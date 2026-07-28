<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->with('roles')
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = '%'.$request->string('search').'%';
                $query->where(fn ($q) => $q->where('name', 'like', $term)->orWhere('email', 'like', $term));
            })
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return UserResource::collection($users)->response();
    }

    public function suspend(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages(['user' => 'You cannot suspend your own account.']);
        }

        $user->forceFill(['suspended_at' => now()])->save();

        return (new UserResource($user->fresh('roles')))->response();
    }

    public function unsuspend(User $user): JsonResponse
    {
        $user->forceFill(['suspended_at' => null])->save();

        return (new UserResource($user->fresh('roles')))->response();
    }
}
