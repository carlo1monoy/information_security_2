<?php
require_once 'config.php';

header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Token Diagnostics</title>
    <style>
        body { font-family: Arial; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; max-width: 1200px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background: #007bff; color: white; }
        tr:nth-child(even) { background: #f9f9f9; }
        .success { background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; color: #155724; }
        .error { background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; color: #721c24; }
        .info { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; color: #0c5460; }
        .code { background: #f4f4f4; padding: 10px; border-radius: 5px; font-family: monospace; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Password Reset Token Diagnostics</h1>
        
<?php
try {
    // Check if table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'password_reset_tokens'");
    $tableExists = $tableCheck->rowCount() > 0;
    
    if (!$tableExists) {
        echo "<div class='error'>";
        echo "<strong>❌ Table 'password_reset_tokens' does not exist!</strong><br>";
        echo "Creating table now...";
        echo "</div>";
        
        $pdo->exec("CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(64) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        
        echo "<div class='success'>✅ Table created successfully!</div>";
    } else {
        echo "<div class='success'>✅ Table 'password_reset_tokens' exists</div>";
    }
    
    // Show table structure
    echo "<h2>📋 Table Structure</h2>";
    $structure = $pdo->query("DESCRIBE password_reset_tokens");
    $columns = $structure->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    foreach ($columns as $col) {
        echo "<tr>";
        echo "<td>{$col['Field']}</td>";
        echo "<td>{$col['Type']}</td>";
        echo "<td>{$col['Null']}</td>";
        echo "<td>{$col['Key']}</td>";
        echo "<td>{$col['Default']}</td>";
        echo "<td>{$col['Extra']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Show all tokens
    echo "<h2>🎫 All Reset Tokens</h2>";
    $tokens = $pdo->query("SELECT 
        prt.*,
        u.username,
        u.id_number,
        CASE 
            WHEN prt.used = 1 THEN 'Used'
            WHEN prt.expires_at < NOW() THEN 'Expired'
            ELSE 'Valid'
        END as status
        FROM password_reset_tokens prt
        LEFT JOIN users u ON prt.user_id = u.id
        ORDER BY prt.created_at DESC
    ");
    $tokensList = $tokens->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($tokensList) > 0) {
        echo "<div class='info'>Found " . count($tokensList) . " token(s)</div>";
        echo "<table>";
        echo "<tr><th>ID</th><th>User</th><th>Token (first 16 chars)</th><th>Created</th><th>Expires</th><th>Status</th></tr>";
        foreach ($tokensList as $token) {
            $statusClass = '';
            if ($token['status'] == 'Valid') $statusClass = 'style="background: #d4edda;"';
            elseif ($token['status'] == 'Used') $statusClass = 'style="background: #f8f9fa;"';
            else $statusClass = 'style="background: #f8d7da;"';
            
            echo "<tr {$statusClass}>";
            echo "<td>{$token['id']}</td>";
            echo "<td>{$token['username']} ({$token['id_number']})</td>";
            echo "<td>" . substr($token['token'], 0, 16) . "...</td>";
            echo "<td>{$token['created_at']}</td>";
            echo "<td>{$token['expires_at']}</td>";
            echo "<td><strong>{$token['status']}</strong></td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Count valid tokens
        $validCount = 0;
        foreach ($tokensList as $token) {
            if ($token['status'] == 'Valid') $validCount++;
        }
        
        if ($validCount > 0) {
            echo "<div class='success'>✅ You have {$validCount} valid token(s) that can be used</div>";
        } else {
            echo "<div class='info'>ℹ️ No valid tokens. Please go through the forgot password process to generate a new token.</div>";
        }
    } else {
        echo "<div class='info'>ℹ️ No tokens in database. Please go through the forgot password process to generate a token.</div>";
    }
    
    // Test token generation
    echo "<h2>🧪 Test Token Generation</h2>";
    echo "<div class='info'>";
    echo "<strong>Sample token that would be generated:</strong><br>";
    $testToken = bin2hex(random_bytes(32));
    echo "<div class='code'>{$testToken}</div>";
    echo "Length: " . strlen($testToken) . " characters<br>";
    echo "This matches the VARCHAR(64) column size ✓";
    echo "</div>";
    
    // Show current time for debugging
    echo "<h2>⏰ Server Time Information</h2>";
    $timeInfo = $pdo->query("SELECT NOW() as current_time, DATE_ADD(NOW(), INTERVAL 1 HOUR) as one_hour_later")->fetch();
    echo "<div class='info'>";
    echo "<strong>Current server time:</strong> {$timeInfo['current_time']}<br>";
    echo "<strong>Token expiry (1 hour later):</strong> {$timeInfo['one_hour_later']}";
    echo "</div>";
    
} catch (PDOException $e) {
    echo "<div class='error'>";
    echo "<strong>❌ Database Error:</strong><br>";
    echo htmlspecialchars($e->getMessage());
    echo "</div>";
}
?>
        
        <hr style="margin: 30px 0;">
        <h2>🔄 Actions</h2>
        <p>
            <a href="../forgot-password.html" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">Go to Forgot Password</a>
            <a href="check-tokens.php" style="padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;">Refresh</a>
        </p>
    </div>
</body>
</html>
