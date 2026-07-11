<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuspensionTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_suspended_user_cannot_log_in(): void
    {
        $user = User::factory()->create(['suspended_at' => now()]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertUnprocessable();
        $this->assertGuest();
    }

    public function test_suspending_a_user_blocks_their_very_next_request(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/v1/auth/me')->assertOk();

        $user->forceFill(['suspended_at' => now()])->save();

        $this->actingAs($user)->getJson('/api/v1/auth/me')->assertForbidden();
    }
}
