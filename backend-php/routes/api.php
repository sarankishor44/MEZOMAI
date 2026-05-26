<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CodeController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\MailController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/health', function () {
    return response()->json([
        'status' => 'online',
        'service' => 'MEZOMAI PHP API',
        'version' => '1.0.0',
        'python_backend_url' => rtrim(env('PYTHON_BACKEND_URL', ''), '/'),
    ]);
});

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth.jwt')->group(function () {
    Route::get('/auth/user', [AuthController::class, 'user']);
    
    Route::get('/chat/sessions', [ChatController::class, 'getSessions']);
    Route::post('/chat/sessions', [ChatController::class, 'createSession']);
    Route::get('/chat/sessions/{uuid}/messages', [ChatController::class, 'getMessages']);
    Route::post('/chat/sessions/{uuid}/message', [ChatController::class, 'sendMessage']);
    
    Route::get('/code/files', [CodeController::class, 'getFiles']);
    Route::post('/code/files', [CodeController::class, 'createFile']);
    Route::put('/code/files/{uuid}', [CodeController::class, 'updateFile']);
    Route::delete('/code/files/{uuid}', [CodeController::class, 'deleteFile']);
    Route::post('/code/run', [CodeController::class, 'runCode']);
    
    Route::get('/meetings', [MeetingController::class, 'getMeetings']);
    Route::post('/meetings', [MeetingController::class, 'createMeeting']);
    Route::get('/meetings/{uuid}/notes', [MeetingController::class, 'getNotes']);
    Route::post('/meetings/{uuid}/notes', [MeetingController::class, 'saveNotes']);
    
    Route::get('/analytics', [AnalyticsController::class, 'getStats']);
    Route::get('/settings', [SettingsController::class, 'getSettings']);
    Route::post('/settings', [SettingsController::class, 'saveSettings']);
    Route::post('/mail/send', [MailController::class, 'send']);
});
