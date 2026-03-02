

## Plan: Beta Landing Page with Email Signup

### Overview

Replace the current `/` route with a new beta landing page. Move the existing app home to `/app`. The landing page will focus on three key messages (gamifying investing, brand collaboration, tokenized stocks), show a live feed of tokenized stock images with animation, and collect emails for beta signup.

### Database Change

Create a `beta_signups` table to store email addresses:
- `id` (uuid, primary key)
- `email` (text, unique, not null)
- `created_at` (timestamptz, default now())
- RLS: allow anonymous inserts (public signup), restrict reads

### Routing Changes (src/App.tsx)

- `/` — new `LandingPage` component (no TopBar, no BottomNav)
- `/app` — current `Index` component (the existing app home)
- All other routes remain unchanged
- TopBar and BottomNav hide on `/` (landing page)

### New File: `src/pages/LandingPage.tsx`

Structure:
1. **Top bar** — "Snap'n Invest" logo + "Launch App" button (disabled/grayed, labeled "Coming Soon")
2. **Hero section** — Bold headline about gamifying investing with tokenized stocks. Three value props: gamification, brand collaboration, uniquely possible with tokenization
3. **Live tokenization feed** — Horizontally scrolling strip of captured product images from the `holdings` table, with a continuous marquee animation to convey ongoing tokenization activity
4. **Email signup** — Simple centered form: email input + "Join the Waitlist" button. On submit, insert into `beta_signups`. Show success toast
5. **Footer** — minimal, "Built on Robinhood Chain" badge

### Component Changes

- **BottomNav** — add `/` to the hidden paths list (already hides for camera/result/confirm)
- **TopBar** — add `/` to the hidden paths list

### Technical Details

- The marquee animation will use CSS `@keyframes` for a continuous horizontal scroll of product images fetched from holdings
- Email validation with basic format check before insert
- The "Launch App" button at top will be styled as disabled with "Coming Soon" text
- Uses existing framer-motion for entrance animations
- Reuses existing design tokens (dark theme, primary green, Space Grotesk headings)

