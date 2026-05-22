<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MeetingController extends Controller
{
    public function getMeetings(Request $request)
    {
        $user = $request->attributes->get('user');

        $meetings = DB::table('meetings')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($meetings);
    }

    public function createMeeting(Request $request)
    {
        $user = $request->attributes->get('user');

        $request->validate([
            'room_id' => 'required|string|max:100',
            'platform' => 'nullable|string|max:30',
            'bot_name' => 'nullable|string|max:100',
            'bot_personality' => 'nullable|string|max:20'
        ]);

        // Check if meeting with this room_id already exists and is active
        $existing = DB::table('meetings')
            ->where('room_id', $request->room_id)
            ->where('status', 'active')
            ->first();

        if ($existing) {
            return response()->json($existing);
        }

        $uuid = (string) Str::uuid();

        $meetingId = DB::table('meetings')->insertGetId([
            'uuid' => $uuid,
            'user_id' => $user->id,
            'room_id' => $request->room_id,
            'platform' => $request->platform ?? 'custom',
            'bot_name' => $request->bot_name ?? 'ARIA',
            'bot_personality' => $request->bot_personality ?? 'professional',
            'status' => 'active',
            'started_at' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $meeting = DB::table('meetings')->where('id', $meetingId)->first();

        return response()->json($meeting, 201);
    }

    public function getNotes(Request $request, $uuid)
    {
        $user = $request->attributes->get('user');

        $meeting = DB::table('meetings')
            ->where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->first();

        if (!$meeting) {
            return response()->json(['error' => 'Meeting not found'], 404);
        }

        $notes = DB::table('meeting_notes')
            ->where('meeting_id', $meeting->id)
            ->first();

        if (!$notes) {
            return response()->json(['error' => 'Notes not generated yet'], 404);
        }

        // Decode JSON structures for API
        return response()->json([
            'meeting_uuid' => $meeting->uuid,
            'summary' => $notes->summary,
            'key_points' => json_decode($notes->key_points),
            'action_items' => json_decode($notes->action_items),
            'generated_at' => $notes->generated_at
        ]);
    }

    public function saveNotes(Request $request, $uuid)
    {
        $user = $request->attributes->get('user');

        $meeting = DB::table('meetings')
            ->where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->first();

        if (!$meeting) {
            return response()->json(['error' => 'Meeting not found'], 404);
        }

        $request->validate([
            'summary' => 'required|string',
            'key_points' => 'required|array',
            'action_items' => 'required|array'
        ]);

        DB::table('meeting_notes')->updateOrInsert(
            ['meeting_id' => $meeting->id],
            [
                'summary' => $request->summary,
                'key_points' => json_encode($request->key_points),
                'action_items' => json_encode($request->action_items),
                'generated_at' => now()
            ]
        );

        // Update meeting status to ended
        DB::table('meetings')
            ->where('id', $meeting->id)
            ->update([
                'status' => 'ended',
                'ended_at' => now(),
                'duration_seconds' => DB::raw('TIMESTAMPDIFF(SECOND, started_at, NOW())')
            ]);

        return response()->json(['message' => 'Meeting notes saved successfully']);
    }
}
