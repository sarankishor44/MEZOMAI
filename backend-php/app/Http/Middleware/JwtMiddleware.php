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
            return response()->json(['error' => 'Unauthorized — Token Missing'], 401);
        }

        $token = substr($header, 7);
        try {
            $secret = env('JWT_SECRET', 'aria_jwt_super_secret_key_change_in_prod');
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
            
            $user = DB::table('users')->where('id', $decoded->sub)->first();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized — User Not Found'], 401);
            }

            // Attach user to request attributes
            $request->attributes->set('user', $user);
            return $next($request);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Unauthorized — Invalid Token: ' . $e->getMessage()], 401);
        }
    }
}
