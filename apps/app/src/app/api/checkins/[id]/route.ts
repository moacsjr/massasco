import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Get check-in by ID with payment summary
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const checkIn = await prisma.checkIn.findUnique({
    where: { id },
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
      payments: true,
    },
  });

  if (!checkIn) {
    return NextResponse.json(
      { error: 'Check-in not found' },
      { status: 404 },
    );
  }

  // Calculate payment summary
  const summary = calculateCheckInSummary(checkIn);

  // Convert Prisma Decimal to number for JSON serialization
  const serialized = {
    ...checkIn,
    summary,
    orders: checkIn.orders.map((order: any) => ({
      ...order,
      items: order.items.map((item: any) => ({
        ...item,
        selectedComplements: item.selectedComplements
          ? JSON.parse(JSON.stringify(item.selectedComplements))
          : [],
      })),
    })),
    payments: checkIn.payments.map((p: any) => ({
      ...p,
      amount: Number(p.amount),
    })),
  };

  return NextResponse.json(serialized);
}

// Calculate check-in payment summary
function calculateCheckInSummary(checkIn: any) {
  // Calculate total from all orders
  let total = 0;
  for (const order of checkIn.orders) {
    for (const item of order.items) {
      const priceValue = item.selectedPrice
        ? Number(item.selectedPrice.value)
        : 0;
      const complementsTotal = Array.isArray(item.selectedComplements)
        ? item.selectedComplements.reduce(
            (s: number, c: any) => s + Number(c.value),
            0,
          )
        : 0;
      total += (priceValue + complementsTotal) * item.quantity;
    }
  }

  // Calculate total payments
  const totalPayments = checkIn.payments.reduce(
    (sum: number, p: any) => sum + Number(p.amount),
    0,
  );

  const totalDue = total - totalPayments;
  const isFullyPaid = totalPayments >= total;

  // Check if all items are delivered or cancelled
  const hasPendingItems = checkIn.orders.some((order: any) =>
    order.items.some((item: any) => item.status !== 'DELIVERED' && item.status !== 'CANCELLED')
  );
  const isEligibleForClose = isFullyPaid && !hasPendingItems;

  return {
    subTotal: total,
    totalPayments,
    totalDue,
    ordersCount: checkIn.orders.length,
    paymentsCount: checkIn.payments.length,
    isFullyPaid,
    hasPendingItems,
    isEligibleForClose,
  };
}

// Close a check-in
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const checkIn = await prisma.checkIn.findUnique({
    where: { id },
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
    where: { id },
    data: {
      status: 'CLOSED',
      closedAt: new Date(),
    },
  });

  return NextResponse.json(closedCheckIn);
}
