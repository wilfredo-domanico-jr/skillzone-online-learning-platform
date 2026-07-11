# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Udemy-style online learning marketplace, being built out in phases.

- **Phase 0** (SPA/API migration + auth hardening) is complete: the project is a **decoupled Laravel API backend + React SPA frontend**, authenticated via Laravel Sanctum's SPA cookie flow, with Google/GitHub OAuth (Laravel Socialite) and role-based access (Spatie Permission: `student`/`instructor`/`admin`).
- **Phase 1** (course catalog & curriculum authoring) is complete: categories, courses, sections, lessons (video/article/quiz/resource), the instructor-application approval workflow, instructor curriculum authoring (CRUD + reordering + file uploads), the admin course-moderation queue, and the public course catalog/detail/curriculum endpoints.
- **Phase 2** (enrollment & free courses) is complete: free-course enrollment, the course player (video/article/resource lesson content, per-lesson completion, video resume position), and per-course progress tracking.
- **Phase 3** (Stripe payments) is complete: cart, coupons, Stripe Checkout Sessions, and a webhook-driven order/enrollment flow (the webhook — not the success-URL redirect — is what actually grants access). **Real Stripe test-mode keys have not been provided yet** — `STRIPE_SECRET`/`STRIPE_WEBHOOK_SECRET` in `backend/.env` are placeholders, so checkout session creation and webhook signature verification are only verified against a mocked `PaymentGateway` in the test suite, not against Stripe's real sandbox. See the "Stripe setup" bullet below before relying on the live checkout flow.

Not yet built: quizzes (the lesson `type` exists but has no quiz-taking flow), reviews, and instructor payouts — see the phased roadmap in the project's plan history for what's next.

Stack: PHP 8.2 / Laravel 12 API backend (no Blade views, no Inertia), MySQL, React 19 SPA frontend (JSX) in `frontend/` with React Router, TanStack React Query, React Hook Form, Tailwind CSS v4, and Vite — talking to the API over CORS with credentials.

## Repo layout

Two independently-run halves in one repo, each in its own top-level folder:

- **`backend/`** — the Laravel API (`app/`, `routes/`, `database/`, `config/`, `composer.json`, `artisan`, etc.) — serves only `/api/v1/*` JSON plus a handful of routes in `routes/web.php` that must stay outside the SPA-facing API (OAuth redirect/callback, signed email-verification links, and the unauthenticated Stripe webhook).
- **`frontend/`** — the React SPA, its own Vite project with its own `package.json`, entirely separate build/dev toolchain from the Laravel app. Laravel does not build, serve, or know about the frontend's assets.

All `php artisan`/`composer` commands below must be run from inside `backend/`; all `npm` commands from inside `frontend/`. `composer dev`/`composer setup` in `backend/composer.json` already invoke the frontend's npm scripts for you via `npm --prefix ../frontend`, so you don't need a second terminal for basic dev work.

## Common commands

**Local dev (single command, run from `backend/`; starts API server + queue worker + log tailer + SPA dev server together):**

```
cd backend
composer dev
```

**Individually:**

```
cd backend && php artisan serve                 # backend API at http://localhost:8000
cd frontend && npm run dev                       # SPA dev server at http://localhost:5173
cd backend && php artisan queue:listen --tries=1 --timeout=0
cd backend && php artisan pail --timeout=0       # live log viewer
```

**Frontend build:**

```
cd frontend && npm run build
```

**Tests (PHPUnit, Feature + Unit suites — run from `backend/`):**

```
composer test                 # clears config cache, then runs php artisan test
php artisan test               # run full suite directly
php artisan test --filter=RegistrationTest        # single test class
php artisan test tests/Feature/Auth/AuthenticationTest.php  # single file
```

Test env config lives inline in `backend/phpunit.xml` (sqlite `:memory:`, array session/cache/mail drivers, sync queue) — no separate `.env.testing` file is needed. Auth Feature tests hit `/api/v1/auth/*` and assert JSON responses, not Inertia/redirect responses — see `backend/tests/TestCase.php` for why a `Referer` header and role seeding are set up globally (Sanctum's stateful-domain detection and Spatie roles both need it).

**Database (run from `backend/`):**

```
php artisan migrate
php artisan migrate:fresh --seed
```

The dev database is MySQL (`DB_CONNECTION=mysql`, configured via `backend/.env`) — despite older docs/scaffolding referencing a `database/database.sqlite` file, the actual dev DB in this environment is MySQL. Tests always run against an isolated in-memory SQLite DB regardless (see `phpunit.xml`).

**First-time setup** (also encoded in `backend/composer.json`'s `setup` script, run from `backend/`): `composer install`, copy `.env.example` to `.env`, `php artisan key:generate`, `php artisan migrate`, `npm --prefix ../frontend install`, copy `../frontend/.env.example` to `../frontend/.env`.

## Architecture

- **JSON API, not Inertia/Blade.** Controllers under `backend/app/Http/Controllers/Api/V1/` return `JsonResponse`s. Routes live in `backend/routes/api.php` under an `/api/v1` prefix. There is no `resources/js/Pages` or server-rendered view layer anymore — the SPA in `frontend/` owns all page rendering and client-side routing (React Router).
- **Auth: Sanctum SPA cookie auth**, not bearer tokens. `EnsureFrontendRequestsAreStateful` is prepended to the `api` middleware group (`backend/bootstrap/app.php`). The SPA must call `GET /sanctum/csrf-cookie` before any state-changing request, then send the `X-XSRF-TOKEN` header (axios does this automatically when `withXSRFToken: true` — see `frontend/src/api/client.js`). CORS is configured in `backend/config/cors.php` against `FRONTEND_URL`/`SANCTUM_STATEFUL_DOMAINS` env vars — update both together when the SPA's dev/prod origin changes.
- **Auth endpoints** (`backend/app/Http/Controllers/Api/V1/AuthController.php`, `ProfileController.php`): register, login, logout, me, forgot/reset password, email verification, password confirm/update, profile update/delete. Email verification (`GET /verify-email/{id}/{hash}`) stays in `backend/routes/web.php` (not `api.php`) because it's a signed link the user clicks from their inbox — a real browser navigation, not a fetch/XHR — and it redirects into the SPA (`config('app.frontend_url')`) afterward rather than returning JSON.
- **Roles & permissions**: `spatie/laravel-permission`. Three base roles (`student`, `instructor`, `admin`) are seeded via `backend/database/seeders/RoleSeeder.php` (called from `DatabaseSeeder`). New users get `student` on registration (both password and OAuth signup). `User` has the `HasRoles` trait; gate routes with the `role:` middleware alias (registered in `backend/bootstrap/app.php`) and Policies for per-resource ownership once domain models exist.
- **Social login (Google/GitHub)**: `App\Http\Controllers\SocialController` (`redirect`/`callback`), routed at `/auth/{provider}/redirect` and `/auth/{provider}/callback` in `backend/routes/web.php` — these must stay browser-navigated (`window.location.href` from the SPA, not axios) since Socialite needs a real redirect chain. The callback matches existing users **by email alone** and links the provider if not already linked (rather than erroring or duplicating), creates+auto-verifies new users otherwise, and finishes with `redirect()->away(frontend_url.'/auth/callback')` so the SPA can hydrate its session via `GET /api/v1/auth/me`. Provider credentials come from `backend/config/services.php` via `GOOGLE_*`/`GITHUB_*` env vars; Socialite runs in `stateless()` mode.
- **Known-fixed gap**: `users.social_provider`/`users.social_id` columns and their unique-together constraint are created by `backend/database/migrations/*_add_social_fields_to_users_table.php`. That migration is written defensively (checks `Schema::hasColumn`/existing index names before altering) because this environment's DB had already drifted from migrations via manual edits before this fix — worth knowing if you see similar drift elsewhere.
- **Migrations**: stock Laravel auth tables, Sanctum's `personal_access_tokens`, Spatie's permission tables, the social-fields migration, the Phase 1 domain tables (`categories`, `courses`, `course_sections`, `lessons`, `lesson_video_details`, `lesson_articles`, `lesson_resources`, `instructor_applications`), the Phase 2 tables (`enrollments`, `lesson_progress`), and the Phase 3 commerce tables (`carts`, `cart_items`, `orders`, `order_items`, `coupons`). No quiz-attempt/review tables exist yet.
- **A recurring gotcha worth knowing**: after `Model::create([...])` with a column you left unset (relying on its DB `default`), the in-memory model does **not** refetch that default — the attribute reads as `null`/absent until reloaded, which throws if it's enum-cast (`Course.level`) or just serializes wrong (`Enrollment.progress_percent`). Fixed in `Instructor\CourseController::store` and `EnrollmentController::store` by passing the default explicitly in the `create()` call rather than omitting the key. Apply the same pattern (explicit defaults, not DB-column defaults) for any new `create()` call whose response is returned immediately without a `->fresh()`/`->refresh()`.
- **Enrollment & progress** (`backend/app/Models/Enrollment.php`, `LessonProgress.php`): `Enrollment` belongs to a `User` and `Course` (unique together — `POST /courses/{slug}/enroll` is idempotent, returning the existing enrollment instead of erroring on a repeat call), has many `LessonProgress` rows (one per lesson touched). `Enrollment::recalculateProgress()` recomputes `progress_percent` from completed-lessons-count / total-lessons-count and stamps `completed_at` at 100% — called after every `POST /lessons/{id}/complete`. The direct `/enroll` endpoint only ever grants `source=free`; paid courses go through checkout instead (a `price > 0` course is rejected there with a 422).
- **Cart, checkout & payments** (`backend/app/Models/Cart.php`, `Order.php`, `Coupon.php`, `backend/app/Http/Controllers/Api/V1/CartController.php`, `CheckoutController.php`, `backend/app/Http/Controllers/StripeWebhookController.php`): a `Cart` holds `CartItem`s (paid courses only — adding a free course or one you're already enrolled in is rejected; prices are looked up live from `courses.price` at read time, never stored on the cart item). `CheckoutController::store` re-derives prices server-side from the cart (never trusts client-submitted totals), re-validates each course is still published and not already owned, applies a `Coupon` if given (`Coupon::isRedeemableFor()`/`discountFor()` handle the active/date-window/redemption-cap/course-scope checks and percent-vs-fixed math), and creates a `pending` `Order` + `OrderItem`s (price snapshotted) before calling out to Stripe. **The webhook — `POST /webhooks/stripe`, handled by `StripeWebhookController`, routed in `backend/routes/web.php` and CSRF-exempted via `bootstrap/app.php`'s `validateCsrfTokens(except: ['webhooks/*'])` — is the source of truth for granting access, not the success-URL redirect** (the redirect can be lost — closed tab, network blip). On `checkout.session.completed` it marks the order `paid`, creates one `Enrollment` per `OrderItem` (`source=purchase`, idempotent via `firstOrCreate` — safe against Stripe's at-least-once webhook delivery), increments the coupon's `times_redeemed`, and clears the purchased courses out of the cart.
- **Stripe is wrapped behind `App\Contracts\PaymentGateway`** (`createCheckoutSession()`, `constructWebhookEvent()`), bound to `StripePaymentGateway` in `AppServiceProvider`. This exists specifically so checkout/webhook logic is unit-testable without real Stripe credentials — tests bind `Tests\Fakes\FakePaymentGateway` instead (see `CheckoutTest`, `StripeWebhookTest`). Discounted checkouts create an ad-hoc Stripe `Coupon` object (`amount_off` in cents, `duration: once`) rather than pre-provisioning Stripe-side coupons — see `StripePaymentGateway::createCheckoutSession()`. `CheckoutController` catches `Stripe\Exception\ApiErrorException` around the gateway call specifically so a Stripe outage/misconfiguration flips the order to `failed` and returns a clean 422 instead of leaking the SDK's stack trace to the API client — this is real, exercised behavior (confirmed live: the placeholder `STRIPE_SECRET` currently in `.env` correctly reaches Stripe's API and gets rejected with `AuthenticationException`, proving the integration point itself works).
- **Stripe setup (still needed before checkout works for real)**: get test-mode keys from `dashboard.stripe.com/test/apikeys`, set `STRIPE_SECRET` in `backend/.env`. For local webhook delivery, run `stripe listen --forward-to localhost:<port>/webhooks/stripe` (Stripe CLI) and put the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`. Until then, `POST /api/v1/checkout/session` will reach Stripe and fail cleanly (order marked `failed`, 422 to the client) rather than actually starting a checkout.
- **Course domain model** (`backend/app/Models/`): `Course` belongs to an `instructor` (User) and optional `Category`, has many `CourseSection`s (ordered by `position`), each with many `Lesson`s (ordered by `position`). A `Lesson` has a `type` enum (`video`/`article`/`quiz`/`resource`) and an optional 1:1 `videoDetail`/`article` plus many `attachments` (`LessonAttachment`, mapped to the `lesson_resources` table — named "Attachment" on the PHP side, not "Resource", to avoid colliding with `Illuminate\Http\Resources\Json\JsonResource`-suffixed classes). Course/lesson status enums live in `backend/app/Enums/`.
- **File storage uses Laravel's `Storage` facade against the `public` disk**, not a hardcoded S3 client — `php artisan storage:link` makes `backend/storage/app/public` web-reachable at `/storage/*`. Swapping to S3 in production is a config-only change (`FILESYSTEM_DISK=s3` + `AWS_*` env vars in `backend/.env`); no controller/model code references S3 directly. Video/attachment uploads go straight through the Laravel API (`multipart/form-data`) rather than S3 presigned PUT URLs — fine for now, but large-file uploads proxying through PHP is a known limitation to revisit before this goes to real production traffic.
- **Course lifecycle**: `draft` → (instructor submits, requires ≥1 section with ≥1 lesson) → `pending_review` → admin approves → `published` (sets `published_at`) or admin rejects → `rejected` (with `rejection_reason`, resubmittable). Ownership is enforced by `CoursePolicy` (`backend/app/Policies/CoursePolicy.php`) — admins bypass via a `before()` hook; sections/lessons/attachments don't have their own policies and instead authorize against `$lesson->section->course` / `$section->course`.
- **Lesson content visibility**: `LessonResource` (`backend/app/Http/Resources/LessonResource.php`) only serializes video/article/attachment content when the requester owns the course, is an admin, is enrolled, or the lesson `is_previewable`. The controller (`CourseController::curriculum`) sets this via `$request->attributes->set('can_view_locked_lesson_content', bool)` and, when enrolled, also sets `lesson_progress_map` (lesson_id → `{completed, last_position_seconds}`) — both read directly by `LessonResource` rather than being threaded through nested resource collections; read that file's comment before changing the locking/progress logic. The same `curriculum` endpoint serves both the public preview (guests/non-enrolled) and the course player (enrolled) — there's no separate `/learn` route server-side, just different unlock state depending on who's asking.
- **API responses are `JsonResource`-wrapped and default-wrap in a top-level `"data"` key** (Laravel's default `JsonResource` behavior) — e.g. `{"data": {...}}` for a single course, `{"data": [...], "links": {...}, "meta": {...}}` for a paginated list. This differs from Phase 0's plain `{"user": {...}}`-style auth responses (which predate the `JsonResource` convention) — don't assume flat responses when consuming new endpoints from the frontend or tests.
- **Frontend structure** under `frontend/src/`:
    - `api/` — axios client (`client.js`) plus per-domain endpoint modules: `auth.js`, `catalog.js` (public browse/detail/curriculum), `instructor.js` (applications, course/section/lesson CRUD, content uploads), `admin.js` (application/course moderation queues, coupon CRUD not yet wired to a UI), `learning.js` (enroll, my-enrollments, curriculum-as-learner, complete/progress), `commerce.js` (cart, coupon validate, checkout session, orders).
    - `app/` — router (`router.jsx`), `RequireAuth` route guard (checks the `/auth/me` query, optionally a list of roles), layouts (`layouts/GuestLayout.jsx`, `layouts/AppLayout.jsx` — the latter now shows role-conditional nav links, a cart-count badge, and works for both guests and authed users since catalog browsing is public).
    - `features/` — one folder per domain: `auth/`, `dashboard/`, `catalog/` (`CourseListPage`, `CourseDetailPage` — the latter drives enroll for free courses, add-to-cart for paid ones, and "continue learning" once enrolled), `instructor/` (`ApplyPage`, `InstructorCoursesPage`, `CourseEditorPage` — the curriculum builder with up/down-button reordering, no drag-and-drop library), `admin/` (`ApplicationsQueuePage`, `CourseModerationPage`), `learning/` (`MyLearningPage` — enrolled courses with progress bars; `CoursePlayerPage` — sidebar curriculum nav + video/article/resource content pane, marks lessons complete, autosaves video resume position every 5s via `onTimeUpdate`), `cart/` (`CartPage` — add/remove, coupon apply, checkout button that does a full `window.location.href` redirect to Stripe, not an axios call), `orders/` (`OrdersPage` — history list; `OrderDetailPage` — shows a "confirming payment" banner and polls every 2s while the order is still `pending`, since the webhook may not have processed yet when the Stripe success redirect lands).
    - `components/` — shared UI primitives.
    - `lib/apiErrors.js` — flattens Laravel's 422 validation-error shape for form display.
    - Auth state is **not** a separate context/store — it's just the React Query cache for `['auth', 'me']` (`useAuthUser()` in `features/auth/useAuth.js`), read wherever needed.

## Known environment quirk

This machine has had multiple unrelated `php artisan serve` processes left running and bound to `127.0.0.1:8000` at once (observed alongside an unrelated `careerhub-job-platform` project) — Windows will let more than one process claim the same port in this state, and which one actually answers a given request is effectively random. If `php artisan serve` requests behave unexpectedly (wrong app responds, 404s for real routes), run `netstat -ano | grep :8000` and check for stray `php.exe` processes before assuming a code bug; picking an alternate `--port` is the quickest way to confirm.

## Commit conventions

Use conventional commit prefixes (`feat:`, `fix:`, `refactor:`, `chore:`), keep the message short but descriptive, and never include Claude attribution (no name, no `Co-Authored-By` trailer).
