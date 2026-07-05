# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Helper Buddy — a Next.js (App Router) marketplace connecting customers with home service partners (cleaning, AC repair, plumbing, electrical, etc.) in Surat, Gujarat. Three user roles share one codebase: `USER` (customers), `PARTNER` (service providers), `ADMIN`.

## Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # next build && prisma generate
npm run start    # start production server
npm run lint     # next lint
```

There is no test suite configured in this repo (no test script/framework present).

Prisma:
```bash
npx prisma generate           # regenerate client after schema changes (also runs on postinstall)
npx prisma migrate dev        # create/apply a migration in development
npx prisma studio             # inspect the database
```

Required env vars (see `.env.local`): `DATABASE_URL` (NeonDB Postgres), `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`, EdgeStore and EmailJS/nodemailer credentials.

## Architecture

### Role-based routing & auth

- Auth is NextAuth (`src/lib/auth.ts` for session helpers, `src/app/api/auth/[...nextauth]/options.ts` for config) with two providers: Credentials (bcrypt-hashed passwords looked up across both `User` and `Partner` tables) and Google OAuth.
- Role lives on the JWT/session (`USER | ADMIN | PARTNER | PENDING_ADMIN`). Admin accounts are recognized by email pattern `hbadmin<...>@gmail.com`; new admin signups get `PENDING_ADMIN` until approved.
- `src/middleware.ts` gates `/admin/:path*`, `/user/:path*`, `/partner/:path*` by comparing the JWT role to the path prefix, redirecting to `/unauthorized/{role}` on mismatch. It also sets permissive CORS headers on every response (tighten before hardening for production).
- Partners must be `approved` by an admin (`Partner.approved`) before they can sign in.
- New user signup grants a ₹100 signup bonus and lazily creates a `Wallet` (`ensureWalletExists` in the NextAuth options file) — this runs on every credential/Google login, not just at registration.

### Data model (`prisma/schema.prisma`)

Central entities: `User`, `Partner`, `Service`, `Order`, `Wallet`/`Transaction`, `Review`, `ServiceProvider` (join table linking partners to the services they offer), `PartnerPincode` (join table for which pincodes a partner serves), `PartnerRequestedService` (partner-submitted requests for new service categories, admin-approved).

`Order.status` moves through a fixed lifecycle: `PENDING → ACCEPTED → IN_PROGRESS → SERVICE_COMPLETED → PAYMENT_REQUESTED → PAYMENT_COMPLETED → COMPLETED` (or `CANCELLED` at various points). Order handler logic is split by concern under `src/app/api/orders/handlers/` (`createOrder.ts`, `updateOrder.ts`, `deleteOrder.ts`, `getOrders.ts`) rather than inlined in `route.ts`.

Partner matching for an order is pincode + service intersection: `PartnerPincode` and `ServiceProvider` are joined against the order's `pincode`/`serviceId` (see `src/app/api/orders/find-partners/route.ts` and `show-partners/route.ts`) — there is no geolocation/distance logic, it's exact pincode match only.

### Payments & wallet

- Razorpay is the payment gateway. `src/app/api/payment/initiate/[orderId]`, `verify`, and `cod` (cash-on-delivery) handle the checkout flow; `src/app/api/webhook/razorpay/route.ts` is the source of truth for marking an order `COMPLETED` on a verified `payment.captured` webhook (HMAC signature check, skipped only in `NODE_ENV=development`).
- Wallet balance can partially pay for an order (`Order.walletAmount` vs `Order.remainingAmount`); the webhook debits the wallet and creates a `Transaction` inside the same DB transaction that completes the order.
- Referral bonuses are paid out to the referrer's wallet automatically the first time a referred user completes their first order (checked via `previousCompletedOrders === 0` inside the webhook's `$transaction`). The bonus amount is read from the `system_config` table (`variable_name = 'referral'`), not hardcoded — use `SystemConfig` to change it, not an env var or constant.
- All money-moving webhook/payment logic wraps multi-step DB writes in `prisma.$transaction(...)` — follow this pattern for any new logic that touches `Wallet`/`Transaction`/`Order` together to keep balances consistent.

### API conventions

- Route handlers live under `src/app/api/**/route.ts` following Next.js App Router conventions. Dynamic segment params are async in this Next version — resolve them with `getParams()` from `src/lib/utils/api-helpers.ts` rather than destructuring directly.
- Two response shapes coexist: some routes use the shared `apiResponse<T>()` helper (`src/lib/utils/api-response.ts`, wraps in `{ success, data|error, timestamp }`), others hand-roll the same `{ success, data/error }` shape with `NextResponse.json`. Match whichever pattern the file you're editing already uses rather than mixing both in one route.
- Auth checks inside route handlers use `getServerSession(authOptions)` directly, or the `isAuthenticated()`/`isAdmin()` helpers in `src/lib/auth.ts` for simple boolean checks.
- A Vercel cron job hits `src/app/api/cron/check-threshold/route.ts` to email customers/admins about orders that have sat `PENDING` with no partner assigned past a threshold (`Service.threshold`, default 2 hours).

### Frontend structure

- `src/app/(routes)/` is a route group for pages that shouldn't affect the URL path (currently `user/orders`); most user-facing pages live directly under `src/app/<name>/page.tsx` instead (e.g. `services`, `blogs`, `contactus`).
- Each role has its own dashboard tree with a shared `layout.tsx`: `src/app/admin/dashboard/*`, `src/app/partner/dashboard/*`, `src/app/user/dashboard/*`.
- UI primitives are shadcn/ui components in `src/components/ui` (config in `components.json`, base color `gray`, no CSS variables — Tailwind classes are used directly). Use the shadcn CLI conventions (`@/components/ui`, `@/lib/utils` for `cn()`) when adding new primitives rather than hand-rolling styles.
- File uploads (service images, blog images, etc.) go through EdgeStore (`src/lib/edgestore.ts`, `edgestore-server.ts`, `edgestore-action.ts`, and the `/api/edgestore` route) — not direct S3/blob calls.
- Email sending (order notifications, threshold alerts, etc.) is centralized in `src/app/api/services/emailServices/index.ts` — add new transactional emails there rather than calling nodemailer/EmailJS ad hoc from route handlers.
