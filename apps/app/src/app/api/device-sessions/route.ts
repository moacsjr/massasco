import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { randomBytes } from 'crypto';

// Generate a unique session token
function generateSessionToken(): string {
  return randomBytes(16).toString('base64url');
}

// Create a new device session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { participantId, deviceInfo, ipAddress, location, expiresAt } = body as {
      participantId: string;
      deviceInfo?: any;
      ipAddress?: string;
      location?: any;
      expiresAt?: Date;
    };

    if (!participantId) {
      return NextResponse.json(
        { error: 'participantId is required' },
        { status: 400 },
      );
    }

    // Check if participant exists
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 },
      );
    }

    // Check if participant is still active
    if (participant.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Participant is not active' },
        { status: 400 },
      );
    }

    // Create the device session
    const deviceSession = await prisma.deviceSession.create({
      data: {
        participantId,
        sessionId: generateSessionToken(),
        deviceInfo,
        ipaddress: ipAddress,
        location,
        expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
      },
      include: {
        participant: true,
      },
    });

    return NextResponse.json(deviceSession, { status: 201 });
  } catch (error) {
    console.error('Error creating device session:', error);
    return NextResponse.json(
      { error: 'Failed to create device session' },
      { status: 500 },
    );
  }
}

// Get device session by session token
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 },
      );
    }

    const deviceSession = await prisma.deviceSession.findUnique({
      where: { sessionId },
      include: {
        participant: {
          include: {
            tableSession: true,
          },
        },
      },
    });

    if (!deviceSession) {
      return NextResponse.json(
        { error: 'Device session not found' },
        { status: 404 },
      );
    }

    // Check if session is expired
    if (deviceSession.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Device session expired' },
        { status: 401 },
      );
    }

    return NextResponse.json(deviceSession);
  } catch (error) {
    console.error('Error fetching device session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch device session' },
      { status: 500 },
    );
  }
}

// Refresh device session
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, deviceInfo, ipAddress, location } = body as {
      sessionId: string;
      deviceInfo?: any;
      ipAddress?: string;
      location?: any;
    };

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 },
      );
    }

    // Find existing session
    const deviceSession = await prisma.deviceSession.findUnique({
      where: { sessionId },
    });

    if (!deviceSession) {
      return NextResponse.json(
        { error: 'Device session not found' },
        { status: 404 },
      );
    }

    // Check if session is expired
    if (deviceSession.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Device session expired' },
        { status: 401 },
      );
    }

    // Refresh the session
    const refreshedSession = await prisma.deviceSession.update({
      where: { sessionId },
      data: {
        deviceInfo,
        ipaddress: ipAddress,
        location,
        lastActive: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Reset to 24 hours
      },
    });

    return NextResponse.json(refreshedSession);
  } catch (error) {
    console.error('Error refreshing device session:', error);
    return NextResponse.json(
      { error: 'Failed to refresh device session' },
      { status: 500 },
    );
  }
}