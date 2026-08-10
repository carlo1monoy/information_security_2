<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$username = sanitizeInput($_POST['username'] ?? '');
$questions = [];
$answers = [];

for ($i = 1; $i <= 3; $i++) {
    $questions[$i] = sanitizeInput($_POST["auth_question{$i}"] ?? '');
    $answers[$i] = sanitizeInput($_POST["auth_answer{$i}"] ?? '');
}

$errors = [];

if (empty($username)) {
    $errors[] = 'ID Number is required';
}

// Count how many questions the user actually attempted to answer
$answeredCount = 0;
foreach ($answers as $answer) {
    if (!empty($answer)) {
        $answeredCount++;
    }
}

if ($answeredCount < 2) {
    $errors[] = 'You must answer at least 2 authentication questions.';
}

if (!empty($errors)) {
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id_number = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'ID Number not found']);
        exit;
    }
    
    $correctCount = 0;
    
    for ($i = 1; $i <= 3; $i++) {
        $storedQuestion = $user["auth_question_{$i}"] ?? '';
        $storedAnswer = $user["auth_answer_{$i}"] ?? '';
        $userQuestion = $questions[$i];
        $userAnswer = $answers[$i];
        
        if (!empty($storedQuestion) && !empty($storedAnswer)) {
            if (strcasecmp($storedQuestion, $userQuestion) === 0 && 
                password_verify(strtolower($userAnswer), $storedAnswer)) {
                $correctCount++;
            }
        }
    }
    
    if ($correctCount < 2) {
        error_log("Forgot password: User verification failed for username: " . $username . " (only " . $correctCount . " correct answers)");
        echo json_encode([
            'success' => false, 
            'message' => '<i class="bi bi-exclamation-circle-fill"></i> Verification failed. You need at least 2 correct answers. Please try again.'
        ]);
        exit;
    }
    
    error_log("Forgot password: User verified successfully - User ID: " . $user['id'] . ", Username: " . $username);
    
    $resetToken = bin2hex(random_bytes(32));
    $tokenExpiry = date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    error_log("Forgot password: Generated token (first 16 chars): " . substr($resetToken, 0, 16) . "... (length: " . strlen($resetToken) . ")");
    error_log("Forgot password: Token will expire at: " . $tokenExpiry);
    
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
    
    $stmt = $pdo->prepare("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)");
    $result = $stmt->execute([$user['id'], $resetToken, $tokenExpiry]);
    
    if (!$result) {
        error_log("Forgot password: FAILED to insert reset token for user ID: " . $user['id']);
        echo json_encode(['success' => false, 'message' => 'Failed to generate reset token. Please try again.']);
        exit;
    }
    
    $insertedId = $pdo->lastInsertId();
    error_log("Forgot password: Token successfully inserted with ID: " . $insertedId);
    
    $stmt = $pdo->prepare("SELECT * FROM password_reset_tokens WHERE id = ?");
    $stmt->execute([$insertedId]);
    $verifyToken = $stmt->fetch();
    
    if ($verifyToken) {
        error_log("Forgot password: Verified token was stored correctly in database");
    } else {
        error_log("Forgot password: WARNING - Could not verify token was stored in database!");
    }
    
    echo json_encode([
        'success' => true, 
        'message' => 'Identity verified successfully',
        'token' => $resetToken,
        'redirect' => 'change-password.html'
    ]);
    
} catch (PDOException $e) {
    error_log("Forgot password error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Verification failed. Please try again.']);
}
?>
