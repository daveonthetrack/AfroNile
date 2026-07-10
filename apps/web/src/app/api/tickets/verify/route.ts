import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';

interface VerificationRequest {
  qrCodeHash: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: VerificationRequest = await req.json();
    const { qrCodeHash } = body;

    // 1. Structural check
    if (!qrCodeHash || typeof qrCodeHash !== 'string') {
      return NextResponse.json({
        approved: false,
        error: 'INVALID_FORMAT',
        message: 'QR Code signature hash is required.',
      }, { status: 400 });
    }

    // Check signature signature length and character set (assume SHA-256 for cryptographic tickets)
    const sha256Regex = /^[a-fA-F0-9]{64}$/;
    if (!sha256Regex.test(qrCodeHash)) {
      return NextResponse.json({
        approved: false,
        error: 'STRUCTURAL_AUTHENTICITY_FAILED',
        message: 'The ticket QR signature fails cryptographic format verification.',
      }, { status: 400 });
    }

    // 2. Fetch ticket with metadata
    const ticket = await prisma.ticket.findUnique({
      where: { qrCodeHash },
      include: {
        event: {
          include: { artist: true },
        },
        orderItem: {
          include: {
            order: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({
        approved: false,
        error: 'TICKET_NOT_FOUND',
        message: 'Invalid ticket. No matching ticket record was found.',
      }, { status: 404 });
    }

    // 3. Check for previous scans
    if (ticket.isScanned) {
      return NextResponse.json({
        approved: false,
        error: 'ALREADY_SCANNED',
        message: 'Rejection: Ticket has already been scanned and cannot be reused.',
        scannedAt: ticket.scannedAt,
        holderEmail: ticket.orderItem.order.user.email,
        eventTitle: ticket.event.title,
      }, { status: 409 });
    }

    // 4. Atomic conditional update to block race conditions
    const updateResult = await prisma.ticket.updateMany({
      where: {
        id: ticket.id,
        isScanned: false,
      },
      data: {
        isScanned: true,
        scannedAt: new Date(),
      },
    });

    // Concurrency conflict check
    if (updateResult.count === 0) {
      const refreshedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
      });
      return NextResponse.json({
        approved: false,
        error: 'CONCURRENT_SCAN_CONFLICT',
        message: 'Rejection: This ticket was scanned in another request simultaneously.',
        scannedAt: refreshedTicket?.scannedAt || new Date(),
      }, { status: 409 });
    }

    // 5. Success
    return NextResponse.json({
      approved: true,
      ticketId: ticket.id,
      event: {
        title: ticket.event.title,
        venueName: ticket.event.venueName,
        eventDate: ticket.event.eventDate,
        artistName: ticket.event.artist.stageName,
      },
      holder: {
        email: ticket.orderItem.order.user.email,
      },
      scannedAt: new Date(),
    }, { status: 200 });

  } catch (error: any) {
    console.error('Ticket Verification API Error:', error);
    return NextResponse.json({
      approved: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected verification error occurred.',
    }, { status: 500 });
  }
}
