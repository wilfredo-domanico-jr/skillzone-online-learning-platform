<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayoutResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'period_start' => $this->period_start,
            'period_end' => $this->period_end,
            'gross_amount' => (float) $this->gross_amount,
            'platform_fee_amount' => (float) $this->platform_fee_amount,
            'net_amount' => (float) $this->net_amount,
            'status' => $this->status,
            'paid_at' => $this->paid_at,
            'notes' => $this->notes,
            'instructor' => $this->whenLoaded('instructor', fn () => [
                'id' => $this->instructor->id,
                'name' => $this->instructor->name,
            ]),
        ];
    }
}
