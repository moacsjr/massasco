import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts, rgb, PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';

// Generate QR code data
function generateQRCodeData(tableToken: string): string {
  return `https://portal.massas.co/plugins/customer-portal/checkin/${tableToken}`;
}

// Draw QR code directly on PDF using rectangles (no image embedding needed)
function drawQRCodeOnPage(
  page: PDFPage,
  data: string,
  x: number,
  y: number,
  size: number,
): void {
  const qrCodeData = QRCode.create(data, {
    errorCorrectionLevel: 'M',
  });

  const modules = qrCodeData.modules;
  const moduleCount = modules.size;
  const moduleSize = size / moduleCount;

  // Draw white background
  page.drawRectangle({
    x,
    y,
    width: size,
    height: size,
    color: rgb(1, 1, 1),
  });

  // Draw black modules
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules.get(row, col)) {
        const moduleX = x + col * moduleSize;
        const moduleY = y + size - (row + 1) * moduleSize;

        page.drawRectangle({
          x: moduleX,
          y: moduleY,
          width: moduleSize + 0.1,
          height: moduleSize + 0.1,
          color: rgb(0, 0, 0),
        });
      }
    }
  }
}

// GET: Download all active tables QR codes as PDF
export async function GET() {
  try {
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

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // A4 dimensions
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    // Grid: 2 columns x 2 rows = 4 QR codes per page
    const cols = 2;
    const rows = 2;
    const itemsPerPage = cols * rows;

    const cellWidth = pageWidth / cols;
    const cellHeight = pageHeight / rows;

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const pageIndex = Math.floor(i / itemsPerPage);
      const positionInPage = i % itemsPerPage;

      let page = pdfDoc.getPages()[pageIndex];
      if (!page) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
      }

      const col = positionInPage % cols;
      const row = Math.floor(positionInPage / cols);

      const cellCenterX = col * cellWidth + cellWidth / 2;
      const cellCenterY = pageHeight - (row * cellHeight + cellHeight / 2);

      // Draw cell border
      page.drawRectangle({
        x: col * cellWidth + 10,
        y: pageHeight - (row + 1) * cellHeight + 10,
        width: cellWidth - 20,
        height: cellHeight - 20,
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 1,
        color: rgb(1, 1, 1),
      });

      const qrUrl = generateQRCodeData(table.token);
      const qrSize = 150;

      // Draw QR code directly using rectangles
      drawQRCodeOnPage(
        page,
        qrUrl,
        cellCenterX - qrSize / 2,
        cellCenterY - qrSize / 2 + 20,
        qrSize,
      );

      // Draw table name (above QR code)
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
      const urlText = `portal.massas.co/plugins/customer-portal/checkin/${table.token.substring(0, 8)}...`;
      const urlWidth = font.widthOfTextAtSize(urlText, 8);
      page.drawText(urlText, {
        x: cellCenterX - urlWidth / 2,
        y: cellCenterY - qrSize / 2 - 15,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    const pdfBytes = await pdfDoc.save();
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

// POST: Download QR codes for specific tables
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableIds } = body as {
      tableIds?: string[];
    };

    const where: any = {
      isActive: true,
    };

    if (tableIds && tableIds.length > 0) {
      where.id = { in: tableIds };
    }

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