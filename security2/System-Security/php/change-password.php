<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$resetToken = $_POST['reset_token'] ?? '';
$newPassword = $_POST['password'] ?? '';
$reenterPassword = $_POST['password2'] ?? '';

$errors = [];

if (empty($newPassword)) {
    $errors[] = 'New password is required';
} elseif (strlen($newPassword) < 8) {
    $errors[] = 'New password must be at least 8 characters long';
}

if (empty($reenterPassword)) {
    $errors[] = 'Please re-enter your new password';
}

if ($newPassword !== $reenterPassword) {
    $errors[] = 'Passwords do not match';
}

if (!empty($errors)) {
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

try {
    if (empty($resetToken)) {
        error_log("Change password: No reset token provided");
        echo json_encode(['success' => false, 'message' => 'Invalid password reset request']);
        exit;
    }
    
    error_log("Change password: Received token (first 16 chars): " . substr($resetToken, 0, 16) . "... (length: " . strlen($resetToken) . ")");
    
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
    
    $stmt = $pdo->prepare("SELECT * FROM password_reset_tokens WHERE token = ?");
    $stmt->execute([$resetToken]);
    $tokenExists = $stmt->fetch();
    
    if (!$tokenExists) {
        error_log("Change password: Token not found in database");
        echo json_encode(['success' => false, 'message' => 'Invalid reset token. Please restart the password reset process.']);
        exit;
    }
    
    error_log("Change password: Token found - User ID: " . $tokenExists['user_id'] . ", Used: " . $tokenExists['used'] . ", Expires: " . $tokenExists['expires_at']);
    
    $stmt = $pdo->prepare("SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > NOW()");
    $stmt->execute([$resetToken]);
    $tokenRecord = $stmt->fetch();
    
    if (!$tokenRecord) {
        if ($tokenExists['used'] == 1) {
            error_log("Change password: Token already used");
            echo json_encode(['success' => false, 'message' => 'This reset token has already been used. Please restart the password reset process.']);
        } else {
            error_log("Change password: Token expired at " . $tokenExists['expires_at']);
            echo json_encode(['success' => false, 'message' => 'This reset token has expired. Please restart the password reset process.']);
        }
        exit;
    }
    
    $hashedNewPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt->execute([$hashedNewPassword, $tokenRecord['user_id']]);
    
    $stmt = $pdo->prepare("UPDATE password_reset_tokens SET used = 1 WHERE id = ?");
    $stmt->execute([$tokenRecord['id']]);
    
    echo json_encode(['success' => true, 'message' => 'Password successfully changed']);
    
} catch (PDOException $e) {
    error_log("Change password error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Password change failed. Please try again.']);
}
?>
