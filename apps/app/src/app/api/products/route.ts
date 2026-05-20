import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');

  const where: Record<string, unknown> = {};
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const products = await prisma.product.findMany({
    where,
    include: { prices: true, complements: true },
    orderBy: { name: 'asc' },
  });

  const serialized = products.map((p) => ({
    ...p,
    prices: p.prices.map((pr) => ({
      ...pr,
      value: Number(pr.value),
    })),
    complements: p.complements.map((c) => ({
      ...c,
      value: Number(c.value),
    })),
  }));

  return NextResponse.json(serialized);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, description, imageUrl, categoryId, prices, complements } = body;

  if (!name || !categoryId || !prices || prices.length === 0) {
    return NextResponse.json(
      { error: 'name, categoryId, and at least 1 price are required' },
      { status: 400 },
    );
  }

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: { name, description, imageUrl, categoryId },
    });

    await tx.productPrice.createMany({
      data: prices.map((p: { description: string; value: number }) => ({
        productId: created.id,
        description: p.description,
        value: p.value,
      })),
    });

    if (complements && Array.isArray(complements) && complements.length > 0) {
      await tx.productComplement.createMany({
        data: complements.map(
          (c: {
            group: string;
            title: string;
            description?: string;
            value?: number;
          }) => ({
            productId: created.id,
            group: c.group,
            title: c.title,
            description: c.description,
            value: c.value ?? 0,
          }),
        ),
      });
    }

    return tx.product.findUnique({
      where: { id: created.id },
      include: { prices: true, complements: true },
    });
  });

  const serialized = {
    ...product,
    prices: product!.prices.map((p) => ({
      ...p,
      value: Number(p.value),
    })),
    complements: product!.complements.map((c) => ({
      ...c,
      value: Number(c.value),
    })),
  };

  return NextResponse.json(serialized, { status: 201 });
}
