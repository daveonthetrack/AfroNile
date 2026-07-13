# AfroNile Redesign - Handoff Guide for Cursor AI

This document details the architecture, design changes, and current status of the AfroNile website visual and motion redesign. You can use this guide to quickly load the context of the redesigned pages and continue fine-tuning the motion, CSS transitions, and styling details.

---

## 1. Project Context & Status

* **Objective**: Completely redesign the user experience and visual language of the AfroNile platform into a premium, immersive digital art experience (Apple/Awwwards polish) without altering any backend API logic, Prisma schemas, or payment flows.
* **Status**: **Fully redesigned and build verified.** The web app compiles and generates static pages cleanly:
  ```bash
  pnpm --filter=@repo/web run build
  ```
* **Development Server**: The server can be run locally using:
  ```bash
  pnpm --filter=@repo/web run dev
  ```

---

## 2. Design System & Global Styles

All design tokens are configured in the Next.js app layout and global stylesheet:

1. **Typography (`apps/web/src/app/layout.tsx`)**
   * Configures **Cinzel** (Google Fonts Serif) as the primary luxury heading font (`--font-serif`).
   * Configures **Outfit** (Sans-serif) as the geometric body/metadata font (`--font-sans`).
2. **Visual & Motion Foundation (`apps/web/src/app/globals.css`)**
   * **Background**: Deep void black (`#020202` / `hsl(240 10% 1.5%)`) layered with subtle Egyptian Gold radial gradients.
   * **Colors**: Accent matches Liquid Egyptian Gold (`#d4af37` / `hsl(38 65% 53%)`).
   * **Custom Scrollbar**: Styled as a thin, translucent gold track.
   * **Glassmorphism**: `.glass-card` and `.glass-card-hover` utilities create frosted overlays with very thin translucent borders (`rgba(255, 255, 255, 0.03)`).
   * **Scroll Reveals**: Natively supported via CSS `@supports (animation-timeline: view())` triggers (`.scroll-reveal`) and `.parallax-hero` to reveal sections smoothly without JS scroll lag.

---

## 3. Key Components Redesigned

* ** Turntable Micro-Interaction (`apps/web/src/components/shared/signature-vinyl.tsx` - NEW)**
  * Implements the signature turntable.
  * In the Hero section, it displays as a large platter with metal corners and a silver tonearm.
  * Mapped to scroll progress, so the vinyl rotates dynamically.
  * Scrolling past `350px` minimizes and scales the platter down, gliding it into a floating circular player widget in the bottom-right corner.
  * Integrates with `useAudioStore` — playing a song sweeps the tonearm onto the record and triggers rotation.
* **Floating Navigation (`apps/web/src/components/shared/navigation-bar.tsx`)**
  * Reimagined as a floating glass pill sitting at the top of the viewport.
  * Underlines active tabs with a glowing gold track. Added the new `Artist` link.
* **Luxury Player (`apps/web/src/components/shared/global-audio-player.tsx`)**
  * Sits at the bottom as a floating glass dock with gold progress sliders, custom thumbs, and micro-animations.

---

## 4. Re-skinned Pages & Clients

1. **Homepage (`apps/web/src/app/home-client.tsx`)**
   * Integrates the large signature vinyl deck side-by-side with editorial titles.
   * Sections slide and fade up.
   * Soundwave Visualizer features looping ambient CSS waves pulsing based on active playback state.
2. **Artist Biography (`apps/web/src/app/artist/page.tsx` & `artist-client.tsx` - NEW)**
   * A new dedicated route that displays the narrative roots of AfroNile in an editorial spread.
   * Features typographic quotes, chronological chapters, and full-bleed image grids.
3. **Music Archive (`apps/web/src/app/music/music-client.tsx`)**
   * Implements a digital "vinyl crate".
   * Hovering or clicking an album sleeve slides the concentric-grooved vinyl disc out from its card sleeve.
   * Right column displays tracklists in a minimal liner-notes booklet.
4. **Luxury Boutique Shop (`apps/web/src/app/shop/shop-client.tsx`)**
   * Replaced generic layouts with a luxury boutique card grid.
   * Includes interactive clothing size selectors (`S`, `M`, `L`, `XL`) that append selection tags directly to the cart hook payload.
5. **Live Concert Tour (`apps/web/src/app/tour/tour-client.tsx` & `event-row.tsx`)**
   * Event lists are designed as physical typographic ticket stubs.
   * Features a dashed vertical "tear line" perforation separating show times from price listings, and neon status indicators for ticket availability.
6. **Premium Checkout (`apps/web/src/app/checkout/checkout-client.tsx`)**
   * Styled Stripe Embedded checkout container to match the deep dark void/gold theme, layering with informative security details.
7. **Live Companion screen (`apps/web/src/app/live/live-client.tsx` & `support-module.tsx`)**
   * Beige forms are replaced with dark translucent panels.
   * Interactive cairo soundwave line pulses dynamically (speed and paths scale up based on the contribution tier chosen by the user).

---

## 5. Next Focus Areas for Fine-Tuning

* **Scroll-driven Animations**: You can check the native CSS view-timelines inside `globals.css` and customize animation range keyframes.
* **Asset Loading**: Ensure the animated hero logo loop (`/AfroNile Logo Animated.mp4`) and visualizer screens render smoothly on mobile viewport sizes.
* **Interactive Turntable**: The turntable arm uses an SVG path rotating from its top-right pivot. You can adjust the rotation angle `transform: rotate(...)` inside `signature-vinyl.tsx` to align exactly with track widths.
