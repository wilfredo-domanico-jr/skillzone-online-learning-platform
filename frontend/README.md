# SkillZone — Frontend (React SPA)

The React single-page app for the SkillZone learning marketplace — talks to the Laravel API in `../backend` over CORS with credentials (Sanctum SPA cookie auth). No server-rendering; this app owns all page rendering and client-side routing.

## Stack

React 19 (JSX) · React Router · TanStack React Query · React Hook Form · Tailwind CSS v4 · Vite

## Setup

```bash
npm install
cp .env.example .env
```

`.env` just needs `VITE_API_URL` pointing at the backend (defaults to `http://localhost:8000`).

## Running it

```bash
npm run dev        # SPA dev server at http://localhost:5173
npm run build       # production build to dist/
npm run preview     # preview the production build
npm run lint         # oxlint
```

The backend must also be running (see `../backend/README.md`) — the SPA calls `GET /sanctum/csrf-cookie` before any state-changing request, and `SANCTUM_STATEFUL_DOMAINS`/`FRONTEND_URL` in the backend's `.env` must match this app's dev origin.

## Structure

```
src/
  api/          axios client + per-domain endpoint modules (auth, catalog, instructor, admin, learning, commerce, quiz, reviews, notifications)
  app/          router, RequireAuth route guard, layouts (GuestLayout, AppLayout)
  features/     one folder per domain — auth/, dashboard/, catalog/, instructor/, admin/, learning/, cart/, orders/
  components/   shared UI primitives (NotificationBell, FormError, ...)
  lib/          apiErrors.js (flattens Laravel 422 errors), useDocumentMeta.js (basic per-page SEO)
```

Auth state isn't a separate context/store — it's just the React Query cache for `['auth', 'me']` (`useAuthUser()` in `features/auth/useAuth.js`), read wherever it's needed.

## Design system

Design tokens and reusable component classes live in `src/index.css` (Tailwind v4's `@theme`/`@layer components`):

- **Colors:** `ink-950`…`ink-600` (dark surfaces — nav, hero banners, auth panel) and `brand-50`…`brand-700` (the teal/emerald accent)
- **Type:** `font-display` (Space Grotesk, for headings) and `font-sans` (Inter, body text) — loaded via Google Fonts in `index.html`
- **Components:** `.btn-primary` / `.btn-outline` / `.btn-dark` / `.btn-ghost`, `.card` / `.card-hover`, `.input`, `.label`, `.badge-brand` / `.badge-amber` / `.badge-slate`, `.eyebrow`

Logo assets (`public/logo.png`, `public/logo-icon.png`, `public/favicon.png`) follow the same teal-on-dark palette.

When adding new UI, prefer these existing classes over one-off Tailwind combinations to keep the app visually consistent.
