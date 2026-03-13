<?php
// Minimal PHP alternative endpoint for shared hosting/cPanel.
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
  http_response_code(405);
  echo json_encode(['message' => 'Only POST allowed']);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$text = trim($input['text'] ?? '');
$mode = $input['mode'] ?? 'standard';

if (strlen($text) < 10) {
  http_response_code(400);
  echo json_encode(['message' => 'Provide at least 10 characters']);
  exit;
}

$output = "Rephrased ({$mode}): " . $text;

echo json_encode([
  'output' => $output,
  'disclaimer' => 'Use only for content you own or have rights to transform.'
]);
