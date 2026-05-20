import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { sseBus } from '../../../../lib/sse-bus';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { status, notes } = body;

  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;

  const order = await prisma.order.update({
    where: { id },
    data: updateData,
    include: {
      items: {
        include: {
          product: { include: { prices: true, complements: true } },
          selectedPrice: true,
        },
      },
    },
  });

  // Serialize complements from Json
  const serialized = {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      selectedComplements: item.selectedComplements
        ? JSON.parse(JSON.stringify(item.selectedComplements))
        : [],
    })),
  };

  sseBus.publish('ORDER_UPDATED', {
    orderId: serialized.id,
    status: serialized.status,
  });

  return NextResponse.json(serialized);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { include: { prices: true, complements: true } },
          selectedPrice: true,
        },
      },
      payments: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Serialize complements from Json
  const serialized = {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      selectedComplements: item.selectedComplements
        ? JSON.parse(JSON.stringify(item.selectedComplements))
        : [],
    })),
  };

  return NextResponse.json(serialized);
}
