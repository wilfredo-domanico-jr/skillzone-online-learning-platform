<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user and start an authenticated session.
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $user->assignRole('student');

        event(new Registered($user));

        Auth::login($user);

        $request->session()->regenerate();

        return response()->json(['user' => $user->fresh()], 201);
    }

    /**
     * Authenticate and start a session for the given credentials.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return response()->json(['user' => $request->user()]);
    }

    /**
     * Demo-mode only: log in as a seeded demo account for the given role,
     * no credentials required. 404s (not 403) when demo mode is off, so the
     * endpoint doesn't advertise itself as a bypass surface in production.
     */
    public function demoLogin(Request $request): JsonResponse
    {
        abort_unless(config('app.demo_mode'), 404);

        $request->validate([
            'role' => 'required|in:student,instructor,admin',
        ]);

        $role = $request->string('role')->toString();

        $user = User::firstOrCreate(
            ['email' => "demo-{$role}@skillzone.test"],
            [
                'name' => 'Demo '.ucfirst($role),
                'password' => Hash::make(Str::random(32)),
                'email_verified_at' => now(),
            ]
        );

        if (! $user->hasRole($role)) {
            $user->syncRoles([$role]);
        }

        Auth::login($user);

        $request->session()->regenerate();

        return response()->json(['user' => $user->fresh()->load('roles')]);
    }

    /**
     * Destroy the authenticated session.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out.']);
    }

    /**
     * Return the currently authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()->load('roles')]);
    }

    /**
     * Send a password reset link to the given email.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => __($status)]);
        }

        throw ValidationException::withMessages(['email' => [trans($status)]]);
    }

    /**
     * Reset the user's password using a valid token.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user) use ($request) {
                $user->forceFill([
                    'password' => Hash::make($request->password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new \Illuminate\Auth\Events\PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)]);
        }

        throw ValidationException::withMessages(['email' => [trans($status)]]);
    }

    /**
     * Update the authenticated user's password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json(['message' => 'Password updated.']);
    }

    /**
     * Confirm the authenticated user's password (for sensitive actions).
     */
    public function confirmPassword(Request $request): JsonResponse
    {
        if (! Auth::guard('web')->validate([
            'email' => $request->user()->email,
            'password' => $request->password,
        ])) {
            throw ValidationException::withMessages([
                'password' => __('auth.password'),
            ]);
        }

        $request->session()->put('auth.password_confirmed_at', time());

        return response()->json(['message' => 'Password confirmed.']);
    }

    /**
     * Resend the email verification notification.
     */
    public function sendVerificationEmail(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent.']);
    }

    /**
     * Mark the authenticated user's email address as verified.
     *
     * Reached via a signed link the user clicks from their inbox, so this is a
     * full browser navigation (routed through routes/web.php) that redirects
     * back into the SPA rather than returning JSON.
     */
    public function verifyEmail(EmailVerificationRequest $request): RedirectResponse
    {
        if (! $request->user()->hasVerifiedEmail() && $request->user()->markEmailAsVerified()) {
            event(new Verified($request->user()));
        }

        return redirect()->away(config('app.frontend_url').'/dashboard?verified=1');
    }
}
