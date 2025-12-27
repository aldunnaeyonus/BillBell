<?php
namespace App\Controllers;

use App\Utils;

class FeedbackController {
  public static function send() {
    // 1. Get Input
    $input = Utils::bodyJson();
    
    $type = $input['type'] ?? 'General';
    $title = $input['title'] ?? 'No Title';
    $description = $input['description'] ?? 'No Description';
    $contact = $input['contact'] ?? 'Anonymous';
    $platform = $input['platform'] ?? 'Unknown';

    // 2. Validate
    if (empty($title) || empty($description)) {
        Utils::json(["error" => "Title and description are required"], 400);
    }

    // 3. Prepare Email
    $to = 'andrew@dunn-carabali.com'; // <--- Your support email
    $subject = "[" . ucfirst($type) . "] " . $title;
    
    $message = "New Feedback Received\n\n";
    $message .= "Type: $type\n";
    $message .= "Platform: $platform\n";
    $message .= "User Contact: $contact\n";
    $message .= "-----------------------------------\n\n";
    $message .= $description;

    // 4. Set Headers
    // Using a generic 'noreply' address on your domain prevents being blocked by some spam filters
    $headers = 'From: noreply@dunn-carabali.com' . "\r\n" .
               'Reply-To: ' . $contact . "\r\n" .
               'X-Mailer: PHP/' . phpversion();

    // 5. Send using PHP mail()
    if (mail($to, $subject, $message, $headers)) {
        Utils::json(["success" => true]);
    } else {
        error_log("PHP mail() failed.");
        Utils::json(["error" => "Failed to send email. Check server logs."], 500);
    }
  }
}