<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Enums\LessonType;
use App\Http\Controllers\Controller;
use App\Http\Resources\LessonResource;
use App\Models\Lesson;
use App\Models\LessonAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LessonContentController extends Controller
{
    /**
     * Upload/replace the video file for a video-type lesson.
     *
     * Direct upload through the API for now — swapping to S3 presigned PUT
     * URLs (so large files don't proxy through PHP) is a later hardening step.
     */
    public function uploadVideo(Request $request, Lesson $lesson): JsonResponse
    {
        $this->authorize('update', $lesson->section->course);
        $this->ensureType($lesson, LessonType::Video);

        $request->validate([
            'video' => ['required', 'file', 'mimetypes:video/mp4,video/webm,video/quicktime', 'max:512000'],
        ]);

        $path = $request->file('video')->store('lessons/'.$lesson->id.'/video', 'local');

        $lesson->videoDetail()->updateOrCreate([], [
            'disk' => 'local',
            'path' => $path,
        ]);

        return $this->respond($request, $lesson);
    }

    /**
     * Create/replace the rich-text body for an article-type lesson.
     */
    public function updateArticle(Request $request, Lesson $lesson): JsonResponse
    {
        $this->authorize('update', $lesson->section->course);
        $this->ensureType($lesson, LessonType::Article);

        $data = $request->validate([
            'body_html' => ['required', 'string'],
        ]);

        $lesson->article()->updateOrCreate([], $data);

        return $this->respond($request, $lesson);
    }

    /**
     * Attach a downloadable file to a lesson (any lesson type).
     */
    public function storeAttachment(Request $request, Lesson $lesson): JsonResponse
    {
        $this->authorize('update', $lesson->section->course);

        $request->validate([
            // Whitelisted by both extension and detected MIME type — an
            // unrestricted upload here would land on a webroot-reachable
            // disk (see LessonContentStreamController for how content is
            // now actually served), so this list is the only thing standing
            // between an instructor account and uploading an executable file.
            'file' => ['required', 'file', 'max:51200', 'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,zip,txt,png,jpg,jpeg'],
        ]);

        $file = $request->file('file');
        $path = $file->store('lessons/'.$lesson->id.'/attachments', 'local');

        $lesson->attachments()->create([
            'file_name' => $file->getClientOriginalName(),
            'disk' => 'local',
            'path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ]);

        return $this->respond($request, $lesson);
    }

    public function destroyAttachment(Request $request, LessonAttachment $attachment): JsonResponse
    {
        $lesson = $attachment->lesson;
        $this->authorize('update', $lesson->section->course);

        $attachment->delete();

        return $this->respond($request, $lesson);
    }

    private function ensureType(Lesson $lesson, LessonType $expected): void
    {
        if ($lesson->type !== $expected) {
            throw ValidationException::withMessages([
                'type' => "This lesson is not a {$expected->value} lesson.",
            ]);
        }
    }

    private function respond(Request $request, Lesson $lesson): JsonResponse
    {
        $request->attributes->set('can_view_locked_lesson_content', true);

        return (new LessonResource($lesson->fresh(['videoDetail', 'article', 'attachments'])))->response();
    }
}
