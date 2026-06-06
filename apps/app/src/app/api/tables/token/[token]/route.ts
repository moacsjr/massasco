import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// Get table by token (checks both Table.token and TableAccessToken.token)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
console.log('Token:', JSON.stringify(token));
console.log('Length:', token.length);
    console.log('Looking up token:', token);

    // First, try to find table by Table.token
    let table = await prisma.table.findUnique({
      where: { token },
      select: {
        id: true,
        number: true,
        name: true,
        isActive: true,
        token: true,
        createdAt: true,
      },
    });

    console.log('Table found by Table.token:', table ? 'yes' : 'no');

    // If not found, try to find by TableAccessToken.token
    if (!table) {
      const accessToken = await prisma.tableAccessToken.findFirst({
        where: { token, isActive: true, revoked: false },
        include: { table: true },
      });

      console.log('TableAccessToken found:', accessToken ? 'yes' : 'no');

      if (accessToken && accessToken.table) {
        table = accessToken.table;
        console.log('Table found by TableAccessToken.token:', table.id);
      }
    }

    if (!table) {
      console.log('Table not found for token:', token);
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(table, { status: 200 });
  } catch (error) {
    console.error('Error fetching table by token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table' },
      { status: 500 }
    );
  }
}
