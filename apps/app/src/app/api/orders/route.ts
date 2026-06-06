import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { sseBus } from '../../../lib/sse-bus';
import { sendOrderToQueue } from '../../../lib/sqs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const tableSessionId = searchParams.get('tableSessionId');
  const tableNumber = searchParams.get('tableNumber');

  const where: Record<string, unknown> = {};
  if (status) {
    where.status = status;
  }
  if (tableSessionId) {
    where.tableSessionId = tableSessionId;
  }
  if (tableNumber && !tableSessionId) {
    where.tableNumber = parseInt(tableNumber, 10);
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      tableSession: true,
      items: {
        include: {
          product: { include: { prices: true, complements: true } },
          selectedPrice: true,
        },
      },
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Convert Prisma Decimal to number for JSON serialization
  const serialized = orders.map((order: any) => ({
    ...order,
    items: order.items.map((item: any) => ({
      ...item,
      selectedComplements: item.selectedComplements
        ? JSON.parse(JSON.stringify(item.selectedComplements))
        : [],
    })),
  }));

  return NextResponse.json(serialized);
}

// Update request type for Next.js 15
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tableSessionId, tableNumber, customerName, items } = body as {
    tableSessionId?: string;
    tableNumber?: number;
    customerName: string;
    items: {
      productId: string;
      quantity: number;
      notes?: string;
      selectedPriceId?: string;
      selectedComplements?: unknown[];
    }[];
  };

  // Validate required fields
  if (!tableSessionId && !tableNumber) {
    return NextResponse.json(
      { error: 'tableSessionId or tableNumber is required' },
      { status: 400 },
    );
  }

  if (!items || items.length === 0) {
    return NextResponse.json(
      { error: 'At least one item is required' },
      { status: 400 },
    );
  }

  // Validate all product IDs exist
  const productIds = [...new Set(items.map((item) => item.productId))];
  const existingProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true },
  });
  const existingIds = new Set(existingProducts.map((p) => p.id));
  const missingIds = productIds.filter((id) => !existingIds.has(id));

  if (missingIds.length > 0) {
    return NextResponse.json(
      { error: 'Products not found', missingIds },
      { status: 400 },
    );
  }

  // If tableSessionId is provided, verify it exists and is open
  let finalTableSessionId: string;
  let finalTableNumber: number;

  if (tableSessionId) {
    const tableSession = await prisma.tableSession.findUnique({
      where: { id: tableSessionId },
      include: { table: true },
    });

    if (!tableSession) {
      return NextResponse.json(
        { error: 'Table session not found' },
        { status: 404 },
      );
    }

    if (tableSession.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Esta mesa já foi encerrada.' },
        { status: 400 },
      );
    }

    finalTableSessionId = tableSessionId;
    finalTableNumber = tableSession.table.number;
  } else if (tableNumber) {
    // If no tableSessionId, create a new table session for the table
    const table = await prisma.table.findFirst({
      where: { number: tableNumber },
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 },
      );
    }

    const tableSession = await prisma.tableSession.create({
      data: {
        tableId: table.id,
        hostName: customerName,
        capacity: 1,
        status: 'OPEN',
      },
    });
    finalTableSessionId = tableSession.id;
    finalTableNumber = table.number;
  } else {
    return NextResponse.json(
      { error: 'tableSessionId or tableNumber is required' },
      { status: 400 },
    );
  }

  const order = await prisma.order.create({
    data: {
      tableSessionId: finalTableSessionId,
      tableNumber: finalTableNumber,
      customerName,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes ?? undefined,
          selectedPriceId: item.selectedPriceId ?? undefined,
          selectedComplements: item.selectedComplements
            ? (item.selectedComplements as object)
            : undefined,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: { include: { prices: true, complements: true } },
          selectedPrice: true,
        },
      },
    },
  });

  // Convert Prisma Decimal to number
  const serialized = {
    ...order,
    items: order.items.map((item: any) => ({
      ...item,
      selectedComplements: item.selectedComplements
        ? JSON.parse(JSON.stringify(item.selectedComplements))
        : [],
    })),
  };

  sseBus.publish('ORDER_CREATED', {
    orderId: serialized.id,
    tableNumber: finalTableNumber as number,
    tableSessionId: finalTableSessionId,
  });

  try {
    await sendOrderToQueue(serialized as Record<string, unknown>);
  } catch (err) {
    console.error('Failed to send order to queue:', err);
  }

  return NextResponse.json(serialized, { status: 201 });
}
