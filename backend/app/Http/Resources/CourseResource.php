<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CourseResource extends JsonResource
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
            'title' => $this->title,
            'slug' => $this->slug,
            'subtitle' => $this->subtitle,
            'description' => $this->description,
            'thumbnail_url' => $this->thumbnail_path ? Storage::disk('public')->url($this->thumbnail_path) : null,
            'price' => (float) $this->price,
            'average_rating' => $this->average_rating ? (float) $this->average_rating : null,
            'reviews_count' => $this->reviews_count,
            'status' => $this->status->value,
            'level' => $this->level->value,
            'language' => $this->language,
            'requirements' => $this->requirements,
            'what_you_will_learn' => $this->what_you_will_learn,
            'published_at' => $this->published_at,
            'rejection_reason' => $this->when(
                $request->user()?->can('view', $this->resource) ?? false,
                $this->rejection_reason
            ),
            'instructor' => $this->whenLoaded('instructor', fn () => [
                'id' => $this->instructor->id,
                'name' => $this->instructor->name,
            ]),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'sections' => CourseSectionResource::collection($this->whenLoaded('sections')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
