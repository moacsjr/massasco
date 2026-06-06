import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { sseBus } from '../../../lib/sse-bus';
import { randomBytes } from 'crypto';

// Generate a unique token for the table
function generateTableToken(): string {
  return randomBytes(16).toString('base64url');
}

// Generate QR code data
function generateQRCodeData(tableToken: string): string {
  // Format: /customer-portal/checkin/{tableToken}
  return `/customer-portal/checkin/${tableToken}`;
}

// Get all tables
export async function GET(req: NextRequest) {
  try {
    const tables = await prisma.table.findMany({
      orderBy: {
        number: 'asc',
      },
      include: {
        sessions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get only the latest session
        },
      },
    });

    // Convert Prisma Decimal to number for JSON serialization
    const serialized = tables.map((table: any) => ({
      ...table,
      sessions: table.sessions.map((session: any) => ({
        ...session,
      })),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 },
    );
  }
}

// Create a new table or bulk create tables
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { number, name, count } = body as {
      number?: number;
      name?: string;
      count?: number;
    };

    // Bulk create tables
    if (count && count > 0) {
      return createBulkTables(count);
    }

    // Single table creation
    if (!number) {
      return NextResponse.json(
        { error: 'number is required' },
        { status: 400 },
      );
    }

    // Check if table with this number already exists
    const existingTable = await prisma.table.findUnique({
      where: { number },
    });

    if (existingTable) {
      return NextResponse.json(
        { error: 'Table with this number already exists' },
        { status: 409 },
      );
    }

    // Create the table with a unique token
    const table = await prisma.$transaction(async (tx) => {
      const newTable = await tx.table.create({
        data: {
          number,
          name,
          token: generateTableToken(),
        },
      });

      // Auto-generate QR code for the new table
      const token = await tx.tableAccessToken.create({
        data: {
          tableId: newTable.id,
          token: generateTableToken(),
          isActive: true,
        },
      });

      // Update table token with the access token
      await tx.table.update({
        where: { id: newTable.id },
        data: {
          token: token.token,
        },
      });

      return newTable;
    });

    // Publish SSE event for new table
    sseBus.publish('TABLE_CREATED', { tableId: table.id, tableNumber: table.number });

    return NextResponse.json(
      {
        ...table,
        qrCodeUrl: generateQRCodeData(table.token),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 },
    );
  }
}

async function createBulkTables(count: number) {
  try {
    if (count < 1) {
      return NextResponse.json(
        { error: 'count must be a positive number' },
        { status: 400 },
      );
    }

    // Get the highest existing table number
    const highestTable = await prisma.table.findFirst({
      orderBy: {
        number: 'desc',
      },
    });

    const startNumber = highestTable ? highestTable.number + 1 : 1;

    // Create tables in a transaction
    const tables = await prisma.$transaction(
      Array.from({ length: count }).map((_, i) =>
        prisma.table.create({
          data: {
            number: startNumber + i,
            token: generateTableToken(),
          },
        }),
      ),
    );

    // Auto-generate QR codes for all new tables
    for (const table of tables) {
      await prisma.$transaction(async (tx) => {
        const token = await tx.tableAccessToken.create({
          data: {
            tableId: table.id,
            token: generateTableToken(),
            isActive: true,
          },
        });

        await tx.table.update({
          where: { id: table.id },
          data: {
            token: token.token,
          },
        });
      });
    }

    // Publish SSE event for new tables
    tables.forEach((table) => {
      sseBus.publish('TABLE_CREATED', { tableId: table.id, tableNumber: table.number });
    });

    return NextResponse.json(
      tables.map((table) => ({
        ...table,
        qrCodeUrl: generateQRCodeData(table.token),
      })),
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating tables:', error);
    return NextResponse.json(
      { error: 'Failed to create tables' },
      { status: 500 },
    );
  }
}

// Update a table
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, number, name, isActive } = body as {
      id: string;
      number?: number;
      name?: string;
      isActive?: boolean;
    };

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 },
      );
    }

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

    return NextResponse.json(table);
  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 },
    );
  }
}

// Delete a table (soft delete by setting isActive to false)
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, force } = body as {
      id: string;
      force?: boolean;
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

    if (activeSession && !force) {
      return NextResponse.json(
        { error: 'Cannot delete table with active session. Close the session first or use force=true.' },
        { status: 409 },
      );
    }

    // Soft delete or hard delete
    if (force) {
      await prisma.table.delete({
        where: { id },
      });
    } else {
      await prisma.table.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
    }

    // Publish SSE event for table update
    sseBus.publish('TABLE_UPDATED', { tableId: id, isActive: false });

    return NextResponse.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 },
    );
  }
}