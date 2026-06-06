import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { sseBus } from '../../../lib/sse-bus';
import { randomBytes } from 'crypto';

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Generate a unique session token
function generateSessionToken(): string {
  return randomBytes(16).toString('base64url');
}

// Check-in request body
interface CheckInRequestBody {
  name: string;
  email?: string;
  phone?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  ipAddress?: string;
  deviceInfo?: any;
}

// Get geolocation settings from database
async function getGeolocationSettings(): Promise<{
  enabled: boolean;
  restaurantLatitude: number;
  restaurantLongitude: number;
  maxDistanceMeters: number;
}> {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: [
          'geolocation.enabled',
          'geolocation.restaurantLatitude',
          'geolocation.restaurantLongitude',
          'geolocation.maxDistanceMeters',
        ],
      },
    },
  });

  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  return {
    enabled: settingsMap.get('geolocation.enabled') === 'true',
    restaurantLatitude: parseFloat(settingsMap.get('geolocation.restaurantLatitude') || '-23.550520'),
    restaurantLongitude: parseFloat(settingsMap.get('geolocation.restaurantLongitude') || '-46.633308'),
    maxDistanceMeters: parseInt(settingsMap.get('geolocation.maxDistanceMeters') || '100', 10),
  };
}

// Validate location (must be within configured distance of restaurant location)
async function validateLocation(location: { latitude: number; longitude: number } | undefined): Promise<boolean> {
  if (!location) {
    return false;
  }

  const settings = await getGeolocationSettings();

  // If geolocation is disabled, always return true
  if (!settings.enabled) {
    return true;
  }

  const distanceKm = calculateDistance(
    location.latitude,
    location.longitude,
    settings.restaurantLatitude,
    settings.restaurantLongitude
  );

  const distanceMeters = distanceKm * 1000;
  return distanceMeters <= settings.maxDistanceMeters;
}

// Create a new check-in (host-based, no table number required)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, location, ipAddress, deviceInfo } = body as CheckInRequestBody;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 },
      );
    }

    // Validate location if provided (must be within 100m radius)
    if (location && !validateLocation(location)) {
      return NextResponse.json(
        { error: 'Location is too far from restaurant (max 100m)' },
        { status: 400 },
      );
    }

    // Create a new table session in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create a new table (virtual table for host-based check-in)
      // In production, you might want to assign to an available table
      const table = await tx.table.create({
        data: {
          number: 0, // Virtual table for host-based check-in
          name: 'Check-in Virtual',
          isActive: true,
        },
      });

      // Create the table session
      const tableSession = await tx.tableSession.create({
        data: {
          tableId: table.id,
          hostName: name,
          capacity: 1,
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
          name,
          email,
          phone,
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
          deviceInfo,
          ipaddress: ipAddress,
          location: location ? { latitude: location.latitude, longitude: location.longitude } : undefined,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
        include: {
          participant: true,
        },
      });

      return { tableSession, host, deviceSession };
    });

    // Publish SSE event for new session
    sseBus.publish('TABLE_SESSION_CREATED', {
      sessionId: result.tableSession.id,
      tableId: result.tableSession.tableId,
      tableName: result.tableSession.table.name,
    });

    return NextResponse.json(
      {
        ...result.tableSession,
        host: result.host,
        deviceSession: result.deviceSession,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating check-in:', error);
    return NextResponse.json(
      { error: 'Failed to create check-in' },
      { status: 500 },
    );
  }
}

// Get all active check-ins (table sessions)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};

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
        participants: {
          orderBy: {
            joinedAt: 'asc',
          },
        },
        orders: true,
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 },
    );
  }
}