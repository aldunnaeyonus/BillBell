<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require __DIR__ . '/../../vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home/dunncarabali/', '.env');
$dotenv->safeLoad();

echo "APPLE_BUNDLE_ID: " . ($_ENV['APPLE_BUNDLE_ID']?: '(empty)') . "<br>";
echo "GOOGLE_CLIENT_ID: " . ($_ENV['GOOGLE_CLIENT_ID'] ?: '(empty)') . "<br>";

echo "<pre>";
print_r($_ENV);
echo "</pre>";
