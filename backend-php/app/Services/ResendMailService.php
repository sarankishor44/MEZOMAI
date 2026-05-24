<?php

namespace App\Services;

use GuzzleHttp\Client;
use RuntimeException;

class ResendMailService
{
    private Client $client;

    public function __construct()
    {
        $this->client = new Client([
            'base_uri' => 'https://api.resend.com',
            'timeout' => 12,
        ]);
    }

    public function send(string $to, string $subject, string $html, ?string $from = null): array
    {
        $apiKey = env('RESEND_API_KEY');
        if (!$apiKey) {
            throw new RuntimeException('RESEND_API_KEY is not configured.');
        }

        $response = $this->client->post('/emails', [
            'headers' => [
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'from' => $from ?: env('RESEND_FROM', 'MEZOMAI <onboarding@resend.dev>'),
                'to' => [$to],
                'subject' => $subject,
                'html' => $html,
            ],
        ]);

        return json_decode((string) $response->getBody(), true) ?: [];
    }
}
