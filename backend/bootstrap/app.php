<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        // Applies the 'api' RateLimiter (registered in AppServiceProvider) to
        // every /api/* route by default — previously nothing was throttled
        // except the routes that had their own explicit `throttle:` middleware.
        $middleware->throttleApi();

        // Applies to every /api/* request, but is a no-op for guests and
        // non-suspended users — simplest way to guarantee a suspension takes
        // effect immediately across all authenticated routes.
        $middleware->api(append: [
            \App\Http\Middleware\EnsureUserIsNotSuspended::class,
        ]);

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            // Overrides the framework default so an already-authenticated
            // hit on a guest-only route (login/register/demo-login) gets a
            // clean JSON 409 instead of a redirect to a nonexistent named
            // "login" route.
            'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
        ]);

        // Stripe signs the webhook body itself; it can't submit a CSRF token.
        $middleware->validateCsrfTokens(except: ['webhooks/*']);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
