<?php
namespace App\Controllers;

use App\Auth;
use App\Utils;

class ChatController {
  
  public static function chat() {
    // 1. Authenticate User
    // This ensures only logged-in users can access the bot
    $userId = Auth::requireUserId();

    // 2. Receive Data from App
    // We expect: message, context (decrypted bills), and optional image
    $input = Utils::bodyJson();
    
    $userMessage = $input['message'] ?? "";
    $billContext = $input['context'] ?? "No bills available or provided.";
    $base64Image = $input['image'] ?? null;
    $mimeType    = $input['mimeType'] ?? "image/jpeg";

    if (!$userMessage && !$base64Image) {
        Utils::json(["error" => "No message or image provided"], 400);
    }

    // 3. Construct the System Prompt
    // We inject the decrypted context here so Gemini "knows" the user's bills
    $systemInstruction = "You are Bill Bell, a helpful financial assistant.
    
    HERE IS THE USER'S DECRYPTED BILL DATA (Active Bills):
    $billContext

    INSTRUCTIONS:
    1. Answer questions based strictly on the bill list above.
    2. If the user asks about a bill not in the list, state that you cannot see it.
    3. If analyzing an image, extract details (Merchant, Date, Total) and ignore the text list if needed.
    4. Be concise, friendly, and helpful.
    ";

    // 4. Construct Gemini Payload
    $parts = [];
    if ($userMessage) $parts[] = ["text" => $userMessage];
    
    if ($base64Image) {
        $parts[] = [
            "inline_data" => [
                "mime_type" => $mimeType,
                "data" => $base64Image
            ]
        ];
    }

    $payload = [
        "system_instruction" => [
            "parts" => [ ["text" => $systemInstruction] ]
        ],
        "contents" => [
            [ "parts" => $parts ]
        ]
    ];

    // 5. Send to Gemini API
    // Ensure GEMINI_API_KEY is set in your .env file
    $apiKey = $_ENV['GEMINI_API_KEY'] ?? "";
    $model = $_ENV['GEMINI_API'] ?? "";

    if (!$apiKey) {
        Utils::json(["error" => "Server configuration error: API Key missing"], 500);
    }

    $apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/".$model.":generateContent?key=" . $apiKey;

    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        Utils::json(["error" => "Gemini API Error: " . curl_error($ch)], 500);
    }
    
    curl_close($ch);

    // 6. Return Response to App
    $jsonResponse = json_decode($response, true);
    
    // Pass through any errors from Google (e.g., 400 Bad Request)
    if ($httpCode !== 200) {
        Utils::json($jsonResponse, $httpCode);
    }

    Utils::json($jsonResponse);
  }
}