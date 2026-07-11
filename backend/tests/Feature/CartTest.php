<?php

namespace Tests\Feature;

use App\Enums\EnrollmentSource;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_paid_course_can_be_added_to_the_cart(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => 49.99]);

        $response = $this->actingAs($student)->postJson('/api/v1/cart/items', ['course_id' => $course->id]);

        $response->assertCreated()->assertJsonPath('data.subtotal', 49.99);
    }

    public function test_a_free_course_cannot_be_added_to_the_cart(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => 0]);

        $this->actingAs($student)
            ->postJson('/api/v1/cart/items', ['course_id' => $course->id])
            ->assertUnprocessable();
    }

    public function test_cannot_add_a_course_already_enrolled_in(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => 49.99]);
        $student->enrollments()->create([
            'course_id' => $course->id,
            'source' => EnrollmentSource::Purchase,
            'enrolled_at' => now(),
        ]);

        $this->actingAs($student)
            ->postJson('/api/v1/cart/items', ['course_id' => $course->id])
            ->assertUnprocessable();
    }

    public function test_a_course_can_be_removed_from_the_cart(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => 49.99]);
        $this->actingAs($student)->postJson('/api/v1/cart/items', ['course_id' => $course->id]);

        $response = $this->actingAs($student)->deleteJson("/api/v1/cart/items/{$course->id}");

        $response->assertOk()->assertJsonCount(0, 'data.items');
    }

    public function test_adding_the_same_course_twice_does_not_duplicate(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => 49.99]);

        $this->actingAs($student)->postJson('/api/v1/cart/items', ['course_id' => $course->id]);
        $this->actingAs($student)->postJson('/api/v1/cart/items', ['course_id' => $course->id]);

        $response = $this->actingAs($student)->getJson('/api/v1/cart');
        $response->assertJsonCount(1, 'data.items');
    }
}
