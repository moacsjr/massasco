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

  // Check if order is fully paid
  const allPayments = await prisma.payment.findMany({ where: { orderId } });
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { include: { prices: true, complements: true } },
          selectedPrice: true,
        },
      },
    },
  });

  if (order) {
    // Compute total from selected prices + complements
    const total = order.items.reduce((sum: number, item: any) => {
      const priceValue = item.selectedPrice
        ? Number(item.selectedPrice.value)
        : 0;
      const complementsTotal = Array.isArray(item.selectedComplements)
        ? item.selectedComplements.reduce(
            (s: number, c: any) => s + Number(c.value),
            0,
          )
        : 0;
      return sum + (priceValue + complementsTotal) * item.quantity;
    }, 0);
    const paid = allPayments.reduce(
      (sum: number, p: any) => sum + Number(p.amount),
      0,
    );

    if (paid >= total) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });
      sseBus.publish('ORDER_CLOSED', { orderId, total, paid });
    } else {
      sseBus.publish('PARTIAL_PAYMENT_ACCEPTED', { orderId, total, paid });
    }
  }

  return NextResponse.json(payment, { status: 201 });
}
