# SkillZone — Backend (Laravel API)

A JSON API for the SkillZone learning marketplace — no Blade views, no Inertia. Every request/response is JSON under `/api/v1/*`, consumed by the separate React SPA in `../frontend`.

## Requirements

- PHP 8.2+
- Composer
- MySQL (dev) — the test suite uses an isolated in-memory SQLite DB regardless, so no separate test database setup is needed

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Set your database credentials in `.env` (`DB_CONNECTION=mysql`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`) and create the database, then:

```bash
php artisan migrate
# or, for a clean slate with seed data (roles + categories):
php artisan migrate:fresh --seed
```

`composer install` alone won't set up the frontend — either run the one-shot `composer setup` script (installs backend deps, copies both `.env` files, migrates, and installs frontend deps) or do it manually per the root [`README.md`](../README.md).

## Running it

```bash
composer dev
```

Starts the API server, a queue worker, a log tailer (`php artisan pail`), and the frontend's Vite dev server together in one terminal. Individually:

```bash
php artisan serve                                  # API at http://localhost:8000
php artisan queue:listen --tries=1 --timeout=0
php artisan pail --timeout=0                        # live log viewer (requires the pcntl extension)
npm --prefix ../frontend run dev                    # SPA at http://localhost:5173
```

> `php artisan pail` requires the PHP `pcntl` extension, which isn't available on stock Windows PHP builds — if it's missing, just skip that one process and use `php artisan serve` + the Vite dev server directly.

## Tests

```bash
composer test          # clears config cache, then runs the suite
php artisan test
php artisan test --filter=RegistrationTest
php artisan test tests/Feature/Auth/AuthenticationTest.php
```

Test environment config lives inline in `phpunit.xml` (sqlite `:memory:`, array session/cache/mail drivers, sync queue) — no `.env.testing` file needed.

## Architecture notes

- **Auth:** Laravel Sanctum's SPA cookie flow (not bearer tokens) — the SPA calls `GET /sanctum/csrf-cookie` before any state-changing request. Google/Facebook OAuth via Socialite, with the redirect/callback routes kept in `routes/web.php` since they need real browser navigation.
- **Roles:** `spatie/laravel-permission` — `student` / `instructor` / `admin`, seeded via `database/seeders/RoleSeeder.php`.
- **Commerce:** cart → Stripe Checkout Session → webhook (`POST /webhooks/stripe`) is the source of truth for granting access, not the success-URL redirect. Stripe is wrapped behind `App\Contracts\PaymentGateway` so checkout/webhook logic is unit-testable without real Stripe credentials (tests use `Tests\Fakes\FakePaymentGateway`).
- **Instructor payouts:** a simple internal ledger (`php artisan payouts:generate`), not Stripe Connect — no real money movement to instructors yet.
- **Notifications:** Laravel's built-in database notifications, in-app only (no mail/broadcast channel wired up).
- **File storage:** the `public` disk via the `Storage` facade — run `php artisan storage:link` once so `storage/app/public` is web-reachable at `/storage/*`.

### Stripe (optional, for real checkout testing)

`STRIPE_SECRET` / `STRIPE_WEBHOOK_SECRET` in `.env` are placeholders by default — checkout will reach Stripe and fail cleanly (order marked `failed`) rather than actually starting a session. To test against real Stripe test-mode:

1. Get test-mode keys from `dashboard.stripe.com/test/apikeys` → set `STRIPE_SECRET`.
2. Run `stripe listen --forward-to localhost:8000/webhooks/stripe` (Stripe CLI) and put the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

### Known environment quirk

This project has occasionally ended up with more than one stray `php artisan serve` process bound to the same port at once (Windows will allow it, and which process actually answers a request becomes random). If API requests behave unexpectedly, run `netstat -ano | grep :8000` and stop any extra `php.exe` processes, or start on an alternate port with `--port`.

## Full documentation

See the root [`CLAUDE.md`](../CLAUDE.md) for a complete phase-by-phase breakdown of the domain model, controllers, and known gotchas.
