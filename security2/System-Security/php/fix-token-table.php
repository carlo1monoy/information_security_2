<?php
require_once 'config.php';

header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Fix Token Table</title>
    <style>
        body { font-family: Arial; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; max-width: 800px; margin: 0 auto; }
        .success { background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; color: #155724; }
        .error { background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; color: #721c24; }
        .info { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; color: #0c5460; }
        .btn { padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Fix Password Reset Tokens Table</h1>
        
<?php
try {
    // Check if table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'password_reset_tokens'");
    $tableExists = $tableCheck->rowCount() > 0;
    
    if ($tableExists) {
        echo "<div class='info'>Table 'password_reset_tokens' exists. Checking schema...</div>";
        
        // Check current schema
        $structure = $pdo->query("DESCRIBE password_reset_tokens");
        $columns = $structure->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<h3>Current Schema:</h3><ul>";
        foreach ($columns as $col) {
            echo "<li><strong>{$col['Field']}</strong>: {$col['Type']}</li>";
        }
        echo "</ul>";
        
        // Drop and recreate the table
        echo "<div class='info'>Dropping old table and creating new one with correct schema...</div>";
        
        $pdo->exec("DROP TABLE IF EXISTS password_reset_tokens");
        echo "<div class='success'>✅ Old table dropped</div>";
        
        $pdo->exec("CREATE TABLE password_reset_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(64) NOT NULL,
            expires_at DATETIME NOT NULL,
            used TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_token (token),
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        
        echo "<div class='success'>✅ New table created with correct schema</div>";
        
    } else {
        echo "<div class='info'>Table doesn't exist. Creating new table...</div>";
        
        $pdo->exec("CREATE TABLE password_reset_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(64) NOT NULL,
            expires_at DATETIME NOT NULL,
            used TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_token (token),
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        
        echo "<div class='success'>✅ Table created successfully</div>";
    }
    
    // Verify new schema
    echo "<h3>New Schema:</h3>";
    $newStructure = $pdo->query("DESCRIBE password_reset_tokens");
    $newColumns = $newStructure->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<ul>";
    foreach ($newColumns as $col) {
        echo "<li><strong>{$col['Field']}</strong>: {$col['Type']} {$col['Null']} {$col['Key']} {$col['Default']} {$col['Extra']}</li>";
    }
    echo "</ul>";
    
    echo "<div class='success'>";
    echo "<h2>✅ Fix Complete!</h2>";
    echo "<p>The password_reset_tokens table has been recreated with the correct schema.</p>";
    echo "<p><strong>Key changes:</strong></p>";
    echo "<ul>";
    echo "<li>expires_at: Changed from TIMESTAMP to DATETIME</li>";
    echo "<li>used: Changed from BOOLEAN to TINYINT(1)</li>";
    echo "<li>Added indexes for better performance</li>";
    echo "<li>Removed foreign key constraint that might cause issues</li>";
    echo "</ul>";
    echo "<p>You can now test the forgot password and change password flow.</p>";
    echo "</div>";
    
} catch (PDOException $e) {
    echo "<div class='error'>";
    echo "<strong>❌ Error:</strong> " . htmlspecialchars($e->getMessage());
    echo "</div>";
}
?>
        
        <hr style="margin: 30px 0;">
        <h2>🎯 Next Steps</h2>
        <p>
            <a href="check-tokens.php" class="btn">📊 Check Tokens</a>
            <a href="../forgot-password.html" class="btn">🔑 Test Forgot Password</a>
            <a href="../login.html" class="btn">🔐 Go to Login</a>
        </p>
    </div>
</body>
</html>
