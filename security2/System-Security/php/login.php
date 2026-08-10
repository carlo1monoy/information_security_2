<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false]);
    exit;
}

$username = sanitizeInput($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';
$ip = $_SERVER['REMOTE_ADDR'];

try {
    // Get user from database
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if (!$user) {
        logLoginAttempt($pdo, $username, $ip, false);
        echo json_encode(['success' => false]);
        exit;
    }
    
    // Verify password
    if (password_verify($password, $user['password'])) {
        // Successful login
        logLoginAttempt($pdo, $username, $ip, true);
        
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['first_name'] = $user['first_name'];
        $_SESSION['last_name'] = $user['last_name'];
        
        echo json_encode(['success' => true]);
    } else {
        // Failed login
        logLoginAttempt($pdo, $username, $ip, false);
        echo json_encode(['success' => false]);
    }
    
} catch (PDOException $e) {
    error_log("Login error: " . $e->getMessage());
    echo json_encode(['success' => false]);
}
?>
