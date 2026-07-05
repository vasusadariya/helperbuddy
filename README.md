# Helper Buddy

Helper Buddy is a home-services marketplace for Surat, Gujarat, connecting customers with verified service partners for cleaning, AC repair, plumbing, electrical work, appliance repair, and more. It's a single Next.js codebase serving three roles — customers, service partners, and admins — each with their own dashboard and permissions.

Live: [helppperbuuuddy.vercel.app](https://helppperbuuuddy.vercel.app/)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack in dev) |
| Language | TypeScript |
| Database | PostgreSQL (NeonDB) via Prisma ORM |
| Auth | NextAuth.js — Credentials (bcrypt) + Google OAuth, JWT sessions |
| Payments | Razorpay (checkout + webhook), plus an internal wallet system |
| File uploads | EdgeStore |
| Email | EmailJS / Nodemailer |
| Styling | Tailwind CSS + shadcn/ui |
| Deployment | Vercel |

## Getting started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (the project is built against NeonDB, but any Postgres works)
- API keys for Razorpay, Google OAuth, EdgeStore, and EmailJS (see below)

### Setup

```bash
git clone <repo-url>
cd helperbuddy
npm install
```

Create a `.env` file in the project root with:

```bash
# Database
DATABASE_URL=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# EdgeStore (file uploads)
EDGE_STORE_ACCESS_KEY=
EDGE_STORE_SECRET_KEY=

# EmailJS (transactional email — see src/app/api/services/emailServices/index.ts
# for exactly which templates each variable maps to)
EMAILJS_PUBLIC_KEY=
EMAILJS_PRIVATE_KEY=
EMAILJS_SERVICE_ID=
EMAILJS_TEMPLATE_ID=
EMAILJS_ORDER_ACCEPTED_TEMPLATE_ID=
EMAILJS_SECONDARY_PUBLIC_KEY=
EMAILJS_SECONDARY_PRIVATE_KEY=
EMAILJS_SECONDARY_SERVICE_ID=
EMAILJS_THRESHOLD_NOTIFICATION_TEMPLATE_ID=
EMAILJS_PARTNER_NOTIFICATION_TEMPLATE_ID=

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Then set up the database and run the app:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

The app runs at `http://localhost:3000`.

### Scripts

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # next build && prisma generate
npm run start    # start production server
npm run lint     # next lint
```

There's no automated test suite in this repo yet.

Useful Prisma commands:

```bash
npx prisma studio       # browse/edit data in a GUI
npx prisma migrate dev  # create and apply a migration after schema changes
```

## Architecture

### Roles & auth

Every account has a role — `USER` (customer), `PARTNER` (service provider), or `ADMIN` — stored on the session JWT. `src/middleware.ts` gates `/admin/:path*`, `/user/:path*`, and `/partner/:path*` by comparing the JWT role to the URL prefix, redirecting mismatches to `/unauthorized/{role}`.

- Sign-in supports email/password (bcrypt-hashed, looked up across both the `User` and `Partner` tables) and Google OAuth.
- Admin accounts are recognized by an email pattern (`hbadmin<...>@gmail.com`); a new signup matching that pattern gets a `PENDING_ADMIN` role until manually promoted.
- Partners must be approved by an admin (`Partner.approved`) before they can sign in and start receiving orders.
- New users get a ₹100 signup bonus and a `Wallet` created automatically on first login.

### Data model

Core entities (see `prisma/schema.prisma`): `User`, `Partner`, `Service`, `Order`, `Wallet` / `Transaction`, `Review`, plus two join tables — `ServiceProvider` (which services a partner offers) and `PartnerPincode` (which pincodes a partner serves).

An order's status moves through a fixed lifecycle:

```
PENDING → ACCEPTED → IN_PROGRESS → SERVICE_COMPLETED → PAYMENT_REQUESTED → PAYMENT_COMPLETED → COMPLETED
                                                                                    (or CANCELLED at various points)
```

Partner matching is a simple intersection of `ServiceProvider` and `PartnerPincode` against the order's `serviceId`/`pincode` — there's no geolocation or distance ranking, just an exact pincode + service match among approved, active partners.

### Payments & wallet

- Razorpay handles online checkout; cash-on-delivery is also supported.
- A user's wallet balance can partially or fully cover an order (`Order.walletAmount` vs `Order.remainingAmount`).
- `src/app/api/webhook/razorpay/route.ts` is the source of truth for completing an order — it verifies the Razorpay webhook signature, then atomically debits the wallet, records the `Transaction`, and marks the order paid inside a single `prisma.$transaction`.
- Referral bonuses pay out to the referrer's wallet automatically on the referred user's first completed order. The bonus amount lives in the `system_config` table, not in code — change it there, not via an env var.
- A Vercel cron job (`src/app/api/cron/check-threshold`) emails customers/admins about orders that have sat `PENDING` with no partner assigned past a threshold.

### Project layout

```
src/
├─ app/
│  ├─ (routes)/          route group for URL-transparent pages
│  ├─ admin/dashboard/   admin UI (approve partners, manage services, wallet, etc.)
│  ├─ partner/dashboard/ partner UI (accept orders, schedule, service selection)
│  ├─ user/dashboard/    customer UI (orders, wallet, profile)
│  ├─ api/               route handlers, one folder per resource
│  │  └─ orders/handlers/  order create/update/delete/list logic, split out of route.ts
│  └─ <page>/page.tsx    public marketing/service pages
├─ components/           shared React components
│  └─ ui/                shadcn/ui primitives
├─ lib/                  Prisma client singleton, auth helpers, EdgeStore config, utils
└─ middleware.ts          role-based route protection
```

### API conventions

- Route handlers follow the Next.js App Router convention (`src/app/api/**/route.ts`); dynamic params are async and should be resolved with `getParams()` from `src/lib/utils/api-helpers.ts`.
- Responses generally follow `{ success, data | error, timestamp }`; some newer routes use the shared `apiResponse()` helper in `src/lib/utils/api-response.ts` — match whichever pattern the file you're editing already uses.
- Use the shared Prisma client from `src/lib/prisma.ts` rather than instantiating `new PrismaClient()` per route.

## Contributing

This project was originally built for Google Winter of Code 2025, run by SVNIT's Google Developer's Club (GDGC). Issues and PRs are welcome — please open an issue describing the change before submitting a large PR.
