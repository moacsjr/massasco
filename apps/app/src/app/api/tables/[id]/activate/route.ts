import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sseBus } from '@/lib/sse-bus';

// Activate a table
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 },
      );
    }

    // Check if table exists
    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 },
      );
    }

    // Check if table is already active
    if (table.isActive) {
      return NextResponse.json(
        { error: 'Table is already active' },
        { status: 400 },
      );
    }

    // Activate the table
    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        isActive: true,
      },
    });

    // Publish SSE event for table update
    sseBus.publish('TABLE_UPDATED', { tableId: id, isActive: true });

    return NextResponse.json(updatedTable);
  } catch (error) {
    console.error('Error activating table:', error);
    return NextResponse.json(
      { error: 'Failed to activate table' },
      { status: 500 },
    );
  }
}