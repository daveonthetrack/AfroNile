# AfroNile Platform - Comprehensive Application Handoff Guide

This document is a complete handoff detailing the entire AfroNile application architecture, directory structure, data models, payment pipelines, and real-time live synchronization mechanisms.

---

## 1. Directory Structure

The project is structured as a **PNPM Monorepo Workspace**:

```
├── apps
│   └── web                  # Next.js 14 App Router Frontend & APIs
│       ├── public           # Static assets (MP4 animations, images)
│       └── src
│           ├── app          # Route handlers (admin, live, shop, music, etc.)
│           ├── components   # Shared components (turntable, navigation)
│           ├── lib          # Utilities (Tailwind cn merge)
│           └── modules      # Business features (commerce, audio hook, live components)
├── packages
│   ├── auth                 # Shared JWT token signing & verification utilities
│   ├── database             # Prisma ORM schema definition, seeds, & migrations
│   └── tsconfig             # Shared TypeScript compiler settings
```

---

## 2. Shared Packages

### `@repo/database` (`packages/database`)
* **Prisma Schema (`prisma/schema.prisma`)**: Defines the relational database schemas. Major entities:
  * `User` & `Role`: Handles customer accounts, passwords, and permissions (Admin vs Client).
  * `Artist`: Tracks stage names, slug identifiers (`afronile`), biographies, and links.
  * `Album` & `Song`: Represents physical and digital albums, tracks, durations, and signed audio paths.
  * `Product`: Catalog products representing merchandise, ticket types, and VIP releases.
  * `Order` & `OrderItem`: Tracks purchases, Stripe payment intents, and status updates (PENDING, PAID, SHIPPED).
  * `Ticket`: Cryptographic tickets mapping to specific orders, verified with QR code hashes.
  * `SupportContribution`: Fan backing and comments sent during live concerts.
  * `EventState`: Tracks setlist progress (what song is currently active on stage).

### `@repo/auth` (`packages/auth`)
* **JWT Helper**: Provides `signToken` and `verifyToken` using `jsonwebtoken` to handle active client sessions, authenticated route cookie parsing, and dashboard permission checking.

---

## 3. Real-Time Concert Synchronization (SSE)

The platform supports live concert interaction through a **Server-Sent Events (SSE)** pipeline:

* **Stage Screen (/live/screen)**:
  * Mounts a fullscreen dashboard displayed on stage.
  * Establishes a persistent SSE connection to the client stream route: `/api/live/stream`.
* **Streaming Endpoint (`/api/live/stream/route.ts`)**:
  * Establishes a continuous HTTP connection with active listeners.
  * Polls the Postgres database every **5 seconds**.
  * Fetches the 30 most recent `SupportContribution` comments.
  * Calculates the active song using local server timestamps (simulating active tour sets dynamically).
  * Enqueues text updates: `data: {...}\n\n`.
* **Stage Feedback Loops**:
  * When a fan submits backing support or comments on `/live`, SSE broadcasts it instantly to the stage screen. The stage client fires a visual alert overlay displaying the comments.

---

## 4. Payment & Checkout Pipelines (Stripe)

Transactions are fully processed directly on-site using **Stripe Embedded Checkout**:

1. **Cart Store (`src/modules/commerce/hooks/useCartStore.ts`)**:
   * Uses a persistent state store (Zustand) to manage items, quantities, and pricing.
2. **Checkout Launch (`src/app/checkout/checkout-client.tsx`)**:
   * Takes a signed `client_secret` returned by the server.
   * Leverages `@stripe/stripe-js` to mount the Stripe payment iframe inside a custom glass-card panel.
3. **Fulfillment Webhook (`/api/webhooks/stripe/route.ts`)**:
   * Listeners capture `checkout.session.completed` events sent by Stripe.
   * Marks database orders as `PAID`.
   * Generates QR `Ticket` rows automatically for virtual entry cards.
4. **Live Support keepsakes (`/live/memory/[id]/page.tsx`)**:
   * Verifies the checkout session parameters on landing.
   * Converts temporary pending contributions into confirmed entries, displaying the fan gratitude box.

---

## 5. Visual Redesign Summary

All frontend elements have been reskinned to match a modern, dark luxury look and feel:

* **Header & Player**: Floating glass panels (`glass-card` backdrop blurs) with gold hover states and custom indicators.
* **Signature Turntable**: Added `SignatureVinyl` that spins on play and shrinks to a floating circular player widget in the bottom-right corner when scrolled past `350px`.
* **Artist Page**: Built a new `/artist` page styled like a high-contrast documentary editorial spread.
* **Music Page**: Refactored albums into a virtual vinyl sleeve rack. sleeves slide open to reveal tracklists when toggled.
* **Shop Page**: Re-skinned as a high-end luxury fashion store.
* **Tour Page**: Events are designed as typographic ticket stubs with perforated tear-off visuals.
