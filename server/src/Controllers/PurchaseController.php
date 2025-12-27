<?php
namespace App\Controllers;

use App\Utils;
use App\DB;

class PurchaseController {

  public static function verifyAppAccess() {
    $data = Utils::bodyJson();
    $platform = $data['platform'] ?? '';
    
    // Default to strict: Block unless verified
    $isValid = false;

    try {
        if ($platform === 'ios') {
            // iOS sends the 'appStoreReceipt' (Base64 string)
            $receipt = $data['receipt'] ?? null;
            if ($receipt) {
                $isValid = self::verifyAppleAppReceipt($receipt);
            }
        } 
        elseif ($platform === 'android') {
            // Android must send the LVL response
            $signedData = $data['signedData'] ?? null;
            $signature = $data['signature'] ?? null;
            if ($signedData && $signature) {
                $isValid = self::verifyAndroidLicense($signedData, $signature);
            }
        }
    } catch (\Throwable $e) {
        error_log("License Check Failed: " . $e->getMessage());
    }

    Utils::json(["authorized" => $isValid]);
  }

  // --- Apple: Verify the App Receipt ---
  private static function verifyAppleAppReceipt($receiptBase64) {
    // Note: 'verifyReceipt' is deprecated but still the standard for "App Receipts".
    // For strictly new implementations, you use the App Store Server API, 
    // but fetching the "Original Transaction ID" from the receipt is often easiest.
    
    $endpoint = $_ENV['APP_ENV'] === 'production' 
        ? 'https://buy.itunes.apple.com/verifyReceipt' 
        : 'https://sandbox.itunes.apple.com/verifyReceipt';

    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'receipt-data' => $receiptBase64,
        'password' => $_ENV['APPLE_SHARED_SECRET'] // Required for auto-renewable, good practice generally
    ]));
    
    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);

    // Status 0 means valid.
    if (!isset($response['status']) || $response['status'] !== 0) {
        return false;
    }

    // Check if the Bundle ID matches YOUR app (prevents receipt injection from other apps)
    if ($response['receipt']['bundle_id'] !== $_ENV['APPLE_BUNDLE_ID']) {
        return false;
    }

    return true;
  }

  // --- Android: Verify License Signature (LVL) ---
  private static function verifyAndroidLicense($signedData, $signature) {
    // You get this Public Key from Google Play Console > Monetization setup
    $publicKeyBase64 = $_ENV['ANDROID_PLAY_PUBLIC_KEY']; 
    
    // Format the key for OpenSSL
    $pem = "-----BEGIN PUBLIC KEY-----\n" . 
           chunk_split($publicKeyBase64, 64, "\n") . 
           "-----END PUBLIC KEY-----";

    $publicKeyId = openssl_get_publickey($pem);
    
    // Google signs the data with SHA1withRSA
    $result = openssl_verify(
        $signedData, 
        base64_decode($signature), 
        $publicKeyId, 
        OPENSSL_ALGO_SHA1
    );

    // 1 = Verified, 0 = Invalid, -1 = Error
    return $result === 1;
  }
}