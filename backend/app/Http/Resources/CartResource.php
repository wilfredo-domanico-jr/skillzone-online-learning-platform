<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $items = $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
            'id' => $item->id,
            'course' => [
                'id' => $item->course->id,
                'title' => $item->course->title,
                'slug' => $item->course->slug,
                'price' => (float) $item->course->price,
                'thumbnail_url' => $item->course->thumbnail_path
                    ? \Illuminate\Support\Facades\Storage::disk('public')->url($item->course->thumbnail_path)
                    : null,
            ],
        ]));

        return [
            'id' => $this->id,
            'items' => $items,
            // Prices are looked up live from courses.price (not stored on the
            // cart item) since a cart is ephemeral pre-checkout — the actual
            // charged price is only locked in at order creation.
            'subtotal' => $this->when(
                $this->relationLoaded('items'),
                fn () => round($this->items->sum(fn ($item) => (float) $item->course->price), 2)
            ),
        ];
    }
}
