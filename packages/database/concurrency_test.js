/**
 * Database Concurrency Race-Condition Test
 * Fires multiple simultaneous checkout requests to verify that
 * transaction locks prevent double-selling when stock is limited.
 */

async function runConcurrencyTest() {
  const baseUrl = 'http://localhost:3000';
  console.log('🚀 Starting Concurrency Race-Condition Test...');

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // 1. Fetch test user and product
    const user = await prisma.user.findFirst({ where: { email: 'user@afronile.com' } });
    const product = await prisma.product.findFirst({ where: { sku: 'MERCH_TSHIRT_BLACK_L' } });

    if (!user || !product) {
      console.error('❌ Error: Seed data missing. Run "pnpm db:seed" first.');
      await prisma.$disconnect();
      return;
    }

    // 2. Set product stock to exactly 1
    console.log(`📦 Setting product stock of "${product.title}" to exactly 1...`);
    await prisma.product.update({
      where: { id: product.id },
      data: { stockQuantity: 1 }
    });
    console.log('✅ Stock reset complete.\n');

    // 3. Prepare 5 simultaneous checkouts for 1 item each
    console.log('⚡ Firing 5 simultaneous checkout requests (Promise.all)...');
    
    const checkoutPayload = {
      userId: user.id,
      items: [
        { productId: product.id, quantity: 1 }
      ]
    };

    const requests = Array.from({ length: 5 }).map((_, i) => {
      return fetch(`${baseUrl}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload)
      })
      .then(res => res.json().then(data => ({ status: res.status, data, requestId: i + 1 })))
      .catch(err => ({ status: 500, error: err.message, requestId: i + 1 }));
    });

    // Run parallel requests
    const responses = await Promise.all(requests);

    // 4. Analyze results
    console.log('\n📊 Analyzing responses:');
    let successCount = 0;
    let conflictCount = 0;
    let otherCount = 0;
    const orderIds = [];

    responses.forEach(res => {
      if (res.status === 201 && res.data.success) {
        successCount++;
        orderIds.push(res.data.orderId);
        console.log(`   [Req #${res.requestId}] 🟢 SUCCESS (201) - Order Created: ${res.data.orderId.substring(0, 8)}...`);
      } else if (res.status === 409 && res.data.error === 'OUT_OF_STOCK') {
        conflictCount++;
        console.log(`   [Req #${res.requestId}] 🔴 REJECTED (409 Conflict) - Stock exhausted.`);
      } else {
        otherCount++;
        console.error(`   [Req #${res.requestId}] ⚠️ UNEXPECTED STATUS (${res.status}):`, res.data || res.error);
      }
    });

    console.log('\n📉 Final Tally:');
    console.log(`   - Total Requests: 5`);
    console.log(`   - Successful Orders: ${successCount} (Expected: 1)`);
    console.log(`   - Stock Conflicts: ${conflictCount} (Expected: 4)`);

    // 5. Verification
    const finalProduct = await prisma.product.findUnique({ where: { id: product.id } });
    console.log(`   - Final DB Stock Quantity: ${finalProduct?.stockQuantity} (Expected: 0)`);

    // Assert correct concurrency locks behavior
    if (successCount === 1 && conflictCount === 4 && finalProduct?.stockQuantity === 0) {
      console.log('\n🎉 SUCCESS: Prisma transaction locks successfully prevented double-selling under high concurrency!');
    } else {
      console.error('\n❌ FAILURE: Concurrency race condition permitted over-selling or returned inconsistent tallies.');
    }

    // Clean up created orders
    if (orderIds.length > 0) {
      await prisma.order.deleteMany({
        where: { id: { in: orderIds } }
      });
      console.log('🧹 Cleanup complete: Removed test orders.');
    }

    // Restore stock to seed level
    await prisma.product.update({
      where: { id: product.id },
      data: { stockQuantity: 150 }
    });
    console.log('🧹 Cleanup complete: Restored Large T-shirt stock to 150.');

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error executing concurrency test:', error);
  }
}

runConcurrencyTest();
