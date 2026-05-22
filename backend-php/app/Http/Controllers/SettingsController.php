<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

class SettingsController extends Controller
{
    public function saveSettings(Request $request)
    {
        $user = $request->attributes->get('user');

        $request->validate([
            'avatar_name' => 'nullable|string|max:100',
            'avatar_style' => 'nullable|string|max:20',
            'personality' => 'nullable|string|max:20',
            'system_prompt' => 'nullable|string',
            'voice_name' => 'nullable|string|max:100',
            'voice_speed' => 'nullable|numeric|between:0.5,2.0',
            'voice_pitch' => 'nullable|numeric|between:0.5,2.0',
            'model' => 'nullable|string|max:50',
            
            // API credentials
            'apiKey' => 'nullable|string',
            'elevenLabsKey' => 'nullable|string'
        ]);

        // 1. Update user settings
        $userUpdates = [];
        if ($request->has('avatar_name')) $userUpdates['avatar_name'] = $request->avatar_name;
        if ($request->has('avatar_style')) $userUpdates['avatar_style'] = $request->avatar_style;
        if ($request->has('personality')) $userUpdates['personality'] = $request->personality;
        if ($request->has('system_prompt')) $userUpdates['system_prompt'] = $request->system_prompt;
        if ($request->has('voice_name')) $userUpdates['voice_name'] = $request->voice_name;
        if ($request->has('voice_speed')) $userUpdates['voice_speed'] = $request->voice_speed;
        if ($request->has('voice_pitch')) $userUpdates['voice_pitch'] = $request->voice_pitch;
        if ($request->has('model')) $userUpdates['model'] = $request->model;

        if (!empty($userUpdates)) {
            DB::table('users')->where('id', $user->id)->update($userUpdates);
        }

        // 2. Save/Update encrypted API keys
        if ($request->has('apiKey') && $request->apiKey !== null) {
            $key = $request->apiKey;
            if ($key !== '') {
                DB::table('api_keys')->updateOrInsert(
                    ['user_id' => $user->id, 'provider' => 'anthropic'],
                    [
                        'encrypted_key' => Crypt::encryptString($key),
                        'key_hint' => '...' . substr($key, -4),
                        'is_valid' => 1,
                        'last_tested_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]
                );
            } else {
                // Clear the key if empty string passed
                DB::table('api_keys')->where('user_id', $user->id)->where('provider', 'anthropic')->delete();
            }
        }

        if ($request->has('elevenLabsKey') && $request->elevenLabsKey !== null) {
            $key = $request->elevenLabsKey;
            if ($key !== '') {
                DB::table('api_keys')->updateOrInsert(
                    ['user_id' => $user->id, 'provider' => 'elevenlabs'],
                    [
                        'encrypted_key' => Crypt::encryptString($key),
                        'key_hint' => '...' . substr($key, -4),
                        'is_valid' => 1,
                        'last_tested_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]
                );
            } else {
                DB::table('api_keys')->where('user_id', $user->id)->where('provider', 'elevenlabs')->delete();
            }
        }

        // Retrieve freshly updated user record
        $updatedUser = DB::table('users')->where('id', $user->id)->first();

        return response()->json([
            'message' => 'Settings saved successfully',
            'user' => [
                'username' => $updatedUser->username,
                'email' => $updatedUser->email,
                'avatar_name' => $updatedUser->avatar_name,
                'avatar_style' => $updatedUser->avatar_style,
                'personality' => $updatedUser->personality,
                'model' => $updatedUser->model,
                'system_prompt' => $updatedUser->system_prompt,
                'voice_name' => $updatedUser->voice_name,
                'voice_speed' => $updatedUser->voice_speed,
                'voice_pitch' => $updatedUser->voice_pitch
            ]
        ]);
    }
}
