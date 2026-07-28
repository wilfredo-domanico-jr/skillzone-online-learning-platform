<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Course;
use App\Models\User;

class CoursePolicy
{
    /**
     * Admins can do anything with any course; short-circuits the rest.
     */
    public function before(User $user, string $ability): ?bool
    {
        return $user->hasRole('admin') ? true : null;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('instructor');
    }

    public function view(User $user, Course $course): bool
    {
        return $course->instructor_id === $user->id;
    }

    public function update(User $user, Course $course): bool
    {
        return $course->instructor_id === $user->id;
    }

    public function delete(User $user, Course $course): bool
    {
        return $course->instructor_id === $user->id;
    }
}
