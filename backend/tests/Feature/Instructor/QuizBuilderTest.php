<?php

namespace Tests\Feature\Instructor;

use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizBuilderTest extends TestCase
{
    use RefreshDatabase;

    private function instructor(): User
    {
        $user = User::factory()->create();
        $user->assignRole('instructor');

        return $user;
    }

    private function quizLesson(User $instructor): Lesson
    {
        $course = Course::factory()->for($instructor, 'instructor')->create();
        $section = CourseSection::factory()->for($course)->create();

        return Lesson::factory()->for($section, 'section')->create(['type' => 'quiz']);
    }

    public function test_instructor_can_create_quiz_settings(): void
    {
        $instructor = $this->instructor();
        $lesson = $this->quizLesson($instructor);

        $response = $this->actingAs($instructor)->putJson("/api/v1/instructor/lessons/{$lesson->id}/quiz", [
            'passing_score_percent' => 80,
            'max_attempts' => 3,
        ]);

        // 201 on first creation (JsonResource::response() auto-detects
        // wasRecentlyCreated); a repeat PUT to update settings returns 200.
        $response->assertSuccessful()
            ->assertJsonPath('data.passing_score_percent', 80)
            ->assertJsonPath('data.max_attempts', 3);
    }

    public function test_instructor_can_fetch_an_existing_quiz_for_editing(): void
    {
        $instructor = $this->instructor();
        $lesson = $this->quizLesson($instructor);
        $lesson->quiz()->create(['passing_score_percent' => 75]);

        $this->actingAs($instructor)
            ->getJson("/api/v1/instructor/lessons/{$lesson->id}/quiz")
            ->assertOk()
            ->assertJsonPath('data.passing_score_percent', 75);
    }

    public function test_fetching_a_quiz_that_does_not_exist_yet_returns_null(): void
    {
        $instructor = $this->instructor();
        $lesson = $this->quizLesson($instructor);

        $this->actingAs($instructor)
            ->getJson("/api/v1/instructor/lessons/{$lesson->id}/quiz")
            ->assertOk()
            ->assertJsonPath('data', null);
    }

    public function test_instructor_can_add_a_question_with_answers(): void
    {
        $instructor = $this->instructor();
        $lesson = $this->quizLesson($instructor);
        $quiz = $lesson->quiz()->create(['passing_score_percent' => 70]);

        $response = $this->actingAs($instructor)->postJson("/api/v1/instructor/quizzes/{$quiz->id}/questions", [
            'question_text' => 'What is 2 + 2?',
            'type' => 'single_choice',
            'answers' => [
                ['answer_text' => '3', 'is_correct' => false],
                ['answer_text' => '4', 'is_correct' => true],
            ],
        ]);

        $response->assertOk()->assertJsonCount(1, 'data.questions');
        $this->assertDatabaseHas('quiz_questions', ['quiz_id' => $quiz->id, 'question_text' => 'What is 2 + 2?']);
        $this->assertDatabaseHas('quiz_answers', ['answer_text' => '4', 'is_correct' => true]);
    }

    public function test_a_question_requires_at_least_one_correct_answer(): void
    {
        $instructor = $this->instructor();
        $lesson = $this->quizLesson($instructor);
        $quiz = $lesson->quiz()->create(['passing_score_percent' => 70]);

        $this->actingAs($instructor)->postJson("/api/v1/instructor/quizzes/{$quiz->id}/questions", [
            'question_text' => 'Bad question',
            'type' => 'single_choice',
            'answers' => [
                ['answer_text' => 'A', 'is_correct' => false],
                ['answer_text' => 'B', 'is_correct' => false],
            ],
        ])->assertUnprocessable();
    }

    public function test_single_choice_cannot_have_more_than_one_correct_answer(): void
    {
        $instructor = $this->instructor();
        $lesson = $this->quizLesson($instructor);
        $quiz = $lesson->quiz()->create(['passing_score_percent' => 70]);

        $this->actingAs($instructor)->postJson("/api/v1/instructor/quizzes/{$quiz->id}/questions", [
            'question_text' => 'Bad question',
            'type' => 'single_choice',
            'answers' => [
                ['answer_text' => 'A', 'is_correct' => true],
                ['answer_text' => 'B', 'is_correct' => true],
            ],
        ])->assertUnprocessable();
    }

    public function test_another_instructor_cannot_modify_this_quiz(): void
    {
        $owner = $this->instructor();
        $intruder = $this->instructor();
        $lesson = $this->quizLesson($owner);
        $quiz = $lesson->quiz()->create(['passing_score_percent' => 70]);

        $this->actingAs($intruder)->postJson("/api/v1/instructor/quizzes/{$quiz->id}/questions", [
            'question_text' => 'Hijack',
            'type' => 'true_false',
            'answers' => [
                ['answer_text' => 'True', 'is_correct' => true],
                ['answer_text' => 'False', 'is_correct' => false],
            ],
        ])->assertForbidden();
    }

    public function test_a_question_can_be_deleted(): void
    {
        $instructor = $this->instructor();
        $lesson = $this->quizLesson($instructor);
        $quiz = $lesson->quiz()->create(['passing_score_percent' => 70]);
        $question = $quiz->questions()->create(['question_text' => 'Q1', 'type' => 'true_false', 'position' => 0]);
        $question->answers()->createMany([
            ['answer_text' => 'True', 'is_correct' => true, 'position' => 0],
            ['answer_text' => 'False', 'is_correct' => false, 'position' => 1],
        ]);

        $response = $this->actingAs($instructor)->deleteJson("/api/v1/instructor/questions/{$question->id}");

        $response->assertOk()->assertJsonCount(0, 'data.questions');
    }
}
