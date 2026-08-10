<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$username = sanitizeInput($_POST['username'] ?? '');

if (empty($username)) {
    echo json_encode(['success' => false, 'message' => 'ID Number is required']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id_number, username, auth_question_1, auth_question_2, auth_question_3 FROM users WHERE id_number = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'ID Number not found']);
        exit;
    }
    
    if (empty($user['auth_question_1']) || empty($user['auth_question_2']) || empty($user['auth_question_3'])) {
        echo json_encode(['success' => false, 'message' => 'No authentication questions found for this account']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'questions' => [
            $user['auth_question_1'],
            $user['auth_question_2'],
            $user['auth_question_3']
        ],
        'id_number' => $user['id_number'],
        'username' => $user['username']
    ]);
    
} catch (PDOException $e) {
    error_log("Fetch questions error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred. Please try again.']);
}
?>
