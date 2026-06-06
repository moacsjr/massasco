import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { randomBytes } from 'crypto';
import { createHash } from 'crypto';

// Generate a unique token for the table access
function generateAccessToken(): string {
  return randomBytes(16).toString('base64url');
}

// Generate QR code data
function generateQRCodeData(tableToken: string): string {
  // Format: /customer-portal/checkin/{tableToken}
  return `/customer-portal/checkin/${tableToken}`;
}

// Generate a new QR code for a table
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableId, regenerate } = body as {
      tableId: string;
      regenerate?: boolean;
    };

    if (!tableId) {
      return NextResponse.json(
        { error: 'tableId is required' },
        { status: 400 },
      );
    }

    // Check if table exists
    const table = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 },
      );
    }

    // Check if table is active
    if (!table.isActive) {
      return NextResponse.json(
        { error: 'Table is not active' },
        { status: 400 },
      );
    }

    // If regenerating, revoke old tokens
    if (regenerate) {
      await prisma.$transaction(async (tx) => {
        // Revoke all existing tokens for this table
        await tx.tableAccessToken.updateMany({
          where: { tableId },
          data: {
            isActive: false,
            revoked: true,
            revokedAt: new Date(),
          },
        });

        // Create new token
        const newToken = await tx.tableAccessToken.create({
          data: {
            tableId,
            token: generateAccessToken(),
            isActive: true,
          },
        });

        // Update table token
        await tx.table.update({
          where: { id: tableId },
          data: {
            token: newToken.token,
          },
        });

        return newToken;
      });
    } else {
      // Check if table already has an active token
      const existingToken = await prisma.tableAccessToken.findFirst({
        where: {
          tableId,
          isActive: true,
          revoked: false,
        },
      });

      if (existingToken && !regenerate) {
        return NextResponse.json({
          tableId: table.id,
          token: existingToken.token,
          qrCodeUrl: generateQRCodeData(existingToken.token),
          message: 'Existing QR code returned',
        });
      }

      // Create new token
      const newToken = await prisma.tableAccessToken.create({
        data: {
          tableId,
          token: generateAccessToken(),
          isActive: true,
        },
      });

      // Update table token
      await prisma.table.update({
        where: { id: tableId },
        data: {
          token: newToken.token,
        },
      });
    }

    // Regenerate the table with updated token
    const updatedTable = await prisma.table.findUnique({
      where: { id: tableId },
    });

    return NextResponse.json({
      tableId: updatedTable?.id,
      token: updatedTable?.token,
      qrCodeUrl: generateQRCodeData(updatedTable?.token || ''),
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 },
    );
  }
}

// Get QR code for a table by token
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tableToken = searchParams.get('tableToken');

    if (!tableToken) {
      return NextResponse.json(
        { error: 'tableToken is required' },
        { status: 400 },
      );
    }

    // Find table by token
    const table = await prisma.table.findUnique({
      where: { token: tableToken },
      include: {
        tableAccessTokens: {
          where: {
            isActive: true,
            revoked: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Invalid or expired QR code' },
        { status: 404 },
      );
    }

    // Check if table is active
    if (!table.isActive) {
      return NextResponse.json(
        { error: 'Invalid or expired QR code' },
        { status: 404 },
      );
    }

    // Get the latest active token
    const activeToken = table.tableAccessTokens[0];

    if (!activeToken || activeToken.revoked) {
      return NextResponse.json(
        { error: 'Invalid or expired QR code' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      tableId: table.id,
      tableNumber: table.number,
      token: activeToken.token,
      qrCodeUrl: generateQRCodeData(activeToken.token),
    });
  } catch (error) {
    console.error('Error fetching QR code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QR code' },
      { status: 500 },
    );
  }
}