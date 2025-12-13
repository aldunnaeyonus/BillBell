<?php
require __DIR__ . '/../../vendor/autoload.php';

use Dotenv\Dotenv;   // 👈 IMPORTANT
use App\Routes;

$dotenv = Dotenv::createImmutable('/home/dunncarabali/');
$dotenv->safeLoad(); // or ->load() if you want it to error when missing

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

Routes::dispatch();
?>