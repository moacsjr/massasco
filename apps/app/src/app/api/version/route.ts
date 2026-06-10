import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface VersionInfo {
  commitHash: string;
  imageTag: string;
  imageDigest: string;
  deployedAt: string;
}

export async function GET() {
  // Try reading version.json written by CI/CD deploy script
  const possiblePaths = [
    join(process.cwd(), '..', 'version.json'), // /home/ec2-user/meu-app/version.json (app runs in apps/app)
    join(process.cwd(), 'version.json'),
    '/home/ec2-user/meu-app/version.json',
  ];

  for (const filePath of possiblePaths) {
    if (existsSync(filePath)) {
      try {
        const raw = readFileSync(filePath, 'utf-8');
        const data: VersionInfo = JSON.parse(raw);
        return NextResponse.json(data);
      } catch {
        // continue to next path
      }
    }
  }

  // Fallback: use env vars or unknown
  return NextResponse.json({
    commitHash: process.env.NEXT_PUBLIC_COMMIT_HASH ?? 'unknown',
    imageTag: process.env.NEXT_PUBLIC_IMAGE_TAG ?? 'unknown',
    imageDigest: process.env.NEXT_PUBLIC_IMAGE_DIGEST ?? 'unknown',
    deployedAt: process.env.NEXT_PUBLIC_DEPLOYED_AT ?? 'unknown',
  });
}