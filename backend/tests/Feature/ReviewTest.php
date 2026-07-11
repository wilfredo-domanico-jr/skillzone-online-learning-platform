<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_enrolled_student_can_review_a_course(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create();
        Enrollment::factory()->create(['user_id' => $student->id, 'course_id' => $course->id]);

        $response = $this->actingAs($student)->postJson("/api/v1/courses/{$course->id}/reviews", [
            'rating' => 5,
            'comment' => 'Excellent course.',
        ]);

        $response->assertCreated()->assertJsonPath('data.rating', 5);
        $this->assertSame(1, $course->fresh()->reviews_count);
        $this->assertSame('5.00', $course->fresh()->average_rating);
    }

    public function test_a_non_enrolled_student_cannot_review_a_course(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create();

        $this->actingAs($student)
            ->postJson("/api/v1/courses/{$course->id}/reviews", ['rating' => 4])
            ->assertUnprocessable();
    }

    public function test_a_student_cannot_review_the_same_course_twice(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create();
        Enrollment::factory()->create(['user_id' => $student->id, 'course_id' => $course->id]);

        $this->actingAs($student)->postJson("/api/v1/courses/{$course->id}/reviews", ['rating' => 4])->assertCreated();
        $this->actingAs($student)
            ->postJson("/api/v1/courses/{$course->id}/reviews", ['rating' => 5])
            ->assertUnprocessable();
    }

    public function test_average_rating_recalculates_across_multiple_reviews(): void
    {
        $course = Course::factory()->published()->create();

        foreach ([3, 5] as $rating) {
            $student = User::factory()->create();
            Enrollment::factory()->create(['user_id' => $student->id, 'course_id' => $course->id]);
            $this->actingAs($student)->postJson("/api/v1/courses/{$course->id}/reviews", ['rating' => $rating]);
        }

        $course->refresh();
        $this->assertSame(2, $course->reviews_count);
        $this->assertSame('4.00', $course->average_rating);
    }

    public function test_a_reviewer_can_update_their_own_review(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create();
        Enrollment::factory()->create(['user_id' => $student->id, 'course_id' => $course->id]);
        $review = $course->reviews()->create(['user_id' => $student->id, 'rating' => 2]);

        $response = $this->actingAs($student)->putJson("/api/v1/reviews/{$review->id}", [
            'rating' => 4,
            'comment' => 'Updated my mind.',
        ]);

        $response->assertOk()->assertJsonPath('data.rating', 4);
        $this->assertSame('4.00', $course->fresh()->average_rating);
    }

    public function test_a_student_cannot_update_someone_elses_review(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $course = Course::factory()->published()->create();
        Enrollment::factory()->create(['user_id' => $owner->id, 'course_id' => $course->id]);
        $review = $course->reviews()->create(['user_id' => $owner->id, 'rating' => 3]);

        $this->actingAs($intruder)
            ->putJson("/api/v1/reviews/{$review->id}", ['rating' => 1])
            ->assertForbidden();
    }

    public function test_an_admin_can_delete_any_review(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $course = Course::factory()->published()->create();
        Enrollment::factory()->create(['user_id' => $owner->id, 'course_id' => $course->id]);
        $review = $course->reviews()->create(['user_id' => $owner->id, 'rating' => 3]);

        $this->actingAs($admin)->deleteJson("/api/v1/reviews/{$review->id}")->assertOk();

        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
        $this->assertSame(0, $course->fresh()->reviews_count);
    }

    public function test_public_can_list_reviews_for_a_published_course(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create();
        Enrollment::factory()->create(['user_id' => $student->id, 'course_id' => $course->id]);
        $course->reviews()->create(['user_id' => $student->id, 'rating' => 5, 'comment' => 'Great!']);

        $response = $this->getJson("/api/v1/courses/{$course->slug}/reviews");

        $response->assertOk()->assertJsonPath('data.0.rating', 5);
    }
}
