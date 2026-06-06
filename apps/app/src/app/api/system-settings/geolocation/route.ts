import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Geolocation settings interface
interface GeolocationSettings {
  enabled: boolean;
  restaurantLatitude: number;
  restaurantLongitude: number;
  maxDistanceMeters: number;
}

// Get geolocation settings
export async function GET(req: NextRequest) {
  try {
    // Get or create default geolocation settings
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

    // Create a map of settings
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    // Build response with defaults if settings don't exist
    const geolocationSettings: GeolocationSettings = {
      enabled: settingsMap.get('geolocation.enabled') === 'true',
      restaurantLatitude: parseFloat(settingsMap.get('geolocation.restaurantLatitude') || '-23.550520'),
      restaurantLongitude: parseFloat(settingsMap.get('geolocation.restaurantLongitude') || '-46.633308'),
      maxDistanceMeters: parseInt(settingsMap.get('geolocation.maxDistanceMeters') || '100', 10),
    };

    return NextResponse.json(geolocationSettings);
  } catch (error) {
    console.error('Error fetching geolocation settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch geolocation settings' },
      { status: 500 },
    );
  }
}

// Update geolocation settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { enabled, restaurantLatitude, restaurantLongitude, maxDistanceMeters } = body as Partial<GeolocationSettings>;

    // Validate required fields
    if (enabled === undefined) {
      return NextResponse.json(
        { error: 'enabled is required' },
        { status: 400 },
      );
    }

    // Update settings in a transaction
    const updatedSettings = await prisma.$transaction(async (tx) => {
      const updates = [];

      // Update enabled flag
      updates.push(
        tx.systemSetting.upsert({
          where: { key: 'geolocation.enabled' },
          update: { value: String(enabled) },
          create: {
            key: 'geolocation.enabled',
            value: String(enabled),
            description: 'Enable or disable geolocation validation',
          },
        }),
      );

      // Update restaurant latitude if provided
      if (restaurantLatitude !== undefined) {
        updates.push(
          tx.systemSetting.upsert({
            where: { key: 'geolocation.restaurantLatitude' },
            update: { value: String(restaurantLatitude) },
            create: {
              key: 'geolocation.restaurantLatitude',
              value: String(restaurantLatitude),
              description: 'Restaurant latitude for geolocation validation',
            },
          }),
        );
      }

      // Update restaurant longitude if provided
      if (restaurantLongitude !== undefined) {
        updates.push(
          tx.systemSetting.upsert({
            where: { key: 'geolocation.restaurantLongitude' },
            update: { value: String(restaurantLongitude) },
            create: {
              key: 'geolocation.restaurantLongitude',
              value: String(restaurantLongitude),
              description: 'Restaurant longitude for geolocation validation',
            },
          }),
        );
      }

      // Update max distance if provided
      if (maxDistanceMeters !== undefined) {
        updates.push(
          tx.systemSetting.upsert({
            where: { key: 'geolocation.maxDistanceMeters' },
            update: { value: String(maxDistanceMeters) },
            create: {
              key: 'geolocation.maxDistanceMeters',
              value: String(maxDistanceMeters),
              description: 'Maximum distance in meters from restaurant for check-in',
            },
          }),
        );
      }

      return Promise.all(updates);
    });

    // Build response
    const geolocationSettings: GeolocationSettings = {
      enabled,
      restaurantLatitude: restaurantLatitude ?? -23.550520,
      restaurantLongitude: restaurantLongitude ?? -46.633308,
      maxDistanceMeters: maxDistanceMeters ?? 100,
    };

    return NextResponse.json(geolocationSettings);
  } catch (error) {
    console.error('Error updating geolocation settings:', error);
    return NextResponse.json(
      { error: 'Failed to update geolocation settings' },
      { status: 500 },
    );
  }
}