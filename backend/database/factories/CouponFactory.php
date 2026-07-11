<?php

namespace Database\Factories;

use App\Enums\CouponType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Coupon>
 */
class CouponFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('SAVE####')),
            'type' => CouponType::Percent,
            'value' => 10,
            'is_active' => true,
            'times_redeemed' => 0,
        ];
    }
}
