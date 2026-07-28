<?php

namespace Tests\Feature\Instructor;

use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LessonContentSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function instructor(): User
    {
        $user = User::factory()->create();
        $user->assignRole('instructor');

        return $user;
    }

    private function lessonFor(User $instructor): Lesson
    {
        $course = Course::factory()->for($instructor, 'instructor')->create();
        $section = CourseSection::factory()->for($course)->create();

        return Lesson::factory()->for($section, 'section')->create(['type' => 'resource']);
    }

    public function test_an_attachment_with_a_disallowed_file_type_is_rejected(): void
    {
        Storage::fake('local');
        $instructor = $this->instructor();
        $lesson = $this->lessonFor($instructor);

        $this->actingAs($instructor)
            ->postJson("/api/v1/instructor/lessons/{$lesson->id}/attachments", [
                'file' => UploadedFile::fake()->create('payload.php', 10),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);
    }

    public function test_an_attachment_with_an_allowed_file_type_is_stored_on_the_private_disk(): void
    {
        Storage::fake('local');
        $instructor = $this->instructor();
        $lesson = $this->lessonFor($instructor);

        $this->actingAs($instructor)
            ->postJson("/api/v1/instructor/lessons/{$lesson->id}/attachments", [
                'file' => UploadedFile::fake()->create('notes.pdf', 10),
            ])
            ->assertOk();

        $attachment = $lesson->attachments()->firstOrFail();
        $this->assertSame('local', $attachment->disk);
        Storage::disk('local')->assertExists($attachment->path);
    }

    public function test_attachment_url_is_a_signed_route_that_streams_the_file(): void
    {
        Storage::fake('local');
        $instructor = $this->instructor();
        $lesson = $this->lessonFor($instructor);

        $this->actingAs($instructor)
            ->postJson("/api/v1/instructor/lessons/{$lesson->id}/attachments", [
                'file' => UploadedFile::fake()->create('notes.pdf', 10),
            ])
            ->assertOk();

        $attachment = $lesson->attachments()->firstOrFail();

        $this->get($attachment->url())->assertOk();
    }

    public function test_a_tampered_attachment_url_is_rejected(): void
    {
        Storage::fake('local');
        $instructor = $this->instructor();
        $lesson = $this->lessonFor($instructor);

        $this->actingAs($instructor)
            ->postJson("/api/v1/instructor/lessons/{$lesson->id}/attachments", [
                'file' => UploadedFile::fake()->create('notes.pdf', 10),
            ])
            ->assertOk();

        $attachment = $lesson->attachments()->firstOrFail();

        $this->get($attachment->url().'&tampered=1')->assertForbidden();
    }
}
