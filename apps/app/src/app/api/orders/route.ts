import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { sseBus } from '../../../lib/sse-bus';
import { sendOrderToQueue } from '../../../lib/sqs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const checkInId = searchParams.get('checkInId');
  const tableNumber = searchParams.get('tableNumber');

  const where: Record<string, unknown> = {};
  if (status) {
    where.status = status;
  }
  if (checkInId) {
    where.checkInId = checkInId;
  }
  if (tableNumber && !checkInId) {
    where.tableNumber = parseInt(tableNumber, 10);
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
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

export async function POST(req: Request) {
  const body = await req.json();
  const { checkInId, tableNumber, customerName, items } = body as {
    checkInId?: string;
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
  if (!checkInId && !tableNumber) {
    return NextResponse.json(
      { error: 'checkInId or tableNumber is required' },
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

  // If checkInId is provided, verify it exists and is open
  const finalCheckInId = checkInId;
  let finalTableNumber = tableNumber;

  if (checkInId) {
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
    });

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in not found' },
        { status: 404 },
      );
    }

    if (checkIn.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Esta mesa já foi encerrada.' },
        { status: 400 },
      );
    }

    finalTableNumber = checkIn.tableNumber;
  }

  const order = await prisma.order.create({
    data: {
      checkInId: finalCheckInId,
      tableNumber: finalTableNumber as number,
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
    checkInId: finalCheckInId,
  });

  try {
    await sendOrderToQueue(serialized as Record<string, unknown>);
  } catch (err) {
    console.error('Failed to send order to SQS:', err);
  }

  return NextResponse.json(serialized, { status: 201 });
}