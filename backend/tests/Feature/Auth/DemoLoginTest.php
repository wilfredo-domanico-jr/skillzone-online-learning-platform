<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_login_is_not_found_when_demo_mode_is_disabled(): void
    {
        config(['app.demo_mode' => false]);

        $response = $this->postJson('/api/v1/auth/demo-login', ['role' => 'student']);

        $response->assertNotFound();
        $this->assertGuest();
    }

    public function test_demo_login_authenticates_as_a_seeded_account_for_the_role(): void
    {
        config(['app.demo_mode' => true]);

        $response = $this->postJson('/api/v1/auth/demo-login', ['role' => 'instructor']);

        $response->assertOk()->assertJsonPath('user.email', 'demo-instructor@skillzone.test');
        $this->assertAuthenticated();
        $this->assertTrue(User::where('email', 'demo-instructor@skillzone.test')->first()->hasRole('instructor'));
    }

    public function test_demo_login_reuses_the_same_seeded_account_on_repeat_calls(): void
    {
        config(['app.demo_mode' => true]);

        $this->postJson('/api/v1/auth/demo-login', ['role' => 'admin']);
        $this->postJson('/api/v1/auth/demo-login', ['role' => 'admin']);

        $this->assertSame(1, User::where('email', 'demo-admin@skillzone.test')->count());
    }

    public function test_demo_login_rejects_an_invalid_role(): void
    {
        config(['app.demo_mode' => true]);

        $response = $this->postJson('/api/v1/auth/demo-login', ['role' => 'superuser']);

        $response->assertUnprocessable();
        $this->assertGuest();
    }
}
