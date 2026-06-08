import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { sseBus } from '../../../lib/sse-bus';

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId');
  const tableSessionId = req.nextUrl.searchParams.get('tableSessionId');

  const where: Record<string, unknown> = {};
  if (orderId) {
    where.orderId = orderId;
  }
  if (tableSessionId) {
    where.tableSessionId = tableSessionId;
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      order: true,
      tableSession: {
        include: { table: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tableSessionId, orderId, amount, method } = body;

  // Validate required fields - tableSessionId is required
  if (!tableSessionId) {
    return NextResponse.json(
      { error: 'tableSessionId is required' },
      { status: 400 },
    );
  }

  if (!amount) {
    return NextResponse.json(
      { error: 'amount is required' },
      { status: 400 },
    );
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: orderId || undefined,
      tableSessionId: tableSessionId || undefined,
      amount: Number(amount),
      method
    },
    include: {
      order: true,
      tableSession: {
        include: { table: true }
      }
    },
  });

  // Get all orders for this table session
  const whereOrders: Record<string, unknown> = {};
  if (tableSessionId) {
    whereOrders.tableSessionId = tableSessionId;
  }

  const orders = await prisma.order.findMany({
    where: whereOrders,
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
  for (const order of orders) {
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

  // Get all payments for this table session
  const wherePayments: Record<string, unknown> = {};
  if (tableSessionId) {
    wherePayments.tableSessionId = tableSessionId;
  }

  const allPayments = await prisma.payment.findMany({
    where: wherePayments,
  });

  const paid = allPayments.reduce(
    (sum: number, p: any) => sum + Number(p.amount),
    0,
  );

  // Check if table session is fully paid
  const isFullyPaid = paid >= total;

  // Get table number from tableSession
  let tableNumber: number | null = null;
  if (payment.tableSession) {
    tableNumber = payment.tableSession.table.number;
  }

  if (isFullyPaid) {
    // Close all orders for this table session
    const orderIds = orders.map((order) => order.id);
    if (orderIds.length > 0) {
      await prisma.order.updateMany({
        where: { id: { in: orderIds } },
        data: { status: 'CLOSED' },
      });
    }

    // Update all participants to EXPIRED status
    await prisma.participant.updateMany({
      where: { tableSessionId },
      data: { status: 'EXPIRED' },
    });

    // Close the table session
    await prisma.tableSession.update({
      where: { id: tableSessionId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });
    sseBus.publish('TABLE_SESSION_CLOSED', {
      tableSessionId,
      tableNumber: tableNumber!,
      total,
      paid,
    });
  } else {
    // Partial payment
    sseBus.publish('TABLE_SESSION_PARTIAL_PAYMENT_ACCEPTED', {
      tableSessionId,
      tableNumber: tableNumber!,
      total,
      paid,
    });
  }

  return NextResponse.json(payment, { status: 201 });
}