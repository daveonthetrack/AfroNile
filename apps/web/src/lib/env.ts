/**
 * Centralized environment variable access.
 * Fails fast in production when required secrets are missing.
 */

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export function getJwtSecret(): string {
  return requireEnv('JWT_SECRET');
}

export function getStripeSecretKey(): string {
  return requireEnv('STRIPE_SECRET_KEY');
}

export function getStripeWebhookSecret(): string {
  return requireEnv('STRIPE_WEBHOOK_SECRET');
}

export function getAppOrigin(req?: { headers: { get(name: string): string | null } }): string {
  const configured = optionalEnv('NEXT_PUBLIC_APP_URL');
  if (configured) return configured.replace(/\/$/, '');
  if (req) {
    const origin = req.headers.get('origin');
    if (origin) return origin;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_APP_URL');
  }
  return 'http://localhost:3000';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getAssetSigningSecret(): string {
  return process.env.ASSET_SIGNING_SECRET?.trim() || getJwtSecret();
}
