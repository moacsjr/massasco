import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { sseBus } from '../../../lib/sse-bus';

// Get check-in by table number (returns active check-in if exists)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tableNumber = searchParams.get('tableNumber');

  if (!tableNumber) {
    return NextResponse.json(
      { error: 'tableNumber is required' },
      { status: 400 },
    );
  }

  const checkIn = await prisma.checkIn.findFirst({
    where: {
      tableNumber: parseInt(tableNumber, 10),
      status: 'OPEN',
    },
    include: {
      orders: {
        include: {
          items: {
            include: {
              product: { include: { prices: true, complements: true } },
              selectedPrice: true,
            },
          },
          payments: true,
        },
      },
    },
  });

  if (!checkIn) {
    return NextResponse.json(
      { error: 'No active check-in found for this table' },
      { status: 404 },
    );
  }

  // Convert Prisma Decimal to number for JSON serialization
  const serialized = {
    ...checkIn,
    orders: checkIn.orders.map((order: any) => ({
      ...order,
      items: order.items.map((item: any) => ({
        ...item,
        selectedComplements: item.selectedComplements
          ? JSON.parse(JSON.stringify(item.selectedComplements))
          : [],
      })),
    })),
  };

  return NextResponse.json(serialized);
}

// Create a new check-in or return existing active one
export async function POST(req: Request) {
  const body = await req.json();
  const { tableNumber, customerName } = body as {
    tableNumber: number;
    customerName: string;
  };

  // Validate required fields
  if (!tableNumber || !customerName) {
    return NextResponse.json(
      { error: 'tableNumber and customerName are required' },
      { status: 400 },
    );
  }

  // Check if there's already an active check-in for this table
  const existingCheckIn = await prisma.checkIn.findFirst({
    where: {
      tableNumber,
      status: 'OPEN',
    },
  });

  if (existingCheckIn) {
    // Return existing check-in (for shared table scenario)
    return NextResponse.json(
      { ...existingCheckIn, message: 'Joined existing check-in' },
      { status: 200 },
    );
  }

  // Create new check-in
  const checkIn = await prisma.checkIn.create({
    data: {
      tableNumber,
      customerName,
      status: 'OPEN',
    },
  });

  // Publish SSE event for new check-in
  sseBus.publish('CHECKIN_CREATED', { checkInId: checkIn.id, tableNumber });

  return NextResponse.json(checkIn, { status: 201 });
}