<?php

declare(strict_types=1);

namespace App\Enums;

enum InstructorApplicationStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
}
