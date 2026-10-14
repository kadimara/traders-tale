# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Type-check + production build
npm run lint         # ESLint
npm run preview      # Preview production build locally
npm run deploy       # Build + deploy to GitHub Pages via gh-pages

pocketbase\pocketbase.exe serve   # Run the local PocketBase backend (http://127.0.0.1:8090, dashboard at /_/)
```

There is no test suite. The PocketBase binary and its data (`pocketbase/pb_data`) are gitignored; download the Windows build from the PocketBase GitHub releases into `pocketbase/`.

## Architecture

**Traders Tale** is a personal trading journal SPA — React 19 + TypeScript, built with Vite, deployed to GitHub Pages at `/traders-tale/`, backed by a self-hosted **PocketBase** server.

Production PocketBase is self-hosted on a home PC and published at `https://api.traders-tale.com` through a Cloudflare Tunnel (the `Cloudflared` Windows service forwards to `127.0.0.1:8090`); the deploy workflow builds with that `VITE_POCKETBASE_URL`. Public sign-ups are closed, so users are created by a superuser in the dashboard.

This branch is a trial of PocketBase as a Supabase replacement. Supabase leftovers (`SupabaseClient.ts`, `src/lib/types/database.types.ts`, the `supa-*` npm scripts, the `supabase/` folder and the `@supabase/supabase-js` dependency) are unused here and can be removed once PocketBase is adopted.

### Routing

`@tanstack/react-router`, configured in `src/router.tsx` with `basepath: '/traders-tale'`. A pathless `layout` route wraps the authenticated pages (`/`, `/journal`, `/playbook`, `/trade/$id`) with `MonthProvider`, `TradesProvider` and `Layout`; `/auth` sits outside it. Use `Link`/`useNavigate` from TanStack Router.

### Context hierarchy

```
SessionProvider (App.tsx)  → PocketBase auth (pb.authStore); redirects to /auth when logged out
  RouterProvider
    layout route           → MonthProvider → TradesProvider → Layout
      Home / Journal / Playbook / Trade
```

- **`monthKey`** is the canonical month identifier: `"YYYY-MM-01"` string. It is the `month_year` field value and used as a date range filter on `created_at`.
- **`TradesProvider`** re-fetches trades whenever `monthKey` changes; `reloadTrades()` refetches after changes made elsewhere (e.g. an OKX sync).

### Database layer (`src/lib/database/`)

All API functions use the singleton `pb` client from `PocketBaseClient.ts` (`VITE_POCKETBASE_URL`, default `http://127.0.0.1:8090`; auto-cancellation is off). Login state lives in `pb.authStore`. API functions throw the PocketBase `ClientResponseError` on failure.

- `TradesApi.ts` — trades CRUD. `TradesRow` and friends are hand-written types; `toRow` maps records (PocketBase stores empty numbers as `0` and empty text as `""`, mapped back to `null`; dates are normalized to ISO).
- `MonthlyPlanApi.ts` — per-month markdown plan. PocketBase has no upsert, so `monthlyPlanUpsert` updates the existing plan or creates one (unique `(user, month_year)` index).
- `OkxApi.ts` — OKX sync calls (see below).

Trade and record ids are 15-character strings, not numbers.

### PocketBase schema (`pocketbase/pb_migrations/`)

Schema changes are JS migrations, applied automatically when `pocketbase serve` starts; add a new file rather than editing an applied one.

- `trades`, `monthly_plan`, `playbook` — every record has a `user` relation; API rules limit all access to the record's owner (`user = @request.auth.id`).
- `okx_connections` — one per user, all API rules null (superusers and hooks only).
- Required number fields reject `0` in PocketBase, so numeric trade fields are optional and validated in the app.

### OKX connection (`pocketbase/pb_hooks/`)

Read-only OKX integration; nothing places orders. `okx_lib.js` loads and decrypts the user's keys and signs requests (HMAC-SHA256, base64); `okx.pb.js` registers the encryption hooks and the sync route; `okx_sync.js` holds the sync logic. Client: `OkxApi.ts`; `useOkxSync` (preview → confirm → apply → reload) backs the sync button in the `TradesTable` header.

- Each user's keys are an `okx_connections` record (`user`, `api_key`, `secret`, `passphrase`), added by a superuser in the PocketBase dashboard. Hooks on create/update encrypt the three fields (AES-256-GCM, stored as `enc:<ciphertext>`); paste a plain value over a field to replace it. The key is `pocketbase/okx.key` (gitignored, created on first use) — keep it; without it the connections can't be decrypted and must be re-entered.
- All calls go to `https://eea.okx.com` (`BASE_URL` in `okx_lib.js`); keys only work on the OKX platform they were made on. A Read-only OKX key is enough.
- `POST /api/okx/sync` (auth-required, always the caller's own connection) returns a dry-run plan unless the body is `{"apply": true}`; apply writes in one transaction.
- Sync matching: same symbol + direction, trade `created_at` within 36h of the position's open time, entry within 0.3% of OKX `openAvgPx`; pairs are assigned best-first. Matched trades are overwritten with OKX entry/exit/amount/fees/pnl and `status = taken`; unmatched positions become new taken trades (account carried forward from the previous trade). `pnl` is OKX `realizedPnl` (includes fees and funding); `fees` = fee + funding + liquidation penalty as a positive cost. `okx_pos_key` (`<posId>-<openTime>`, since OKX reuses `posId`) prevents double imports and is writable only by the hook.
- EEA perpetuals are `FUTURES` instruments like `BTC-USD_UM_XPERP-310404` (ctVal 0.0001 BTC, matching `CONTRACT_SIZES` in `TradeUtils.ts`). The symbol is the part of `instId` before the first `-`.
- Hooks don't hot-reload on Windows — restart `pocketbase.exe serve` after editing them. Route handlers and hooks run in isolated scopes, so helpers are loaded with `require(`${__hooks}/okx_lib.js`)` inside each handler.

### Path alias

`@lib` resolves to `src/lib` (configured in `vite.config.ts` and `tsconfig.app.json`).

### React Compiler

`babel-plugin-react-compiler` is enabled globally. Avoid manual `useMemo`/`useCallback` unless the compiler cannot handle the specific case.

### Utilities

- `src/lib/utils/TradeUtils.ts` — PnL, risk, long/short and contract-size calculations for futures trades (OKX contract sizes, fixed 1.8% risk sizing); CSV export; TradingView snapshot URL parsing.
- `src/lib/utils/MathUtils.ts` — `round` and `toUSD` helpers.
- `src/lib/utils/DateUtils.ts` — date helpers.
- `src/lib/hooks/useAsync.ts` — wraps an async function in `{ data, loading, error, setData }` state; the context providers use this for initial data fetches.
- `src/lib/hooks/useOkxSync.ts` — the OKX sync flow used by the trades table.
