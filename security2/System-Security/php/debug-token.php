<?php
require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h2>Token Diagnostic Tool</h2>";

try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'password_reset_tokens'");
    if ($stmt->rowCount() > 0) {
        echo "<p style='color: green;'>✓ Table 'password_reset_tokens' exists</p>";
        
        $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM password_reset_tokens");
        $result = $stmt->fetch();
        echo "<p>Total tokens in database: <strong>" . $result['cnt'] . "</strong></p>";
        
        $stmt = $pdo->query("SELECT id, user_id, SUBSTRING(token, 1, 16) as token_prefix, 
                             expires_at, used, created_at, 
                             TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes_until_expiry 
                             FROM password_reset_tokens 
                             ORDER BY created_at DESC LIMIT 10");
        
        echo "<h3>Recent Tokens:</h3>";
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>User ID</th><th>Token (first 16 chars)</th><th>Expires At</th><th>Used</th><th>Created At</th><th>Status</th></tr>";
        
        while ($row = $stmt->fetch()) {
            $status = '';
            if ($row['used'] == 1) {
                $status = '<span style="color: orange;">Already Used</span>';
            } elseif ($row['minutes_until_expiry'] < 0) {
                $status = '<span style="color: red;">Expired (' . abs($row['minutes_until_expiry']) . ' min ago)</span>';
            } else {
                $status = '<span style="color: green;">Valid (' . $row['minutes_until_expiry'] . ' min left)</span>';
            }
            
            echo "<tr>";
            echo "<td>" . $row['id'] . "</td>";
            echo "<td>" . $row['user_id'] . "</td>";
            echo "<td>" . $row['token_prefix'] . "...</td>";
            echo "<td>" . $row['expires_at'] . "</td>";
            echo "<td>" . ($row['used'] ? 'Yes' : 'No') . "</td>";
            echo "<td>" . $row['created_at'] . "</td>";
            echo "<td>" . $status . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        $stmt = $pdo->query("SELECT COUNT(*) as valid_count FROM password_reset_tokens 
                            WHERE used = 0 AND expires_at > NOW()");
        $result = $stmt->fetch();
        echo "<p>Currently valid tokens: <strong style='color: " . ($result['valid_count'] > 0 ? 'green' : 'red') . ";'>" 
             . $result['valid_count'] . "</strong></p>";
        
        echo "<h3>Test Token Validation</h3>";
        echo "<form method='POST'>";
        echo "<input type='text' name='test_token' placeholder='Enter token to test' size='70' />";
        echo "<button type='submit'>Test Token</button>";
        echo "</form>";
        
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['test_token'])) {
            $testToken = $_POST['test_token'];
            echo "<h4>Testing token: " . htmlspecialchars(substr($testToken, 0, 16)) . "...</h4>";
            echo "<p>Token length: " . strlen($testToken) . "</p>";
            
            $stmt = $pdo->prepare("SELECT * FROM password_reset_tokens WHERE token = ?");
            $stmt->execute([$testToken]);
            $tokenRecord = $stmt->fetch();
            
            if ($tokenRecord) {
                echo "<p style='color: green;'>✓ Token found in database</p>";
                echo "<ul>";
                echo "<li>User ID: " . $tokenRecord['user_id'] . "</li>";
                echo "<li>Expires at: " . $tokenRecord['expires_at'] . "</li>";
                echo "<li>Used: " . ($tokenRecord['used'] ? 'Yes' : 'No') . "</li>";
                echo "<li>Created at: " . $tokenRecord['created_at'] . "</li>";
                
                $stmt = $pdo->prepare("SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > NOW()");
                $stmt->execute([$testToken]);
                $validToken = $stmt->fetch();
                
                if ($validToken) {
                    echo "<li style='color: green;'><strong>✓ Token is VALID and can be used</strong></li>";
                } else {
                    if ($tokenRecord['used'] == 1) {
                        echo "<li style='color: red;'><strong>✗ Token has already been used</strong></li>";
                    } else {
                        echo "<li style='color: red;'><strong>✗ Token has expired</strong></li>";
                    }
                }
                echo "</ul>";
            } else {
                echo "<p style='color: red;'>✗ Token NOT found in database</p>";
            }
        }
        
    } else {
        echo "<p style='color: red;'>✗ Table 'password_reset_tokens' does NOT exist</p>";
        echo "<p>Run fix-token-table.php to create it</p>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Database error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
