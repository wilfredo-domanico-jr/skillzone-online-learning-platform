<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Contracts\PaymentGateway;
use App\Enums\EnrollmentSource;
use App\Enums\OrderStatus;
use App\Exceptions\InvalidWebhookSignatureException;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Enrollment;
use App\Models\Order;
use App\Notifications\NewEnrollment;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request, PaymentGateway $paymentGateway): Response
    {
        try {
            $event = $paymentGateway->constructWebhookEvent(
                $request->getContent(),
                $request->header('Stripe-Signature', '')
            );
        } catch (InvalidWebhookSignatureException) {
            return response('Invalid signature.', 400);
        }

        if ($event['type'] === 'checkout.session.completed') {
            $this->grantAccessForCompletedSession($event['data']['object']);
        }

        return response('OK');
    }

    /**
     * The webhook — not the success-URL redirect — is the source of truth
     * for granting access, since the redirect can be lost (tab closed,
     * network blip). Guarded so a retried/duplicate webhook delivery is a
     * no-op instead of double-processing.
     */
    private function grantAccessForCompletedSession(array $session): void
    {
        $order = Order::with('items.course.instructor')
            ->where('stripe_checkout_session_id', $session['id'])
            ->first();

        if (! $order || $order->status === OrderStatus::Paid) {
            return;
        }

        DB::transaction(function () use ($order, $session) {
            $order->update([
                'status' => OrderStatus::Paid,
                'paid_at' => now(),
                'stripe_payment_intent_id' => $session['payment_intent'] ?? null,
            ]);

            foreach ($order->items as $item) {
                $enrollment = Enrollment::firstOrCreate(
                    ['user_id' => $order->user_id, 'course_id' => $item->course_id],
                    ['source' => EnrollmentSource::Purchase, 'enrolled_at' => now(), 'progress_percent' => 0]
                );

                if ($enrollment->wasRecentlyCreated) {
                    $item->course->instructor->notify(new NewEnrollment($enrollment->load('user', 'course')));
                }
            }

            if ($order->coupon_id) {
                Coupon::whereKey($order->coupon_id)->increment('times_redeemed');
            }

            $courseIds = $order->items->pluck('course_id');
            $cart = Cart::where('user_id', $order->user_id)->first();
            $cart?->items()->whereIn('course_id', $courseIds)->delete();
        });
    }
}
