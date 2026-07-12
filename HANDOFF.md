# AfroNile Platform — Handoff to Antigravity

**Date:** July 12, 2026  
**From:** Cursor Agent (production-readiness audit + Phases 0–2)  
**To:** Antigravity  
**Repo:** `/Users/daveonthetrack/AfroNile Website`  
**Constraint:** Do **not** redesign the UI. Extend and harden what exists.

---

## 1. Mission

Transform this monorepo from a prototype into a production-ready artist platform. A full audit was completed and **Phases 0–2 are largely implemented**. Your job is to **finish Phases 3–5**, fix remaining operational gaps, and validate end-to-end flows.

---

## 2. Repo Structure

```
apps/web/                  Next.js 14 app (main product)
packages/auth/             JWT + bcrypt helpers
packages/database/         Prisma schema, seed, migrations
```

**Stack:** Next.js App Router, Prisma/PostgreSQL, Stripe Checkout (embedded), Resend (email), Zustand (cart/audio), middleware auth.

**Key env vars** (see `.env.example`):

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Neon in prod; local docker on `:5435` |
| `JWT_SECRET` | Yes | No fallback — app throws if missing |
| `STRIPE_SECRET_KEY` | Yes | Payments |
| `STRIPE_WEBHOOK_SECRET` | Yes | Fulfillment |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Client checkout |
| `NEXT_PUBLIC_APP_URL` | Prod | Required in production |
| `RESEND_API_KEY` | Optional | Skips emails if unset |
| `ASSET_SIGNING_SECRET` | Optional | Defaults to `JWT_SECRET` |

---

## 3. What Was Completed

### Phase 0 — Blockers (DONE)

| Item | Implementation |
|------|----------------|
| Centralized env validation | `apps/web/src/lib/env.ts` — `getJwtSecret()`, `getStripeSecretKey()`, etc. Fail fast, no hardcoded secrets |
| Webhook-only order fulfillment | `apps/web/src/lib/fulfillment.ts` — atomic `PENDING→PAID`, stock decrement, ticket creation |
| Checkout success is read-only | `apps/web/src/app/api/checkout/success/route.ts` — verifies Stripe session, polls for webhook, never writes tickets |
| Checkout bound to session | `apps/web/src/app/api/checkout/route.ts` — `userId` from JWT cookie via `lib/auth.ts`, not request body |
| Stock not decremented pre-payment | Stock decremented only in `fulfillOrder()` on webhook |
| Simulate routes guarded | `api/admin/simulate/*` return 404 when `NODE_ENV === 'production'` |
| Demo payment bypass removed | `support-module.tsx` — no redirect without `clientSecret` |
| JWT verified on live routes | `api/live/support`, `api/live/checkin` use `lib/auth.ts` |
| Prisma migrations | `packages/database/prisma/migrations/20250712000000_init/` |
| Seed guarded | `seed.ts` throws in production |
| `.env.example` | Root of repo |

### Phase 1 — Core Commerce (DONE)

| Item | Implementation |
|------|----------------|
| `/orders` page | `apps/web/src/app/orders/` — fixes broken nav link |
| Auto ticket product on event create | `api/admin/events/route.ts` — creates `TICKET_{eventId}` in same transaction |
| `checkout.session.expired` webhook | `api/webhooks/stripe/route.ts` — marks orders `FAILED`, deletes unpaid contributions |
| Paid-only live comments | `api/live/comments` filters by `stripeSessionId`; support route only sets session ID after payment |
| Memory page payment gate | `live/memory/[id]/page.tsx` — requires paid session or existing `stripeSessionId` |
| STAFF seed user | `staff@afronile.com` in seed (same bcrypt hash as other seed users) |

### Phase 2 — Content & Media (DONE)

| Item | Implementation |
|------|----------------|
| Audio streaming proxy | `api/audio/stream/[songId]/route.ts` + `lib/audio-signing.ts` |
| Direct `/audio/*` blocked | `middleware.ts` matcher includes `/audio/:path*` → 403 |
| Signed stream URLs | `modules/audio/assetDistribution.ts` returns `/api/audio/stream/{songId}?token=&expires=` |
| News HTML sanitization | `lib/sanitize.ts` using **`sanitize-html`** (NOT isomorphic-dompurify — breaks build) |
| DB product images | `lib/product-image.ts`; shop/home pass `imageUrl` from Prisma |
| Artist page from DB | `artist-client.tsx` — bio paragraphs + `socialLinks` from DB |
| Admin image URL + upload | Product form has URL field; `POST /api/admin/upload` saves to `public/uploads/` |
| Products API `imageUrl` | `api/admin/products/route.ts` |

### Testing Fix (DONE)

- Replaced `isomorphic-dompurify` with `sanitize-html` — build was failing with `ENOENT: browser/default-stylesheet.css`
- Verified: `tsc`, monorepo `pnpm run build`, clean dev smoke tests pass

---

## 4. Critical Architecture Decisions (Do Not Break)

### Payment flow

```
Cart → POST /api/checkout (JWT session) → Stripe embedded checkout
     → Stripe webhook (SOLE fulfillment via fulfillOrder)
     → GET /api/checkout/success (read-only poll → redirect /tickets)
```

**Never** mark orders `PAID` or create tickets outside the webhook + `fulfillOrder()`.

### Auth helpers

Use `apps/web/src/lib/auth.ts`:

- `getSessionUser()`, `requireSessionUser()`, `verifyAdminFromRequest()`, `verifyAdminFromCookies()`

Do **not** reintroduce inline JWT secret fallbacks or manual base64 JWT decode.

### Audio

- Files still live in `public/audio/` (dev), but **direct access is blocked** by middleware
- Playback goes through signed `/api/audio/stream/[songId]` URLs
- **Future:** move to private S3/R2 and stream from object storage (Phase 2 stretch — not done)

---

## 5. Known Issues / Warnings

### Must fix before production deploy

1. **Pending migration on Neon**  
   `pnpm db:deploy` has not been applied to remote DB (`20250712000000_init` pending).  
   Vercel `buildCommand` runs `db:deploy` — ensure Neon credentials are set in Vercel.

2. **`next start` incompatible with `output: 'standalone'`**  
   `next.config.mjs` has `output: 'standalone'` but `package.json` uses `next start`.  
   **Fix:** Update start script to `node .next/standalone/apps/web/server.js` or remove standalone for Vercel-only deploys.

3. **Do not run `next build` while `next dev` is active**  
   Corrupts `.next` cache (`Cannot find module './3867.js'`). Delete `.next` and restart dev if this happens.

### Seed credentials undocumented

Seed users use bcrypt hash `$2a$10$yTIWdSLSG6NiBQk3UB6S.e2hVnYXLtkNfbWUxRz1iP7kNWWfT8Hme` — plaintext password is **not documented in repo**. `admin@afronile.com` / `password123` failed against Neon (DB may not be seeded). Document or rotate before prod.

### Still simulated / incomplete (Phase 3+)

| Area | Status |
|------|--------|
| Live status (`/api/live/status`, `/api/live/stream`) | Time-based fake rotation — `EventState` model exists but unused |
| `useLiveState` hook | Built but **never wired** into `LiveClient` |
| `LiveHero`, `LivePlayer`, `LiveFeed`, `UpcomingShows` | Orphaned components — not rendered |
| `/verify` page | Manual hash paste only — no camera QR scanner |
| `journey-progress.tsx` | `Math.random()` simulated momentum |
| `modules/live/constants.ts` | Mock Spotify/Apple URLs (some pages use DB social links now) |
| Analytics | None |
| Open Graph / SEO | Incomplete — most pages lack `openGraph` |
| `loading.tsx` / `error.tsx` | None |
| Rate limiting | None |
| Zod validation | None on API routes |
| `Role.permissions` JSON | Never enforced |
| Refund webhooks | `OrderStatus.REFUNDED` unused |
| CMS / Payload | `payloadMapping.ts` stub only |
| CI/CD | No `.github/workflows` |
| Tests | Zero test files |

---

## 6. Your Roadmap (Phases 3–5)

### Phase 3 — Live Experience (NEXT)

| # | Task | Files to touch |
|---|------|----------------|
| 1 | Wire `useLiveState(initialEventId)` into `LiveClient` | `live/live-client.tsx`, `live/page.tsx` |
| 2 | Render `LiveHero`, `LivePlayer`, `LiveFeed`, `UpcomingShows` | Same + existing module components |
| 3 | Replace simulated live status with `EventState` CRUD | `api/live/status`, `api/live/stream`, new admin API or artist controls |
| 4 | Filter mock data from admin stats | `api/admin/stats/route.ts` — exclude `mock_stripe_session_*` |
| 5 | Camera QR scanner on `/verify` | `verify/page.tsx` — `@zxing/browser` or `html5-qrcode` |
| 6 | Real social links everywhere | Remove/replace `modules/live/constants.ts` mock URLs |

### Phase 4 — Observability & SEO

| # | Task |
|---|------|
| 7 | `metadataBase` + Open Graph on all public pages |
| 8 | Complete `sitemap.ts` — add `/live`, `/tickets`, dynamic `/news/[slug]` |
| 9 | Analytics provider in `layout.tsx` |
| 10 | `loading.tsx` / `error.tsx` per data route |
| 11 | Structured logging (replace `console.log/error`) |
| 12 | Email retry queue when Resend fails |

### Phase 5 — Hardening

| # | Task |
|---|------|
| 13 | CSP + Permissions-Policy headers |
| 14 | Zod schemas shared client/server (`@repo/validation`?) |
| 15 | Rate limiting (auth, checkout, verify) |
| 16 | Password policy + email verification |
| 17 | ISR caching on catalog pages (`revalidate = 60–300`) |
| 18 | Cart persistence (`localStorage` or server cart) |
| 19 | CI pipeline (lint, tsc, build) |
| 20 | Scope ticket reset to `eventId` + audit log |
| 21 | Private audio storage (S3/R2) — move off `public/audio` |

---

## 7. Key Files Reference

```
apps/web/src/lib/
  env.ts              # All env access — extend here
  auth.ts             # Session/admin helpers — use everywhere
  fulfillment.ts      # Order fulfillment — webhook only
  audio-signing.ts    # HMAC stream tokens
  sanitize.ts         # HTML sanitization (sanitize-html)
  product-image.ts    # imageUrl + keyword fallbacks

apps/web/src/middleware.ts     # /admin, /verify, /audio protection
apps/web/src/app/api/webhooks/stripe/route.ts   # Payment source of truth
apps/web/src/app/api/checkout/route.ts          # Session-bound checkout
apps/web/src/app/api/checkout/success/route.ts  # Read-only redirect
apps/web/src/app/admin/admin-dashboard-client.tsx  # Admin UI (large file)
packages/database/prisma/schema.prisma          # Full data model
packages/database/prisma/seed.ts                # Dev-only seed
```

---

## 8. How to Run Locally

```bash
# 1. Start Postgres (docker)
docker compose up -d postgres

# 2. Env
cp .env.example .env   # fill DATABASE_URL, JWT_SECRET, Stripe keys

# 3. Database
pnpm db:generate
pnpm db:migrate        # or db:deploy for prod-like
pnpm db:seed           # dev only — wipes and reseeds

# 4. Dev
pnpm dev               # http://localhost:3000 (or next free port)

# 5. Verify
cd apps/web && pnpm exec tsc --noEmit
pnpm run build         # run ONLY when dev server is stopped
```

**Smoke test checklist (clean dev):**

- `/` → 200
- `/orders` unauthenticated → 307
- `POST /api/checkout` no auth → 401
- `POST /api/checkout` empty cart + auth → 400
- `/audio/*` → 403
- `/api/audio/[id]` no auth → 401

---

## 9. Deployment (Vercel)

`apps/web/vercel.json`:

```json
{
  "buildCommand": "pnpm --filter=@repo/database db:generate && pnpm --filter=@repo/database db:deploy && pnpm --filter=@repo/auth build && next build"
}
```

Ensure all env vars are set in Vercel. Stripe webhook must point to `/api/webhooks/stripe`.

---

## 10. Git State Note

At handoff time, many files were modified but **not committed** (per user instruction — only commit when asked). Run `git status` and review the full diff before continuing. Key new files:

- `apps/web/src/app/orders/`
- `apps/web/src/lib/env.ts`, `auth.ts`, `fulfillment.ts`, `audio-signing.ts`, `sanitize.ts`, `product-image.ts`
- `apps/web/src/app/api/audio/stream/[songId]/route.ts`
- `apps/web/src/app/api/admin/upload/route.ts`
- `packages/database/prisma/migrations/20250712000000_init/`
- `HANDOFF.md` (this file)

---

## 11. Rules for Antigravity

1. **Do not redesign the UI** — wire existing components, fix backend, add validation.
2. **Minimize scope** — smallest correct diff per task.
3. **Match existing conventions** — read surrounding code before adding abstractions.
4. **Never reintroduce** JWT secret fallbacks, payment bypass on success route, or demo payment redirects.
5. **Test after changes:** `tsc --noEmit`, `pnpm run build` (dev server stopped), smoke tests above.
6. **Do not commit** unless the user explicitly asks.

---

## 12. Suggested First Session for Antigravity

1. Fix `package.json` start script for standalone output (5 min)
2. Run `pnpm db:deploy` against Neon and verify seed/password docs (10 min)
3. Start **Phase 3, Task 1:** Wire `useLiveState` into `LiveClient` — highest user-visible gap
4. Add `loading.tsx` / `error.tsx` for `/`, `/shop`, `/admin` while touching those areas

Good luck. The foundation is solid — payment security and auth are in good shape. The live experience, SEO, and operational polish are the main remaining work.
