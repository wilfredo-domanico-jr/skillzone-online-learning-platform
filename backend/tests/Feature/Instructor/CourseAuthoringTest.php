<?php

namespace Tests\Feature\Instructor;

use App\Models\Course;
use App\Models\CourseSection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CourseAuthoringTest extends TestCase
{
    use RefreshDatabase;

    private function instructor(): User
    {
        $user = User::factory()->create();
        $user->assignRole('instructor');

        return $user;
    }

    public function test_a_student_cannot_create_a_course(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');

        $this->actingAs($student)
            ->postJson('/api/v1/instructor/courses', ['title' => 'Learn PHP'])
            ->assertForbidden();
    }

    public function test_an_instructor_can_create_a_draft_course(): void
    {
        $instructor = $this->instructor();

        $response = $this->actingAs($instructor)->postJson('/api/v1/instructor/courses', [
            'title' => 'Learn PHP the Right Way',
            'price' => 49.99,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.title', 'Learn PHP the Right Way')
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.slug', 'learn-php-the-right-way');
    }

    public function test_an_instructor_cannot_update_another_instructors_course(): void
    {
        $owner = $this->instructor();
        $intruder = $this->instructor();
        $course = Course::factory()->for($owner, 'instructor')->create();

        $this->actingAs($intruder)
            ->putJson("/api/v1/instructor/courses/{$course->id}", ['title' => 'Hijacked'])
            ->assertForbidden();
    }

    public function test_an_instructor_can_build_curriculum_and_reorder_lessons(): void
    {
        $instructor = $this->instructor();
        $course = Course::factory()->for($instructor, 'instructor')->create();

        $section = $this->actingAs($instructor)
            ->postJson("/api/v1/instructor/courses/{$course->id}/sections", ['title' => 'Getting Started'])
            ->assertCreated()
            ->json('data');

        $lessonOne = $this->actingAs($instructor)
            ->postJson("/api/v1/instructor/sections/{$section['id']}/lessons", [
                'title' => 'Welcome',
                'type' => 'article',
            ])->assertCreated()->json('data');

        $lessonTwo = $this->actingAs($instructor)
            ->postJson("/api/v1/instructor/sections/{$section['id']}/lessons", [
                'title' => 'Setup',
                'type' => 'article',
            ])->assertCreated()->json('data');

        $this->actingAs($instructor)
            ->putJson("/api/v1/instructor/lessons/{$lessonOne['id']}/article", [
                'body_html' => '<p>Welcome to the course!</p>',
            ])->assertOk();

        // Reverse the order: lessonTwo should now be position 0.
        $this->actingAs($instructor)
            ->postJson("/api/v1/instructor/sections/{$section['id']}/lessons/reorder", [
                'lesson_ids' => [$lessonTwo['id'], $lessonOne['id']],
            ])->assertOk();

        $this->assertSame(0, \App\Models\Lesson::find($lessonTwo['id'])->position);
        $this->assertSame(1, \App\Models\Lesson::find($lessonOne['id'])->position);
    }

    public function test_an_instructor_can_filter_their_courses_by_status(): void
    {
        $instructor = $this->instructor();
        Course::factory()->for($instructor, 'instructor')->create(['title' => 'Draft Course']);
        Course::factory()->for($instructor, 'instructor')->published()->create(['title' => 'Live Course']);

        $response = $this->actingAs($instructor)
            ->getJson('/api/v1/instructor/courses?status=published')
            ->assertOk();

        $response->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Live Course');
    }

    public function test_an_instructor_can_search_their_courses_by_title(): void
    {
        $instructor = $this->instructor();
        Course::factory()->for($instructor, 'instructor')->create(['title' => 'Mastering Laravel']);
        Course::factory()->for($instructor, 'instructor')->create(['title' => 'Intro to Design']);

        $response = $this->actingAs($instructor)
            ->getJson('/api/v1/instructor/courses?search=laravel')
            ->assertOk();

        $response->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Mastering Laravel');
    }

    public function test_an_instructor_can_upload_a_course_thumbnail(): void
    {
        Storage::fake('public');
        $instructor = $this->instructor();
        $course = Course::factory()->for($instructor, 'instructor')->create();

        $response = $this->actingAs($instructor)
            ->postJson("/api/v1/instructor/courses/{$course->id}/thumbnail", [
                'thumbnail' => UploadedFile::fake()->image('cover.jpg'),
            ])
            ->assertOk();

        $path = $response->json('data.thumbnail_url');
        $this->assertNotNull($path);
        Storage::disk('public')->assertExists($course->fresh()->thumbnail_path);
    }

    public function test_uploading_a_thumbnail_replaces_the_previous_file(): void
    {
        Storage::fake('public');
        $instructor = $this->instructor();
        $course = Course::factory()->for($instructor, 'instructor')->create();

        $this->actingAs($instructor)->postJson("/api/v1/instructor/courses/{$course->id}/thumbnail", [
            'thumbnail' => UploadedFile::fake()->image('first.jpg'),
        ])->assertOk();
        $firstPath = $course->fresh()->thumbnail_path;

        $this->actingAs($instructor)->postJson("/api/v1/instructor/courses/{$course->id}/thumbnail", [
            'thumbnail' => UploadedFile::fake()->image('second.jpg'),
        ])->assertOk();

        Storage::disk('public')->assertMissing($firstPath);
        Storage::disk('public')->assertExists($course->fresh()->thumbnail_path);
    }

    public function test_an_instructor_cannot_upload_a_thumbnail_for_another_instructors_course(): void
    {
        $owner = $this->instructor();
        $intruder = $this->instructor();
        $course = Course::factory()->for($owner, 'instructor')->create();

        $this->actingAs($intruder)
            ->postJson("/api/v1/instructor/courses/{$course->id}/thumbnail", [
                'thumbnail' => UploadedFile::fake()->image('cover.jpg'),
            ])
            ->assertForbidden();
    }

    public function test_thumbnail_upload_rejects_non_image_files(): void
    {
        $instructor = $this->instructor();
        $course = Course::factory()->for($instructor, 'instructor')->create();

        $this->actingAs($instructor)
            ->postJson("/api/v1/instructor/courses/{$course->id}/thumbnail", [
                'thumbnail' => UploadedFile::fake()->create('malware.exe', 10),
            ])
            ->assertUnprocessable();
    }

    public function test_submitting_for_review_requires_at_least_one_lesson(): void
    {
        $instructor = $this->instructor();
        $course = Course::factory()->for($instructor, 'instructor')->create();

        $this->actingAs($instructor)
            ->postJson("/api/v1/instructor/courses/{$course->id}/submit-for-review")
            ->assertUnprocessable();

        CourseSection::factory()->for($course)->has(\App\Models\Lesson::factory())->create();

        $this->actingAs($instructor)
            ->postJson("/api/v1/instructor/courses/{$course->id}/submit-for-review")
            ->assertOk()
            ->assertJsonPath('data.status', 'pending_review');
    }
}
