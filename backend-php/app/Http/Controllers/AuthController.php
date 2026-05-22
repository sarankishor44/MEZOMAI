<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Firebase\JWT\JWT;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    private function generateToken($userId)
    {
        $payload = [
            'iss' => 'mezomai_platform',
            'sub' => $userId,
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60 * 7) // 7 days expiration
        ];
        
        $secret = env('JWT_SECRET');
        if (!$secret) {
            abort(500, 'JWT secret is not configured');
        }
        return JWT::encode($payload, $secret, 'HS256');
    }

    public function register(Request $request)
    {
        $request->validate([
            'username' => 'required|string|max:50|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6'
        ]);

        $uuid = (string) Str::uuid();

        $userId = DB::table('users')->insertGetId([
            'uuid' => $uuid,
            'username' => $request->username,
            'email' => $request->email,
            'password_hash' => Hash::make($request->password),
            'avatar_name' => 'ARIA',
            'avatar_style' => 'cyan',
            'personality' => 'friendly',
            'model' => 'claude-sonnet-4-20250514',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $user = DB::table('users')->where('id', $userId)->first();
        $token = $this->generateToken($userId);

        return response()->json([
            'token' => $token,
            'user' => [
                'username' => $user->username,
                'email' => $user->email,
                'avatar_name' => $user->avatar_name,
                'avatar_style' => $user->avatar_style,
                'personality' => $user->personality,
                'model' => $user->model
            ]
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string'
        ]);

        $user = DB::table('users')->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return response()->json(['error' => 'Invalid email or password'], 401);
        }

        $token = $this->generateToken($user->id);

        return response()->json([
            'token' => $token,
            'user' => [
                'username' => $user->username,
                'email' => $user->email,
                'avatar_name' => $user->avatar_name,
                'avatar_style' => $user->avatar_style,
                'personality' => $user->personality,
                'model' => $user->model
            ]
        ]);
    }

    public function user(Request $request)
    {
        $user = $request->attributes->get('user');
        
        return response()->json([
            'user' => [
                'username' => $user->username,
                'email' => $user->email,
                'avatar_name' => $user->avatar_name,
                'avatar_style' => $user->avatar_style,
                'personality' => $user->personality,
                'model' => $user->model
            ]
        ]);
    }
}
