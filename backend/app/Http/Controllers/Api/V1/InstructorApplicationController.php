<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\InstructorApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInstructorApplicationRequest;
use App\Http\Resources\InstructorApplicationResource;
use App\Models\InstructorApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class InstructorApplicationController extends Controller
{
    /**
     * Submit an application to become an instructor.
     */
    public function store(StoreInstructorApplicationRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasRole('instructor')) {
            throw ValidationException::withMessages([
                'status' => 'You are already an approved instructor.',
            ]);
        }

        $existing = $user->instructorApplications()
            ->where('status', InstructorApplicationStatus::Pending)
            ->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'status' => 'You already have a pending instructor application.',
            ]);
        }

        $application = $user->instructorApplications()->create([
            ...$request->validated(),
            'status' => InstructorApplicationStatus::Pending,
            'submitted_at' => now(),
        ]);

        return (new InstructorApplicationResource($application))->response()->setStatusCode(201);
    }

    /**
     * The authenticated user's most recent instructor application, if any.
     */
    public function me(Request $request): JsonResponse
    {
        $application = $request->user()->instructorApplications()->latest('submitted_at')->first();

        return response()->json([
            'application' => $application ? new InstructorApplicationResource($application) : null,
        ]);
    }
}
