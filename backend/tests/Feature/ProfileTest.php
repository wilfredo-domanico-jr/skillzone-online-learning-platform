<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patchJson('/api/v1/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response->assertOk();

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patchJson('/api/v1/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response->assertOk();

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->deleteJson('/api/v1/profile', [
                'password' => 'password',
            ]);

        $response->assertOk();

        // The "sanctum" guard the auth:sanctum middleware selects for this
        // request stays the process-wide default guard for the rest of the
        // test (container reuse), so check the session guard that logout()
        // actually clears rather than the request-scoped default.
        $this->assertGuest('web');
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->deleteJson('/api/v1/profile', [
                'password' => 'wrong-password',
            ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->assertNotNull($user->fresh());
    }

    public function test_deleting_an_account_recalculates_the_reviewed_courses_rating(): void
    {
        // reviews.user_id cascades at the DB level on user deletion, which
        // bypasses Review's own model events — this guards against that
        // leaving the course's cached average_rating/reviews_count stale.
        $user = User::factory()->create();
        $otherStudent = User::factory()->create();
        $course = Course::factory()->published()->create();
        Enrollment::factory()->create(['user_id' => $user->id, 'course_id' => $course->id]);
        Enrollment::factory()->create(['user_id' => $otherStudent->id, 'course_id' => $course->id]);
        $course->reviews()->create(['user_id' => $user->id, 'rating' => 1]);
        $course->reviews()->create(['user_id' => $otherStudent->id, 'rating' => 5]);

        $this
            ->actingAs($user)
            ->deleteJson('/api/v1/profile', ['password' => 'password'])
            ->assertOk();

        $course->refresh();
        $this->assertSame(1, $course->reviews_count);
        $this->assertSame('5.00', $course->average_rating);
    }
}
