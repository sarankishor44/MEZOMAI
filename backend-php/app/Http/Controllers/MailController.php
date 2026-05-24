<?php

namespace App\Http\Controllers;

use App\Services\ResendMailService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Throwable;

class MailController extends Controller
{
    public function send(Request $request, ResendMailService $mail)
    {
        $data = $request->validate([
            'to' => 'required|email|max:255',
            'subject' => 'required|string|max:160',
            'html' => 'required|string|max:20000',
        ]);

        $user = $request->attributes->get('user');
        $allowedRecipient = $user?->email;

        if ($allowedRecipient && Str::lower($data['to']) !== Str::lower($allowedRecipient)) {
            return response()->json([
                'error' => 'Email can only be sent to the authenticated user from this endpoint.',
            ], 403);
        }

        try {
            $result = $mail->send($data['to'], $data['subject'], $data['html']);

            return response()->json([
                'ok' => true,
                'id' => $result['id'] ?? null,
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'ok' => false,
                'error' => 'Unable to send email right now.',
            ], 502);
        }
    }
}
