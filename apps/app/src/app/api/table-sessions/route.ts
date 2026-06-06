import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { sseBus } from '../../../lib/sse-bus';
import { randomBytes } from 'crypto';

// Generate a unique session token
function generateSessionToken(): string {
  return randomBytes(16).toString('base64url');
}

// Create a new table session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableId, hostName, capacity } = body as {
      tableId: string;
      hostName: string;
      capacity?: number;
    };

    // Validate required fields
    if (!tableId || !hostName) {
      return NextResponse.json(
        { error: 'tableId and hostName are required' },
        { status: 400 },
      );
    }

    // Check if table exists and is active
    const table = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 },
      );
    }

    if (!table.isActive) {
      return NextResponse.json(
        { error: 'Table is not active' },
        { status: 400 },
      );
    }

    // Check if table already has an active session
    const activeSession = await prisma.tableSession.findFirst({
      where: {
        tableId,
        status: {
          in: ['OPEN', 'OCCUPIED', 'CLOSING'],
        },
      },
    });

    if (activeSession) {
      return NextResponse.json(
        { error: 'Table already has an active session' },
        { status: 409 },
      );
    }

    // Create the session in a transaction
    const session = await prisma.$transaction(async (tx) => {
      // Create the table session
      const tableSession = await tx.tableSession.create({
        data: {
          tableId,
          hostName,
          capacity: capacity || 1,
          status: 'OPEN',
        },
        include: {
          table: true,
        },
      });

      // Create the host participant
      const host = await tx.participant.create({
        data: {
          tableSessionId: tableSession.id,
          name: hostName,
          status: 'APPROVED',
          role: 'HOST',
          joinedAt: new Date(),
        },
      });

      // Create the device session for the host
      const deviceSession = await tx.deviceSession.create({
        data: {
          participantId: host.id,
          sessionId: generateSessionToken(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      return { tableSession, host, deviceSession };
    });

    // Publish SSE event for new session
    sseBus.publish('TABLE_SESSION_CREATED', {
      sessionId: session.tableSession.id,
      tableId: session.tableSession.tableId,
      tableNumber: session.tableSession.table.number,
    });

    return NextResponse.json(
      {
        ...session.tableSession,
        host: session.host,
        deviceSession: session.deviceSession,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating table session:', error);
    return NextResponse.json(
      { error: 'Failed to create table session' },
      { status: 500 },
    );
  }
}

// Get all active sessions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tableId = searchParams.get('tableId');
    const status = searchParams.get('status');

    const where: any = {};

    if (tableId) {
      where.tableId = tableId;
    }

    if (status) {
      where.status = status;
    } else {
      // Default to active sessions
      where.status = {
        in: ['OPEN', 'OCCUPIED', 'CLOSING'],
      };
    }

    const sessions = await prisma.tableSession.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        table: true,
        participants: true,
        orders: true,
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 },
    );
  }
}