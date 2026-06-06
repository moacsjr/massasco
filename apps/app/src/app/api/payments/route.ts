import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { sseBus } from '../../../lib/sse-bus';

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId');
  const checkInId = req.nextUrl.searchParams.get('checkInId');

  const where: Record<string, unknown> = {};
  if (orderId) {
    where.orderId = orderId;
  }
  if (checkInId) {
    where.checkInId = checkInId;
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      order: true,
      checkIn: true
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { checkInId, orderId, amount, method } = body;

  // Validate required fields
  if (!checkInId || !amount) {
    return NextResponse.json(
      { error: 'checkInId and amount are required' },
      { status: 400 },
    );
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: orderId || undefined,
      checkInId,
      amount: Number(amount),
      method
    },
    include: {
      order: true,
      checkIn: true
    },
  });

  // Get all orders for this check-in
  const checkInOrders = await prisma.order.findMany({
    where: { checkInId },
    include: {
      items: {
        include: {
          product: { include: { prices: true, complements: true } },
          selectedPrice: true,
        },
      },
    },
  });

  // Calculate total from all orders
  let total = 0;
  for (const order of checkInOrders) {
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

  // Get all payments for this check-in
  const allPayments = await prisma.payment.findMany({
    where: { checkInId },
  });

  const paid = allPayments.reduce(
    (sum: number, p: any) => sum + Number(p.amount),
    0,
  );

  // Check if all items are delivered or cancelled (no pending items)
  const hasPendingItems = checkInOrders.some((order) =>
    order.items.some((item) => item.status !== 'DELIVERED' && item.status !== 'CANCELLED')
  );

  // Check if check-in is fully paid
  const isFullyPaid = paid >= total;

  if (isFullyPaid && !hasPendingItems) {
    // Close the check-in
    await prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    // Publish SSE event for check-in closed
    sseBus.publish('CHECKIN_CLOSED', {
      checkInId,
      tableNumber: payment.checkIn.tableNumber,
      total,
      paid,
    });
  } else if (isFullyPaid) {
    // Publish event that payment is complete but items still pending
    sseBus.publish('PAYMENT_COMPLETE_PENDING_ITEMS', {
      checkInId,
      tableNumber: payment.checkIn.tableNumber,
      total,
      paid,
    });
  } else {
    // Partial payment
    sseBus.publish('PARTIAL_PAYMENT_ACCEPTED', {
      checkInId,
      tableNumber: payment.checkIn.tableNumber,
      total,
      paid,
    });
  }

  return NextResponse.json(payment, { status: 201 });
}
