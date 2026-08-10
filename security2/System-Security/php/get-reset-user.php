<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$resetToken = $_POST['reset_token'] ?? '';

if (empty($resetToken)) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

try {
    // Ensure table exists (same structure as used in forgot-password.php and change-password.php)
    $pdo->exec("CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token (token),
        INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $stmt = $pdo->prepare('SELECT user_id FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > NOW()');
    $stmt->execute([$resetToken]);
    $tokenRecord = $stmt->fetch();

    if (!$tokenRecord) {
        echo json_encode(['success' => false, 'message' => 'Invalid or expired reset token']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT id_number, username FROM users WHERE id = ?');
    $stmt->execute([$tokenRecord['user_id']]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'id_number' => $user['id_number'],
        'username'  => $user['username'],
    ]);
} catch (PDOException $e) {
    error_log('Get reset user error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred. Please try again.']);
}
