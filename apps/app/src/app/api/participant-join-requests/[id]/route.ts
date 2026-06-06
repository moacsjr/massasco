import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { sseBus } from '../../../../lib/sse-bus';

// Approve a join request
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { respondedBy, responseMessage } = body as {
      respondedBy?: string;
      responseMessage?: string;
    };

    // Check if join request exists
    const joinRequest = await prisma.participantJoinRequest.findUnique({
      where: { id },
      include: {
        tableSession: true,
      },
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 },
      );
    }

    // Check if request is still pending
    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Join request is no longer pending' },
        { status: 400 },
      );
    }

    // Approve the request in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update join request status
      const updatedRequest = await tx.participantJoinRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          respondedAt: new Date(),
          respondedBy,
          responseMessage,
        },
      });

      // Create participant
      const participant = await tx.participant.create({
        data: {
          tableSessionId: joinRequest.tableSessionId,
          name: joinRequest.requesterName,
          email: joinRequest.requesterEmail,
          status: 'APPROVED',
          role: 'GUEST',
          joinedAt: new Date(),
        },
      });

      return { request: updatedRequest, participant };
    });

    // Publish SSE event for approved request
    sseBus.publish('JOIN_REQUEST_APPROVED', {
      joinRequestId: id,
      participantId: result.participant.id,
      tableSessionId: joinRequest.tableSessionId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error approving join request:', error);
    return NextResponse.json(
      { error: 'Failed to approve join request' },
      { status: 500 },
    );
  }
}

// Reject a join request
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { respondedBy, responseMessage } = body as {
      respondedBy?: string;
      responseMessage?: string;
    };

    // Check if join request exists
    const joinRequest = await prisma.participantJoinRequest.findUnique({
      where: { id },
      include: {
        tableSession: true,
      },
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 },
      );
    }

    // Check if request is still pending
    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Join request is no longer pending' },
        { status: 400 },
      );
    }

    // Reject the request
    const updatedRequest = await prisma.participantJoinRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
        respondedBy,
        responseMessage,
      },
    });

    // Publish SSE event for rejected request
    sseBus.publish('JOIN_REQUEST_REJECTED', {
      joinRequestId: id,
      tableSessionId: joinRequest.tableSessionId,
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error rejecting join request:', error);
    return NextResponse.json(
      { error: 'Failed to reject join request' },
      { status: 500 },
    );
  }
}

// Get a single join request by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const joinRequest = await prisma.participantJoinRequest.findUnique({
      where: { id },
      include: {
        tableSession: true,
      },
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(joinRequest);
  } catch (error) {
    console.error('Error fetching join request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch join request' },
      { status: 500 },
    );
  }
}