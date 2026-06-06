import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { sseBus } from '../../../lib/sse-bus';

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId');
  const checkInId = req.nextUrl.searchParams.get('checkInId');
  const tableSessionId = req.nextUrl.searchParams.get('tableSessionId');

  const where: Record<string, unknown> = {};
  if (orderId) {
    where.orderId = orderId;
  }
  if (checkInId) {
    where.checkInId = checkInId;
  }
  if (tableSessionId) {
    where.tableSessionId = tableSessionId;
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      order: true,
      checkIn: true,
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
  const { checkInId, tableSessionId, orderId, amount, method } = body;

  // Validate required fields - at least one of checkInId or tableSessionId is required
  if (!checkInId && !tableSessionId) {
    return NextResponse.json(
      { error: 'checkInId or tableSessionId is required' },
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
      checkInId: checkInId || undefined,
      tableSessionId: tableSessionId || undefined,
      amount: Number(amount),
      method
    },
    include: {
      order: true,
      checkIn: true,
      tableSession: {
        include: { table: true }
      }
    },
  });

  // Get all orders for this check-in or table session
  const whereOrders: Record<string, unknown> = {};
  if (checkInId) {
    whereOrders.checkInId = checkInId;
  }
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

  // Get all payments for this check-in or table session
  const wherePayments: Record<string, unknown> = {};
  if (checkInId) {
    wherePayments.checkInId = checkInId;
  }
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

  // Check if all items are delivered or cancelled (no pending items)
  const hasPendingItems = orders.some((order) =>
    order.items.some((item) => item.status !== 'DELIVERED' && item.status !== 'CANCELLED')
  );

  // Check if check-in or table session is fully paid
  const isFullyPaid = paid >= total;

  // Get table number from checkIn or tableSession
  let tableNumber: number | null = null;
  if (payment.checkIn) {
    tableNumber = payment.checkIn.tableNumber;
  } else if (payment.tableSession) {
    tableNumber = payment.tableSession.table.number;
  }

  if (isFullyPaid && !hasPendingItems) {
    // Close the check-in or table session
    if (checkInId) {
      await prisma.checkIn.update({
        where: { id: checkInId },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });
      sseBus.publish('CHECKIN_CLOSED', {
        checkInId,
        tableNumber: tableNumber!,
        total,
        paid,
      });
    } else if (tableSessionId) {
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
    }
  } else if (isFullyPaid) {
    // Publish event that payment is complete but items still pending
    if (checkInId) {
      sseBus.publish('PAYMENT_COMPLETE_PENDING_ITEMS', {
        checkInId,
        tableNumber: tableNumber!,
        total,
        paid,
      });
    } else if (tableSessionId) {
      sseBus.publish('TABLE_SESSION_PAYMENT_COMPLETE_PENDING_ITEMS', {
        tableSessionId,
        tableNumber: tableNumber!,
        total,
        paid,
      });
    }
  } else {
    // Partial payment
    if (checkInId) {
      sseBus.publish('PARTIAL_PAYMENT_ACCEPTED', {
        checkInId,
        tableNumber: tableNumber!,
        total,
        paid,
      });
    } else if (tableSessionId) {
      sseBus.publish('TABLE_SESSION_PARTIAL_PAYMENT_ACCEPTED', {
        tableSessionId,
        tableNumber: tableNumber!,
        total,
        paid,
      });
    }
  }

  return NextResponse.json(payment, { status: 201 });
}
