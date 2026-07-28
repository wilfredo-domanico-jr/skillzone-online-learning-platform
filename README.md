# SkillZone

A Udemy-style online learning marketplace — a decoupled **Laravel API backend** and **React SPA frontend**, covering course authoring, enrollment, paid checkout, quizzes, reviews, instructor payouts, and admin moderation.

## Stack

- **Backend:** PHP 8.2, Laravel 12, MySQL, Sanctum (SPA cookie auth), Spatie Permission, Stripe
- **Frontend:** React 19 (TypeScript), React Router, TanStack React Query, React Hook Form, Tailwind CSS v4, Vite

## Repo layout

This is two independently-run apps in one repo:

```
backend/     Laravel API — serves /api/v1/* JSON plus a few non-API routes
             (OAuth redirect/callback, signed email-verification links, Stripe webhook)
frontend/    React SPA — its own Vite project, entirely separate build/dev toolchain
```

Laravel does not build, serve, or know about the frontend's assets. See [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md) for setup and commands specific to each half.

## Quick start

```bash
# 1. Backend — installs deps, copies .env, generates key, migrates, and
#    also bootstraps the frontend's install/.env for you
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm --prefix ../frontend install
cp ../frontend/.env.example ../frontend/.env

# 2. Run everything (API + queue worker + log tailer + SPA dev server)
composer dev
```

- API: http://localhost:8000
- SPA: http://localhost:5173

By default the backend uses a MySQL database (`DB_CONNECTION`, `DB_DATABASE`, etc. in `backend/.env`) — create the database yourself before running migrations. The test suite always runs against an isolated in-memory SQLite DB regardless of your local `.env`.

## Docker

```bash
cd backend && cp .env.example .env
# generate a key without needing PHP installed locally:
docker run --rm php:8.2-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
# paste the printed value into backend/.env as APP_KEY=..., then:
cd ..
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

This runs four containers: `db` (MySQL 8), `backend` (the API, migrating on
boot), `queue` (a `queue:work` worker sharing the same image), and
`frontend` (an nginx-served production build of the SPA). `backend/.env`
supplies everything except the DB connection itself — `docker-compose.yml`
forces `DB_HOST=db`/etc. regardless of what's in that file, so the same
`.env` works whether you're running natively or in Docker.

Two things only take effect at image build time, since Vite inlines them
into the built JS: `VITE_API_URL` and `VITE_DEMO_MODE`. Override them via a
root `.env` (`VITE_API_URL=...`) before `docker compose up --build` rather
than editing `frontend/.env`, which the frontend container never reads.

Seed demo data once the containers are up:

```bash
docker compose exec backend php artisan db:seed
```

## What's built

- **Auth** — email/password + Google/Facebook OAuth (Sanctum SPA cookie flow), role-based access (student / instructor / admin)
- **Catalog & curriculum** — categories, courses, sections, video/article/quiz/resource lessons, instructor authoring, admin moderation queue
- **Enrollment & the course player** — free-course enrollment, per-lesson progress, video resume position
- **Commerce** — cart, coupons, Stripe Checkout, webhook-driven order/enrollment granting
- **Quizzes** — instructor quiz builder, attempt limits, auto-grading, quiz-driven lesson completion
- **Reviews, payouts, admin tools, notifications** — course ratings, an internal instructor payout ledger, user suspension, in-app notifications
- **Search & polish** — catalog sort/filters, lightweight SEO, category caching

Refund automation and real payout money-movement (Stripe Connect) are intentionally out of scope — see `backend/README.md` for details.

## Contributing / conventions

Commit messages use conventional prefixes (`feat:`, `fix:`, `refactor:`, `chore:`). See each app's README for its own test/lint commands.

## License

All rights reserved. This project is shared for demonstration/portfolio purposes only — no permission is granted to copy, modify, or redistribute this code without the author's consent.
