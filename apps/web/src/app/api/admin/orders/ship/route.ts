import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { verifyAdminFromRequest } from '@/lib/auth';
import { AuditService } from '@/lib/services/audit.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '127.0.0.1';
  let adminUserId = '';

  try {
    // 1. Authenticate Admin session
    if (!verifyAdminFromRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 403 });
    }

    // Resolve user ID if possible
    const token = req.cookies.get('token')?.value;
    if (token) {
      const { verifyToken } = await import('@repo/auth');
      const { getJwtSecret } = await import('@/lib/env');
      const decoded = verifyToken(token, getJwtSecret());
      adminUserId = decoded?.userId || '';
    }

    // 2. Parse request body
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    // 3. Retrieve order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status !== 'PAID') {
      return NextResponse.json({ error: `Cannot mark order as shipped in status: ${order.status}` }, { status: 400 });
    }

    // 4. Update order status and fulfillmentStatus
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        fulfillmentStatus: 'SHIPPED',
      },
    });

    // Log admin audit event
    await AuditService.record({
      ...(adminUserId ? { userId: adminUserId } : {}),
      action: 'ADMIN_ORDER_MARKED_SHIPPED',
      details: `Admin marked Order ID ${orderId} (Order Number: ${order.orderNumber}) as SHIPPED.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({ success: true, status: 'SHIPPED' });

  } catch (error: any) {
    console.error('Admin ship API error:', error);
    return NextResponse.json({ error: 'Internal server error processing shipment.' }, { status: 500 });
  }
}
