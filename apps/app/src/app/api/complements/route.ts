import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/complements?productId=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  const complements = await prisma.productComplement.findMany({
    where: { productId },
    orderBy: { group: 'asc' },
  });

  const serialized = complements.map((c) => ({
    ...c,
    value: Number(c.value),
  }));

  return NextResponse.json(serialized);
}

// POST /api/complements
export async function POST(req: Request) {
  const body = await req.json();
  const { productId, group, title, description, value } = body;

  if (!productId || !group || !title) {
    return NextResponse.json({ error: 'productId, group, and title are required' }, { status: 400 });
  }

  const complement = await prisma.productComplement.create({
    data: { productId, group, title, description, value: value ?? 0 },
  });

  return NextResponse.json({ ...complement, value: Number(complement.value) }, { status: 201 });
}
