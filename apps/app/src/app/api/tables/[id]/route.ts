import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { sseBus } from '../../../../lib/sse-bus';

// Get a single table by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        sessions: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            participants: true,
          },
        },
        tableAccessTokens: true,
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error('Error fetching table:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table' },
      { status: 500 },
    );
  }
}

// Update a table by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { number, name, isActive } = body as {
      number?: number;
      name?: string;
      isActive?: boolean;
    };

    // Check if table exists
    const existingTable = await prisma.table.findUnique({
      where: { id },
    });

    if (!existingTable) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 },
      );
    }

    // Check if new number conflicts with another table
    if (number && number !== existingTable.number) {
      const existingNumber = await prisma.table.findUnique({
        where: { number },
      });

      if (existingNumber && existingNumber.id !== id) {
        return NextResponse.json(
          { error: 'Table with this number already exists' },
          { status: 409 },
        );
      }
    }

    // Update the table
    const table = await prisma.table.update({
      where: { id },
      data: {
        number,
        name,
        isActive,
      },
    });

    // Publish SSE event for table update
    sseBus.publish('TABLE_UPDATED', { tableId: id, tableNumber: table.number });

    return NextResponse.json(table);
  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 },
    );
  }
}

// Delete a table by ID (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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

    // Check if table has active sessions
    const activeSession = await prisma.tableSession.findFirst({
      where: {
        tableId: id,
        status: {
          in: ['OPEN', 'OCCUPIED', 'CLOSING'],
        },
      },
    });

    if (activeSession) {
      return NextResponse.json(
        { error: 'Cannot delete table with active session. Close the session first.' },
        { status: 409 },
      );
    }

    // Soft delete
    await prisma.table.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    // Publish SSE event for table update
    sseBus.publish('TABLE_DELETED', { tableId: id });

    return NextResponse.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 },
    );
  }
}