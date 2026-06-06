<?php

namespace App\Http\Controllers;

use App\Services\ResendMailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Firebase\JWT\JWT;
use Illuminate\Support\Str;
use Throwable;

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

    private function ensureEmailVerificationColumns(): void
    {
        $columns = DB::select("SHOW COLUMNS FROM users LIKE 'email_verified_at'");
        if (!$columns) {
            DB::statement("ALTER TABLE users ADD email_verified_at TIMESTAMP NULL AFTER email");
        }

        $columns = DB::select("SHOW COLUMNS FROM users LIKE 'email_verification_token'");
        if (!$columns) {
            DB::statement("ALTER TABLE users ADD email_verification_token VARCHAR(128) NULL AFTER email_verified_at");
        }

        $columns = DB::select("SHOW COLUMNS FROM users LIKE 'email_verification_sent_at'");
        if (!$columns) {
            DB::statement("ALTER TABLE users ADD email_verification_sent_at TIMESTAMP NULL AFTER email_verification_token");
        }
    }

    private function frontendUrl(): string
    {
        return rtrim(env('FRONTEND_URL', env('APP_URL', 'http://localhost:5173')), '/');
    }

    private function sendVerificationEmail(object $user, string $token, ResendMailService $mail): void
    {
        $link = $this->frontendUrl() . '/verify-email?token=' . urlencode($token);
        $html = '
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                <h2>Verify your MEZOMAI account</h2>
                <p>Hello ' . e($user->username) . ',</p>
                <p>Confirm this email address to activate your workspace.</p>
                <p><a href="' . e($link) . '" style="display:inline-block;background:#d97706;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Verify email</a></p>
                <p>If the button does not work, open this link:</p>
                <p><a href="' . e($link) . '">' . e($link) . '</a></p>
            </div>';

        $mail->send($user->email, 'Verify your MEZOMAI email', $html);
    }

    private function userPayload(object $user): array
    {
        return [
            'username' => $user->username,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at ?? null,
            'avatar_name' => $user->avatar_name,
            'avatar_style' => $user->avatar_style,
            'avatar_gender' => $user->avatar_gender ?? 'female',
            'personality' => $user->personality,
            'model' => $user->model,
            'system_prompt' => $user->system_prompt,
            'voice_name' => $user->voice_name,
            'voice_speed' => $user->voice_speed,
            'voice_pitch' => $user->voice_pitch,
            'active_provider' => $user->active_provider ?? 'gemma'
        ];
    }

    public function register(Request $request, ResendMailService $mail)
    {
        $this->ensureEmailVerificationColumns();

        $request->validate([
            'username' => 'required|string|max:50|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6'
        ]);

        $uuid = (string) Str::uuid();
        $verificationToken = Str::random(64);

        $userId = DB::table('users')->insertGetId([
            'uuid' => $uuid,
            'username' => $request->username,
            'email' => $request->email,
            'email_verification_token' => hash('sha256', $verificationToken),
            'email_verification_sent_at' => now(),
            'password_hash' => Hash::make($request->password),
            'avatar_name' => 'ARIA',
            'avatar_style' => 'cyan',
            'personality' => 'friendly',
            'model' => 'gemma-3-27b-it',
            'active_provider' => 'gemma',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $user = DB::table('users')->where('id', $userId)->first();

        try {
            $this->sendVerificationEmail($user, $verificationToken, $mail);
        } catch (Throwable $e) {
            report($e);
            return response()->json([
                'error' => 'Account created, but verification email could not be sent. Check RESEND_API_KEY and RESEND_FROM.',
            ], 502);
        }

        return response()->json([
            'ok' => true,
            'requires_verification' => true,
            'message' => 'Account created. Check your email and open the confirmation link to verify your account.'
        ], 201);
    }

    public function login(Request $request)
    {
        $this->ensureEmailVerificationColumns();

        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string'
        ]);

        $user = DB::table('users')->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return response()->json(['error' => 'Invalid email or password'], 401);
        }

        if (empty($user->email_verified_at)) {
            return response()->json([
                'error' => 'Email not verified. Open the confirmation link we sent before logging in.',
                'requires_verification' => true,
            ], 403);
        }

        $token = $this->generateToken($user->id);

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user)
        ]);
    }

    public function verifyEmail(Request $request)
    {
        $this->ensureEmailVerificationColumns();

        $request->validate([
            'token' => 'required|string|min:32|max:255',
        ]);

        $hashedToken = hash('sha256', $request->token);
        $user = DB::table('users')->where('email_verification_token', $hashedToken)->first();

        if (!$user) {
            return response()->json(['error' => 'Verification link is invalid or has already been used.'], 422);
        }

        DB::table('users')->where('id', $user->id)->update([
            'email_verified_at' => now(),
            'email_verification_token' => null,
            'updated_at' => now(),
        ]);

        $verifiedUser = DB::table('users')->where('id', $user->id)->first();
        $token = $this->generateToken($verifiedUser->id);

        return response()->json([
            'ok' => true,
            'token' => $token,
            'user' => $this->userPayload($verifiedUser),
            'message' => 'Email verified. Your MEZOMAI workspace is ready.',
        ]);
    }

    public function resendVerification(Request $request, ResendMailService $mail)
    {
        $this->ensureEmailVerificationColumns();

        $request->validate([
            'email' => 'required|string|email|max:255',
        ]);

        $user = DB::table('users')->where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['ok' => true, 'message' => 'If this account exists, a verification email was sent.']);
        }
        if (!empty($user->email_verified_at)) {
            return response()->json(['ok' => true, 'message' => 'This email is already verified.']);
        }

        $verificationToken = Str::random(64);
        DB::table('users')->where('id', $user->id)->update([
            'email_verification_token' => hash('sha256', $verificationToken),
            'email_verification_sent_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            $updatedUser = DB::table('users')->where('id', $user->id)->first();
            $this->sendVerificationEmail($updatedUser, $verificationToken, $mail);
        } catch (Throwable $e) {
            report($e);
            return response()->json(['error' => 'Unable to send verification email right now.'], 502);
        }

        return response()->json(['ok' => true, 'message' => 'Verification email sent.']);
    }

    public function user(Request $request)
    {
        $user = $request->attributes->get('user');
        
        return response()->json([
            'user' => $this->userPayload($user)
        ]);
    }
}
