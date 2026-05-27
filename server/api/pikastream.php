<?php
/**
 * server/api/pikastream.php
 * Custom PHP Endpoint to serve as the bridge between React and Python AI scripts
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Ensure scripts directory exists
$scripts_dir = __DIR__ . '/../scripts';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

switch ($action) {
    case 'join':
        $meetUrl = escapeshellarg($input['meetUrl'] ?? '');
        $botName = escapeshellarg($input['botName'] ?? '');
        
        // Call Python script
        $cmd = "python3 {$scripts_dir}/ai_meeting.py join --meet-url {$meetUrl} --bot-name {$botName} 2>&1";
        $output = shell_exec($cmd);
        
        echo json_encode([
            'success' => true,
            'sessionId' => 'sess_' . time(),
            'message' => 'Agent joining meeting...',
            'output' => $output
        ]);
        break;

    case 'leave':
        $sessionId = escapeshellarg($input['sessionId'] ?? '');
        $cmd = "python3 {$scripts_dir}/ai_meeting.py leave --session-id {$sessionId} 2>&1";
        $output = shell_exec($cmd);
        
        echo json_encode([
            'success' => true,
            'message' => 'Agent left meeting.',
            'output' => $output
        ]);
        break;

    case 'generate-avatar':
        $prompt = escapeshellarg($input['prompt'] ?? '');
        $cmd = "python3 {$scripts_dir}/ai_meeting.py generate-avatar --prompt {$prompt} 2>&1";
        $output = shell_exec($cmd);
        
        echo json_encode([
            'success' => true,
            'imagePath' => '/generated/avatar_' . time() . '.webp',
            'message' => 'Avatar generated.',
            'output' => $output
        ]);
        break;

    case 'clone-voice':
        // In a real scenario, handle $_FILES['audio']
        $profileName = escapeshellarg($input['profileName'] ?? 'default_voice');
        $cmd = "python3 {$scripts_dir}/ai_meeting.py clone-voice --name {$profileName} 2>&1";
        $output = shell_exec($cmd);
        
        echo json_encode([
            'success' => true,
            'voiceId' => $profileName,
            'message' => 'Voice cloned successfully.',
            'output' => $output
        ]);
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Unknown action']);
        break;
}
