<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\PaymentGateway;
use App\Enums\CourseStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Stripe\Exception\ApiErrorException;

class CheckoutController extends Controller
{
    public function __construct(private readonly PaymentGateway $paymentGateway)
    {
    }

    /**
     * Create a pending Order (server-derived prices) from the requester's
     * cart and hand back a Stripe Checkout Session URL to redirect to.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'coupon_code' => ['nullable', 'string'],
        ]);

        $cart = $request->user()->cart()->with('items.course')->first();

        if (! $cart || $cart->items->isEmpty()) {
            throw ValidationException::withMessages(['cart' => 'Your cart is empty.']);
        }

        foreach ($cart->items as $item) {
            if ($item->course->status !== CourseStatus::Published) {
                throw ValidationException::withMessages(['cart' => "\"{$item->course->title}\" is no longer available."]);
            }

            if ($request->user()->enrollments()->where('course_id', $item->course->id)->exists()) {
                throw ValidationException::withMessages(['cart' => "You're already enrolled in \"{$item->course->title}\"."]);
            }
        }

        $subtotal = round($cart->items->sum(fn ($item) => (float) $item->course->price), 2);

        $coupon = null;
        $discount = 0.0;

        if (! empty($data['coupon_code'])) {
            $coupon = Coupon::where('code', $data['coupon_code'])->first();
            $courseIds = $cart->items->pluck('course_id');

            if (! $coupon || ! $coupon->isRedeemableFor($courseIds)) {
                throw ValidationException::withMessages(['coupon_code' => 'This coupon cannot be applied to your cart.']);
            }

            $discount = $coupon->discountFor($subtotal);
        }

        $order = DB::transaction(function () use ($request, $cart, $subtotal, $discount, $coupon) {
            $order = $request->user()->orders()->create([
                'status' => OrderStatus::Pending,
                'subtotal' => $subtotal,
                'discount_total' => $discount,
                'total' => round($subtotal - $discount, 2),
                'currency' => 'usd',
                'coupon_id' => $coupon?->id,
            ]);

            foreach ($cart->items as $item) {
                $order->items()->create([
                    'course_id' => $item->course->id,
                    'price_at_purchase' => $item->course->price,
                    'instructor_id' => $item->course->instructor_id,
                ]);
            }

            return $order;
        });

        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        try {
            $session = $this->paymentGateway->createCheckoutSession(
                $order->load('items.course', 'user'),
                "{$frontendUrl}/orders/{$order->id}?success=true",
                "{$frontendUrl}/cart?canceled=true",
            );
        } catch (ApiErrorException $e) {
            // Don't leave the order stuck in "pending" forever, and never
            // leak Stripe SDK internals (file paths, stack traces) to the
            // client — this is reachable any time Stripe/network hiccups,
            // not just from a misconfigured key.
            $order->update(['status' => OrderStatus::Failed]);
            Log::error('Stripe checkout session creation failed', ['order_id' => $order->id, 'message' => $e->getMessage()]);

            throw ValidationException::withMessages([
                'checkout' => 'We could not start checkout right now. Please try again shortly.',
            ]);
        }

        $order->update(['stripe_checkout_session_id' => $session['id']]);

        return response()->json(['checkout_url' => $session['url'], 'order_id' => $order->id]);
    }
}
