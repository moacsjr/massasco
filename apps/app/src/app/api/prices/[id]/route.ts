import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const price = await prisma.productPrice.findUnique({ where: { id } });
  if (!price)
    return NextResponse.json({ error: 'Price not found' }, { status: 404 });
  return NextResponse.json({ ...price, value: Number(price.value) });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { description, value } = body;

  try {
    const price = await prisma.productPrice.update({
      where: { id },
      data: { description, value },
    });
    return NextResponse.json({ ...price, value: Number(price.value) });
  } catch {
    return NextResponse.json({ error: 'Price not found' }, { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await prisma.productPrice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Price not found' }, { status: 404 });
  }
}
