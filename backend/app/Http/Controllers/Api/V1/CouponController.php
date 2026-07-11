<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class CouponController extends Controller
{
    /**
     * Preview the discount a code would apply to the requester's current cart.
     */
    public function validate(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'string']]);

        $coupon = Coupon::where('code', $data['code'])->first();

        if (! $coupon) {
            throw ValidationException::withMessages(['code' => 'This coupon code is invalid.']);
        }

        $cart = $request->user()->cart()->with('items.course')->first();
        $courseIds = new Collection($cart?->items->pluck('course_id') ?? []);

        if ($courseIds->isEmpty()) {
            throw ValidationException::withMessages(['code' => 'Your cart is empty.']);
        }

        if (! $coupon->isRedeemableFor($courseIds)) {
            throw ValidationException::withMessages(['code' => 'This coupon cannot be applied to your cart.']);
        }

        $subtotal = round($cart->items->sum(fn ($item) => (float) $item->course->price), 2);
        $discount = $coupon->discountFor($subtotal);

        return response()->json([
            'code' => $coupon->code,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => round($subtotal - $discount, 2),
        ]);
    }
}
