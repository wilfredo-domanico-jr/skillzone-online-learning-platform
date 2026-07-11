<?php

namespace App\Models;

use App\Enums\CouponType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'type',
        'value',
        'course_id',
        'instructor_id',
        'max_redemptions',
        'starts_at',
        'expires_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => CouponType::class,
            'value' => 'decimal:2',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    /**
     * Whether this coupon can currently be redeemed against the given set of
     * course IDs (the cart's contents) — active, within its date window,
     * under its redemption cap, and (if course-scoped) matches the cart.
     */
    public function isRedeemableFor(Collection $courseIds): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->starts_at && $this->starts_at->isFuture()) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->max_redemptions !== null && $this->times_redeemed >= $this->max_redemptions) {
            return false;
        }

        if ($this->course_id !== null && ! $courseIds->contains($this->course_id)) {
            return false;
        }

        return true;
    }

    /**
     * The discount amount for a given subtotal, never exceeding the subtotal
     * itself (a fixed-amount coupon can't produce a negative total).
     */
    public function discountFor(float $subtotal): float
    {
        $discount = $this->type === CouponType::Percent
            ? $subtotal * ((float) $this->value / 100)
            : (float) $this->value;

        return round(min($discount, $subtotal), 2);
    }
}
