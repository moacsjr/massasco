import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST() {
  // Delete all data in reverse dependency order
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.auditLog.deleteMany();
  return NextResponse.json({ ok: true });
}
