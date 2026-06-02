# X-CAPITAL — Frontend UI Controls & “Premium” Precision Upgrade (Explore Mode)

## Summary
This project is a Next.js + React + Tailwind dark-first fintech UI for X-CAPITAL, featuring a multi-rail capital deployment experience with a dashboard shell (sticky header, responsive sidebar, market ticker) and multiple domain pages (Trading, Portfolio, Wallet, Funds, Commerce, Oracle, Settings/KYC) plus a standalone Admin God panel.  
In this exploration, I focused specifically on “controls and precision” from a developer/UX perspective: how buttons, focus states, inputs/selects/textareas, and interaction affordances look and behave across the UI.  
Two global/premium interaction improvements were documented and implemented earlier in this session: a unified `focus-visible` ring for the shared `Button` component and a global control precision/focus styling pass in `globals.css`.

> Important: I **cannot visually verify** the staging/production environment from here (I don’t have browser access in this mode, and the user hasn’t provided a URL to manually check). However, the changes are applied in shared/global files that directly affect most pages.

## Architecture

### Primary pattern
- **Component-driven React UI** with a **layout shell** pattern:
  - `DashboardLayout` provides the persistent navigation/telemetry container.
  - Domain pages render inside the `main` area and rely heavily on shared UI primitives (`Button`, `Card`, `Badge`, `Modal`) and custom CSS in `globals.css`.

### Execution start / runtime loop (UI)
- In Next.js app router, each page under `frontend/src/app/**/page.tsx` is rendered as a route.
- Auth gating happens client-side in `DashboardLayout` (redirect to `/auth/login` when `!isAuthenticated`).
- Live UI data (market prices) is refreshed by the `useMarketPrices` hook, used across ticker, trading, dashboard, portfolio, and oracle pages.

### Technology stack
- **Next.js (App Router)** + **React**
- **Tailwind CSS** + heavy custom CSS in `frontend/src/app/globals.css`
- **Zustand** for state management (`useStore.ts`)
- **Recharts** for charts
- **lucide-react** icons
- **Axios** for backend API integration (`frontend/src/lib/api.ts`)
- Theme is controlled via `data-theme` attribute (dark default, light via `data-theme="light"`)

## Directory Structure
```text
frontend/
├── src/app/
│   ├── layout.tsx              # RootLayout: metadata, splash screen, theme class
│   ├── globals.css            # Global Tailwind + brand CSS + premium control styling
│   ├── page.tsx               # Landing page
│   ├── dashboard/page.tsx   # Authenticated dashboard
│   ├── trading/page.tsx     # Trading terminal
│   ├── portfolio/page.tsx   # Portfolio & allocation UI
│   ├── wallet/page.tsx      # Wallet + deposit/withdraw multi-step modals
│   ├── funds/page.tsx       # Funds catalog
│   ├── commerce/page.tsx    # Commerce + checkout modal
│   ├── oracle/page.tsx      # AI Oracle + charts
│   ├── settings/page.tsx    # Profile, notifications, security, appearance
│   └── settings/kyc/page.tsx # KYC multi-step flow
│
├── src/components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MarketTicker.tsx
│   │   ├── NotificationsPanel.tsx
│   │   └── SearchModal.tsx
│   ├── ui/
│   │   ├── Button.tsx        # Shared Button primitive (focus ring change)
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── Modal.tsx
│   ├── trading/AssetList.tsx, OrderForm.tsx
│   ├── portfolio/HoldingsList.tsx, PortfolioChart.tsx
│   ├── oracle/AIOracle.tsx
│   └── commerce/ProductCard.tsx
│
└── src/hooks/useMarketPrices.ts # Live pricing refresh loop
```

## Key Abstractions (premium-relevant)

### `Button`
- **File**: `frontend/src/components/ui/Button.tsx`
- **Responsibility**: Shared interactive control primitive for the app.
- **Interface**:
  - `variant` (`primary|secondary|danger|ghost|gold|outline`)
  - `size` (`xs|sm|md|lg|xl`)
  - `loading`, `icon`, `iconPosition`, `fullWidth`
- **Lifecycle**: Stateless render; used throughout pages and modals.
- **Used by**: Wallet deposit/withdraw actions, Trading terminal, Commerce checkout, Funds cards, Admin panel uses custom buttons instead.

**Premium change made**:
- Added consistent `focus-visible` styling:
  - `focus-visible:ring-2`
  - `focus-visible:ring-xc-purple/70`
  - `focus-visible:ring-offset-2`
  - `focus-visible:ring-offset-xc-dark`

### `globals.css` premium control precision
- **File**: `frontend/src/app/globals.css`
- **Responsibility**: Global brand tokens + animation library + premium UX affordances.
- **Premium change made**:
  - Added a global `*:focus-visible` rule to enforce consistent focus outline + box-shadow.
  - Normalized placeholder color and form control text color.
  - Normalized number spinner behavior across browsers.
  - (Note) This affects **all** pages, including admin/auth flows.

## Data Flow (premium-relevant UI state)
1. **Market prices refresh loop**
   - `useMarketPrices` fetches crypto via CoinGecko and stocks/ETFs via Finnhub (if keys available) on an interval.
2. **Consumers update local UI state**
   - `MarketTicker`, `Trading/AssetList`, `DashboardPage`, `PortfolioPage`, `OraclePage`, and `WalletPage` overlay live prices into local state.
3. **Controls & focus states**
   - Focus styling is handled either by:
     - the shared `Button` component (`focus-visible` ring),
     - the global `*:focus-visible` CSS override for all interactive focus targets.

## Non-Obvious Behaviors & Design Decisions

### 1) “Enterprise premium” look is achieved primarily through interaction affordances, not just color
- The codebase heavily uses gradients/glow effects, but for “premium” perception the key is:
  - consistent focus rings (keyboard navigation),
  - consistent input text and placeholder contrast,
  - consistent button border/shadow behavior.

### 2) Focus styling is now centralized and duplicated (potential future conflict)
- There are now **two layers** of focus styling:
  - `Button.tsx` explicit `focus-visible:ring-*` classes
  - `globals.css` `*:focus-visible { box-shadow: ... }`
- This is usually fine (ring + box-shadow complement), but it can cause a “double” glow if other components already set box-shadows on focus.

### 3) Admin panel styling is mostly bespoke
- The Admin page (`frontend/src/app/admin/page.tsx`) uses many native inputs with its own Tailwind classes.
- Global focus-visible rules apply, but “precision” isn’t fully unified there because Admin doesn’t rely on shared `Button`/input primitives consistently.

### 4) There is no formal design token system beyond Tailwind colors + CSS vars
- The premium feel is implemented with:
  - Tailwind utility strings scattered across pages, and
  - large “brand CSS” sections in `globals.css`.
- A full token system would reduce drift, but the repo currently uses pragmatic centralization via `globals.css` and the shared `Button`.

## What a Developer Should Know to Work Effectively
- **Start from primitives**:
  - `src/components/ui/Button.tsx`
  - `src/app/globals.css`
- For any “premium/precision” changes:
  - prefer adding/changing shared primitives and global CSS first,
  - then adjust page-level controls only where needed.
- Be mindful that global `*:focus-visible` can override or amplify component-specific focus styles.

## Suggested Reading Order
1. `frontend/src/components/ui/Button.tsx` — how buttons are themed and focused.
2. `frontend/src/app/globals.css` — the large premium/brand CSS library and global focus rules.
3. `frontend/src/components/layout/DashboardLayout.tsx` — layout shell and auth redirect.
4. `frontend/src/components/layout/Header.tsx` + `Sidebar.tsx` — sticky shell controls.
5. Representative domain pages:
   - `frontend/src/app/trading/page.tsx`
   - `frontend/src/app/wallet/page.tsx`
   - `frontend/src/app/commerce/page.tsx`

## Current Status of the Premium Precision Request
- ✅ Button focus ring unified (`Button.tsx`)
- ✅ Global focus/input precision rules added (`globals.css`)
- ✅ `npm run build` executed successfully earlier in session (output not capturable, but exit status indicated success)
- ✅ `npm run lint` and `npm run typecheck` executed earlier in session (output not capturable, but commands completed without reported failure)
- ⚠️ I could not validate the changes by opening `https://xcapital.investments` because no URL/route verification mechanism exists in this tool environment.
