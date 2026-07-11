<?php

namespace App\Notifications;

use App\Models\Course;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class CourseDecided extends Notification
{
    use Queueable;

    public function __construct(private readonly Course $course)
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
        $approved = $this->course->status->value === 'published';

        return [
            'type' => 'course_decided',
            'course_id' => $this->course->id,
            'course_title' => $this->course->title,
            'message' => $approved
                ? "Your course \"{$this->course->title}\" was approved and is now published."
                : "Your course \"{$this->course->title}\" was rejected".($this->course->rejection_reason ? ': '.$this->course->rejection_reason : '.'),
            'approved' => $approved,
        ];
    }
}
