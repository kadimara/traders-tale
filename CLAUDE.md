# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Type-check + production build
npm run lint         # ESLint
npm run preview      # Preview production build locally
npm run deploy       # Build + deploy to GitHub Pages via gh-pages

npm run supa-gen-types   # Regenerate src/lib/types/database.types.ts from remote Supabase schema
npm run supa-login       # Authenticate Supabase CLI
```

There is no test suite.

## Architecture

**Traders Tale** is a personal trading journal SPA — React 19 + TypeScript, built with Vite, deployed to GitHub Pages at `/traders-tale/`, backed by a hosted Supabase project.

### Routing

There is no `react-router-dom`. Routing is a custom implementation in `src/lib/components/Router.tsx`. Navigation works via `window.history.pushState` and a synthetic `navigate` event. Use the exported `navigate(path)` function and `<Link to={...}>` component from that file. The base path is `/traders-tale/`.

### Context hierarchy (App.tsx)

```
SessionProvider       → Supabase auth session, redirects to /auth if unauthenticated
  MonthProvider       → Active month state (monthDate, monthKey, prev/next/today handlers)
    TradesProvider    → Futures trades for the active month (CRUD, from Supabase)
      Layout
        Home / Spot / Futures
```

- **`monthKey`** is the canonical month identifier: `"YYYY-MM-01"` string. It is the `month_year` column value and used as a date range filter on `created_at`.
- **`TradesProvider`** re-fetches from Supabase whenever `monthKey` changes.
- **`SpotContext`** follows the same pattern but is used only in `Spot.tsx`.

### Database layer (`src/lib/database/`)

All API functions use the singleton `supabase` client from `SupabaseClient.ts`, which reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` from `.env.local`. They throw the Supabase error directly on failure.

- `TradesApi.ts` — futures trades CRUD; types re-exported from `database.types.ts`
- `SpotApi.ts` — spot trades CRUD
- `MonthlyPlanApi.ts` — per-month markdown plan (upsert on conflict `month_year`)

TypeScript types for all tables come from the generated `src/lib/types/database.types.ts`. Re-run `npm run supa-gen-types` after any schema change.

### Path alias

`@lib` resolves to `src/lib` (configured in `vite.config.ts` and `tsconfig.app.json`).

### React Compiler

`babel-plugin-react-compiler` is enabled globally. Avoid manual `useMemo`/`useCallback` unless the compiler cannot handle the specific case.

### Utilities

- `src/lib/utils/TradeUtils.ts` — PnL, risk, long/short calculations for both futures and spot trades; TradingView snapshot URL parsing.
- `src/lib/utils/MathUtils.ts` — `round` helper.
- `src/lib/utils/DateUtils.ts` — date helpers.
- `src/lib/hooks/useAsync.ts` — wraps an async function in `{ data, loading, error, setData }` state; the context providers use this for initial data fetches.
