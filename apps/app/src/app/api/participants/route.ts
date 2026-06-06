import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { sseBus } from '../../../lib/sse-bus';

// Get all participants for a session
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tableSessionId = searchParams.get('tableSessionId');

    if (!tableSessionId) {
      return NextResponse.json(
        { error: 'tableSessionId is required' },
        { status: 400 },
      );
    }

    const participants = await prisma.participant.findMany({
      where: { tableSessionId },
      orderBy: {
        joinedAt: 'asc',
      },
      include: {
        deviceSessions: true,
        tableSession: true,
      },
    });

    return NextResponse.json(participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 },
    );
  }
}

// Create a new participant (for walk-in guests)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableSessionId, name, email, phone, role } = body as {
      tableSessionId: string;
      name: string;
      email?: string;
      phone?: string;
      role?: 'HOST' | 'GUEST';
    };

    if (!tableSessionId || !name) {
      return NextResponse.json(
        { error: 'tableSessionId and name are required' },
        { status: 400 },
      );
    }

    // Check if session exists
    const session = await prisma.tableSession.findUnique({
      where: { id: tableSessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Table session not found' },
        { status: 404 },
      );
    }

    // Check if session is still active
    if (session.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Table session is closed' },
        { status: 400 },
      );
    }

    // Create the participant
    const participant = await prisma.participant.create({
      data: {
        tableSessionId,
        name,
        email,
        phone,
        status: 'APPROVED',
        role: role || 'GUEST',
        joinedAt: new Date(),
      },
      include: {
        deviceSessions: true,
      },
    });

    // Publish SSE event for new participant
    sseBus.publish('PARTICIPANT_JOINED', {
      participantId: participant.id,
      tableSessionId: participant.tableSessionId,
      name: participant.name,
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error('Error creating participant:', error);
    return NextResponse.json(
      { error: 'Failed to create participant' },
      { status: 500 },
    );
  }
}