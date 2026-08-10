<?php
/**
 * Registration Processing Script
 * Handles user registration with comprehensive validation
 * Following all requirements from Registration-Instructions.docx
 */

require_once 'config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die('Method not allowed');
}

$errors = [];
$data = [];

// ===== SANITIZE AND COLLECT INPUT DATA =====
$data['id_number'] = sanitizeInput($_POST['idno'] ?? '');
$data['first_name'] = sanitizeInput($_POST['firstname'] ?? '');
$data['middle_name'] = sanitizeInput($_POST['mi'] ?? '');
$data['last_name'] = sanitizeInput($_POST['lastname'] ?? '');

// ===== ADDED: Handle custom extension name =====
// REQUIREMENT: Name Extension with Other option
$extnameSelect = sanitizeInput($_POST['extname'] ?? '');
if ($extnameSelect === 'Other') {
    $data['extension_name'] = sanitizeInput($_POST['custom_extname'] ?? '');
} else if ($extnameSelect !== '') {
    $data['extension_name'] = $extnameSelect;
} else {
    $data['extension_name'] = '';
}
// ===== END ADDED =====

$data['birthdate'] = sanitizeInput($_POST['birthdate'] ?? '');
$data['age'] = intval($_POST['age'] ?? 0);
$data['sex'] = sanitizeInput($_POST['sex'] ?? '');
$data['username'] = sanitizeInput($_POST['username'] ?? '');
$data['password'] = $_POST['password'] ?? '';
$data['password2'] = $_POST['password2'] ?? '';
$data['email'] = sanitizeInput($_POST['email'] ?? '');
$data['purok_street'] = sanitizeInput($_POST['purok'] ?? '');
$data['barangay'] = sanitizeInput($_POST['barangay'] ?? '');
$data['municipality_city'] = sanitizeInput($_POST['municipality'] ?? '');
$data['province'] = sanitizeInput($_POST['province'] ?? '');
$data['country'] = sanitizeInput($_POST['country'] ?? '');
$data['zip_code'] = sanitizeInput($_POST['zip'] ?? '');
$data['auth_question_1'] = sanitizeInput($_POST['auth_question1'] ?? '');
$data['auth_answer_1'] = sanitizeInput($_POST['auth_answer1'] ?? '');
$data['auth_question_2'] = sanitizeInput($_POST['auth_question2'] ?? '');
$data['auth_answer_2'] = sanitizeInput($_POST['auth_answer2'] ?? '');
$data['auth_question_3'] = sanitizeInput($_POST['auth_question3'] ?? '');
$data['auth_answer_3'] = sanitizeInput($_POST['auth_answer3'] ?? '');

// ===== VALIDATE REQUIRED FIELDS =====
// REQUIREMENT: All required fields must be filled
$requiredFields = [
    'id_number' => 'ID Number',
    'first_name' => 'First Name',
    'last_name' => 'Family Name',
    'birthdate' => 'Birthdate',
    'age' => 'Age',
    'sex' => 'Sex',
    'username' => 'Username',
    'password' => 'Password',
    'email' => 'Email Address',
    'purok_street' => 'Purok/Street',
    'barangay' => 'Barangay',
    'municipality_city' => 'Municipality/City',
    'province' => 'Province',
    'country' => 'Country',
    'zip_code' => 'Zip Code',
    'auth_question_1' => 'Authentication Question 1',
    'auth_answer_1' => 'Authentication Answer 1',
    'auth_question_2' => 'Authentication Question 2',
    'auth_answer_2' => 'Authentication Answer 2',
    'auth_question_3' => 'Authentication Question 3',
    'auth_answer_3' => 'Authentication Answer 3'
];

foreach ($requiredFields as $field => $label) {
    if (empty($data[$field])) {
        $errors[] = "$label is required";
    }
}

// ===== VALIDATE AND REGENERATE ID NUMBER IF NEEDED =====
// REQUIREMENT: ID number format xxxx-xxxx, primary key (unique)
if (!empty($data['id_number'])) {
    $idError = validateIDNumber($data['id_number']);
    if ($idError) {
        $errors[] = $idError;
    } else {
        // Check if ID number already exists in database
        // REQUIREMENT: ID number is primary key, must be unique
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id_number = ?");
        $stmt->execute([$data['id_number']]);
        if ($stmt->fetch()) {
            // ID already exists, generate a new one
            $data['id_number'] = generateNextAvailableID($pdo);
        }
    }
}

// ===== VALIDATE NAME FIELDS =====
// REQUIREMENT: All name validation rules
$nameFields = [
    'first_name' => 'First Name',
    'last_name' => 'Family Name'
];

// Middle name is optional but must be validated if provided
if (!empty($data['middle_name'])) {
    $nameFields['middle_name'] = 'Middle Name';
}

// Extension name is optional but must be validated if provided
if (!empty($data['extension_name'])) {
    $nameErrors = validateExtensionName($data['extension_name']);
    $errors = array_merge($errors, $nameErrors);
}

foreach ($nameFields as $field => $label) {
    if (!empty($data[$field])) {
        $nameErrors = validateName($data[$field], $label);
        $errors = array_merge($errors, $nameErrors);
    }
}

// ===== VALIDATE AGE =====
// REQUIREMENT: Age computed from birthdate, legal age only (18+)
if (!empty($data['birthdate'])) {
    $ageError = validateAge($data['birthdate']);
    if ($ageError) {
        $errors[] = $ageError;
    }
    
    // Double-check age value matches birthdate
    $birthDate = new DateTime($data['birthdate']);
    $today = new DateTime('today');
    $calculatedAge = $birthDate->diff($today)->y;
    
    if ($calculatedAge != $data['age']) {
        $errors[] = "Age does not match birthdate";
    }
}

// ===== VALIDATE PASSWORD =====
// REQUIREMENT: Password must be hashed, minimum length, must match confirmation
if (!empty($data['password'])) {
    if (strlen($data['password']) < 8) {
        $errors[] = "Password must be at least 8 characters long";
    }
    
    // REQUIREMENT: Password and re-enter password must match
    if ($data['password'] !== $data['password2']) {
        $errors[] = "Passwords do not match";
    }
}

// ===== VALIDATE EMAIL =====
// REQUIREMENT: Valid email format
if (!empty($data['email'])) {
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Invalid email format";
    } else {
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            $errors[] = "Email Address already exists";
        }
    }
}

// ===== VALIDATE USERNAME =====
// REQUIREMENT: Username must be unique
if (!empty($data['username'])) {
    if (strlen($data['username']) < 3) {
        $errors[] = "Username must be at least 3 characters";
    } else {
        // Check if username already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$data['username']]);
        if ($stmt->fetch()) {
            $errors[] = "Username already exists";
        }
    }
}

// ===== VALIDATE ADDRESS FIELDS =====
// REQUIREMENT: Basic validation for all address fields
$addressFields = ['purok_street', 'barangay', 'municipality_city', 'province', 'country'];
foreach ($addressFields as $field) {
    if (!empty($data[$field])) {
        $addressError = validateAddressField($data[$field]);
        if ($addressError) {
            $errors[] = $addressError;
        }
    }
}

// Validate zip code
if (!empty($data['zip_code'])) {
    if (!preg_match('/^[0-9]{4,10}$/', $data['zip_code'])) {
        $errors[] = "Invalid zip code format";
    }
}

// ===== IF ERRORS EXIST, RETURN THEM =====
if (!empty($errors)) {
    // Redirect back with errors
    $_SESSION['registration_errors'] = $errors;
    $_SESSION['registration_data'] = $_POST;
    header('Location: ../register.html?error=validation');
    exit;
}

// ===== INSERT USER INTO DATABASE =====
try {
    // REQUIREMENT: Password must be hashed
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    
    // SECURITY: Hash authentication answers before storage (normalize case for consistency)
    $hashedAuthAnswer1 = password_hash(strtolower($data['auth_answer_1']), PASSWORD_DEFAULT);
    $hashedAuthAnswer2 = password_hash(strtolower($data['auth_answer_2']), PASSWORD_DEFAULT);
    $hashedAuthAnswer3 = password_hash(strtolower($data['auth_answer_3']), PASSWORD_DEFAULT);
    
    // Prepare SQL statement
    $stmt = $pdo->prepare("
        INSERT INTO users (
            id_number, first_name, middle_name, last_name, extension_name,
            birthdate, age, sex, username, password, email,
            purok_street, barangay, municipality_city, province, country, zip_code,
            auth_question_1, auth_answer_1, auth_question_2, auth_answer_2, 
            auth_question_3, auth_answer_3
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    // Execute with data (using hashed authentication answers)
    $stmt->execute([
        $data['id_number'],
        $data['first_name'],
        $data['middle_name'] ?: null,
        $data['last_name'],
        $data['extension_name'] ?: null,
        $data['birthdate'],
        $data['age'],
        $data['sex'],
        $data['username'],
        $hashedPassword,
        $data['email'],
        $data['purok_street'],
        $data['barangay'],
        $data['municipality_city'],
        $data['province'],
        $data['country'],
        $data['zip_code'],
        $data['auth_question_1'],
        $hashedAuthAnswer1,
        $data['auth_question_2'],
        $hashedAuthAnswer2,
        $data['auth_question_3'],
        $hashedAuthAnswer3
    ]);
    
    // Success - redirect to login page
    $_SESSION['registration_success'] = true;
    header('Location: ../login.html?success=registered');
    exit;
    
} catch (PDOException $e) {
    error_log("Registration error: " . $e->getMessage());
    $_SESSION['registration_errors'] = ['Registration failed. Please try again.'];
    header('Location: ../register.html?error=database');
    exit;
}

// ===== HELPER FUNCTIONS =====

// Note: sanitizeInput is already defined in config.php; we use that one to avoid duplication

/**
 * Validate ID Number format
 * REQUIREMENT: Format xxxx-xxxx, only numbers
 * @param string $idNumber ID number to validate
 * @return string|null Error message or null if valid
 */
function validateIDNumber($idNumber) {
    if (!preg_match('/^[0-9]{4}-[0-9]{4}$/', $idNumber)) {
        return "ID Number must be in format xxxx-xxxx";
    }
    return null;
}

/**
 * Validate name fields
 * REQUIREMENT: All name validation rules
 * @param string $name Name to validate
 * @param string $label Field label for error messages
 * @return array Array of error messages
 */
function validateName($name, $label) {
    $errors = [];
    
    // REQUIREMENT: Special characters not allowed
    if (!preg_match('/^[a-zA-Z\s]+$/', $name)) {
        $errors[] = "$label: Special characters are not allowed";
    }
    
    // REQUIREMENT: Numbers not allowed
    if (preg_match('/\d/', $name)) {
        $errors[] = "$label: Numbers are not allowed";
    }
    
    // REQUIREMENT: Double spaces not allowed
    if (strpos($name, '  ') !== false) {
        $errors[] = "$label: Double spaces are not allowed";
    }
    
    // REQUIREMENT: All capital letters not allowed
    if ($name === strtoupper($name) && strlen($name) > 1) {
        $errors[] = "$label: All capital letters are not allowed";
    }
    
    // REQUIREMENT: Three consecutive identical letters not allowed
    if (preg_match('/(.)\1{2,}/i', $name)) {
        $errors[] = "$label: Three consecutive identical letters are not allowed";
    }
    
    // REQUIREMENT: Proper capitalization - first letter capital, rest lowercase
    $words = explode(' ', $name);
    foreach ($words as $word) {
        if (strlen($word) > 0) {
            $firstLetter = substr($word, 0, 1);
            $restLetters = substr($word, 1);
            
            if ($firstLetter !== strtoupper($firstLetter)) {
                $errors[] = "$label: First letter must be capital (e.g., Juan Carlo)";
                break;
            }
            
            if (strlen($restLetters) > 0 && $restLetters !== strtolower($restLetters)) {
                $errors[] = "$label: Only first letter should be capital, rest must be lowercase (e.g., Juan Carlo)";
                break;
            }
        }
    }
    
    return $errors;
}

/**
 * Validate extension name
 * REQUIREMENT: Extension name validation for custom input
 * @param string $extension Extension name to validate
 * @return array Array of error messages
 */
function validateExtensionName($extension) {
    $errors = [];
    
    // Allow standard extensions
    $standardExtensions = ['Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    
    if (!in_array($extension, $standardExtensions)) {
        // Validate custom extension (Roman numerals)
        if (!preg_match('/^[IVX]+$/i', $extension)) {
            $errors[] = "Extension: Invalid format. Use Roman numerals (e.g., I, II, III)";
        }
    }
    
    return $errors;
}

/**
 * Validate age from birthdate
 * REQUIREMENT: Legal age only (18+)
 * @param string $birthdate Birthdate in YYYY-MM-DD format
 * @return string|null Error message or null if valid
 */
function validateAge($birthdate) {
    $birthDate = new DateTime($birthdate);
    $today = new DateTime('today');
    $age = $birthDate->diff($today)->y;
    
    if ($age < 18) {
        return "Must be at least 18 years old";
    }
    
    if ($age > 120) {
        return "Invalid age";
    }
    
    return null;
}

/**
 * Validate address field
 * REQUIREMENT: Basic validation for address fields
 * @param string $address Address field to validate
 * @return string|null Error message or null if valid
 */
function validateAddressField($address) {
    // Allow letters, numbers, spaces, commas, periods, hyphens
    if (!preg_match('/^[a-zA-Z0-9\s,.\-]+$/', $address)) {
        return "Address: Invalid characters";
    }
    
    // Check for double spaces
    if (strpos($address, '  ') !== false) {
        return "Address: Double spaces are not allowed";
    }
    
    return null;
}

/**
 * Generate next available ID number from database
 * REQUIREMENT: Auto-increment ID starting from 2025-0001
 * @param PDO $pdo Database connection
 * @return string Next available ID number
 */
function generateNextAvailableID($pdo) {
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
        while (true) {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE id_number = ?");
            $stmt->execute([$nextID]);
            
            if (!$stmt->fetch()) {
                // ID is available
                break;
            }
            
            // Try next number
            $nextNumber++;
            $nextID = '2025-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
        }
        
        return $nextID;
        
    } catch (PDOException $e) {
        error_log("Generate next ID error: " . $e->getMessage());
        // Fallback to a random number to avoid conflicts
        return '2025-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }
}
?>