import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get('entityType');
  const action = searchParams.get('action');

  const where: Record<string, unknown> = {};
  if (entityType) where.entityType = entityType;
  if (action) where.action = action;

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json(logs);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { entityType, entityId, action, performedBy, metadata } = body;

  const log = await prisma.auditLog.create({
    data: { entityType, entityId, action, performedBy, metadata },
  });
  return NextResponse.json(log, { status: 201 });
}
