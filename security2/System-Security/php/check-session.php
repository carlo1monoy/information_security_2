<?php
require_once 'config.php';

header('Content-Type: application/json');

if (isset($_SESSION['user_id']) && isset($_SESSION['username'])) {
    echo json_encode([
        'loggedIn' => true,
        'username' => $_SESSION['username'],
        'firstName' => $_SESSION['first_name'] ?? '',
        'lastName' => $_SESSION['last_name'] ?? ''
    ]);
} else {
    echo json_encode(['loggedIn' => false]);
}
?>
