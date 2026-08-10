<?php
require_once 'config.php';

try {
    // First, check what users exist
    $checkStmt = $pdo->query("
        SELECT id, username, id_number, auth_question_1, auth_question_2, auth_question_3 
        FROM users 
        WHERE auth_question_1 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
           OR auth_question_2 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
           OR auth_question_3 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
    ");
    
    $users = $checkStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($users) . " user(s) with old question format:\n";
    foreach ($users as $user) {
        echo "- ID: {$user['id']}, Username: {$user['username']}, ID: {$user['id_number']}\n";
        echo "  Q1: {$user['auth_question_1']}\n";
        echo "  Q2: {$user['auth_question_2']}\n";
        echo "  Q3: {$user['auth_question_3']}\n\n";
    }
    
    // Delete them
    $deleteStmt = $pdo->prepare("
        DELETE FROM users 
        WHERE auth_question_1 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
           OR auth_question_2 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
           OR auth_question_3 IN ('best_friend_elementary', 'favorite_pet', 'favorite_teacher')
    ");
    
    $deleteStmt->execute();
    $deletedCount = $deleteStmt->rowCount();
    
    echo "SUCCESS: Deleted {$deletedCount} user(s) with old question format.\n";
    echo "The database is now ready for new registrations with correct question format.\n";
    
} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>
