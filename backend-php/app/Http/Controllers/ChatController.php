<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    public function getSessions(Request $request)
    {
        $user = $request->attributes->get('user');
        
        $sessions = DB::table('chat_sessions')
            ->where('user_id', $user->id)
            ->where('is_active', 1)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($sessions);
    }

    public function createSession(Request $request)
    {
        $user = $request->attributes->get('user');

        $request->validate([
            'title' => 'nullable|string|max:255',
            'personality' => 'nullable|string|max:20'
        ]);

        $uuid = (string) Str::uuid();
        
        $sessionId = DB::table('chat_sessions')->insertGetId([
            'uuid' => $uuid,
            'user_id' => $user->id,
            'title' => $request->title ?? 'New Chat Session',
            'personality' => $request->personality ?? 'friendly',
            'message_count' => 0,
            'token_count' => 0,
            'is_active' => 1,
            'started_at' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $session = DB::table('chat_sessions')->where('id', $sessionId)->first();

        return response()->json($session, 201);
    }

    public function getMessages(Request $request, $uuid)
    {
        $user = $request->attributes->get('user');

        $session = DB::table('chat_sessions')
            ->where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            return response()->json(['error' => 'Chat session not found'], 404);
        }

        $messages = DB::table('messages')
            ->where('session_id', $session->id)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }
}
