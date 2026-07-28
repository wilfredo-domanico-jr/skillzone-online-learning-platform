<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsNotSuspended
{
    /**
     * Blocks a suspended user's existing session too, not just fresh logins
     * — an admin suspending someone mid-session should take effect on their
     * very next request rather than waiting for them to log out and back in.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->isSuspended()) {
            abort(403, 'This account has been suspended.');
        }

        return $next($request);
    }
}
