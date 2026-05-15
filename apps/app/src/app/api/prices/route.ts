import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/prices?productId=xxx — list prices for a product
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  const prices = await prisma.productPrice.findMany({
    where: { productId },
    orderBy: { description: 'asc' },
  });

  const serialized = prices.map((p) => ({
    ...p,
    value: Number(p.value),
  }));

  return NextResponse.json(serialized);
}

// POST /api/prices — create a new price
export async function POST(req: Request) {
  const body = await req.json();
  const { productId, description, value } = body;

  if (!productId || !description || value == null) {
    return NextResponse.json({ error: 'productId, description, and value are required' }, { status: 400 });
  }

  const price = await prisma.productPrice.create({
    data: { productId, description, value },
  });

  return NextResponse.json({ ...price, value: Number(price.value) }, { status: 201 });
}
