<?php

namespace Tests\Feature;

use App\Enums\EnrollmentSource;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizAttemptTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A published course with a quiz lesson containing:
     * - Q1 single_choice "2+2": correct = "4"
     * - Q2 true_false "Sky is blue": correct = "True"
     * - Q3 multiple_choice "Pick primes": correct = {2, 3}
     */
    private function courseWithQuiz(): array
    {
        $course = Course::factory()->published()->create();
        $section = CourseSection::factory()->for($course)->create();
        $lesson = Lesson::factory()->for($section, 'section')->create(['type' => 'quiz']);
        $quiz = $lesson->quiz()->create(['passing_score_percent' => 70]);

        $q1 = $quiz->questions()->create(['question_text' => '2+2?', 'type' => 'single_choice', 'position' => 0, 'points' => 1]);
        $q1Answers = $q1->answers()->createMany([
            ['answer_text' => '3', 'is_correct' => false, 'position' => 0],
            ['answer_text' => '4', 'is_correct' => true, 'position' => 1],
        ]);

        $q2 = $quiz->questions()->create(['question_text' => 'Sky is blue?', 'type' => 'true_false', 'position' => 1, 'points' => 1]);
        $q2Answers = $q2->answers()->createMany([
            ['answer_text' => 'True', 'is_correct' => true, 'position' => 0],
            ['answer_text' => 'False', 'is_correct' => false, 'position' => 1],
        ]);

        $q3 = $quiz->questions()->create(['question_text' => 'Pick primes', 'type' => 'multiple_choice', 'position' => 2, 'points' => 1]);
        $q3Answers = $q3->answers()->createMany([
            ['answer_text' => '2', 'is_correct' => true, 'position' => 0],
            ['answer_text' => '3', 'is_correct' => true, 'position' => 1],
            ['answer_text' => '4', 'is_correct' => false, 'position' => 2],
        ]);

        return [$course, $lesson, $quiz, $q1, $q1Answers, $q2, $q2Answers, $q3, $q3Answers];
    }

    private function enroll(User $user, Course $course): void
    {
        $user->enrollments()->create([
            'course_id' => $course->id,
            'source' => EnrollmentSource::Free,
            'enrolled_at' => now(),
        ]);
    }

    public function test_a_non_enrolled_user_cannot_start_an_attempt(): void
    {
        [$course, $lesson] = $this->courseWithQuiz();
        $student = User::factory()->create();

        $this->actingAs($student)
            ->postJson("/api/v1/lessons/{$lesson->id}/quiz/attempts")
            ->assertUnprocessable();
    }

    public function test_correct_answers_are_hidden_before_submission(): void
    {
        [$course, $lesson] = $this->courseWithQuiz();
        $student = User::factory()->create();
        $this->enroll($student, $course);

        $response = $this->actingAs($student)->getJson("/api/v1/lessons/{$lesson->id}/quiz");

        $response->assertOk();
        $firstAnswer = $response->json('quiz.questions.0.answers.0');
        $this->assertNull($firstAnswer['is_correct']);
    }

    public function test_a_perfect_attempt_passes_and_completes_the_lesson(): void
    {
        [$course, $lesson, $quiz, $q1, $q1Answers, $q2, $q2Answers, $q3, $q3Answers] = $this->courseWithQuiz();
        $student = User::factory()->create();
        $this->enroll($student, $course);

        $attempt = $this->actingAs($student)
            ->postJson("/api/v1/lessons/{$lesson->id}/quiz/attempts")
            ->json('data');

        $correctQ1 = $q1Answers->firstWhere('is_correct', true)->id;
        $correctQ2 = $q2Answers->firstWhere('is_correct', true)->id;
        $correctQ3Ids = $q3Answers->where('is_correct', true)->pluck('id')->values()->all();

        $response = $this->actingAs($student)->postJson("/api/v1/quiz-attempts/{$attempt['id']}/submit", [
            'answers' => [
                ['question_id' => $q1->id, 'answer_ids' => [$correctQ1]],
                ['question_id' => $q2->id, 'answer_ids' => [$correctQ2]],
                ['question_id' => $q3->id, 'answer_ids' => $correctQ3Ids],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.score_percent', 100)
            ->assertJsonPath('data.passed', true);

        $this->assertDatabaseHas('lesson_progress', ['lesson_id' => $lesson->id]);
        $this->assertNotNull(\App\Models\LessonProgress::where('lesson_id', $lesson->id)->first()->completed_at);

        $enrollment = $student->enrollments()->where('course_id', $course->id)->first();
        $this->assertSame(100, $enrollment->progress_percent);
    }

    public function test_a_failing_attempt_does_not_complete_the_lesson(): void
    {
        [$course, $lesson, $quiz, $q1, $q1Answers, $q2, $q2Answers, $q3, $q3Answers] = $this->courseWithQuiz();
        $student = User::factory()->create();
        $this->enroll($student, $course);

        $attempt = $this->actingAs($student)
            ->postJson("/api/v1/lessons/{$lesson->id}/quiz/attempts")
            ->json('data');

        // Get only Q1 right (1/3 = 33%, below the 70% passing bar).
        $wrongQ1 = $q1Answers->firstWhere('is_correct', false)->id;

        $response = $this->actingAs($student)->postJson("/api/v1/quiz-attempts/{$attempt['id']}/submit", [
            'answers' => [
                ['question_id' => $q1->id, 'answer_ids' => [$wrongQ1]],
                ['question_id' => $q2->id, 'answer_ids' => [$q2Answers->firstWhere('is_correct', true)->id]],
                ['question_id' => $q3->id, 'answer_ids' => []],
            ],
        ]);

        $response->assertOk()->assertJsonPath('data.passed', false);
        $this->assertDatabaseMissing('lesson_progress', ['lesson_id' => $lesson->id]);
    }

    public function test_max_attempts_is_enforced(): void
    {
        [$course, $lesson, $quiz] = $this->courseWithQuiz();
        $quiz->update(['max_attempts' => 1]);
        $student = User::factory()->create();
        $this->enroll($student, $course);

        $this->actingAs($student)->postJson("/api/v1/lessons/{$lesson->id}/quiz/attempts")->assertCreated();

        $this->actingAs($student)
            ->postJson("/api/v1/lessons/{$lesson->id}/quiz/attempts")
            ->assertUnprocessable();
    }

    public function test_an_attempt_cannot_be_submitted_twice(): void
    {
        [$course, $lesson, $quiz, $q1, $q1Answers, $q2, $q2Answers, $q3, $q3Answers] = $this->courseWithQuiz();
        $student = User::factory()->create();
        $this->enroll($student, $course);

        $attempt = $this->actingAs($student)
            ->postJson("/api/v1/lessons/{$lesson->id}/quiz/attempts")
            ->json('data');

        $payload = ['answers' => [
            ['question_id' => $q1->id, 'answer_ids' => [$q1Answers->firstWhere('is_correct', true)->id]],
            ['question_id' => $q2->id, 'answer_ids' => [$q2Answers->firstWhere('is_correct', true)->id]],
            ['question_id' => $q3->id, 'answer_ids' => $q3Answers->where('is_correct', true)->pluck('id')->values()->all()],
        ]];

        $this->actingAs($student)->postJson("/api/v1/quiz-attempts/{$attempt['id']}/submit", $payload)->assertOk();
        $this->actingAs($student)->postJson("/api/v1/quiz-attempts/{$attempt['id']}/submit", $payload)->assertUnprocessable();
    }
}
