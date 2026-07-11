<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\InstructorApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\InstructorApplicationResource;
use App\Models\InstructorApplication;
use App\Notifications\InstructorApplicationDecided;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class InstructorApplicationController extends Controller
{
    /**
     * List instructor applications, optionally filtered by status (defaults to pending).
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', InstructorApplicationStatus::Pending->value);

        $applications = InstructorApplication::query()
            ->with('user')
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->latest('submitted_at')
            ->paginate($request->integer('per_page', 15));

        return InstructorApplicationResource::collection($applications)->response();
    }

    public function approve(Request $request, InstructorApplication $instructorApplication): JsonResponse
    {
        $this->ensurePending($instructorApplication);

        $instructorApplication->update([
            'status' => InstructorApplicationStatus::Approved,
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
        ]);

        $instructorApplication->user->assignRole('instructor');
        $instructorApplication->user->notify(new InstructorApplicationDecided($instructorApplication));

        return (new InstructorApplicationResource($instructorApplication->fresh('user')))->response();
    }

    public function reject(Request $request, InstructorApplication $instructorApplication): JsonResponse
    {
        $this->ensurePending($instructorApplication);

        $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $instructorApplication->update([
            'status' => InstructorApplicationStatus::Rejected,
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
            'rejection_reason' => $request->input('rejection_reason'),
        ]);

        $instructorApplication->user->notify(new InstructorApplicationDecided($instructorApplication));

        return (new InstructorApplicationResource($instructorApplication->fresh('user')))->response();
    }

    private function ensurePending(InstructorApplication $application): void
    {
        if ($application->status !== InstructorApplicationStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => 'This application has already been reviewed.',
            ]);
        }
    }
}
