<?php
require_once 'config.php';

$questionMap = [
    'best_friend_elementary' => 'Who is your best friend in Elementary?',
    'favorite_pet' => 'What is the name of your favorite pet?',
    'favorite_teacher' => 'Who is your favorite teacher in high school?'
];

try {
    $stmt = $pdo->query("SELECT id, auth_question_1, auth_question_2, auth_question_3 FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $updateCount = 0;
    
    foreach ($users as $user) {
        $needsUpdate = false;
        $newQuestion1 = $user['auth_question_1'];
        $newQuestion2 = $user['auth_question_2'];
        $newQuestion3 = $user['auth_question_3'];
        
        if (isset($questionMap[$user['auth_question_1']])) {
            $newQuestion1 = $questionMap[$user['auth_question_1']];
            $needsUpdate = true;
        }
        
        if (isset($questionMap[$user['auth_question_2']])) {
            $newQuestion2 = $questionMap[$user['auth_question_2']];
            $needsUpdate = true;
        }
        
        if (isset($questionMap[$user['auth_question_3']])) {
            $newQuestion3 = $questionMap[$user['auth_question_3']];
            $needsUpdate = true;
        }
        
        if ($needsUpdate) {
            $updateStmt = $pdo->prepare("
                UPDATE users 
                SET auth_question_1 = ?, auth_question_2 = ?, auth_question_3 = ? 
                WHERE id = ?
            ");
            $updateStmt->execute([$newQuestion1, $newQuestion2, $newQuestion3, $user['id']]);
            $updateCount++;
            
            echo "Updated user ID {$user['id']}<br>";
            echo "  Q1: {$user['auth_question_1']} → {$newQuestion1}<br>";
            echo "  Q2: {$user['auth_question_2']} → {$newQuestion2}<br>";
            echo "  Q3: {$user['auth_question_3']} → {$newQuestion3}<br><br>";
        }
    }
    
    echo "<strong>Migration complete!</strong><br>";
    echo "Updated {$updateCount} user(s).<br><br>";
    echo "<a href='../login.html'>Go to Login</a>";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
