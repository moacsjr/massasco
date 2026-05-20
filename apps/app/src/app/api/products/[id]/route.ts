import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { prices: true, complements: true, category: true },
  });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json({
    ...product,
    prices: product.prices.map((p) => ({ ...p, value: Number(p.value) })),
    complements: product.complements.map((c) => ({ ...c, value: Number(c.value) })),
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, description, imageUrl, categoryId, prices, complements } = body;

  try {
    const product = await prisma.$transaction(async (tx) => {
      // Update product fields
      const updated = await tx.product.update({
        where: { id },
        data: { name, description, imageUrl, categoryId },
      });

      if (prices && Array.isArray(prices)) {
        // Delete existing prices and recreate
        await tx.productPrice.deleteMany({ where: { productId: id } });

        if (prices.length > 0) {
          await tx.productPrice.createMany({
            data: prices.map((p: { description: string; value: number }) => ({
              productId: id,
              description: p.description,
              value: p.value,
            })),
          });
        }
      }

      if (complements !== undefined && Array.isArray(complements)) {
        // Delete existing complements and recreate
        await tx.productComplement.deleteMany({ where: { productId: id } });

        if (complements.length > 0) {
          await tx.productComplement.createMany({
            data: complements.map((c: { group: string; title: string; description?: string; value?: number }) => ({
              productId: id,
              group: c.group,
              title: c.title,
              description: c.description,
              value: c.value ?? 0,
            })),
          });
        }
      }

      return tx.product.findUnique({
        where: { id: updated.id },
        include: { prices: true, complements: true },
      });
    });

    return NextResponse.json({
      ...product,
      prices: product!.prices.map((p) => ({ ...p, value: Number(p.value) })),
      complements: product!.complements.map((c) => ({ ...c, value: Number(c.value) })),
    });
  } catch {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
}
