import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Generate QR code data
function generateQRCodeData(tableToken: string): string {
  // Format: /customer-portal/checkin/{tableToken}
  return `/customer-portal/checkin/${tableToken}`;
}

// Download QR codes as PDF
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableIds } = body as {
      tableIds?: string[];
    };

    // If no tableIds provided, get all active tables
    const where: any = {
      isActive: true,
    };

    if (tableIds && tableIds.length > 0) {
      where.id = { in: tableIds };
    }

    // Get all tables with their tokens
    const tables = await prisma.table.findMany({
      where,
      orderBy: {
        number: 'asc',
      },
    });

    if (tables.length === 0) {
      return NextResponse.json(
        { error: 'No tables found' },
        { status: 404 },
      );
    }

    // Return a JSON response with QR code URLs
    // The client can use this to generate and download QR codes
    return NextResponse.json({
      tables: tables.map((table) => ({
        id: table.id,
        number: table.number,
        name: table.name,
        qrCodeUrl: generateQRCodeData(table.token),
      })),
    });
  } catch (error) {
    console.error('Error downloading QR codes:', error);
    return NextResponse.json(
      { error: 'Failed to download QR codes' },
      { status: 500 },
    );
  }
}