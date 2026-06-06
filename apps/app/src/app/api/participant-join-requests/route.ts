import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { sseBus } from '../../../lib/sse-bus';

// Create a new join request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableSessionId, requesterName, requesterEmail, ipAddress, deviceInfo } = body as {
      tableSessionId: string;
      requesterName: string;
      requesterEmail?: string;
      ipAddress?: string;
      deviceInfo?: any;
    };

    // Validate required fields
    if (!tableSessionId || !requesterName) {
      return NextResponse.json(
        { error: 'tableSessionId and requesterName are required' },
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

    // Create the join request
    const joinRequest = await prisma.participantJoinRequest.create({
      data: {
        tableSessionId,
        requesterName,
        requesterEmail,
        ipAddress,
        deviceInfo,
        status: 'PENDING',
      },
      include: {
        tableSession: {
          include: {
            table: true,
            participants: true,
          },
        },
      },
    });

    // Publish SSE event for new join request
    sseBus.publish('JOIN_REQUEST_CREATED', {
      joinRequestId: joinRequest.id,
      tableSessionId: joinRequest.tableSessionId,
      requesterName: joinRequest.requesterName,
    });

    return NextResponse.json(joinRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating join request:', error);
    return NextResponse.json(
      { error: 'Failed to create join request' },
      { status: 500 },
    );
  }
}

// Get all join requests for a session
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

    const joinRequests = await prisma.participantJoinRequest.findMany({
      where: { tableSessionId },
      orderBy: {
        requestedAt: 'desc',
      },
      include: {
        tableSession: true,
      },
    });

    return NextResponse.json(joinRequests);
  } catch (error) {
    console.error('Error fetching join requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch join requests' },
      { status: 500 },
    );
  }
}