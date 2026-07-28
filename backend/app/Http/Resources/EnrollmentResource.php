<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnrollmentResource extends JsonResource
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
            'source' => $this->source->value,
            'enrolled_at' => $this->enrolled_at,
            'completed_at' => $this->completed_at,
            'progress_percent' => $this->progress_percent,
            'course' => new CourseResource($this->whenLoaded('course')),
        ];
    }
}
