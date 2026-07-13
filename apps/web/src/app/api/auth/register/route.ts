import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { hashPassword, signToken } from '@repo/auth';
import { getJwtSecret } from '@/lib/env';
import { RegisterSchema } from '@/lib/validation';
import { AuditService } from '@/lib/services/audit.service';

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '127.0.0.1';
  let emailAttempt = '';

  try {
    const body = await req.json();

    // Validate input schema using Zod
    const parseResult = RegisterSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Invalid input parameters.' },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    emailAttempt = email;

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      await AuditService.record({
        action: 'AUTH_REGISTER_FAILED',
        details: `Registration failed: account with email "${email}" already exists`,
        ipAddress: clientIp,
      });
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    // 2. Fetch default USER role
    let defaultRole = await prisma.role.findUnique({
      where: { name: 'USER' },
    });

    // If role doesn't exist, create it (failsafe)
    if (!defaultRole) {
      defaultRole = await prisma.role.create({
        data: { name: 'USER', permissions: {} },
      });
    }

    // 3. Hash password and save user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        roleId: defaultRole.id,
      },
      include: {
        role: true,
      },
    });

    // 4. Sign JWT token
    const token = signToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role.name,
      },
      getJwtSecret()
    );

    // 5. Record successful registration event
    await AuditService.record({
      userId: user.id,
      action: 'AUTH_REGISTER_SUCCESS',
      details: `User registered successfully: "${email}"`,
      ipAddress: clientIp,
    });

    // 6. Build response and set http-only cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role.name,
          name: user.email.split('@')[0],
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (error: any) {
    await AuditService.record({
      action: 'AUTH_REGISTER_ERROR',
      details: `Exception occurred during registration: ${error.message || 'Unknown error'}. Attempted email: "${emailAttempt}"`,
      ipAddress: clientIp,
    });
    return NextResponse.json(
      { error: 'Internal server error occurred.' },
      { status: 500 }
    );
  }
}
