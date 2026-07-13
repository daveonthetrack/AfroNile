import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@repo/auth';
import { getJwtSecret } from '@/lib/env';
import { TicketVerifySchema } from '@/lib/validation';
import { TicketService } from '@/lib/services/ticket.service';

export async function POST(req: NextRequest) {
  try {
    // Authenticate scanner staff/admin session
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({
        approved: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication session token is missing.',
      }, { status: 401 });
    }

    const decoded = verifyToken(token, getJwtSecret());
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'STAFF')) {
      return NextResponse.json({
        approved: false,
        error: 'FORBIDDEN',
        message: 'Access denied. Concert Staff authorization required.',
      }, { status: 403 });
    }

    // Input Validation using Zod
    const body = await req.json();
    const parseResult = TicketVerifySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({
        approved: false,
        error: 'INVALID_FORMAT',
        message: parseResult.error.issues[0]?.message || 'Invalid QR code signature format.',
      }, { status: 400 });
    }

    const { qrCodeHash } = parseResult.data;

    // Get client IP for auditing
    const clientIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Execute validation through TicketService transaction layer
    const result = await TicketService.verifyAndScan(qrCodeHash, clientIp, decoded.userId);

    if (!result.approved) {
      let statusCode = 400;
      if (result.error === 'TICKET_NOT_FOUND') statusCode = 404;
      if (result.error === 'ALREADY_SCANNED') statusCode = 409;
      if (result.error === 'CONCURRENT_SCAN_CONFLICT') statusCode = 409;
      if (result.error === 'INTERNAL_SERVER_ERROR') statusCode = 500;

      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      approved: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected verification error occurred.',
    }, { status: 500 });
  }
}
