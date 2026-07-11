<?php

namespace Tests\Feature\Admin;

use App\Models\InstructorPayout;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PayoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_payouts(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $instructor = User::factory()->create();
        InstructorPayout::create([
            'instructor_id' => $instructor->id,
            'period_start' => '2026-06-01',
            'period_end' => '2026-06-30',
            'gross_amount' => 100,
            'platform_fee_amount' => 30,
            'net_amount' => 70,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/payouts');

        $response->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_admin_can_filter_payouts_by_status(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $instructor = User::factory()->create();
        InstructorPayout::create([
            'instructor_id' => $instructor->id,
            'period_start' => '2026-06-01',
            'period_end' => '2026-06-30',
            'gross_amount' => 100,
            'platform_fee_amount' => 30,
            'net_amount' => 70,
            'status' => 'paid',
            'paid_at' => now(),
        ]);
        InstructorPayout::create([
            'instructor_id' => $instructor->id,
            'period_start' => '2026-05-01',
            'period_end' => '2026-05-31',
            'gross_amount' => 50,
            'platform_fee_amount' => 15,
            'net_amount' => 35,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/payouts?status=pending');

        $response->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.status', 'pending');
    }

    public function test_admin_can_mark_a_payout_paid_and_it_notifies_the_instructor(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $instructor = User::factory()->create();
        $payout = InstructorPayout::create([
            'instructor_id' => $instructor->id,
            'period_start' => '2026-06-01',
            'period_end' => '2026-06-30',
            'gross_amount' => 100,
            'platform_fee_amount' => 30,
            'net_amount' => 70,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)->postJson("/api/v1/admin/payouts/{$payout->id}/mark-paid");

        $response->assertOk()->assertJsonPath('data.status', 'paid');
        $this->assertNotNull($payout->fresh()->paid_at);
        $this->assertSame(1, $instructor->notifications()->where('type', \App\Notifications\PayoutPaid::class)->count());
    }

    public function test_a_payout_cannot_be_marked_paid_twice(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $instructor = User::factory()->create();
        $payout = InstructorPayout::create([
            'instructor_id' => $instructor->id,
            'period_start' => '2026-06-01',
            'period_end' => '2026-06-30',
            'gross_amount' => 100,
            'platform_fee_amount' => 30,
            'net_amount' => 70,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/payouts/{$payout->id}/mark-paid")
            ->assertUnprocessable();
    }

    public function test_a_non_admin_cannot_access_payouts(): void
    {
        $instructor = User::factory()->create();
        $instructor->assignRole('instructor');

        $this->actingAs($instructor)->getJson('/api/v1/admin/payouts')->assertForbidden();
    }
}
