import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

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
  if (status === 'READY') updateData.sentAt = new Date();
  if (status === 'DELIVERED') updateData.deliveredAt = new Date();

  const item = await prisma.orderItem.update({
    where: { id },
    data: updateData,
    include: {
      product: { include: { prices: true, complements: true } },
      order: true,
      selectedPrice: true,
    },
  });

  // Serialize complements from Json
  const serialized = {
    ...item,
    selectedComplements: item.selectedComplements
      ? JSON.parse(JSON.stringify(item.selectedComplements))
      : [],
  };

  return NextResponse.json(serialized);
}
