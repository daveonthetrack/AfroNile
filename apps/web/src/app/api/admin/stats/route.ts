import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { verifyToken } from '@repo/auth';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-artist-monolith';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user via token cookie
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Missing token.' }, { status: 401 });
    }

    const payload = verifyToken(token, JWT_SECRET) as any;
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // 2. Query Dashboard Data
    
    // a. Orders and Sales Metrics
    const totalOrders = await prisma.order.count();
    const paidOrders = await prisma.order.count({
      where: { status: 'PAID' }
    });

    const revenueResult = await prisma.order.aggregate({
      where: { status: 'PAID' },
      _sum: {
        totalAmountCents: true
      }
    });
    const totalRevenueCents = revenueResult._sum.totalAmountCents || 0;

    // b. Support Contributions (Donations) Metrics (only count verified paid ones)
    const totalDonationsCount = await prisma.supportContribution.count({
      where: {
        stripeSessionId: {
          not: {
            startsWith: 'pending_'
          }
        }
      }
    });
    const donationSumResult = await prisma.supportContribution.aggregate({
      where: {
        stripeSessionId: {
          not: {
            startsWith: 'pending_'
          }
        }
      },
      _sum: {
        amountCents: true
      }
    });
    const totalDonationsCents = donationSumResult._sum.amountCents || 0;

    // c. Users count
    const totalUsers = await prisma.user.count();

    // d. Tickets and scanning rate
    const totalTickets = await prisma.ticket.count();
    const scannedTickets = await prisma.ticket.count({
      where: { isScanned: true }
    });

    // e. Recent Orders (limit 50, include line items and user details)
    const recentOrders = await prisma.order.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true
          }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    // f. Recent Donations (limit 50)
    const recentDonations = await prisma.supportContribution.findMany({
      take: 50,
      where: {
        stripeSessionId: {
          not: {
            startsWith: 'pending_'
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            title: true
          }
        }
      }
    });

    // g. Product Inventory
    const inventory = await prisma.product.findMany({
      orderBy: { stockQuantity: 'asc' }
    });

    // Fetch all events
    const eventsList = await prisma.event.findMany({
      orderBy: { eventDate: 'asc' },
      include: {
        artist: {
          select: {
            stageName: true
          }
        }
      }
    });

    // Fetch all news/devlog posts
    const newsList = await prisma.contentPost.findMany({
      orderBy: { publishedAt: 'desc' }
    });

    // h. Tickets List (limit 100 for admin console management)
    const ticketsList = await prisma.ticket.findMany({
      take: 100,
      orderBy: { isScanned: 'asc' },
      include: {
        event: {
          select: {
            title: true
          }
        },
        orderItem: {
          include: {
            order: {
              include: {
                user: {
                  select: {
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // i. Time series for charts (30 days of data)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders30Days = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        },
        status: 'PAID'
      },
      select: {
        createdAt: true,
        totalAmountCents: true
      }
    });

    const donations30Days = await prisma.supportContribution.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        },
        stripeSessionId: {
          not: {
            startsWith: 'pending_'
          }
        }
      },
      select: {
        createdAt: true,
        amountCents: true
      }
    });

    // Group sales and donations by day
    const dailyDataMap: { [dateStr: string]: { sales: number; donations: number } } = {};
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyDataMap[dateStr] = { sales: 0, donations: 0 };
    }

    orders30Days.forEach(order => {
      const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyDataMap[dateStr]) {
        dailyDataMap[dateStr].sales += order.totalAmountCents;
      }
    });

    donations30Days.forEach(donation => {
      const dateStr = new Date(donation.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyDataMap[dateStr]) {
        dailyDataMap[dateStr].donations += donation.amountCents;
      }
    });

    const timeSeries = Object.entries(dailyDataMap).map(([date, data]) => ({
      date,
      sales: data.sales,
      donations: data.donations
    }));

    // 3. Respond with payload
    return NextResponse.json({
      success: true,
      metrics: {
        totalOrders,
        paidOrders,
        totalRevenueCents,
        totalDonationsCount,
        totalDonationsCents,
        totalUsers,
        totalTickets,
        scannedTickets,
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        email: order.user?.email || 'Guest',
        amountCents: order.totalAmountCents,
        status: order.status,
        createdAt: order.createdAt,
        items: order.orderItems.map(item => ({
          id: item.id,
          productTitle: item.product.title,
          sku: item.product.sku,
          quantity: item.quantity,
          priceCents: item.unitPriceCents
        }))
      })),
      recentDonations: recentDonations.map(donation => ({
        id: donation.id,
        email: donation.email || 'Anonymous',
        amountCents: donation.amountCents,
        comment: donation.comment || '',
        eventTitle: donation.event?.title || 'General Support',
        createdAt: donation.createdAt,
      })),
      inventory: inventory.map(product => ({
        id: product.id,
        title: product.title,
        sku: product.sku,
        type: product.type,
        stockQuantity: product.stockQuantity,
        priceCents: product.priceCents,
      })),
      tickets: ticketsList.map(t => ({
        id: t.id,
        qrCodeHash: t.qrCodeHash,
        isScanned: t.isScanned,
        scannedAt: t.scannedAt,
        eventTitle: t.event.title,
        email: t.orderItem.order.user?.email || 'Guest'
      })),
      events: eventsList.map(e => ({
        id: e.id,
        title: e.title,
        venueName: e.venueName,
        venueAddress: e.venueAddress,
        eventDate: e.eventDate,
        artistName: e.artist.stageName,
        artistId: e.artistId
      })),
      news: newsList.map(n => ({
        id: n.id,
        title: n.title,
        slug: n.slug,
        bodyHtml: n.bodyHtml,
        type: n.type,
        publishedAt: n.publishedAt
      })),
      timeSeries,
    });

  } catch (error: any) {
    console.error('Admin Stats API error:', error);
    return NextResponse.json({ error: 'Internal server error occurred.' }, { status: 500 });
  }
}
