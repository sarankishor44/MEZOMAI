<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\DB;

class JwtMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $header = $request->header('Authorization');
        if (!$header || !str_starts_with($header, 'Bearer ')) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $token = substr($header, 7);
        try {
            $secret = env('JWT_SECRET');
            if (!$secret) {
                return response()->json(['error' => 'Server authentication is not configured'], 500);
            }

            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
            $user = DB::table('users')->where('id', $decoded->sub)->first();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $request->attributes->set('user', $user);
            return $next($request);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
    }
}
