<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizAttemptResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quiz_id' => $this->quiz_id,
            'score_percent' => $this->score_percent,
            'passed' => $this->passed,
            'started_at' => $this->started_at,
            'submitted_at' => $this->submitted_at,
            'answers' => $this->whenLoaded('answers', fn () => $this->answers->map(fn ($answer) => [
                'question_id' => $answer->question_id,
                'selected_answer_ids' => $answer->selected_answer_ids,
                'is_correct' => $answer->is_correct,
                'correct_answer_ids' => $this->when(
                    $this->submitted_at !== null,
                    fn () => $answer->question->correctAnswerIds()
                ),
            ])),
        ];
    }
}
