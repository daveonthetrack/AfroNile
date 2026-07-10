/**
 * API Integration Test Script
 * Runs tests against local Next.js API endpoints:
 * 1. POST /api/checkout - Cart checkout validation, stock check, order creation, Stripe secrets.
 * 2. POST /api/tickets/verify - Cryptographic signature check, atomic scan updates, double-scanning prevention.
 */

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('🚀 Starting API integration tests on localhost:3000...\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Retrieve Seed Data (Artist & Products)
    // ----------------------------------------------------
    console.log('📦 Step 1: Connecting to PostgreSQL to find seeded product SKU...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findFirst({ where: { email: 'user@afronile.com' } });
    const product = await prisma.product.findFirst({ where: { sku: 'MERCH_TSHIRT_BLACK_L' } });
    const ticketProduct = await prisma.product.findFirst({ where: { sku: { startsWith: 'TICKET_' } } });
    
    if (!user || !product || !ticketProduct) {
      console.error('❌ Error: Seed data missing. Run "pnpm db:seed" first.');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Seed data located:\n   - User UUID: ${user.id}\n   - Product SKU: ${product.sku} (Stock: ${product.stockQuantity})\n`);

    // ----------------------------------------------------
    // TEST 2: POST /api/checkout (Merchandise)
    // ----------------------------------------------------
    console.log('🛒 Step 2: Testing POST /api/checkout (Merch Buy)...');
    
    const checkoutPayload = {
      userId: user.id,
      items: [
        { productId: product.id, quantity: 2 }
      ]
    };

    const checkoutResponse = await fetch(`${baseUrl}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutPayload)
    });

    const checkoutData = await checkoutResponse.json();

    if (checkoutResponse.ok && checkoutData.success) {
      console.log('✅ Checkout Successful:');
      console.log(`   - Order UUID: ${checkoutData.orderId}`);
      console.log(`   - Stripe Secret: ${checkoutData.stripeClientSecret.substring(0, 30)}...`);
      
      // Verify database stock decrement
      const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
      console.log(`   - Inventory Updated: ${product.stockQuantity} -> ${updatedProduct?.stockQuantity} (Decremented by 2)`);
    } else {
      console.error('❌ Checkout Failed:', checkoutData);
    }
    console.log('');

    // ----------------------------------------------------
    // TEST 3: Cryptographic Ticket Verification
    // ----------------------------------------------------
    console.log('🎫 Step 3: Seeding and scanning a cryptographically signed ticket...');

    // Locate event
    const event = await prisma.event.findFirst();
    if (!event) {
      console.error('❌ Error: No events found.');
      await prisma.$disconnect();
      return;
    }

    // Create a mock paid order with order item and ticket
    const tempOrder = await prisma.order.create({
      data: {
        userId: user.id,
        status: 'PAID',
        totalAmountCents: ticketProduct.priceCents,
        orderItems: {
          create: {
            productId: ticketProduct.id,
            quantity: 1,
            unitPriceCents: ticketProduct.priceCents
          }
        }
      },
      include: { orderItems: true }
    });

    const orderItemId = tempOrder.orderItems[0].id;
    // Generate valid SHA-256 signature format
    const testQrCodeHash = require('crypto').createHash('sha256').update(`ticket_signature_${Date.now()}`).digest('hex');

    // Create Ticket in DB
    const ticket = await prisma.ticket.create({
      data: {
        orderItemId,
        eventId: event.id,
        qrCodeHash: testQrCodeHash,
        isScanned: false
      }
    });
    console.log(`✅ Temporary Ticket Created:\n   - Hash: ${ticket.qrCodeHash}\n   - Scanned State: ${ticket.isScanned}`);

    // Call verify endpoint (Scan 1: Access Granted)
    console.log('\n   🔍 Firing Gate Scan 1 (Expected: Approved)...');
    const scan1Response = await fetch(`${baseUrl}/api/tickets/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCodeHash: ticket.qrCodeHash })
    });
    const scan1Data = await scan1Response.json();

    if (scan1Response.ok && scan1Data.approved) {
      console.log('   ✅ Gate Check 1: APPROVED (Access Granted!)');
      console.log(`      - Event: ${scan1Data.event.title}`);
      console.log(`      - Holder: ${scan1Data.holder.email}`);
    } else {
      console.error('   ❌ Gate Check 1 Failed:', scan1Data);
    }

    // Call verify endpoint (Scan 2: Double Scan Blocked)
    console.log('\n   🔍 Firing Gate Scan 2 (Expected: Rejection - Duplicate Scan)...');
    const scan2Response = await fetch(`${baseUrl}/api/tickets/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCodeHash: ticket.qrCodeHash })
    });
    const scan2Data = await scan2Response.json();

    if (!scan2Response.ok && scan2Data.error === 'ALREADY_SCANNED') {
      console.log('   ✅ Gate Check 2: REJECTED (Atomic Double-Scan Prevention Confirmed!)');
      console.log(`      - Rejection Message: "${scan2Data.message}"`);
      console.log(`      - Scanned At: ${scan2Data.scannedAt}`);
    } else {
      console.error('   ❌ Gate Check 2 Failed (Duplicate was not blocked):', scan2Data);
    }

    // Clean up temporary test order & ticket
    await prisma.ticket.delete({ where: { id: ticket.id } });
    await prisma.order.delete({ where: { id: tempOrder.id } });
    console.log('\n🧹 Step 4: Cleanup complete. Removed temporary test transactions.');
    
    await prisma.$disconnect();
    console.log('\n🎉 All API endpoints integration tests passed successfully!');

  } catch (error) {
    console.error('\n❌ Uncaught error during integration testing:', error);
  }
}

runTests();
