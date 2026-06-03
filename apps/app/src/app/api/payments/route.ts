import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { sseBus } from '../../../lib/sse-bus';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  const where: Record<string, unknown> = orderId ? { orderId } : {};
  const payments = await prisma.payment.findMany({
    where,
    include: { order: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(payments);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { orderId, amount, method } = body;

  const payment = await prisma.payment.create({
    data: { orderId, amount: Number(amount), method },
    include: { order: true },
  });

  // Get the order to find its checkInId
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      checkIn: true,
      items: {
        include: {
          product: { include: { prices: true, complements: true } },
          selectedPrice: true,
        },
      },
    },
  });

  if (order && order.checkIn) {
    const checkInId = order.checkIn.id;

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

    // Get all payments for orders in this check-in
    const checkInPaymentIds = checkInOrders.map((o) => o.id);
    const allPayments = await prisma.payment.findMany({
      where: { orderId: { in: checkInPaymentIds } },
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
        tableNumber: order.checkIn.tableNumber,
        total,
        paid,
      });
    } else if (isFullyPaid) {
      // Publish event that payment is complete but items still pending
      sseBus.publish('PAYMENT_COMPLETE_PENDING_ITEMS', {
        checkInId,
        tableNumber: order.checkIn.tableNumber,
        total,
        paid,
      });
    } else {
      // Partial payment
      sseBus.publish('PARTIAL_PAYMENT_ACCEPTED', {
        checkInId,
        tableNumber: order.checkIn.tableNumber,
        total,
        paid,
      });
    }
  }

  return NextResponse.json(payment, { status: 201 });
}