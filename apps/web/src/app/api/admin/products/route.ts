import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { cookies } from 'next/headers';

async function verifyAdmin(): Promise<boolean> {
  const token = cookies().get('token')?.value;
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(payloadBase64));
      return decoded.role === 'ADMIN';
    }
  } catch (e) {}
  return false;
}

export async function POST(req: NextRequest) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { type, title, priceCents, sku, stockQuantity } = await req.json();

    if (!type || !title?.trim() || typeof priceCents !== 'number' || !sku?.trim() || typeof stockQuantity !== 'number') {
      return NextResponse.json({ error: 'MISSING_OR_INVALID_FIELDS' }, { status: 400 });
    }

    // Check unique SKU
    const existing = await prisma.product.findUnique({ where: { sku: sku.trim() } });
    if (existing) {
      return NextResponse.json({ error: 'SKU_ALREADY_EXISTS' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        type,
        title: title.trim(),
        priceCents,
        sku: sku.trim(),
        stockQuantity,
      },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id, type, title, priceCents, sku, stockQuantity } = await req.json();

    if (!id || !type || !title?.trim() || typeof priceCents !== 'number' || !sku?.trim() || typeof stockQuantity !== 'number') {
      return NextResponse.json({ error: 'MISSING_OR_INVALID_FIELDS' }, { status: 400 });
    }

    // Check unique SKU (ignoring this product)
    const existing = await prisma.product.findFirst({
      where: {
        sku: sku.trim(),
        NOT: { id },
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'SKU_ALREADY_EXISTS' }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        type,
        title: title.trim(),
        priceCents,
        sku: sku.trim(),
        stockQuantity,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Failed to update product:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'MISSING_ID' }, { status: 400 });
    }

    // Check if orders exist for this product to prevent foreign key errors
    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      return NextResponse.json({
        error: 'PRODUCT_HAS_ORDERS',
        message: 'Cannot delete product because customer orders exist for it. You can set its stock to 0 instead to deactivate sales.'
      }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete product:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
