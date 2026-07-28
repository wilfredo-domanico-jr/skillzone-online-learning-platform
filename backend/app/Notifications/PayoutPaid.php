<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\InstructorPayout;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PayoutPaid extends Notification
{
    use Queueable;

    public function __construct(private readonly InstructorPayout $payout)
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
            'type' => 'payout_paid',
            'payout_id' => $this->payout->id,
            'message' => "Your payout of \${$this->payout->net_amount} for {$this->payout->period_start->format('M j')}–{$this->payout->period_end->format('M j, Y')} has been paid.",
        ];
    }
}
