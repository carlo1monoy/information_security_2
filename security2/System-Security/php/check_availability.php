<?php
/**
 * =============================================================
 * CSUCC SafeMart - Check Availability (AJAX)
 * Purpose: Real-time checks for username/ID/email availability.
 * Notes: Returns JSON; preserves existing logic/behavior.
 * =============================================================
 */

require_once 'config.php';

header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$action = $_POST['action'] ?? '';

switch ($action) {
    case 'check_username':
        // REQUIREMENT: Check if username already exists
        checkUsername($pdo);
        break;
        
    case 'check_id':
        // REQUIREMENT: Check if ID number already exists (primary key)
        checkIDNumber($pdo);
        break;
        
    case 'check_email':
        // Check if email already exists
        checkEmail($pdo);
        break;
        
    case 'get_next_id':
        // Get next available ID number from database
        getNextIDNumber($pdo);
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
        exit;
}

/**
 * Check if username exists in database
 * @param PDO $pdo Database connection
 */
function checkUsername($pdo) {
    $username = trim($_POST['username'] ?? '');
    
    if (empty($username)) {
        echo json_encode(['error' => 'Username is required']);
        exit;
    }
    
    if (strlen($username) < 3) {
        echo json_encode(['error' => 'Username too short']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $exists = $stmt->fetch() !== false;
        
        echo json_encode(['exists' => $exists]);
    } catch (PDOException $e) {
        error_log("Username check error: " . $e->getMessage());
        echo json_encode(['error' => 'Database error']);
    }
}

/**
 * Check if ID number exists in database
 * @param PDO $pdo Database connection
 */
function checkIDNumber($pdo) {
    $idno = trim($_POST['idno'] ?? '');
    
    if (empty($idno)) {
        echo json_encode(['error' => 'ID Number is required']);
        exit;
    }
    
    // Validate format
    if (!preg_match('/^[0-9]{4}-[0-9]{4}$/', $idno)) {
        echo json_encode(['error' => 'Invalid ID format']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id_number = ?");
        $stmt->execute([$idno]);
        $exists = $stmt->fetch() !== false;
        
        echo json_encode(['exists' => $exists]);
    } catch (PDOException $e) {
        error_log("ID check error: " . $e->getMessage());
        echo json_encode(['error' => 'Database error']);
    }
}

/**
 * Check if email exists in database
 * @param PDO $pdo Database connection
 */
function checkEmail($pdo) {
    $email = trim($_POST['email'] ?? '');
    
    if (empty($email)) {
        echo json_encode(['error' => 'Email is required']);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['error' => 'Invalid email format']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $exists = $stmt->fetch() !== false;
        
        echo json_encode(['exists' => $exists]);
    } catch (PDOException $e) {
        error_log("Email check error: " . $e->getMessage());
        echo json_encode(['error' => 'Database error']);
    }
}

/**
 * Get next available ID number from database
 * @param PDO $pdo Database connection
 */
function getNextIDNumber($pdo) {
    try {
        // Get the highest existing ID number
        $stmt = $pdo->prepare("SELECT id_number FROM users WHERE id_number LIKE '2025-%' ORDER BY id_number DESC LIMIT 1");
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            // Extract the numeric part and increment
            $lastNumber = intval(substr($result['id_number'], 5));
            $nextNumber = $lastNumber + 1;
        } else {
            // No existing records, start with 1
            $nextNumber = 1;
        }
        
        // Format as 2025-XXXX
        $nextID = '2025-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
        
        // Double-check this ID doesn't exist (race condition protection)
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id_number = ?");
        $stmt->execute([$nextID]);
        
        if ($stmt->fetch()) {
            // If it exists, try the next number
            $nextNumber++;
            $nextID = '2025-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
        }
        
        echo json_encode(['id_number' => $nextID]);
        
    } catch (PDOException $e) {
        error_log("Get next ID error: " . $e->getMessage());
        echo json_encode(['error' => 'Database error']);
    }
}
?>