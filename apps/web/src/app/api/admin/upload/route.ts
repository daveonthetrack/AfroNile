import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { verifyAdminFromRequest } from '@/lib/auth';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(req: NextRequest) {
  if (!verifyAdminFromRequest(req)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'FILE_REQUIRED' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'INVALID_FILE_TYPE' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
      const filename = `${randomUUID()}.${ext}`;
      const uploadsDir = join(process.cwd(), 'public', 'uploads');

      await mkdir(uploadsDir, { recursive: true });
      await writeFile(join(uploadsDir, filename), buffer);

      const url = `/uploads/${filename}`;
      return NextResponse.json({ success: true, url }, { status: 201 });
    } catch (fsError) {
      console.warn('Local FS write failed (likely serverless/read-only). Falling back to Base64 data URL representation:', fsError);
      // Generate standard Base64 Data URL format that displays natively in <img> elements
      const base64 = buffer.toString('base64');
      const url = `data:${file.type};base64,${base64}`;
      return NextResponse.json({ success: true, url }, { status: 201 });
    }
  } catch (error: unknown) {
    console.error('Admin upload error:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
