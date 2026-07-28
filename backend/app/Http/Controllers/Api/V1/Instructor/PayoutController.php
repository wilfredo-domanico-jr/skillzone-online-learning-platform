<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Http\Controllers\Controller;
use App\Http\Resources\PayoutResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayoutController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payouts = $request->user()->payouts()->latest('period_start')->paginate($request->integer('per_page', 15));

        return PayoutResource::collection($payouts)->response();
    }
}
