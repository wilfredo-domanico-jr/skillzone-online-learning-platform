<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_only_see_published_courses_in_the_catalog(): void
    {
        Course::factory()->published()->create(['title' => 'Published Course']);
        Course::factory()->create(['title' => 'Draft Course']);

        $response = $this->getJson('/api/v1/courses')->assertOk();

        $titles = collect($response->json('data'))->pluck('title');
        $this->assertTrue($titles->contains('Published Course'));
        $this->assertFalse($titles->contains('Draft Course'));
    }

    public function test_guest_gets_404_for_an_unpublished_course_detail_page(): void
    {
        $course = Course::factory()->create();

        $this->getJson("/api/v1/courses/{$course->slug}")->assertNotFound();
    }

    public function test_owner_can_preview_their_own_unpublished_course(): void
    {
        $instructor = User::factory()->create();
        $instructor->assignRole('instructor');
        $course = Course::factory()->for($instructor, 'instructor')->create();

        $this->actingAs($instructor)
            ->getJson("/api/v1/courses/{$course->slug}")
            ->assertOk()
            ->assertJsonPath('data.id', $course->id);
    }

    public function test_catalog_can_be_sorted_by_rating(): void
    {
        Course::factory()->published()->create(['title' => 'Low Rated', 'average_rating' => 3.0, 'reviews_count' => 2]);
        Course::factory()->published()->create(['title' => 'High Rated', 'average_rating' => 4.8, 'reviews_count' => 10]);

        $response = $this->getJson('/api/v1/courses?sort=rating')->assertOk();

        $titles = collect($response->json('data'))->pluck('title');
        $this->assertSame(['High Rated', 'Low Rated'], $titles->all());
    }

    public function test_curriculum_locks_non_previewable_lesson_content_for_guests(): void
    {
        $course = Course::factory()->published()->create();
        $section = $course->sections()->create(['title' => 'Section 1', 'position' => 0]);
        $lesson = $section->lessons()->create([
            'title' => 'Intro',
            'type' => 'article',
            'position' => 0,
            'is_previewable' => false,
        ]);
        $lesson->article()->create(['body_html' => '<p>Secret content</p>']);

        $response = $this->getJson("/api/v1/courses/{$course->slug}/curriculum")->assertOk();

        $lessonData = collect($response->json('data.sections.0.lessons'))->firstWhere('id', $lesson->id);
        $this->assertTrue($lessonData['locked']);
        $this->assertArrayNotHasKey('article', $lessonData);
    }
}
