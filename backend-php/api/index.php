<?php

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if ($path === '/' || $path === '/api/health' || $path === '/health') {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'online',
        'service' => 'MEZOMAI PHP API',
        'version' => '1.0.0',
        'python_backend_url' => rtrim(getenv('PYTHON_BACKEND_URL') ?: '', '/'),
    ]);
    return;
}

$laravelPublicIndex = __DIR__ . '/../public/index.php';

if (file_exists($laravelPublicIndex)) {
    require $laravelPublicIndex;
    return;
}

http_response_code(503);
header('Content-Type: application/json');
echo json_encode([
    'status' => 'offline',
    'service' => 'MEZOMAI PHP API',
    'message' => 'Laravel public/index.php is missing. Deploy a complete Laravel app or use /health for status checks.',
]);
