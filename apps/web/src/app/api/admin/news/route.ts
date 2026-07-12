import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { verifyAdminFromCookies } from '@/lib/auth';
import { sanitizeHtml } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  try {
    if (!(await verifyAdminFromCookies())) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { title, slug, bodyHtml, type, publishedAt } = await req.json();

    if (!title?.trim() || !slug?.trim() || !bodyHtml?.trim() || !type?.trim() || !publishedAt) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    }

    // Check unique slug
    const existing = await prisma.contentPost.findUnique({ where: { slug: slug.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'SLUG_ALREADY_EXISTS' }, { status: 400 });
    }

    const post = await prisma.contentPost.create({
      data: {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        bodyHtml: sanitizeHtml(bodyHtml.trim()),
        type: type.trim().toUpperCase(),
        publishedAt: new Date(publishedAt),
      },
    });

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create news post:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await verifyAdminFromCookies())) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id, title, slug, bodyHtml, type, publishedAt } = await req.json();

    if (!id || !title?.trim() || !slug?.trim() || !bodyHtml?.trim() || !type?.trim() || !publishedAt) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    }

    // Check unique slug (ignoring this post)
    const existing = await prisma.contentPost.findFirst({
      where: {
        slug: slug.trim().toLowerCase(),
        NOT: { id },
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'SLUG_ALREADY_EXISTS' }, { status: 400 });
    }

    const post = await prisma.contentPost.update({
      where: { id },
      data: {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        bodyHtml: sanitizeHtml(bodyHtml.trim()),
        type: type.trim().toUpperCase(),
        publishedAt: new Date(publishedAt),
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error('Failed to update news post:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await verifyAdminFromCookies())) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'MISSING_ID' }, { status: 400 });
    }

    await prisma.contentPost.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete news post:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
