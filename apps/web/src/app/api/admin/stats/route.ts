import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@repo/database';
import { verifyAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminFromRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // 1. Compute Start Times
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const startOfYear = new Date();
    startOfYear.setUTCMonth(0);
    startOfYear.setUTCDate(1);
    startOfYear.setUTCHours(0, 0, 0, 0);

    const paidOrderWhere: Prisma.OrderWhereInput = {
      status: { in: ['PAID', 'SHIPPED'] },
      payments: { some: { status: 'succeeded' } },
    };
    const paidContributionWhere: Prisma.SupportContributionWhereInput = {
      stripeSessionId: { not: null },
    };

    // 2. Query Dashboard Data

    // a. Orders count by status
    const totalOrders = await prisma.order.count({
      where: {
        OR: [
          paidOrderWhere,
          { status: 'PENDING', stripePaymentIntentId: { not: null } },
        ],
      },
    });
    const paidOrders = await prisma.order.count({
      where: paidOrderWhere,
    });
    const pendingOrdersCount = await prisma.order.count({
      where: { status: 'PENDING', stripePaymentIntentId: { not: null } },
    });
    const completedOrdersCount = await prisma.order.count({
      where: paidOrderWhere,
    });

    const revenueResult = await prisma.order.aggregate({
      where: paidOrderWhere,
      _sum: {
        totalAmountCents: true
      }
    });
    const totalSalesCents = revenueResult._sum.totalAmountCents || 0;

    // b. Support Contributions (Donations) Metrics
    const totalDonationsCount = await prisma.supportContribution.count({
      where: paidContributionWhere,
    });
    const donationSumResult = await prisma.supportContribution.aggregate({
      where: paidContributionWhere,
      _sum: {
        amountCents: true
      }
    });
    const totalDonationsCents = donationSumResult._sum.amountCents || 0;

    const totalRevenueCents = totalSalesCents + totalDonationsCents;

    // c. Users count
    const totalUsers = await prisma.user.count();

    // d. Tickets and scanning rate
    const totalTickets = await prisma.ticket.count();
    const scannedTickets = await prisma.ticket.count({
      where: { isScanned: true }
    });

    // e. Today, Month, Year Revenue ranges
    const salesTodayResult = await prisma.order.aggregate({
      where: {
        ...paidOrderWhere,
        createdAt: { gte: startOfToday },
      },
      _sum: { totalAmountCents: true },
    });
    const donationsTodayResult = await prisma.supportContribution.aggregate({
      where: {
        ...paidContributionWhere,
        createdAt: { gte: startOfToday },
      },
      _sum: { amountCents: true },
    });
    const revenueToday = (salesTodayResult._sum.totalAmountCents || 0) + (donationsTodayResult._sum.amountCents || 0);
    const ordersTodayCount = await prisma.order.count({
      where: {
        ...paidOrderWhere,
        createdAt: { gte: startOfToday },
      }
    });

    const salesMonthResult = await prisma.order.aggregate({
      where: {
        ...paidOrderWhere,
        createdAt: { gte: startOfMonth },
      },
      _sum: { totalAmountCents: true },
    });
    const donationsMonthResult = await prisma.supportContribution.aggregate({
      where: {
        ...paidContributionWhere,
        createdAt: { gte: startOfMonth },
      },
      _sum: { amountCents: true },
    });
    const revenueMonth = (salesMonthResult._sum.totalAmountCents || 0) + (donationsMonthResult._sum.amountCents || 0);

    const salesYearResult = await prisma.order.aggregate({
      where: {
        ...paidOrderWhere,
        createdAt: { gte: startOfYear },
      },
      _sum: { totalAmountCents: true },
    });
    const donationsYearResult = await prisma.supportContribution.aggregate({
      where: {
        ...paidContributionWhere,
        createdAt: { gte: startOfYear },
      },
      _sum: { amountCents: true },
    });
    const revenueYear = (salesYearResult._sum.totalAmountCents || 0) + (donationsYearResult._sum.amountCents || 0);

    // f. Refunds
    const refundsResult = await prisma.transaction.aggregate({
      where: { type: 'REFUND' },
      _sum: { amountCents: true },
    });
    const refundsCents = Math.abs(refundsResult._sum.amountCents || 0);

    // g. Average Order Value
    const averageOrderValue = paidOrders > 0 ? Math.round(totalSalesCents / paidOrders) : 0;

    // h. Conversion Rate (Checkout Init vs Checkout Success)
    const checkoutInitCount = await prisma.analyticsEvent.count({ where: { eventType: 'CHECKOUT_INIT' } });
    const checkoutSuccessCount = await prisma.analyticsEvent.count({ where: { eventType: 'CHECKOUT_SUCCESS' } });
    const conversionRate = checkoutInitCount > 0 ? Number(((checkoutSuccessCount / checkoutInitCount) * 100).toFixed(1)) : 0.0;

    // i. Sales Category breakdowns
    const ticketSalesResult = await prisma.orderItem.aggregate({
      where: {
        order: paidOrderWhere,
        product: { type: 'TICKET_DIGITAL' }
      },
      _sum: { quantity: true }
    });
    const ticketSalesCount = ticketSalesResult._sum.quantity || 0;

    const albumSalesResult = await prisma.orderItem.aggregate({
      where: {
        order: paidOrderWhere,
        product: { sku: { startsWith: 'ALBUM_' } }
      },
      _sum: { quantity: true }
    });
    const albumSalesCount = albumSalesResult._sum.quantity || 0;

    const merchSalesResult = await prisma.orderItem.aggregate({
      where: {
        order: paidOrderWhere,
        product: { type: 'MERCHANDISE' }
      },
      _sum: { quantity: true }
    });
    const merchSalesCount = merchSalesResult._sum.quantity || 0;

    // j. Top Selling Products Grouping
    const paidOrderItems = await prisma.orderItem.findMany({
      where: {
        order: paidOrderWhere,
      },
      select: {
        productId: true,
        quantity: true,
        unitPriceCents: true,
        product: {
          select: {
            title: true,
            sku: true,
          },
        },
      },
    });
    const topProductsById = new Map<string, {
      productId: string;
      title: string;
      sku: string;
      quantitySold: number;
      totalSalesCents: number;
    }>();
    for (const item of paidOrderItems) {
      const current = topProductsById.get(item.productId) || {
        productId: item.productId,
        title: item.product.title,
        sku: item.product.sku,
        quantitySold: 0,
        totalSalesCents: 0,
      };
      current.quantitySold += item.quantity;
      current.totalSalesCents += item.unitPriceCents * item.quantity;
      topProductsById.set(item.productId, current);
    }
    const topProducts = [...topProductsById.values()]
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // k. Recent Orders (limit 50, include detailed columns)
    const recentOrders = await prisma.order.findMany({
      take: 50,
      where: {
        OR: [
          paidOrderWhere,
          { status: 'PENDING', stripePaymentIntentId: { not: null } },
        ],
      },
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

    // l. Recent Donations (limit 50)
    const recentDonations = await prisma.supportContribution.findMany({
      take: 50,
      where: {
        ...paidContributionWhere,
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

    // m. Product Inventory
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

    // n. Tickets List (limit 100)
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

    // o. Time series for charts (30 days of data)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders30Days = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        },
        ...paidOrderWhere,
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
        ...paidContributionWhere,
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
        pendingOrders: pendingOrdersCount,
        completedOrders: completedOrdersCount,
        totalRevenueCents,
        totalSalesCents,
        totalDonationsCount,
        totalDonationsCents,
        totalUsers,
        totalTickets,
        scannedTickets,
        revenueToday,
        revenueMonth,
        revenueYear,
        refundsCents,
        averageOrderValue,
        conversionRate,
        ordersToday: ordersTodayCount,
        ticketSalesCount,
        albumSalesCount,
        merchSalesCount,
      },
      topProducts,
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber || `AN-${order.id.slice(0, 6).toUpperCase()}`,
        email: order.user?.email || 'Guest',
        amountCents: order.totalAmountCents,
        taxCents: order.taxCents,
        shippingCents: order.shippingCents,
        discountCents: order.discountCents,
        status: order.status,
        stripeSessionId: order.stripeSessionId,
        stripePaymentIntentId: order.stripePaymentIntentId,
        receiptUrl: order.receiptUrl,
        refundStatus: order.refundStatus,
        fulfillmentStatus: order.fulfillmentStatus,
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
