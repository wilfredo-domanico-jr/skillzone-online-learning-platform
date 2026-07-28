<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * Overrides the framework default, which unconditionally redirects to
     * route('login') — this is a JSON-only API with no such named route, so
     * an already-authenticated hit on login/register/demo-login threw a
     * RouteNotFoundException instead of a clean response. Return JSON here
     * the same way Authenticate::redirectTo() already does for the
     * inverse (unauthenticated) case.
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        foreach (empty($guards) ? [null] : $guards as $guard) {
            if (Auth::guard($guard)->check()) {
                return response()->json(['message' => 'Already authenticated.'], 409);
            }
        }

        return $next($request);
    }
}
