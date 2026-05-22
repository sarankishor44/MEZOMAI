<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CodeController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\SettingsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth.jwt')->group(function () {
    Route::get('/auth/user', [AuthController::class, 'user']);
    
    Route::get('/chat/sessions', [ChatController::class, 'getSessions']);
    Route::post('/chat/sessions', [ChatController::class, 'createSession']);
    Route::get('/chat/sessions/{uuid}/messages', [ChatController::class, 'getMessages']);
    
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
    Route::post('/settings', [SettingsController::class, 'saveSettings']);
});
