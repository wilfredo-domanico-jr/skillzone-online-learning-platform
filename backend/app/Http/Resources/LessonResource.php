<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class LessonResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Full lesson content (video/article/attachments) is only sent when the
        // requester owns the course (or is an admin), is enrolled, or the
        // lesson is a free preview — set by the controller via a request
        // attribute so nested resources don't need to re-derive course
        // ownership/enrollment per lesson.
        $canViewContent = $this->is_previewable || $request->attributes->get('can_view_locked_lesson_content', false);
        $progress = $request->attributes->get('lesson_progress_map')?->get($this->id);

        return [
            'id' => $this->id,
            'section_id' => $this->section_id,
            'title' => $this->title,
            'type' => $this->type->value,
            'position' => $this->position,
            'is_previewable' => $this->is_previewable,
            'duration_seconds' => $this->duration_seconds,
            'locked' => ! $canViewContent,
            'completed' => $progress['completed'] ?? false,
            'last_position_seconds' => $progress['last_position_seconds'] ?? null,
            'video' => $this->when($canViewContent, fn () => $this->videoDetail ? [
                'url' => $this->videoDetail->url(),
                'duration_seconds' => $this->videoDetail->duration_seconds,
                'captions_url' => $this->videoDetail->captions_path
                    ? Storage::disk($this->videoDetail->disk)->url($this->videoDetail->captions_path)
                    : null,
            ] : null),
            'article' => $this->when($canViewContent, fn () => $this->article ? [
                'body_html' => $this->article->body_html,
            ] : null),
            'attachments' => $this->when($canViewContent, fn () => $this->attachments->map(fn ($attachment) => [
                'id' => $attachment->id,
                'file_name' => $attachment->file_name,
                'file_size' => $attachment->file_size,
                'mime_type' => $attachment->mime_type,
                'url' => $attachment->url(),
            ])),
        ];
    }
}
