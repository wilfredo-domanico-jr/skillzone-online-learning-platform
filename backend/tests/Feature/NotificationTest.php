<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_new_free_enrollment_notifies_the_instructor(): void
    {
        $instructor = User::factory()->create();
        $course = Course::factory()->published()->create(['instructor_id' => $instructor->id, 'price' => 0]);
        $student = User::factory()->create();

        $this->actingAs($student)->postJson("/api/v1/courses/{$course->slug}/enroll")->assertCreated();

        $this->assertSame(1, $instructor->notifications()->count());
        $this->assertSame('new_enrollment', $instructor->notifications()->first()->data['type']);
    }

    public function test_a_user_can_list_their_notifications_with_unread_count(): void
    {
        $instructor = User::factory()->create();
        $course = Course::factory()->published()->create(['instructor_id' => $instructor->id, 'price' => 0]);
        $student = User::factory()->create();
        $this->actingAs($student)->postJson("/api/v1/courses/{$course->slug}/enroll");

        $response = $this->actingAs($instructor)->getJson('/api/v1/notifications');

        $response->assertOk()->assertJsonPath('unread_count', 1)->assertJsonCount(1, 'data');
    }

    public function test_a_user_can_mark_a_single_notification_read(): void
    {
        $instructor = User::factory()->create();
        $course = Course::factory()->published()->create(['instructor_id' => $instructor->id, 'price' => 0]);
        $student = User::factory()->create();
        $this->actingAs($student)->postJson("/api/v1/courses/{$course->slug}/enroll");
        $notificationId = $instructor->notifications()->first()->id;

        $response = $this->actingAs($instructor)->postJson("/api/v1/notifications/{$notificationId}/read");

        $response->assertOk();
        $this->assertNotNull($instructor->notifications()->first()->fresh()->read_at);
    }

    public function test_a_user_can_mark_all_notifications_read(): void
    {
        $instructor = User::factory()->create();
        $courseA = Course::factory()->published()->create(['instructor_id' => $instructor->id, 'price' => 0]);
        $courseB = Course::factory()->published()->create(['instructor_id' => $instructor->id, 'price' => 0]);
        $student = User::factory()->create();
        $this->actingAs($student)->postJson("/api/v1/courses/{$courseA->slug}/enroll");
        $this->actingAs($student)->postJson("/api/v1/courses/{$courseB->slug}/enroll");

        $response = $this->actingAs($instructor)->postJson('/api/v1/notifications/read-all');

        $response->assertOk();
        $this->assertSame(0, $instructor->unreadNotifications()->count());
    }

    public function test_a_user_cannot_mark_someone_elses_notification_read(): void
    {
        $instructor = User::factory()->create();
        $course = Course::factory()->published()->create(['instructor_id' => $instructor->id, 'price' => 0]);
        $student = User::factory()->create();
        $this->actingAs($student)->postJson("/api/v1/courses/{$course->slug}/enroll");
        $notificationId = $instructor->notifications()->first()->id;

        $intruder = User::factory()->create();

        $this->actingAs($intruder)
            ->postJson("/api/v1/notifications/{$notificationId}/read")
            ->assertNotFound();
    }
}
