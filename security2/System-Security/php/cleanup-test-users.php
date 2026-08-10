<?php
require_once 'config.php';

echo "<h2>Database Cleanup - Remove Test Users with Old Question Format</h2>";
echo "<p>This script will remove users who have old shortcode values in their authentication questions.</p>";

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['confirm'])) {
    try {
        $stmt = $pdo->prepare("
            DELETE FROM users 
            WHERE auth_question_1 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
               OR auth_question_2 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
               OR auth_question_3 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
        ");
        
        $stmt->execute();
        $deletedCount = $stmt->rowCount();
        
        echo "<div style='padding: 20px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; margin: 20px 0;'>";
        echo "<strong>✓ Cleanup complete!</strong><br>";
        echo "Deleted {$deletedCount} user(s) with old question format.<br><br>";
        echo "You can now register new accounts with the corrected authentication questions.<br>";
        echo "</div>";
        echo "<a href='../register.html' style='padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;'>Go to Registration</a>";
        
    } catch (PDOException $e) {
        echo "<div style='padding: 20px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; margin: 20px 0;'>";
        echo "<strong>Error:</strong> " . $e->getMessage();
        echo "</div>";
    }
} else {
    try {
        $stmt = $pdo->query("
            SELECT id, username, id_number, auth_question_1, auth_question_2, auth_question_3 
            FROM users 
            WHERE auth_question_1 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
               OR auth_question_2 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
               OR auth_question_3 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
        ");
        
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($users) > 0) {
            echo "<div style='padding: 20px; background: #fff3cd; border: 1px solid #ffeeba; border-radius: 5px; margin: 20px 0;'>";
            echo "<strong>Found " . count($users) . " user(s) with old question format:</strong><br><br>";
            
            echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr style='background: #f8f9fa;'>";
            echo "<th>ID</th><th>Username</th><th>ID Number</th><th>Question 1</th><th>Question 2</th><th>Question 3</th>";
            echo "</tr>";
            
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
            echo "</div>";
            
            echo "<form method='POST' onsubmit='return confirm(\"Are you sure you want to delete these " . count($users) . " user(s)? This action cannot be undone.\")'>";
            echo "<input type='hidden' name='confirm' value='1'>";
            echo "<button type='submit' style='padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;'>Delete These Users</button>";
            echo "</form>";
        } else {
            echo "<div style='padding: 20px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; margin: 20px 0;'>";
            echo "<strong>✓ No users found with old question format!</strong><br>";
            echo "All users are using the new authentication question format.";
            echo "</div>";
            echo "<a href='../login.html' style='padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;'>Go to Login</a>";
        }
        
    } catch (PDOException $e) {
        echo "<div style='padding: 20px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; margin: 20px 0;'>";
        echo "<strong>Error:</strong> " . $e->getMessage();
        echo "</div>";
    }
}
?>
