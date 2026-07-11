<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_and_search_users(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        User::factory()->create(['name' => 'Jane Searchable']);
        User::factory()->create(['name' => 'Someone Else']);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/users?search=Searchable');

        $response->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Jane Searchable');
    }

    public function test_admin_can_suspend_a_user(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $target = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/v1/admin/users/{$target->id}/suspend");

        $response->assertOk();
        $this->assertNotNull($target->fresh()->suspended_at);
    }

    public function test_admin_can_unsuspend_a_user(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $target = User::factory()->create(['suspended_at' => now()]);

        $response = $this->actingAs($admin)->postJson("/api/v1/admin/users/{$target->id}/unsuspend");

        $response->assertOk();
        $this->assertNull($target->fresh()->suspended_at);
    }

    public function test_admin_cannot_suspend_themselves(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/users/{$admin->id}/suspend")
            ->assertUnprocessable();

        $this->assertNull($admin->fresh()->suspended_at);
    }

    public function test_a_non_admin_cannot_manage_users(): void
    {
        $student = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($student)
            ->postJson("/api/v1/admin/users/{$target->id}/suspend")
            ->assertForbidden();
    }
}
