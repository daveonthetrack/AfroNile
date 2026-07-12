import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { hashPassword, signToken } from '@repo/auth';
import { getJwtSecret } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
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

    // 5. Build response and set http-only cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role.name,
          name: name || user.email.split('@')[0],
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
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred.' },
      { status: 500 }
    );
  }
}
