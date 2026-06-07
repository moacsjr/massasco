import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { sseBus } from '../../../lib/sse-bus';
import { randomBytes } from 'crypto';

// Generate a unique session token
function generateSessionToken(): string {
  return randomBytes(16).toString('base64url');
}

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
        tableSession: {
          include: {
            table: true,
          },
        },
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

// Approve or reject a join request
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { joinRequestId, action, approverName } = body as {
      joinRequestId: string;
      action: 'APPROVE' | 'REJECT';
      approverName?: string;
    };

    // Validate required fields
    if (!joinRequestId || !action) {
      return NextResponse.json(
        { error: 'joinRequestId and action are required' },
        { status: 400 },
      );
    }

    // Get the join request
    const joinRequest = await prisma.participantJoinRequest.findUnique({
      where: { id: joinRequestId },
      include: {
        tableSession: {
          include: {
            table: true,
            participants: {
              where: {
                role: 'HOST',
                status: 'APPROVED',
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 },
      );
    }

    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Join request is not pending' },
        { status: 400 },
      );
    }

    // Update the join request status
    const updatedRequest = await prisma.participantJoinRequest.update({
      where: { id: joinRequestId },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        respondedAt: new Date(),
        respondedBy: approverName,
        responseMessage: action === 'APPROVE' 
          ? 'Check-in aprovado pelo administrador' 
          : 'Check-in rejeitado pelo administrador',
      },
    });

    if (action === 'APPROVE') {
      // Create a new participant for the guest
      const participant = await prisma.participant.create({
        data: {
          tableSessionId: joinRequest.tableSessionId,
          name: joinRequest.requesterName,
          email: joinRequest.requesterEmail,
          status: 'APPROVED',
          role: 'GUEST',
          joinedAt: new Date(),
          approvedAt: new Date(),
          approvedBy: approverName,
        },
      });

      // Create a device session for the participant
      await prisma.deviceSession.create({
        data: {
          participantId: participant.id,
          sessionId: generateSessionToken(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // Update table session status if it was OPEN and now has approved guests
      const approvedGuestsCount = await prisma.participant.count({
        where: {
          tableSessionId: joinRequest.tableSessionId,
          role: 'GUEST',
          status: 'APPROVED',
        },
      });

      if (approvedGuestsCount > 0) {
        await prisma.tableSession.update({
          where: { id: joinRequest.tableSessionId },
          data: {
            status: 'OCCUPIED',
            capacity: Math.max(
              1,
              (await prisma.participant.count({
                where: {
                  tableSessionId: joinRequest.tableSessionId,
                  status: 'APPROVED',
                },
              }))
            ),
          },
        });
      }

      // Publish SSE event for approved join request
      sseBus.publish('JOIN_REQUEST_APPROVED', {
        joinRequestId: joinRequest.id,
        tableSessionId: joinRequest.tableSessionId,
        participantId: participant.id,
        participantName: joinRequest.requesterName,
      });
    } else {
      // Publish SSE event for rejected join request
      sseBus.publish('JOIN_REQUEST_REJECTED', {
        joinRequestId: joinRequest.id,
        tableSessionId: joinRequest.tableSessionId,
        requesterName: joinRequest.requesterName,
      });
    }

    // Return updated request with participant info if approved
    const result = {
      ...updatedRequest,
      participant: action === 'APPROVE' 
        ? await prisma.participant.findFirst({
            where: {
              tableSessionId: joinRequest.tableSessionId,
              name: joinRequest.requesterName,
              role: 'GUEST',
              status: 'APPROVED',
            },
          })
        : null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing join request:', error);
    return NextResponse.json(
      { error: 'Failed to process join request' },
      { status: 500 },
    );
  }
}
