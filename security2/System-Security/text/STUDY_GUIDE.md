# Vinta Market - Implementation Study Guide

## Overview
This document explains all the changes made to implement the final submission requirements for the Vinta Market vintage clothing store web application.

---

## 📋 **Requirements Implementation Summary**

### **1. FORM STRUCTURE CHANGES**

#### **A. Prospect Name Above Header**
**Files Modified:** `home.html`, `login.html`, `register.html`, `forgot-password.html`, `change-password.html`

**What I Added:**
```html
<div class="prospect-name">Vinta Market - Vintage Clothing Store</div>
```

**Why:** Required to display the specific system name above the header on all pages.

#### **B. Dynamic Header Navigation**
**Files Modified:** All HTML files

**Logic Implemented:**
- **Home Page:** Home, Register, Log-in
- **Login Page:** Home, Register (removed Login from nav)
- **Register Page:** Home, Log-in (removed Register from nav)
- **Logged-in Pages:** Home, Log-out

**Code Example:**
```html
<!-- Login page navigation -->
<nav class="navigation">
  <a href="home.html" class="nav-link">Home</a>
  <a href="register.html" class="nav-link">Register</a>
</nav>
```

#### **C. Footer Copyright Statement**
**Files Modified:** All HTML files

**What I Changed:**
```html
<!-- Before -->
<p>2025 Vinta Market Bringing timeless vintage fashion.</p>

<!-- After -->
<p>&copy; 2025 Vinta Market. All rights reserved. Bringing timeless vintage fashion to your wardrobe.</p>
```

---

### **2. FORM VALIDATION SYSTEM**

#### **A. Label Positioning and Required Indicators**
**Files Modified:** `register.html`, `login.html`, `forgot-password.html`, `change-password.html`

**What I Added:**
```html
<!-- Before -->
<input type="text" id="firstname" placeholder="Enter first name" required />

<!-- After -->
<label for="firstname">First Name *</label>
<input type="text" id="firstname" name="firstname" placeholder="Enter first name" required />
<div class="error-message" id="firstname-error"></div>
```

**CSS for Required Asterisks:**
```css
.form-group label:has(+ input[required])::after {
  content: " *";
  color: #d32f2f;
}
```

#### **B. ID Number Format Validation**
**Files Modified:** `register.html`, `js/register.js`

**HTML Pattern:**
```html
<input type="text" id="idno" name="idno" placeholder="xxxx-xxxx" pattern="[0-9]{4}-[0-9]{4}" required />
```

**JavaScript Validation:**
```javascript
function validateIDNumber(field) {
    const value = field.value.trim();
    const idPattern = /^[0-9]{4}-[0-9]{4}$/;
    
    if (!idPattern.test(value)) {
        showError('idno-error', 'ID Number must be in format xxxx-xxxx');
        return false;
    }
    return true;
}
```

---

### **3. COMPREHENSIVE FORM VALIDATION**

#### **A. Name Field Validation**
**File:** `js/register.js`

**Validation Rules Implemented:**
1. **No Special Characters:** Only letters and spaces allowed
2. **No Double Spaces:** Prevents "John  Doe" format
3. **No All Caps:** Prevents "JOHN DOE" format
4. **No Three Consecutive Letters:** Prevents "Jooohn" format
5. **Proper Capitalization:** First letter capital, rest lowercase

**Code Example:**
```javascript
function validateNameField(field) {
    const value = field.value.trim();
    
    // Check for special characters
    if (!/^[a-zA-Z\s]+$/.test(value)) {
        showError(fieldId + '-error', 'Special characters are not allowed');
        return false;
    }
    
    // Check for double spaces
    if (value.includes('  ')) {
        showError(fieldId + '-error', 'Double spaces are not allowed');
        return false;
    }
    
    // Check for all capital letters
    if (value === value.toUpperCase() && value.length > 1) {
        showError(fieldId + '-error', 'All capital letters are not allowed');
        return false;
    }
    
    // Check for three consecutive identical letters
    if (/(.)\1{2,}/i.test(value)) {
        showError(fieldId + '-error', 'Three consecutive identical letters are not allowed');
        return false;
    }
    
    // Check proper capitalization (Juan Carlo format)
    const words = value.split(' ');
    for (let word of words) {
        if (word.length > 0) {
            const firstLetter = word[0];
            const restLetters = word.slice(1);
            if (firstLetter !== firstLetter.toUpperCase() || restLetters !== restLetters.toLowerCase()) {
                showError(fieldId + '-error', 'First letter must be capital, rest must be lowercase (e.g., Juan Carlo)');
                return false;
            }
        }
    }
    
    return true;
}
```

#### **B. Age Calculation and Legal Age Validation**
**File:** `js/register.js`

**What I Added:**
```javascript
// Age calculation from birthdate
birthdateInput.addEventListener('change', function() {
    const birthdate = new Date(this.value);
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDiff = today.getMonth() - birthdate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
        age--;
    }
    
    ageInput.value = age;
    
    // Validate legal age (18+)
    if (age < 18) {
        showError('age-error', 'Must be at least 18 years old');
    } else {
        hideError('age-error');
    }
});
```

#### **C. Password Strength Checker**
**File:** `js/register.js`

**Implementation:**
```javascript
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = '';
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const strengthElement = document.getElementById('password-strength');
    
    if (strength < 3) {
        strengthElement.textContent = 'Weak Password';
        strengthElement.className = 'password-strength weak';
    } else if (strength < 5) {
        strengthElement.textContent = 'Medium Password';
        strengthElement.className = 'password-strength medium';
    } else {
        strengthElement.textContent = 'Strong Password';
        strengthElement.className = 'password-strength strong';
    }
}
```

---

### **4. AUTHENTICATION QUESTIONS SYSTEM**

#### **A. HTML Structure**
**File:** `register.html`

**What I Added:**
```html
<div class="section-title">Authentication Questions</div>

<div class="form-row">
  <div class="form-group">
    <label for="auth_question1">Authentication Question 1 *</label>
    <select id="auth_question1" name="auth_question1" required>
      <option value="" disabled selected>Select a question</option>
      <option value="best_friend_elementary">Who is your best friend in Elementary?</option>
      <option value="favorite_pet">What is the name of your favorite pet?</option>
      <option value="favorite_teacher">Who is your favorite teacher in high school?</option>
    </select>
    <div class="error-message" id="auth_question1-error"></div>
  </div>
  <div class="form-group">
    <label for="auth_answer1">Your Answer *</label>
    <input type="text" id="auth_answer1" name="auth_answer1" placeholder="Enter your answer" required />
    <div class="error-message" id="auth_answer1-error"></div>
  </div>
</div>
```

#### **B. Validation Logic**
**File:** `js/register.js`

**Unique Question Validation:**
```javascript
// Check for duplicate questions
const selectedQuestions = authQuestions.map(id => document.getElementById(id).value).filter(v => v);
const uniqueQuestions = [...new Set(selectedQuestions)];
if (selectedQuestions.length !== uniqueQuestions.length) {
    showError('form-error', 'Authentication questions must be unique');
    isValid = false;
}
```

---

### **5. LOGIN SECURITY SYSTEM**

#### **A. Consecutive Error Tracking**
**File:** `js/login.js`

**Implementation:**
```javascript
let loginAttempts = 0;
let isBlocked = false;
let blockEndTime = 0;

function attemptLogin() {
    // ... validation logic ...
    
    if (validCredentials[username] && validCredentials[username] === password) {
        // Successful login
        loginAttempts = 0;
        showSuccess('Login successful! Redirecting...');
    } else {
        // Failed login
        loginAttempts++;
        showError('login-error', 'Invalid username or password');
        
        // Show forgot password link after 2 attempts
        if (loginAttempts >= 2) {
            document.getElementById('forgot-password-link').style.display = 'block';
        }
        
        // Block user after 3 attempts
        if (loginAttempts >= 3) {
            blockUser();
        }
    }
}
```

#### **B. Progressive Access Denial**
**File:** `js/login.js`

**Block Duration Logic:**
```javascript
function blockUser() {
    isBlocked = true;
    
    // Calculate block duration based on attempt count
    let blockDuration = 0;
    if (loginAttempts === 3) {
        blockDuration = 15; // 15 seconds
    } else if (loginAttempts === 6) {
        blockDuration = 30; // 30 seconds
    } else if (loginAttempts === 9) {
        blockDuration = 60; // 60 seconds
    }
    
    blockEndTime = Date.now() + (blockDuration * 1000);
    
    // Disable form elements
    document.getElementById('login-button').disabled = true;
    document.getElementById('register-link').style.pointerEvents = 'none';
    document.getElementById('register-link').style.opacity = '0.5';
    
    // Start countdown
    startCountdown(blockDuration);
}
```

#### **C. Browser Back Button Disable**
**File:** `js/login.js`

**Implementation:**
```javascript
function disableBackButton() {
    // Disable back button
    history.pushState(null, null, location.href);
    window.onpopstate = function () {
        history.go(1);
    };
}
```

---

### **6. PASSWORD MANAGEMENT SYSTEM**

#### **A. Show/Hide Password Functionality**
**Files:** All JavaScript files

**Implementation:**
```javascript
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.nextElementSibling;
    
    if (field.type === 'password') {
        field.type = 'text';
        button.textContent = '🙈';
    } else {
        field.type = 'password';
        button.textContent = '👁️';
    }
}
```

**HTML Structure:**
```html
<div class="password-container">
    <input type="password" id="password" name="password" placeholder="Enter password" required />
    <button type="button" class="show-password" onclick="togglePassword('password')">👁️</button>
</div>
```

---

### **7. ADDRESS FORMAT VALIDATION**

#### **A. Structured Address Fields**
**File:** `register.html`

**What I Changed:**
```html
<!-- Before: Single textarea -->
<textarea id="address" rows="3" placeholder="Purok, Barangay, City/Municipality, Province, Country"></textarea>

<!-- After: Individual fields -->
<div class="form-row">
  <div class="form-group">
    <label for="purok">Purok/Street *</label>
    <input type="text" id="purok" name="purok" placeholder="Enter Purok/Street" required />
    <div class="error-message" id="purok-error"></div>
  </div>
  <div class="form-group">
    <label for="barangay">Barangay *</label>
    <input type="text" id="barangay" name="barangay" placeholder="Enter Barangay" required />
    <div class="error-message" id="barangay-error"></div>
  </div>
</div>
```

---

### **8. DATABASE IMPLEMENTATION**

#### **A. Database Schema**
**File:** `php/config.php`

**Users Table:**
```sql
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_number VARCHAR(9) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(2),
    last_name VARCHAR(50) NOT NULL,
    extension_name VARCHAR(10),
    birthdate DATE NOT NULL,
    age INT NOT NULL,
    sex ENUM('Male', 'Female') NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    purok_street VARCHAR(100) NOT NULL,
    barangay VARCHAR(50) NOT NULL,
    municipality_city VARCHAR(50) NOT NULL,
    province VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    auth_question_1 VARCHAR(100) NOT NULL,
    auth_answer_1 VARCHAR(100) NOT NULL,
    auth_question_2 VARCHAR(100) NOT NULL,
    auth_answer_2 VARCHAR(100) NOT NULL,
    auth_question_3 VARCHAR(100) NOT NULL,
    auth_answer_3 VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

#### **B. Password Hashing**
**File:** `php/register.php`

**Implementation:**
```php
// Hash the password
$hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

// Store in database
$stmt->execute([
    // ... other fields ...
    $hashedPassword,
    // ... other fields ...
]);
```

#### **C. Login Verification**
**File:** `php/login.php`

**Implementation:**
```php
// Verify password
if (password_verify($password, $user['password'])) {
    // Successful login
    logLoginAttempt($pdo, $username, $ip, true);
    
    // Start session
    session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    
    echo json_encode(['success' => true, 'message' => 'Login successful']);
} else {
    // Failed login
    logLoginAttempt($pdo, $username, $ip, false);
    echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
}
```

---

### **9. CSS STYLING SYSTEM**

#### **A. Common Styles**
**File:** `css/common.css`

**Key Features:**
- Error message styling
- Password strength indicators
- Form validation styles
- Responsive design
- Button states (disabled, hover, active)

**Example:**
```css
.error-message {
    color: #d32f2f;
    font-size: 12px;
    margin-top: 5px;
    display: none;
}

.error-message.show {
    display: block;
}

.password-strength.weak {
    color: #d32f2f;
}

.password-strength.medium {
    color: #ff9800;
}

.password-strength.strong {
    color: #4caf50;
}
```

---

### **10. FOLDER STRUCTURE ORGANIZATION**

#### **A. Created Directories**
```
Project-Almanac/
├── css/           # All CSS files
├── js/            # All JavaScript files
├── php/           # All PHP backend files
├── images/        # Image assets
└── [HTML files]   # All HTML pages
```

#### **B. File Linking**
**Updated all HTML files to use proper paths:**
```html
<link rel="stylesheet" href="css/home.css">
<link rel="stylesheet" href="css/common.css">
<script src="js/register.js"></script>
```

---

## 🔧 **Key Technical Concepts Used**

### **1. Form Validation Patterns**
- **Client-side validation:** Immediate feedback using JavaScript
- **Server-side validation:** Security using PHP
- **Real-time validation:** Event listeners for instant feedback

### **2. Security Measures**
- **Password hashing:** Using PHP's `password_hash()`
- **Input sanitization:** `htmlspecialchars()` and `strip_tags()`
- **SQL injection prevention:** Prepared statements
- **Session management:** Secure user sessions

### **3. User Experience Features**
- **Progressive enhancement:** Works without JavaScript
- **Responsive design:** Mobile-friendly layouts
- **Accessibility:** Proper labels and form structure
- **Error handling:** Clear, helpful error messages

### **4. Database Design**
- **Normalized structure:** Proper table relationships
- **Data integrity:** Constraints and validation
- **Security:** Prepared statements and input validation

---

## 📚 **Study Tips**

1. **Start with HTML structure** - Understand the form layout first
2. **Study JavaScript validation** - Learn the validation patterns
3. **Examine PHP backend** - Understand server-side processing
4. **Review CSS styling** - See how visual feedback is implemented
5. **Test the functionality** - Use the demo credentials to test features

---

## 🎯 **Key Learning Points**

1. **Form validation** requires both client and server-side implementation
2. **Security** is crucial - always hash passwords and sanitize input
3. **User experience** matters - provide clear feedback and error messages
4. **Database design** should support your application's needs
5. **Code organization** makes maintenance easier

This implementation demonstrates professional web development practices with comprehensive validation, security measures, and user-friendly design.
