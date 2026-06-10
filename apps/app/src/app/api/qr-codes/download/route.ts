import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

// Generate QR code data
function generateQRCodeData(tableToken: string): string {
  // Format: https://portal.massas.co/customer-portal/checkin/{tableToken}
  return `https://portal.massas.co/customer-portal/checkin/${tableToken}`;
}

// Generate QR code as PNG data URI
async function generateQRCodeImage(data: string): Promise<Uint8Array> {
  const qrDataUrl = await QRCode.toDataURL(data, {
    width: 200,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
  // Convert data URL to Uint8Array
  const base64 = qrDataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// GET: Download all active tables QR codes as PDF
export async function GET() {
  try {
    // Get all active tables with their tokens
    const tables = await prisma.table.findMany({
      where: { isActive: true },
      orderBy: { number: 'asc' },
    });

    if (tables.length === 0) {
      return NextResponse.json(
        { error: 'No active tables found' },
        { status: 404 },
      );
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Page dimensions (A4)
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    // Grid layout: 2 columns x 2 rows = 4 QR codes per page
    const cols = 2;
    const rows = 2;
    const itemsPerPage = cols * rows;

    const cellWidth = pageWidth / cols;
    const cellHeight = pageHeight / rows;

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const pageIndex = Math.floor(i / itemsPerPage);
      const positionInPage = i % itemsPerPage;

      // Create new page if needed
      let page = pdfDoc.getPages()[pageIndex];
      if (!page) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
      }

      const col = positionInPage % cols;
      const row = Math.floor(positionInPage / cols);

      // Cell center coordinates
      const cellCenterX = col * cellWidth + cellWidth / 2;
      const cellCenterY = pageHeight - (row * cellHeight + cellHeight / 2);

      // Generate QR code image
      const qrUrl = generateQRCodeData(table.token);
      const qrImageBytes = await generateQRCodeImage(qrUrl);
      const qrImage = await pdfDoc.embedPng(qrImageBytes);

      // QR code size
      const qrSize = 150;

      // Draw QR code image (centered in cell)
      page.drawImage(qrImage, {
        x: cellCenterX - qrSize / 2,
        y: cellCenterY - qrSize / 2 + 20,
        width: qrSize,
        height: qrSize,
      });

      // Draw table number (above QR code)
      const tableLabel = table.name || `Mesa ${table.number}`;
      const labelWidth = boldFont.widthOfTextAtSize(tableLabel, 14);
      page.drawText(tableLabel, {
        x: cellCenterX - labelWidth / 2,
        y: cellCenterY + qrSize / 2 + 30,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Draw table number subtitle
      const subtitle = `Mesa ${table.number}`;
      const subtitleWidth = font.widthOfTextAtSize(subtitle, 10);
      page.drawText(subtitle, {
        x: cellCenterX - subtitleWidth / 2,
        y: cellCenterY + qrSize / 2 + 12,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Draw URL (below QR code)
      const urlText = `portal.massas.co/checkin/${table.token.substring(0, 8)}...`;
      const urlWidth = font.widthOfTextAtSize(urlText, 8);
      page.drawText(urlText, {
        x: cellCenterX - urlWidth / 2,
        y: cellCenterY - qrSize / 2 - 15,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Draw cell border (light gray)
      page.drawRectangle({
        x: col * cellWidth + 10,
        y: pageHeight - (row + 1) * cellHeight + 10,
        width: cellWidth - 20,
        height: cellHeight - 20,
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 1,
        color: rgb(1, 1, 1),
      });
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();

    // Convert Uint8Array to ArrayBuffer for NextResponse body
    const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
    new Uint8Array(pdfBuffer).set(pdfBytes);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="qr-codes-todas-mesas.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating all QR codes PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR codes PDF' },
      { status: 500 },
    );
  }
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