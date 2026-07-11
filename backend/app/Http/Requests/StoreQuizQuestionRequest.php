<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreQuizQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'question_text' => ['required', 'string', 'max:2000'],
            'type' => ['required', 'in:single_choice,multiple_choice,true_false'],
            'points' => ['nullable', 'integer', 'min:1'],
            'answers' => ['required', 'array', 'min:2'],
            'answers.*.answer_text' => ['required', 'string', 'max:255'],
            'answers.*.is_correct' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $answers = $this->input('answers', []);
            $correctCount = count(array_filter($answers, fn ($a) => ! empty($a['is_correct'])));

            if ($correctCount === 0) {
                $validator->errors()->add('answers', 'At least one answer must be marked correct.');

                return;
            }

            if ($this->input('type') === 'single_choice' && $correctCount > 1) {
                $validator->errors()->add('answers', 'Single-choice questions can only have one correct answer.');
            }

            if ($this->input('type') === 'true_false' && count($answers) !== 2) {
                $validator->errors()->add('answers', 'True/false questions must have exactly two answers.');
            }
        });
    }
}
