<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\LessonAttachment;
use App\Models\LessonVideoDetail;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Serves lesson video/attachment files via short-lived signed URLs instead of
 * a permanent public disk link. The `signed` route middleware is the access
 * control here — a URL is only ever handed out by LessonVideoDetail::url()/
 * LessonAttachment::url() to a viewer LessonResource already deemed
 * authorized, and it expires instead of granting indefinite access if it
 * leaks (view-source, shared link, browser history).
 */
class LessonContentStreamController extends Controller
{
    public function video(LessonVideoDetail $videoDetail): StreamedResponse
    {
        return Storage::disk($videoDetail->disk)->response($videoDetail->path);
    }

    public function attachment(LessonAttachment $attachment): StreamedResponse
    {
        return Storage::disk($attachment->disk)->response($attachment->path, $attachment->file_name);
    }
}
