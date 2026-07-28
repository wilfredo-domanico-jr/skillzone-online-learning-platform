<?php

declare(strict_types=1);

namespace App\Enums;

enum LessonType: string
{
    case Video = 'video';
    case Article = 'article';
    case Quiz = 'quiz';
    case Resource = 'resource';
}
