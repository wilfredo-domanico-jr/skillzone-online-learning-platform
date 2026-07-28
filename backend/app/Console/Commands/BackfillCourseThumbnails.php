<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Course;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Generates a simple placeholder cover image (gradient + title) for any
 * course missing a thumbnail_path. There's no instructor-facing thumbnail
 * upload feature yet, so this is what keeps catalog/course cards from
 * showing a blank slot for demo and newly-created courses.
 */
class BackfillCourseThumbnails extends Command
{
    protected $signature = 'courses:backfill-thumbnails';

    protected $description = 'Generate a placeholder SVG thumbnail for any course missing one';

    /** @var array<int, array{0: string, 1: string}> */
    private const GRADIENTS = [
        ['#4f46e5', '#0f172a'], // indigo -> ink
        ['#0ea5e9', '#0f172a'], // sky -> ink
        ['#8b5cf6', '#0f172a'], // violet -> ink
        ['#f59e0b', '#0f172a'], // amber -> ink
        ['#10b981', '#0f172a'], // emerald -> ink
        ['#ec4899', '#0f172a'], // pink -> ink
    ];

    public function handle(): int
    {
        $courses = Course::whereNull('thumbnail_path')->get();

        foreach ($courses as $course) {
            $path = "course-thumbnails/{$course->id}.svg";
            Storage::disk('public')->put($path, $this->svg($course->title, $course->id));
            $course->forceFill(['thumbnail_path' => $path])->save();
        }

        $this->info("Generated thumbnails for {$courses->count()} course(s).");

        return self::SUCCESS;
    }

    private function svg(string $title, int $seed): string
    {
        [$from, $to] = self::GRADIENTS[$seed % count(self::GRADIENTS)];
        $lines = $this->wrap($title);
        $totalLines = count($lines);

        $textElements = '';
        foreach ($lines as $i => $line) {
            $y = 100 + ($i - ($totalLines - 1) / 2) * 26;
            $textElements .= sprintf(
                '<text x="200" y="%.1F" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="white" text-anchor="middle" opacity="0.95">%s</text>',
                $y,
                htmlspecialchars($line, ENT_XML1)
            );
        }

        return <<<SVG
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">
            <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="{$from}" />
                    <stop offset="100%" stop-color="{$to}" />
                </linearGradient>
            </defs>
            <rect width="400" height="225" fill="url(#g)" />
            {$textElements}
        </svg>
        SVG;
    }

    /**
     * @return array<int, string>
     */
    private function wrap(string $title): array
    {
        $words = explode(' ', $title);
        $lines = [];
        $current = '';

        foreach ($words as $word) {
            $candidate = trim($current.' '.$word);
            if (strlen($candidate) > 22 && $current !== '') {
                $lines[] = $current;
                $current = $word;
            } else {
                $current = $candidate;
            }
        }
        if ($current !== '') {
            $lines[] = $current;
        }

        return array_slice($lines, 0, 3);
    }
}
