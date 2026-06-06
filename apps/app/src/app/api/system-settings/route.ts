import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all system settings
export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: {
        key: 'asc',
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 },
    );
  }
}

// Update system settings (bulk update)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = body as Array<{
      key: string;
      value?: string;
      description?: string;
    }>;

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Settings must be an array' },
        { status: 400 },
      );
    }

    // Update settings in a transaction
    const updatedSettings = await prisma.$transaction(
      settings.map((setting) =>
        prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value ?? null,
            description: setting.description ?? undefined,
          },
          create: {
            key: setting.key,
            value: setting.value ?? null,
            description: setting.description ?? undefined,
          },
        }),
      ),
    );

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 },
    );
  }
}