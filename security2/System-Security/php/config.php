<?php
/**
 * =============================================================
 * CSUCC SafeMart - Database Configuration
 * Purpose: Centralize PDO connection and shared helpers.
 * =============================================================
 */

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'csucc_safemart_db');
define('DB_USER', 'root');  // Change this to your MySQL username
define('DB_PASS', '');      // Change this to your MySQL password
define('DB_CHARSET', 'utf8mb4');

// Create PDO instance with error handling
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    
} catch (PDOException $e) {
    // Log error and show user-friendly message
    error_log("Database Connection Error: " . $e->getMessage());
    die("Database connection failed. Please contact the administrator.");
}

/**
 * Sanitize input data
 * @param string $data Input data to sanitize
 * @return string Sanitized data
 */
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

/**
 * Record a login attempt for rate-limiting and auditing
 */
function logLoginAttempt(PDO $pdo, string $username, string $ip, bool $success): void {
    // Ensure the table exists (safe to run; IF NOT EXISTS)
    $pdo->exec("CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(191) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        was_success TINYINT(1) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $stmt = $pdo->prepare("INSERT INTO login_attempts (username, ip_address, was_success) VALUES (?, ?, ?)");
    $stmt->execute([$username, $ip, $success ? 1 : 0]);
}

/**
 * Count recent failed attempts for a username+IP within given minutes
 */
function getRecentFailedAttempts(PDO $pdo, string $username, string $ip, int $minutes): int {
    // Ensure table exists (matches creator above)
    $pdo->exec("CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(191) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        was_success TINYINT(1) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $stmt = $pdo->prepare("SELECT COUNT(*) AS cnt
        FROM login_attempts
        WHERE username = ? AND ip_address = ? AND was_success = 0
          AND created_at >= (NOW() - INTERVAL ? MINUTE)");
    $stmt->execute([$username, $ip, $minutes]);
    $row = $stmt->fetch();
    return (int)($row['cnt'] ?? 0);
}
?>