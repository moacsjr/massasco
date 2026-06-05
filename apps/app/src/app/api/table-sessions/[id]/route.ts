import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { sseBus } from '../../../../lib/sse-bus';

// Get a single table session by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await prisma.tableSession.findUnique({
      where: { id },
      include: {
        table: true,
        participants: {
          include: {
            deviceSessions: true,
          },
        },
        orders: true,
        joinRequests: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Table session not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 },
    );
  }
}

// Update a table session by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, capacity, closedBy } = body as {
      status?: 'OPEN' | 'OCCUPIED' | 'CLOSING' | 'CLOSED';
      capacity?: number;
      closedBy?: string;
    };

    // Check if session exists
    const existingSession = await prisma.tableSession.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Table session not found' },
        { status: 404 },
      );
    }

    // Update the session
    const session = await prisma.tableSession.update({
      where: { id },
      data: {
        status,
        capacity,
        closedBy,
        closedAt: status === 'CLOSED' ? new Date() : null,
      },
      include: {
        table: true,
      },
    });

    // Publish SSE event for session update
    if (status) {
      sseBus.publish('TABLE_SESSION_UPDATED', {
        sessionId: id,
        status,
        tableId: session.tableId,
        tableNumber: session.table.number,
      });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 },
    );
  }
}

// Close a table session
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check if session exists
    const session = await prisma.tableSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Table session not found' },
        { status: 404 },
      );
    }

    // Check if session is already closed
    if (session.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Table session is already closed' },
        { status: 400 },
      );
    }

    // Close the session in a transaction
    const closedSession = await prisma.$transaction(async (tx) => {
      // Update session status
      const updatedSession = await tx.tableSession.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
        include: {
          table: true,
        },
      });

      // Update all participants to EXPIRED status
      await tx.participant.updateMany({
        where: { tableSessionId: id },
        data: { status: 'EXPIRED' },
      });

      // Update all device sessions to expired
      await tx.deviceSession.updateMany({
        where: { participantId: { in: session.participants.map((p: any) => p.id) } },
        data: { expiresAt: new Date() },
      });

      return updatedSession;
    });

    // Publish SSE event for session close
    sseBus.publish('TABLE_SESSION_CLOSED', {
      sessionId: id,
      tableId: closedSession.tableId,
      tableNumber: closedSession.table.number,
    });

    return NextResponse.json(closedSession);
  } catch (error) {
    console.error('Error closing session:', error);
    return NextResponse.json(
      { error: 'Failed to close session' },
      { status: 500 },
    );
  }
}