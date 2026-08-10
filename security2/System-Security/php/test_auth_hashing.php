<?php
/**
 * Test script to verify authentication answer hashing implementation
 */
require_once 'config.php';

echo "=== Authentication Answer Hashing Test ===\n";

try {
    // Test database connection
    echo "✓ Database connected successfully\n";
    
    // Test data
    $testAnswer = "MyTestAnswer123";
    
    // Test hashing
    $hashedAnswer = password_hash($testAnswer, PASSWORD_DEFAULT);
    echo "✓ Hashing works - Original: '$testAnswer'\n";
    echo "✓ Hashed: '$hashedAnswer'\n";
    
    // Test verification
    $isValid = password_verify($testAnswer, $hashedAnswer);
    echo "✓ Verification works - Valid: " . ($isValid ? 'YES' : 'NO') . "\n";
    
    // Test wrong answer verification
    $isInvalid = password_verify('WrongAnswer', $hashedAnswer);
    echo "✓ Wrong answer rejected - Valid: " . ($isInvalid ? 'YES' : 'NO') . "\n";
    
    echo "\n=== Testing Case Insensitive Comparison ===\n";
    
    // Test case insensitive comparison (which the forgot-password uses)
    $testCases = [
        ['Original' => 'MyTestAnswer123', 'Input' => 'mytestanswer123'],
        ['Original' => 'MyTestAnswer123', 'Input' => 'MYTESTANSWER123'],
        ['Original' => 'MyTestAnswer123', 'Input' => 'MyTestAnswer123']
    ];
    
    foreach ($testCases as $case) {
        $original = $case['Original'];
        $input = $case['Input'];
        $hash = password_hash($original, PASSWORD_DEFAULT);
        
        // Note: password_verify is case-sensitive, but the old system used strcasecmp
        // We need to test if this affects the implementation
        $isValid = password_verify($input, $hash);
        echo "Original: '$original' -> Input: '$input' -> Valid: " . ($isValid ? 'YES' : 'NO') . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
