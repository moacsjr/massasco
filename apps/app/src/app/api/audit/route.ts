import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const module = searchParams.get('module');
  const eventType = searchParams.get('eventType');

  const where: Record<string, unknown> = {};
  if (module) where.module = module;
  if (eventType) where.eventType = eventType;

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json(logs);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { module, eventType, payload } = body;

  const log = await prisma.auditLog.create({
    data: { module, eventType, payload },
  });
  return NextResponse.json(log, { status: 201 });
}
