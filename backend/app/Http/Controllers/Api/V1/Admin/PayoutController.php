<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PayoutResource;
use App\Models\InstructorPayout;
use App\Notifications\PayoutPaid;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PayoutController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payouts = InstructorPayout::query()
            ->with('instructor')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest('period_start')
            ->paginate($request->integer('per_page', 15));

        return PayoutResource::collection($payouts)->response();
    }

    public function markPaid(InstructorPayout $payout): JsonResponse
    {
        if ($payout->status === 'paid') {
            throw ValidationException::withMessages(['status' => 'This payout has already been marked paid.']);
        }

        $payout->update(['status' => 'paid', 'paid_at' => now()]);
        $payout->instructor->notify(new PayoutPaid($payout));

        return (new PayoutResource($payout->load('instructor')))->response();
    }
}
