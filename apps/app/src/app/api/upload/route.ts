import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }),
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;

    if (!bucketName || !cdnUrl) {
      return NextResponse.json(
        { error: 'AWS S3 configuration missing' },
        { status: 500 },
      );
    }

    const fileExtension = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    });

    await s3Client.send(command);

    const imageUrl = `${cdnUrl.replace(/\/$/, '')}/${fileName}`;

    return NextResponse.json({ imageUrl }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading file to S3:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 },
    );
  }
}
