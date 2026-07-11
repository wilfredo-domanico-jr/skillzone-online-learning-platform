<?php

namespace App\Notifications;

use App\Models\Enrollment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewEnrollment extends Notification
{
    use Queueable;

    public function __construct(private readonly Enrollment $enrollment)
    {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_enrollment',
            'course_id' => $this->enrollment->course_id,
            'message' => "{$this->enrollment->user->name} enrolled in \"{$this->enrollment->course->title}\".",
        ];
    }
}
