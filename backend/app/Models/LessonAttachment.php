<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\URL;

/**
 * Maps to the `lesson_resources` table — named Attachment on the PHP side to
 * avoid colliding with Laravel's own JsonResource-suffixed classes.
 */
class LessonAttachment extends Model
{
    protected $table = 'lesson_resources';

    protected $fillable = ['lesson_id', 'file_name', 'disk', 'path', 'file_size', 'mime_type'];

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * A short-lived signed URL rather than a permanent public disk link —
     * see LessonContentStreamController for why.
     */
    public function url(): string
    {
        return URL::temporarySignedRoute('lessons.attachments.download', now()->addHours(4), ['attachment' => $this->id]);
    }
}
