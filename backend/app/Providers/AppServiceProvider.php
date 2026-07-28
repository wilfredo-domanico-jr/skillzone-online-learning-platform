<?php

declare(strict_types=1);

namespace App\Providers;

use App\Contracts\PaymentGateway;
use App\Services\StripePaymentGateway;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Stripe\StripeClient;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PaymentGateway::class, fn () => new StripePaymentGateway(
            new StripeClient(config('services.stripe.secret'))
        ));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Backs bootstrap/app.php's throttleApi() call — applies to every
        // /api/v1/* route that doesn't already have its own tighter limiter
        // (login has its own manual RateLimiter; register/forgot-password/
        // coupon-validate get an explicit stricter one in routes/api.php).
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
