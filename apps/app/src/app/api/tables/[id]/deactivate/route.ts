import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sseBus } from '@/lib/sse-bus';

// Deactivate a table
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { reason } = body as {
      reason?: string;
    };

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 },
      );
    }

    // Check if table exists
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        sessions: {
          where: {
            status: {
              in: ['OPEN', 'OCCUPIED', 'CLOSING'],
            },
          },
        },
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 },
      );
    }

    // Check if table is already inactive
    if (!table.isActive) {
      return NextResponse.json(
        { error: 'Table is already inactive' },
        { status: 400 },
      );
    }

    // Check if table has active sessions
    const activeSession = table.sessions.find(
      (s: { status: string }) => s.status === 'OPEN' || s.status === 'OCCUPIED' || s.status === 'CLOSING',
    );

    if (activeSession) {
      return NextResponse.json(
        { error: 'Cannot deactivate table with active session. Close the session first.' },
        { status: 409 },
      );
    }

    // Deactivate the table
    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    // Publish SSE event for table update
    sseBus.publish('TABLE_UPDATED', { tableId: id, isActive: false });

    return NextResponse.json(updatedTable);
  } catch (error) {
    console.error('Error deactivating table:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate table' },
      { status: 500 },
    );
  }
}