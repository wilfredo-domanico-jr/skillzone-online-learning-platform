<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\EnrollmentSource;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enrollment extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'course_id', 'source', 'enrolled_at', 'completed_at', 'progress_percent'];

    protected function casts(): array
    {
        return [
            'source' => EnrollmentSource::class,
            'enrolled_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function lessonProgress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    /**
     * Recompute progress_percent from completed lessons vs. the course's total
     * lesson count, and stamp completed_at the first time it reaches 100%.
     */
    public function recalculateProgress(): void
    {
        $totalLessons = Lesson::whereHas('section', fn ($q) => $q->where('course_id', $this->course_id))->count();
        $completedLessons = $this->lessonProgress()->whereNotNull('completed_at')->count();

        $percent = $totalLessons > 0 ? (int) round(($completedLessons / $totalLessons) * 100) : 0;

        $this->update([
            'progress_percent' => $percent,
            'completed_at' => $percent === 100 ? ($this->completed_at ?? now()) : null,
        ]);
    }
}
