# Legacy Vault Frontend Reconnaissance

Phase 0 inventory based on the repository source as inspected on 2026-09-16. This document describes the current implementation only. Statements from `README.md` are called out as planned or expected behavior when they are not wired into the frontend.

## 1. Application Routes

Routes are declared in `src/App.tsx`. There is no route-level authentication wrapper; authenticated application routes are wrapped by `AppLayout`, which redirects to `/welcome` when there is no local user and to `/onboarding/create` when a wallet address is absent.

| Route | File | Current behavior |
| --- | --- | --- |
| `/` | `LandingPage.tsx` | Public marketing/home page with product positioning and calls to action. |
| `/how-it-works` | `HowItWorksPage.tsx` | Public explanation of wallet setup, beneficiary configuration, and dormancy behavior. |
| `/security` | `SecurityPage.tsx` | Public security and self-custody claims. |
| `/welcome` | `WelcomePage.tsx` | Public entry screen linking to sign-up/sign-in. |
| `/auth` | `AuthPage.tsx` | Local prototype sign-up/sign-in form; query parameter `mode=signup` selects sign-up mode, otherwise sign-in mode. |
| `/onboarding/setup` | `onboarding/OnboardingSetupPage.tsx` | Chooses generated-wallet or existing-wallet onboarding. |
| `/onboarding/create` | `onboarding/OnboardingCreatePage.tsx` | Generates a mock Starknet-looking address or accepts a manually entered address. It redirects unauthenticated users to `/welcome` and completed onboarding users to `/dashboard`. |
| `/onboarding/secure` | `onboarding/OnboardingSecurePage.tsx` | Recovery/security acknowledgement step. |
| `/onboarding/ready` | `onboarding/OnboardingReadyPage.tsx` | Shows wallet/network/balance summary and links to `/dashboard`; redirects if user or wallet is absent. |
| `/dashboard` | `DashboardPage.tsx` | Authenticated dashboard with balance, legacy status, quick actions, and recent activity/transactions. |
| `/assets` | `AssetsPage.tsx` | Authenticated token balances and asset overview. |
| `/transactions` | `TransactionsPage.tsx` | Filterable/searchable local transaction history. |
| `/transactions/:id` | `TransactionDetailPage.tsx` | Local transaction detail view; redirects to `/transactions` if the ID is not found. |
| `/send` | `SendPage.tsx` | Local prototype send form with address validation, balance/fee checks, and simulated completion. |
| `/receive` | `ReceivePage.tsx` | Displays the local wallet address, copy action, and receive guidance. |
| `/deposit` | `DepositPage.tsx` | Simulated deposit form and wallet address display. |
| `/withdraw` | `WithdrawPage.tsx` | Local prototype withdrawal form with address validation, balance/fee checks, and simulated completion. |
| `/bridge` | `BridgePage.tsx` | Local prototype bridge form with network/asset/amount validation and a simulated pending transaction. |
| `/legacy-protection` | `LegacyProtectionPage.tsx` | Displays local legacy-protection configuration/status and pause/resume action. |
| `/legacy-protection/setup` | `LegacyProtectionSetupPage.tsx` | Configures beneficiary, dormancy days, and STRK gas reserve in local state. |
| `/activity` | `ActivityPage.tsx` | Displays local heartbeat countdown/status and records a simulated heartbeat. |
| `/settings` | `SettingsPage.tsx` | Displays local account/wallet data, sign-out, and prototype-data reset controls. |
| `*` | `Navigate` in `App.tsx` | Redirects unknown paths to `/`. |

## 2. Page and Main Component Files

### Application entry and orchestration

- `src/main.tsx`: React 19 entry point, imports global CSS, renders `App` inside `StrictMode`.
- `src/App.tsx`: `VaultProvider`, `BrowserRouter`, all routes, and page-to-layout composition.
- `src/context/VaultContext.tsx`: local session/vault state, simulated domain actions, derived balance and legacy status.
- `src/types.ts`: user, balance, transaction, legacy-protection, activity, and vault data types.
- `src/utils/format.ts`: asset metadata, USD/amount/date/address formatting, fee constants, and address validation.
- `src/lib/starknet.ts`: Starknet network/provider setup, ABI skeleton, call builders, and typed contract factory. It is not imported by the current page/context implementation.

### Pages

Public: `LandingPage.tsx`, `HowItWorksPage.tsx`, `SecurityPage.tsx`, `WelcomePage.tsx`, `AuthPage.tsx`.

Onboarding: `onboarding/OnboardingSetupPage.tsx`, `OnboardingCreatePage.tsx`, `OnboardingSecurePage.tsx`, `OnboardingReadyPage.tsx`.

Vault application: `DashboardPage.tsx`, `AssetsPage.tsx`, `TransactionsPage.tsx`, `TransactionDetailPage.tsx`, `SendPage.tsx`, `ReceivePage.tsx`, `DepositPage.tsx`, `WithdrawPage.tsx`, `BridgePage.tsx`, `LegacyProtectionPage.tsx`, `LegacyProtectionSetupPage.tsx`, `ActivityPage.tsx`, and `SettingsPage.tsx`.

## 3. Shared Layout and UI Components

- `components/layout/PublicNavbar.tsx`: sticky public navigation, current-page highlighting, and auth/setup/open-vault CTAs.
- `components/layout/AppLayout.tsx`: authenticated guard, desktop sidebar, mobile drawer/top bar, mobile bottom navigation, wallet/network status, sign-out, and Motion route transitions.
- `components/ui/Button.tsx`: variants `default`, `outline`, `secondary`, `ghost`, `destructive`, `vault`; sizes `sm`, `md`, `lg`, `icon`.
- `components/ui/Card.tsx`: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter` primitives.
- `components/ui/Badge.tsx`: `StatusBadge` style/label map for transaction and legacy states.
- `components/ui/AddressDisplay.tsx`: short/full address display and clipboard copy state.
- `components/ui/EmptyState.tsx`: icon, title, description, and optional action empty state.
- `components/ui/LegacyVaultLogo.tsx`: inline SVG emblem and horizontal, stacked, icon, app-icon, and full logo variants.
- `components/ui/TokenIcon.tsx`: circular text-based asset icon.

## 4. Global CSS and Design Tokens

`src/index.css` imports Tailwind v4 with `@import "tailwindcss"` and defines an `@theme` mapping from Tailwind color/font names to CSS variables.

### Colors

The declared palette is a dark black/slate base with neon lime accent:

- Background `#0B0F14`; foreground `#E8E8EA`.
- Card/popover `#1E2329`; secondary `#171B21`; muted `#151920`.
- Primary/accent/ring `#AAFF00`; primary foreground `#0B0F14`.
- Muted foreground `#8E95A0`; border/input `#262C34`.
- Destructive `#EF4444`; success `#10B981`; warning `#F59E0B`.
- Vault surface `#151920`; sidebar `#0E1217`; sidebar accent `#1E2329`.

The stylesheet also hard-codes `#171C23`, `#9CE600`, and several rgba neon-lime values in custom vault classes. Components additionally hard-code brand colors such as `#1E2329`, `#2A3038`, `#AAFF00`, `#E8E8EA`, and `#8E95A0`.

### Typography

Tailwind `font-sans` and `font-display` both resolve to `Sora`, followed by `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, and `Roboto`. No font import or local font asset is present in the inspected source, so the actual first-choice font depends on runtime availability.

### Spacing and sizing

Spacing is predominantly Tailwind utility-driven: common page spacing is `space-y-6`, cards use `p-5` or `p-6`, and the app shell uses `p-4 sm:p-6 lg:p-8`. Controls use heights `h-8`, `h-9`, `h-10`, and `h-11`. There is no separate spacing-token file.

### Borders and radii

The base `Card` uses `rounded-xl border border-border`; `Button` uses `rounded-lg`; `StatusBadge` uses `rounded-full`. Pages also use `rounded-2xl` and `rounded-3xl`, and logo/app-icon variants use `rounded-4xl`. Border colors vary among semantic `border-border`, `border-input`, `border-sidebar-border`, opacity variants, and direct hex/rgba values.

### Shadows and effects

The shared card uses `shadow-sm`; buttons use `shadow` on the default/destructive variants. Pages use `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, and `shadow-2xl`. `backdrop-blur`, `backdrop-blur-md`, and opacity backgrounds are used in navigation and status surfaces. The custom solid vault button adds a neon-lime glow on hover.

### Tailwind/configuration

There is no standalone `tailwind.config.*` file. Tailwind v4 is configured through `@tailwindcss/vite` in `vite.config.ts` and the CSS `@theme` block. Vite aliases `@` to the repository root.

## 5. Starknet Contract Read and Write Call Sites

### Implemented call sites

There are no active Starknet contract read or write call sites in the rendered application. `src/lib/starknet.ts` is not imported elsewhere in `src`.

### Prepared adapter surface

`src/lib/starknet.ts` contains:

- RPC endpoints for Starknet Sepolia and Mainnet plus a default Sepolia `RpcProvider`.
- `INHERITANCE_VAULT_ABI` view definitions: `get_inheritance_config`, `get_last_heartbeat`, `is_claim_eligible`, and `get_gas_reserve`.
- ABI external definitions: `configure_inheritance`, `send_heartbeat`, `pause_inheritance`, `resume_inheritance`, `claim_inheritance`, and `withdraw_gas_reserve`.
- `ContractCallBuilder` write-call constructors for `configureInheritance`, `sendHeartbeat`, `pauseInheritance`, `resumeInheritance`, and `claimInheritance`.
- `getInheritanceContract`, which creates a `Contract` from the ABI and either an account or provider.

The current UI actions with Starknet wording (`send`, `withdraw`, bridge, heartbeat, and legacy setup) call `VaultContext` methods that wait with `setTimeout` and mutate localStorage-backed state. They do not call `account.execute`, `Contract.call`, `provider.waitForTransaction`, or any adapter export.

The README describes expected future contract integration, including `get_time_until_dormant` and a beneficiary claim portal, but those are not implemented in the current adapter/UI. The adapter also has no deployed contract address configuration.

## 6. Backend/API Call Sites

No frontend backend/API call sites were found. There are no `fetch`, Axios, `XMLHttpRequest`, `WebSocket`, or API client usages in `src`.

`README.md` documents expected but currently unwired endpoints for auth/profile, wallet association, dormancy status, notification settings, heartbeat sync, indexed transactions, price oracle data, and bridge quotes. `@google/genai`, `express`, and `dotenv` appear in package metadata, but no Gemini or backend invocation is present in `src`. `.env.example` contains `GEMINI_API_KEY` and `APP_URL` documentation only.

## 7. Implemented Loading, Error, Wallet, and Transaction States

### Loading and pending

- `VaultContext.loading` is set during simulated sign-up/sign-in delays and consumed by `OnboardingCreatePage` as skeleton blocks.
- `pending` is local state in `OnboardingCreatePage`, `SendPage`, `WithdrawPage`, `DepositPage`, `BridgePage`, `LegacyProtectionSetupPage`, and `ActivityPage`.
- Labels include `Generating...`, `Connecting...`, `Sending...`, `Withdrawing...`, `Depositing...`, `Bridging...`, `Saving...`, and `Recording Heartbeat...`.
- `SettingsPage` has a short `resetting` state and animated reset icon.
- Bridge writes a transaction with status `pending`; the local context does not later promote it to completed.

### Errors and success

- Form pages keep local string `error` state and render inline validation/action errors.
- Address validation uses a permissive `0x` hexadecimal length check in `isValidStarknetAddress`.
- Balance and fee failures are thrown by local `send`/`withdraw`; calling pages render the error.
- `AuthPage` renders authentication errors; `OnboardingCreatePage` renders wallet create/connect errors; `LegacyProtectionSetupPage` validates beneficiary input and self-beneficiary rejection.
- `success` states are shown for deposit, send, withdraw, bridge, and heartbeat flows, generally with an emerald alert and a timeout. Clipboard components separately show a temporary check icon/`Copied` state.
- `TransactionDetailPage` exposes a `failure_reason` field if present, although the local mutation paths do not create failed transactions.

### Wallet states

- User session is stored under `lv_user_session`.
- Per-user vault data is stored under `lv_vault_<user.id>`.
- Wallet profile state is `wallet_address` plus `wallet_source: generated | connected`, with a hard-coded displayed network of `Starknet Mainnet`.
- Missing user redirects to `/welcome`; missing wallet on app routes redirects to `/onboarding/create`.
- Generated and connected wallets both receive the same `DEFAULT_BALANCES` sample values: `ETH 1.45`, `STRK 320`, `USDC 1250`.
- No real browser wallet connector, account object, signature flow, chain check, or wallet disconnection state is implemented.

### Transaction/status model

`types.ts` supports `completed`, `pending`, `failed`, `confirmed`, `active`, `warning`, `eligible`, `executed`, `not_configured`, `paused`, `submitted`, and `wallet_confirmation`. `StatusBadge` maps those values to semantic color classes and humanized labels. Local deposit/send/withdraw transactions are completed; bridge transactions are pending; no real transaction polling or receipt handling exists.

## 8. Visual Inconsistencies and Redesign Audit

### Gemini-star decorations

No Gemini-star decoration system or star-field decoration was found. The only explicit sparkle-style icon is `Sparkles` in `AuthPage`, used as a small accent beside demo-account text. There is no Gemini rendering or Gemini-generated visual asset in the frontend.

### Inconsistent borders and surfaces

- Shared `Card` establishes `rounded-xl border-border bg-card shadow-sm`, but many pages add their own border/radius/shadow combinations.
- `vault-surface` uses direct `#262C34`, while page instances add `border-vault/20`, producing a different border treatment from standard cards.
- Direct hex borders (`#2A3038`) coexist with semantic borders and multiple opacity variants (`border-border/50`, `/60`, `/70`, `/80`, `border-sidebar-border/60`).
- Inputs vary between `rounded-lg` and `rounded-xl`; some use `bg-background`, others `bg-card`.

### Generic/repeated cards

The repeated `Card` primitive is used for most settings, asset, transaction, security, onboarding, form, and explanatory sections. Several screens layer cards inside visually similar card/surface groups, which reduces hierarchy. `EmptyState` is itself a rounded bordered card-like block and is used inside a `Card` on transactions.

### Gradients and glow

The active code does not contain a broad gradient system, but `DashboardPage` uses `bg-gradient-to-br` for its main balance surface. Neon-lime glows appear in the landing/welcome app-icon treatment and custom button hover. Multiple large `shadow-2xl`/`shadow-xl` surfaces, blur backdrops, and translucent overlays create a stronger promotional effect than the denser operational screens.

### Other inconsistencies

- Radius scale ranges from `rounded-lg` to nonstandard `rounded-4xl` without a documented hierarchy.
- Typography uses `font-display` inconsistently alongside direct size/weight/tracking utilities; logo text uses hard-coded brand colors.
- Status colors mix semantic tokens with direct emerald, amber, rose, purple, and lime utilities. Bridge-specific purple is an isolated accent.
- Some UI copy describes real Starknet confirmations even though actions are simulated locally, including heartbeat and send success messaging.
- Public marketing surfaces and authenticated operational surfaces share the same dark neon palette, but their density, shadows, and surface treatments are not fully normalized.

## 9. Exact Available Commands

From `package.json`:

| Command | Exact script | Current purpose |
| --- | --- | --- |
| `npm run dev` | `vite --port=3000 --host=0.0.0.0` | Start the Vite development server on port 3000. |
| `npm run build` | `vite build` | Create a production build. |
| `npm run preview` | `vite preview` | Serve the production build for preview. |
| `npm run clean` | `rm -rf dist server.js` | Remove `dist` and `server.js`; this command is Unix-style and may not run in Windows PowerShell without a compatible shell. |
| `npm run lint` | `tsc --noEmit` | TypeScript check; there is no separate ESLint configuration/script. |

No `test` or `typecheck` script is declared. The available typechecking command is `npm run lint`. No automated test runner or test files were found in the inspected repository structure.

Baseline captured during reconnaissance:

- `npm run lint`: passed.
- `npm run build`: passed; Vite emitted a warning that the main minified chunk is over 500 kB.

## 10. Risks and Open Questions

### Risks

- UI language currently implies live Starknet custody, confirmations, explorer hashes, and on-chain heartbeat broadcasts while the source implements local simulation and generated placeholder hashes/addresses.
- The generated wallet address is random client-side data, not a deployed account or secured key-bearing wallet.
- Authentication is localStorage-based and ignores the password argument; it is not suitable for real authentication or recovery.
- All balances, prices, and fees are hard-coded prototype values. No oracle or transaction indexer is connected.
- Bridge balance mutation does not visibly validate all insufficient-balance cases before subtracting and leaves the created transaction pending.
- There is no real transaction lifecycle, receipt/error reconciliation, retry handling, or wallet confirmation state despite those types existing.
- The adapter defaults to Sepolia while the UI displays Mainnet, creating a network consistency risk when integration begins.
- No deployed contract address, ABI artifact provenance, token addresses, account connector, or signing boundary is defined.
- README contract/API claims are ahead of the implementation and may be mistaken for current behavior during redesign work.
- The production bundle exceeds Vite’s 500 kB warning threshold.

### Open questions

- Which wallet/account integration is intended: generated account abstraction, browser wallet connector, or both? Where will keys/signatures be held?
- Is the target network Sepolia or Mainnet for Phase 1, and should the UI derive network status from the connected chain?
- What is the deployed inheritance contract address and authoritative ABI? Should `get_time_until_dormant` be added to the adapter?
- Which contract/token calls are required for deposit, send, withdraw, bridge, gas-reserve funding, pause/resume, and claim?
- Which backend endpoints are real, which are planned, and what authentication/session contract should the frontend use?
- Should transaction hashes and balances be sourced from Starknet/indexer responses rather than generated/local values?
- What are the authoritative fee, price, decimal, and confirmation/polling rules?
- Which legacy status is authoritative when local elapsed-time calculation differs from on-chain/backend status?
- Is the beneficiary claim portal in scope, and what authorization/paymaster flow does it require?
- What visual system should replace or normalize the mixed card, radius, border, shadow, direct-color, and neon-glow conventions?
- Is the `Sparkles` icon in the auth demo copy intentional brand language, or should it be removed as part of the redesign?
- Is `npm run clean` expected to support Windows directly, and should a platform-neutral cleanup command be introduced later?