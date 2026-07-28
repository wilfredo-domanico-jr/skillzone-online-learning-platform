<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\URL;

class LessonVideoDetail extends Model
{
    protected $fillable = ['lesson_id', 'disk', 'path', 'duration_seconds', 'captions_path'];

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
        return URL::temporarySignedRoute('lessons.video.stream', now()->addHours(4), ['videoDetail' => $this->id]);
    }
}
