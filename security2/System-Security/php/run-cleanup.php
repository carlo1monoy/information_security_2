<?php
require_once 'config.php';

header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Cleanup</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .info {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
        }
        th {
            background: #007bff;
            color: white;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 5px;
        }
        .btn:hover {
            background: #0056b3;
        }
        h1 {
            color: #333;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Database Cleanup - Old Authentication Questions</h1>
        
<?php
try {
    // Check what users exist with old format
    $checkStmt = $pdo->query("
        SELECT id, username, id_number, auth_question_1, auth_question_2, auth_question_3 
        FROM users 
        WHERE auth_question_1 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
           OR auth_question_2 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
           OR auth_question_3 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
    ");
    
    $users = $checkStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($users) > 0) {
        echo "<div class='info'>";
        echo "<strong>📋 Found " . count($users) . " user(s) with old question format:</strong>";
        echo "</div>";
        
        echo "<table>";
        echo "<tr><th>ID</th><th>Username</th><th>ID Number</th><th>Question 1</th><th>Question 2</th><th>Question 3</th></tr>";
        
        foreach ($users as $user) {
            echo "<tr>";
            echo "<td>{$user['id']}</td>";
            echo "<td>{$user['username']}</td>";
            echo "<td>{$user['id_number']}</td>";
            echo "<td>{$user['auth_question_1']}</td>";
            echo "<td>{$user['auth_question_2']}</td>";
            echo "<td>{$user['auth_question_3']}</td>";
            echo "</tr>";
        }
        
        echo "</table>";
        
        // Automatically delete them
        $deleteStmt = $pdo->prepare("
            DELETE FROM users 
            WHERE auth_question_1 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
               OR auth_question_2 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
               OR auth_question_3 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
        ");
        
        $deleteStmt->execute();
        $deletedCount = $deleteStmt->rowCount();
        
        echo "<div class='success'>";
        echo "<strong>✅ SUCCESS!</strong><br>";
        echo "Deleted {$deletedCount} user(s) with old question format.<br>";
        echo "The database is now clean and ready for new registrations.";
        echo "</div>";
        
    } else {
        echo "<div class='success'>";
        echo "<strong>✅ All Clear!</strong><br>";
        echo "No users found with old question format.<br>";
        echo "The database is already using the correct authentication question format.";
        echo "</div>";
    }
    
    // Show current users after cleanup
    $currentStmt = $pdo->query("SELECT id, username, id_number, auth_question_1, auth_question_2, auth_question_3 FROM users");
    $currentUsers = $currentStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h2>📊 Current Database Status</h2>";
    if (count($currentUsers) > 0) {
        echo "<div class='info'>Total users in database: " . count($currentUsers) . "</div>";
        echo "<table>";
        echo "<tr><th>ID</th><th>Username</th><th>ID Number</th><th>Question 1</th><th>Question 2</th><th>Question 3</th></tr>";
        
        foreach ($currentUsers as $user) {
            echo "<tr>";
            echo "<td>{$user['id']}</td>";
            echo "<td>{$user['username']}</td>";
            echo "<td>{$user['id_number']}</td>";
            echo "<td>" . htmlspecialchars(substr($user['auth_question_1'], 0, 50)) . "...</td>";
            echo "<td>" . htmlspecialchars(substr($user['auth_question_2'], 0, 50)) . "...</td>";
            echo "<td>" . htmlspecialchars(substr($user['auth_question_3'], 0, 50)) . "...</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<div class='info'>Database is empty. No users registered yet.</div>";
    }
    
} catch (PDOException $e) {
    echo "<div class='error'>";
    echo "<strong>❌ ERROR:</strong> " . htmlspecialchars($e->getMessage());
    echo "</div>";
}
?>
        
        <h2>🎯 Next Steps</h2>
        <p><strong>The cleanup is complete!</strong> You can now:</p>
        <ol>
            <li>Register new accounts with the corrected authentication questions</li>
            <li>Test the forgot password functionality with the new accounts</li>
            <li>Verify that unique questions are displayed (no duplicates)</li>
        </ol>
        
        <a href="../register.html" class="btn">📝 Go to Registration</a>
        <a href="../login.html" class="btn">🔐 Go to Login</a>
        <a href="run-cleanup.php" class="btn">🔄 Refresh This Page</a>
    </div>
</body>
</html>
