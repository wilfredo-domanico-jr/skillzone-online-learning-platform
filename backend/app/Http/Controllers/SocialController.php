<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;

class SocialController extends Controller
{
    /**
     * Redirect user to the social provider.
     */
    public function redirect(string $provider): RedirectResponse
    {
        return Socialite::driver($provider)->redirect();
    }

    /**
     * Handle callback from the social provider.
     */
    public function callback(string $provider): RedirectResponse
    {
        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Exception $e) {
            return redirect()->away(
                config('app.frontend_url').'/login?error=oauth_failed'
            );
        }

        $user = $this->resolveUser($provider, $socialUser);

        Auth::login($user);

        if ($user->isSuspended()) {
            Auth::logout();

            return redirect()->away(
                config('app.frontend_url').'/login?error=account_suspended'
            );
        }

        return redirect()->away(config('app.frontend_url').'/auth/callback');
    }

    /**
     * Match by email alone: a user who originally registered with a
     * password should be linked to this provider, not rejected/duplicated.
     */
    private function resolveUser(string $provider, SocialiteUser $socialUser): User
    {
        $user = User::where('email', $socialUser->getEmail())->first();

        if (! $user) {
            $user = User::create([
                'name' => $socialUser->getName(),
                'email' => $socialUser->getEmail(),
                'password' => bcrypt(Str::random(16)),
                'email_verified_at' => now(), // provider already verified this email
                'social_provider' => $provider,
                'social_id' => $socialUser->getId(),
            ]);

            $user->assignRole('student');

            return $user;
        }

        if (is_null($user->social_provider)) {
            $user->forceFill([
                'social_provider' => $provider,
                'social_id' => $socialUser->getId(),
            ])->save();
        }

        return $user;
    }
}
