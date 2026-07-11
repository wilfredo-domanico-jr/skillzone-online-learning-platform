<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Correct answers are only revealed to the instructor building the
        // quiz or a student reviewing an already-submitted attempt — set by
        // the controller via a request attribute, same pattern as
        // LessonResource's can_view_locked_lesson_content.
        $canViewCorrectAnswers = $request->attributes->get('can_view_correct_answers', false);

        return [
            'id' => $this->id,
            'lesson_id' => $this->lesson_id,
            'passing_score_percent' => $this->passing_score_percent,
            'max_attempts' => $this->max_attempts,
            'time_limit_minutes' => $this->time_limit_minutes,
            'questions' => $this->whenLoaded('questions', fn () => $this->questions->map(fn ($question) => [
                'id' => $question->id,
                'question_text' => $question->question_text,
                'type' => $question->type->value,
                'position' => $question->position,
                'points' => $question->points,
                'answers' => $question->answers->map(fn ($answer) => [
                    'id' => $answer->id,
                    'answer_text' => $answer->answer_text,
                    'is_correct' => $canViewCorrectAnswers ? $answer->is_correct : null,
                ]),
            ])),
        ];
    }
}
