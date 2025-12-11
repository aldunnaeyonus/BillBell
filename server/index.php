<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require '/home/dunncarabali/vendor/autoload.php';


use App\Routes;
use Dotenv\Dotenv;



$dotenvPath = '/home/dunncarabali/public_html/billMVP';                  // expects /home/dunncarabali/.env

if (file_exists($dotenvPath . "/.env")) {
  $dotenv = Dotenv::createImmutable($dotenvPath);
  $dotenv->safeLoad(); // doesn't crash if .env missing
}



header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

Routes::dispatch();
