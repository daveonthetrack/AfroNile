import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { verifyPassword, signToken } from '@repo/auth';
import { getJwtSecret } from '@/lib/env';
import { LoginSchema } from '@/lib/validation';
import { AuditService } from '@/lib/services/audit.service';

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '127.0.0.1';
  let emailAttempt = '';

  try {
    const body = await req.json();
    
    // Validate input schema using Zod
    const parseResult = LoginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Invalid input parameters.' },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    emailAttempt = email;

    // 1. Fetch user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      await AuditService.record({
        action: 'AUTH_LOGIN_FAILED',
        details: `Login failed: user not found for email "${email}"`,
        ipAddress: clientIp,
      });
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // 2. Compare password hashes
    const passwordMatch = await verifyPassword(password, user.passwordHash);

    if (!passwordMatch) {
      await AuditService.record({
        userId: user.id,
        action: 'AUTH_LOGIN_FAILED',
        details: `Login failed: incorrect password for email "${email}"`,
        ipAddress: clientIp,
      });
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // 3. Sign JWT token
    const token = signToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role.name,
      },
      getJwtSecret()
    );

    // 4. Record successful login event
    await AuditService.record({
      userId: user.id,
      action: 'AUTH_LOGIN_SUCCESS',
      details: `User logged in successfully: "${email}"`,
      ipAddress: clientIp,
    });

    // 5. Set http-only cookie in response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        name: user.email.split('@')[0],
      },
    });

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
      action: 'AUTH_LOGIN_ERROR',
      details: `Exception occurred: ${error.message || 'Unknown error'}. Attempted email: "${emailAttempt}"`,
      ipAddress: clientIp,
    });
    return NextResponse.json(
      { error: 'Internal server error occurred.' },
      { status: 500 }
    );
  }
}
