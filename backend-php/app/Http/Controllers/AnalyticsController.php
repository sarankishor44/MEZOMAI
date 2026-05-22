<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function getStats(Request $request)
    {
        $user = $request->attributes->get('user');

        // Get daily analytics logs for the last 30 days
        $history = DB::table('analytics')
            ->where('user_id', $user->id)
            ->orderBy('date', 'asc')
            ->limit(30)
            ->get();

        // Calculate total summaries for current user
        $totals = DB::table('analytics')
            ->where('user_id', $user->id)
            ->select(
                DB::raw('SUM(sessions_count) as total_sessions'),
                DB::raw('SUM(messages_count) as total_messages'),
                DB::raw('SUM(tokens_input + tokens_output) as total_tokens'),
                DB::raw('SUM(estimated_cost_usd) as total_cost'),
                DB::raw('SUM(meetings_count) as total_meetings')
            )
            ->first();

        // If no records in table yet, provide active numbers from current live tables
        if (!$totals || $totals->total_messages === null) {
            $totalMessages = DB::table('messages')->where('user_id', $user->id)->count();
            $totalMeetings = DB::table('meetings')->where('user_id', $user->id)->count();
            $totalSessions = DB::table('chat_sessions')->where('user_id', $user->id)->count();
            
            // Calculate a dummy token count based on typical lengths (e.g., 200 tokens per message)
            $totalTokens = $totalMessages * 200;
            $totalCost = $totalTokens * 0.000015; // Rough estimate of $15 per million tokens

            $totals = (object) [
                'total_sessions' => $totalSessions,
                'total_messages' => $totalMessages,
                'total_tokens' => $totalTokens,
                'total_cost' => round($totalCost, 4),
                'total_meetings' => $totalMeetings
            ];
        }

        // Return combined metrics
        return response()->json([
            'totals' => $totals,
            'history' => $history
        ]);
    }
}
