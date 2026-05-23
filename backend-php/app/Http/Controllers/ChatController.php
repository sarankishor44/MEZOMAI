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

    public function sendMessage(Request $request, $uuid)
    {
        $user = $request->attributes->get('user');

        $session = DB::table('chat_sessions')
            ->where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            return response()->json(['error' => 'Chat session not found'], 404);
        }

        $request->validate([
            'role' => 'required|string|in:user,assistant',
            'content' => 'required|string',
            'token_count' => 'nullable|integer|min:0',
            'emotion' => 'nullable|string|max:20',
            'has_image' => 'nullable|boolean',
            'image_path' => 'nullable|string|max:500',
        ]);

        $messageId = DB::table('messages')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'session_id' => $session->id,
            'user_id' => $user->id,
            'role' => $request->role,
            'content' => $request->content,
            'has_image' => $request->boolean('has_image'),
            'image_path' => $request->image_path,
            'token_count' => $request->token_count ?? 0,
            'emotion' => $request->emotion ?? 'neutral',
            'created_at' => now(),
        ]);

        DB::table('chat_sessions')
            ->where('id', $session->id)
            ->update([
                'message_count' => DB::raw('message_count + 1'),
                'token_count' => DB::raw('token_count + ' . (int) ($request->token_count ?? 0)),
                'updated_at' => now(),
            ]);

        $message = DB::table('messages')->where('id', $messageId)->first();

        return response()->json($message, 201);
    }
}
