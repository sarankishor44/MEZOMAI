<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class CodeController extends Controller
{
    public function getFiles(Request $request)
    {
        $user = $request->attributes->get('user');

        $files = DB::table('code_files')
            ->where('user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($files);
    }

    public function createFile(Request $request)
    {
        $user = $request->attributes->get('user');

        $request->validate([
            'filename' => 'required|string|max:255',
            'language' => 'nullable|string|max:30',
            'content' => 'nullable|string',
            'folder_path' => 'nullable|string|max:500'
        ]);

        $uuid = (string) Str::uuid();

        $fileId = DB::table('code_files')->insertGetId([
            'uuid' => $uuid,
            'user_id' => $user->id,
            'filename' => $request->filename,
            'language' => $request->language ?? 'python',
            'content' => $request->content ?? '',
            'folder_path' => $request->folder_path ?? '/',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $file = DB::table('code_files')->where('id', $fileId)->first();

        return response()->json($file, 201);
    }

    public function updateFile(Request $request, $uuid)
    {
        $user = $request->attributes->get('user');

        $file = DB::table('code_files')
            ->where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->first();

        if (!$file) {
            return response()->json(['error' => 'File not found'], 404);
        }

        $request->validate([
            'filename' => 'nullable|string|max:255',
            'language' => 'nullable|string|max:30',
            'content' => 'nullable|string',
            'folder_path' => 'nullable|string|max:500',
            'change_summary' => 'nullable|string|max:255'
        ]);

        $updates = [];
        if ($request->has('filename')) $updates['filename'] = $request->filename;
        if ($request->has('language')) $updates['language'] = $request->language;
        if ($request->has('content')) $updates['content'] = $request->content;
        if ($request->has('folder_path')) $updates['folder_path'] = $request->folder_path;
        $updates['updated_at'] = now();

        DB::table('code_files')->where('id', $file->id)->update($updates);

        // Save a version history if content changed
        if ($request->has('content') && $request->content !== $file->content) {
            DB::table('code_versions')->insert([
                'file_id' => $file->id,
                'content' => $file->content, // old content
                'change_summary' => $request->change_summary ?? 'Auto-save version',
                'created_at' => now()
            ]);
        }

        $updatedFile = DB::table('code_files')->where('id', $file->id)->first();

        return response()->json($updatedFile);
    }

    public function deleteFile(Request $request, $uuid)
    {
        $user = $request->attributes->get('user');

        $file = DB::table('code_files')
            ->where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->first();

        if (!$file) {
            return response()->json(['error' => 'File not found'], 404);
        }

        DB::table('code_files')->where('id', $file->id)->delete();

        return response()->json(['message' => 'File deleted successfully']);
    }

    public function runCode(Request $request)
    {
        $user = $request->attributes->get('user');

        $request->validate([
            'file_uuid' => 'nullable|string',
            'code' => 'required|string',
            'language' => 'required|string|max:30'
        ]);

        $fileId = null;
        if ($request->file_uuid) {
            $file = DB::table('code_files')
                ->where('uuid', $request->file_uuid)
                ->where('user_id', $user->id)
                ->first();
            if ($file) {
                $fileId = $file->id;
            } else {
                return response()->json(['error' => 'File not found'], 404);
            }
        }

        $startTime = microtime(true);

        // Proxy request to Python FastAPI Sandbox server
        $pythonUrl = env('PYTHON_BACKEND_URL', 'http://backend-python:8000') . '/code/run';
        
        try {
            $response = Http::timeout(10)->post($pythonUrl, [
                'code' => $request->code,
                'language' => $request->language
            ]);

            $durationMs = (int) ((microtime(true) - $startTime) * 1000);
            $result = $response->json();

            // Record execution run in DB
            if ($fileId) {
                DB::table('code_runs')->insert([
                    'file_id' => $fileId,
                    'user_id' => $user->id,
                    'language' => $request->language,
                    'input_code' => $request->code,
                    'output' => $result['stdout'] ?? '',
                    'error' => $result['stderr'] ?? '',
                    'duration_ms' => $durationMs,
                    'exit_code' => $result['exit_code'] ?? 0,
                    'executed_at' => now()
                ]);
            }

            return response()->json([
                'stdout' => $result['stdout'] ?? '',
                'stderr' => $result['stderr'] ?? '',
                'exit_code' => $result['exit_code'] ?? 0,
                'duration_ms' => $durationMs
            ]);

        } catch (\Exception $e) {
            $durationMs = (int) ((microtime(true) - $startTime) * 1000);
            return response()->json([
                'stdout' => '',
                'stderr' => 'Failed to reach execution sandbox backend.',
                'exit_code' => -1,
                'duration_ms' => $durationMs
            ], 502);
        }
    }
}
