<?php

require_once __DIR__ . '/api.php';

header('Content-type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid request method',

    ], JSON_THROW_ON_ERROR );
    exit;
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

//Validate  Json format
if (!$data || !isset($data['player'], $data['score'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid JSON data. Must have the keys "player" and "score".',

    ],JSON_THROW_ON_ERROR);
    exit;
}


// validate player name
$player = trim($data['player']);
if (empty($player) || strlen($player) < 2 || strlen($player) > 50) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid player name. Must have a minimum of 2 characters and maximum of 50 characters.',
    ],JSON_THROW_ON_ERROR);
    exit;
}

//validate score
$score = (int) $data['score'];
if ($score <= 0) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid score must be greater than 0.',
    ],JSON_THROW_ON_ERROR);
    exit;

}

//send score to Highscore api
$url = 'https://highscores.martindilling.com/api/v1/games/12/highscores';
$payload = [
    'player' => $player,
    'score' => $score,
];
$response = apiPost($url, $payload);

echo json_encode([
    'success' => 'The score was submitted',
], JSON_THROW_ON_ERROR);