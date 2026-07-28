<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\LessonContentStreamController;
use App\Http\Controllers\SocialController;
use App\Http\Controllers\StripeWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Browser-navigated routes
|--------------------------------------------------------------------------
|
| Everything else is a JSON API served from routes/api.php and consumed by
| the decoupled React SPA. The routes below must stay here because they
| involve a real browser redirect (OAuth, signed email links) rather than
| an XHR/fetch call — or, for the Stripe webhook, an unauthenticated
| server-to-server POST that can't carry a Sanctum session/CSRF token.
|
*/

Route::get('/auth/{provider}/redirect', [SocialController::class, 'redirect'])
    ->where('provider', 'google|facebook')
    ->name('social.redirect');
Route::get('/auth/{provider}/callback', [SocialController::class, 'callback'])
    ->where('provider', 'google|facebook')
    ->name('social.callback');

Route::get('/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['auth', 'signed', 'throttle:6,1'])
    ->name('verification.verify');

Route::post('/webhooks/stripe', StripeWebhookController::class)->name('webhooks.stripe');

// Lesson video/attachment content — served via short-lived signed URLs (see
// LessonContentStreamController) rather than a permanent public disk link.
Route::get('/lessons/video/{videoDetail}', [LessonContentStreamController::class, 'video'])
    ->middleware('signed')
    ->name('lessons.video.stream');
Route::get('/lessons/attachments/{attachment}', [LessonContentStreamController::class, 'attachment'])
    ->middleware('signed')
    ->name('lessons.attachments.download');
