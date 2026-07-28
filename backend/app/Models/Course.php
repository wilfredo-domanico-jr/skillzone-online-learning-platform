<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CourseLevel;
use App\Enums\CourseStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class Course extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Deliberately excludes status/published_at/rejection_reason/
     * average_rating/reviews_count — those are system-managed (moderation
     * decisions, cached rating stats), never user input. They're written via
     * forceFill() at the specific call sites that own that decision, not
     * through mass assignment.
     */
    protected $fillable = [
        'instructor_id',
        'category_id',
        'title',
        'slug',
        'subtitle',
        'description',
        'thumbnail_path',
        'promo_video_path',
        'price',
        'level',
        'language',
        'requirements',
        'what_you_will_learn',
    ];

    protected function casts(): array
    {
        return [
            'status' => CourseStatus::class,
            'level' => CourseLevel::class,
            'price' => 'decimal:2',
            'requirements' => 'array',
            'what_you_will_learn' => 'array',
            'published_at' => 'datetime',
            'average_rating' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Course $course) {
            if (! $course->slug) {
                $course->slug = static::uniqueSlugFor($course->title);
            }
        });
    }

    public static function uniqueSlugFor(string $title): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $suffix = 1;

        while (static::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(CourseSection::class)->orderBy('position');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', CourseStatus::Published);
    }

    /**
     * Recompute the cached average_rating/reviews_count from the reviews
     * table. Called from Review's saved/deleted model events rather than on
     * every catalog read, since ratings change far less often than they're
     * displayed.
     */
    public function recalculateRating(): void
    {
        $this->forceFill([
            'reviews_count' => $this->reviews()->count(),
            'average_rating' => $this->reviews()->avg('rating'),
        ])->save();
    }
}
