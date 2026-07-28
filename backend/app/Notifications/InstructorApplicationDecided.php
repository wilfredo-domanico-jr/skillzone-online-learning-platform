<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\InstructorApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class InstructorApplicationDecided extends Notification
{
    use Queueable;

    public function __construct(private readonly InstructorApplication $application)
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
        $approved = $this->application->status->value === 'approved';

        return [
            'type' => 'instructor_application_decided',
            'message' => $approved
                ? 'Your instructor application was approved — you can now create courses.'
                : 'Your instructor application was rejected'.($this->application->rejection_reason ? ': '.$this->application->rejection_reason : '.'),
            'approved' => $approved,
        ];
    }
}
