<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Deliberately does NOT use WithoutModelEvents — DemoDataSeeder relies
     * on Course's slug-generation and Review's rating-recalculation model
     * events, which that trait would silently suppress for every seeder
     * called from here.
     */
    public function run(): void
    {
        $this->call([RoleSeeder::class, CategorySeeder::class]);

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Test User', 'password' => \Illuminate\Support\Facades\Hash::make('password')]
        )->assignRole('student');

        $this->call(DemoDataSeeder::class);
    }
}
