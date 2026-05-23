import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { sseBus } from '../../../lib/sse-bus';
import { sendOrderToQueue } from '../../../lib/sqs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const where: Record<string, unknown> = {};
  if (status) {
    where.status = status;
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
  const serialized = orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
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
  const { tableNumber, items } = body as {
    tableNumber: number;
    items: {
      productId: string;
      quantity: number;
      notes?: string;
      selectedPriceId?: string;
      selectedComplements?: unknown[];
    }[];
  };

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

  const order = await prisma.order.create({
    data: {
      tableNumber,
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
    items: order.items.map((item) => ({
      ...item,
      selectedComplements: item.selectedComplements
        ? JSON.parse(JSON.stringify(item.selectedComplements))
        : [],
    })),
  };

  sseBus.publish('ORDER_CREATED', { orderId: serialized.id, tableNumber });

  try {
    await sendOrderToQueue(serialized as Record<string, unknown>);
  } catch (err) {
    console.error('Failed to send order to SQS:', err);
  }

  return NextResponse.json(serialized, { status: 201 });
}
