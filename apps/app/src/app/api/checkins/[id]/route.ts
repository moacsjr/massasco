import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Get check-in by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const checkIn = await prisma.checkIn.findUnique({
    where: { id: params.id },
    include: {
      orders: {
        include: {
          items: {
            include: {
              product: { include: { prices: true, complements: true } },
              selectedPrice: true,
            },
          },
          payments: true,
        },
      },
    },
  });

  if (!checkIn) {
    return NextResponse.json(
      { error: 'Check-in not found' },
      { status: 404 },
    );
  }

  // Convert Prisma Decimal to number for JSON serialization
  const serialized = {
    ...checkIn,
    orders: checkIn.orders.map((order: any) => ({
      ...order,
      items: order.items.map((item: any) => ({
        ...item,
        selectedComplements: item.selectedComplements
          ? JSON.parse(JSON.stringify(item.selectedComplements))
          : [],
      })),
    })),
  };

  return NextResponse.json(serialized);
}

// Close a check-in
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const checkIn = await prisma.checkIn.findUnique({
    where: { id: params.id },
  });

  if (!checkIn) {
    return NextResponse.json(
      { error: 'Check-in not found' },
      { status: 404 },
    );
  }

  if (checkIn.status === 'CLOSED') {
    return NextResponse.json(
      { error: 'Check-in is already closed' },
      { status: 400 },
    );
  }

  const closedCheckIn = await prisma.checkIn.update({
    where: { id: params.id },
    data: {
      status: 'CLOSED',
      closedAt: new Date(),
    },
  });

  return NextResponse.json(closedCheckIn);
}