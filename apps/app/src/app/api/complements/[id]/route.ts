import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const complement = await prisma.productComplement.findUnique({ where: { id } });
  if (!complement) return NextResponse.json({ error: 'Complement not found' }, { status: 404 });
  return NextResponse.json({ ...complement, value: Number(complement.value) });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { group, title, description, value } = body;

  try {
    const complement = await prisma.productComplement.update({
      where: { id },
      data: { group, title, description, value },
    });
    return NextResponse.json({ ...complement, value: Number(complement.value) });
  } catch {
    return NextResponse.json({ error: 'Complement not found' }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await prisma.productComplement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Complement not found' }, { status: 404 });
  }
}
