# Chefito Multitenant Implementation Plan

**Goal:** Serve the Chefito platform at `/` and one isolated business per owner at `/{slug}` with all images in R2 bucket `app`.

**Architecture:** Shared Postgres tables receive `business_id` and RLS policies. React Router resolves a business slug before rendering the existing menu and management application. Supabase Auth owns sign-up and sessions; Cloudflare R2 receives signed uploads scoped by business ID.

**Tech Stack:** React, TypeScript, Vite, Supabase Auth/Postgres/Edge Functions, Cloudflare R2, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-11-15-chefito-multitenant-design.md`

## Global Constraints

- Public site: `chefi.to/`; business site: `chefi.to/{slug}`.
- One owner account per business and one business per owner account.
- Immediate publication after account and business creation.
- All UI copy and formatting use pt-BR.
- New images are uploaded only to Cloudflare R2 bucket `app`.
- Reuse the existing business menu and management behavior while applying Material Design 3 tokens.

## Tasks

### 1. Database boundary

- [ ] Add `businesses` with unique owner and slug; reserve platform paths.
- [ ] Add `business_id` to every business table, including join and event tables; add composite integrity constraints.
- [ ] Replace global assumptions in unique constraints and SQL functions.
- [ ] Replace permissive legacy policies with owner-scoped and purpose-specific public policies.
- [ ] Verify anonymous, owner A, and owner B permissions directly through the API.

### 2. Business routing and onboarding

- [ ] Add slug parser and route tests, including reserved paths and unknown businesses.
- [ ] Add a business context that loads and clears selected business state.
- [ ] Add platform landing, login, registration, and business creation screens.
- [ ] Nest public menu/product/order and protected management routes under the business slug.
- [ ] Ensure signup email confirmation and interrupted sessions recover cleanly.

### 3. Scope all app data

- [ ] Scope theme settings, catalog, cart, product links, coupons, customer profile, orders, reservations, analytics, staff, and Realtime subscriptions.
- [ ] Ensure every insert carries or derives business ID and every update/delete is protected by RLS.
- [ ] Verify two-business usage without cross-business state or data leakage.

### 4. R2 bucket app

- [ ] Configure and verify bucket `app`, public domain and CORS.
- [ ] Change upload and delete functions to authorize owner, use the business ID path, and require bucket `app`.
- [ ] Remove old bucket acceptance in frontend upload checks and test signed upload and deletion.

### 5. Material Design and pt-BR

- [ ] Introduce shared color, type, spacing, radius, elevation and state tokens.
- [ ] Build the landing and auth screens with Material components and consistent mobile layout.
- [ ] Apply tokens throughout menu and management; remove language switcher and PT/EUR selection.
- [ ] Audit visible strings and formatting for pt-BR; verify keyboard, focus, errors and responsive layouts.

### 6. Release verification

- [ ] Run tests, TypeScript build, lint and UI checks on localhost.
- [ ] Run cross-tenant read/write tests and full business flow with separate accounts.
- [ ] Apply the reviewed migration, deploy Edge Functions, verify production configuration, then deploy the frontend.
