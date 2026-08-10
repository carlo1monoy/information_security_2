/* ========================================
   LOGIN FORM VALIDATION AND FUNCTIONALITY
   ========================================
   
   This script handles:
   - Input validation (empty username/password checks)
   - Login form submission and validation
   - Tracking consecutive failed login attempts (only when both fields are filled)
   - Displaying "Forgot Password" link after 2 consecutive errors
   - Blocking user access after 3, 6, and 9 consecutive errors (15s, 30s, 60s)
   - Disabling browser back button
   - Password visibility toggle
   ======================================== */

// ========================================
// GLOBAL VARIABLES
// ========================================

// Tracks how many consecutive failed login attempts the user has made
// This counter resets to 0 when login is successful
// Only increments when BOTH username AND password fields are filled
let loginAttempts = 0;

// Indicates whether the user is currently blocked from logging in
// When true, all login attempts are prevented until the timer expires
let isBlocked = false;

// Stores the timestamp when the block will end (in milliseconds)
// Used to calculate remaining time if user refreshes the page
let blockEndTime = 0;

// ========================================
// PAGE INITIALIZATION
// ========================================
// This code runs when the HTML page finishes loading
document.addEventListener('DOMContentLoaded', function() {
    // Get references to HTML elements we'll need to interact with
    const form = document.getElementById('loginForm');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const passwordInput = document.getElementById('password');
    const passwordToggleButton = document.getElementById('password-toggle');
    const passwordToggleIcon = document.getElementById('password-toggle-icon');
    
    // ========================================
    // INITIALIZATION SETUP
    // ========================================
    // Disable browser back button to prevent users from going back
    disableBackButton();
    
    // Check if user was previously blocked (e.g., after page refresh)
    // If so, restore the block state and continue the countdown
    checkBlockStatus();
    
    // ========================================
    // FORM SUBMISSION HANDLER
    // ========================================
    // Listen for when user clicks the "Sign In" button or presses Enter
    form.addEventListener('submit', function(e) {
        // Prevent the form from submitting normally (which would reload the page)
        e.preventDefault();
        
        // If user is currently blocked, show timer message and don't process login
        if (isBlocked) {
            showTimerMessage();
            return; // Exit early - don't continue with login attempt
        }
        
        // Validate form (checks if fields are empty)
        // If validation passes (returns true), attempt to log in
        if (validateLoginForm()) {
            attemptLogin();
        }
    });
    
    // ========================================
    // FORGOT PASSWORD LINK VISIBILITY
    // ========================================
    // Show "Forgot Password" link only after 2 consecutive failed attempts
    // This is hidden by default in CSS, and shown by adding the 'show' class
    if (forgotPasswordLink) {
        if (loginAttempts >= 2) {
            forgotPasswordLink.classList.add('show');
        } else {
            forgotPasswordLink.classList.remove('show');
        }
    }

    // ========================================
    // PASSWORD VISIBILITY TOGGLE
    // ========================================
    // Allow users to show/hide their password by clicking the eye icon
    if (passwordToggleButton && passwordInput && passwordToggleIcon) {
        passwordToggleButton.addEventListener('click', function() {
            // Check if password is currently hidden
            const isHidden = passwordInput.getAttribute('type') === 'password';
            
            // Toggle between 'password' (hidden) and 'text' (visible)
            passwordInput.setAttribute('type', isHidden ? 'text' : 'password');
            
            // Update the eye icon to match the current state
            if (isHidden) {
                // Password is now visible - show "eye-slash" icon
                passwordToggleIcon.classList.remove('bi-eye-fill');
                passwordToggleIcon.classList.add('bi-eye-slash-fill');
                passwordToggleButton.setAttribute('aria-label', 'Hide password');
                passwordToggleButton.setAttribute('title', 'Hide password');
            } else {
                // Password is now hidden - show "eye" icon
                passwordToggleIcon.classList.remove('bi-eye-slash-fill');
                passwordToggleIcon.classList.add('bi-eye-fill');
                passwordToggleButton.setAttribute('aria-label', 'Show password');
                passwordToggleButton.setAttribute('title', 'Show password');
            }
        });
    }
});

// ========================================
// FORM VALIDATION
// ========================================
/**
 * Validates the login form by checking if username and password fields are filled
 * Displays appropriate error messages if fields are empty
 * @returns {boolean} - Returns true if both fields are filled, false otherwise
 */
function validateLoginForm() {
    // Clear any previous error messages from the form
    clearAllErrors();
    
    // Get the username and password values from the form inputs
    // .trim() removes any extra spaces at the beginning or end
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // Check if both fields are empty
    if (!username && !password) {
        showError('login-error', '<i class="bi bi-exclamation-circle-fill"></i> Please enter Username and Password.');
        return false; // Form validation failed
    }
    
    // Check if only username is empty (password is filled)
    if (!username && password) {
        showError('login-error', '<i class="bi bi-exclamation-circle-fill"></i> Please enter Username.');
        return false; // Form validation failed
    }
    
    // Check if only password is empty (username is filled)
    if (username && !password) {
        showError('login-error', '<i class="bi bi-exclamation-circle-fill"></i> Please enter Password.');
        return false; // Form validation failed
    }
    
    // Both fields are filled - form validation passed
    return true;
}

// ========================================
// LOGIN ATTEMPT HANDLER
// ========================================
/**
 * Attempts to log in the user by sending credentials to the server
 * Handles success, failure, and error cases
 * Manages the "Forgot Password" link visibility and blocking logic
 * Note: This function is only called when BOTH username AND password fields are filled
 */
function attemptLogin() {
    // Get the username and password values from the form inputs
    // .trim() removes any extra spaces at the beginning or end
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginBtn = document.getElementById('login-button');
    const forgotLink = document.getElementById('forgot-password-link');

    // Prevent user from clicking the button multiple times while login is processing
    // This avoids duplicate login attempts
    if (loginBtn) loginBtn.disabled = true;

    // Send login request to the server using fetch API
    // fetch() is a modern way to make HTTP requests in JavaScript
    fetch('php/login.php', {
        method: 'POST', // Use POST method to send data securely
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        // Convert username and password into URL-encoded format (like form submission)
        body: new URLSearchParams({ username, password }).toString()
    })
    .then(res => res.json()) // Convert the server response from JSON to JavaScript object
    .then(data => {
        // ========================================
        // SUCCESSFUL LOGIN
        // ========================================
        if (data && data.success) {
            // Reset the failed attempt counter since login was successful
            loginAttempts = 0;
            
            // Show success message to the user
            showSuccess('Login successful! Redirecting...');
            
            // Clear any stored block state from localStorage
            // This ensures the user starts fresh on next visit
            localStorage.removeItem('loginBlocked');
            localStorage.removeItem('blockEndTime');
            localStorage.removeItem('loginAttempts');
            
            // Wait 1.2 seconds to show the success message, then redirect to home page
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1200);
        } 
        // ========================================
        // FAILED LOGIN
        // ========================================
        else {
            // Increment the failed attempt counter
            // This counter only increments when BOTH username AND password are filled
            loginAttempts++;
            
            // ========================================
            // ERROR MESSAGE DISPLAY LOGIC
            // ========================================
            // Behavior:
            // - Attempts 1-2: Shows "Invalid username or password" only
            // - Attempt 3: Timer (15s block)
            // - Attempts 4-5: Shows "Invalid username or password" only
            // - Attempt 6: Timer (30s block)
            // - Attempts 7-8: Shows "Invalid username or password" only
            // - Attempt 9: Timer (60s block)
            // - Then repeats: 10-11 regular, 12 timer, etc.
            
            if (loginAttempts % 3 === 0) {
                // Every 3rd consecutive attempt (3, 6, 9, 12, etc.):
                // Block the user from logging in for a specific duration
                blockUser();
            } else {
                // For attempts that are NOT multiples of 3 (1, 2, 4, 5, 7, 8, etc.):
                // Show regular error message "Invalid username or password"
                showError('login-error', data && data.message ? `<i class="bi bi-exclamation-circle-fill"></i> ${data.message}` : '<i class="bi bi-exclamation-circle-fill"></i> Invalid username or password');
            }

            // ========================================
            // SHOW FORGOT PASSWORD LINK (After 2 consecutive errors)
            // ========================================
            // Display "Forgot Password? Reset here" link after 2 consecutive failed attempts
            if (forgotLink && loginAttempts >= 2) {
                forgotLink.classList.add('show');
            }
        }
    })
    // ========================================
    // NETWORK ERROR HANDLING
    // ========================================
    // If the request fails (network error, server down, etc.), show error message
    .catch(() => {
        showError('login-error', 'Unable to reach server. Please try again.');
    })
    // ========================================
    // CLEANUP (Always runs, regardless of success or failure)
    // ========================================
    // Re-enable the login button after the request completes
    // Only if user is not currently blocked (blocked users can't try again anyway)
    .finally(() => {
        if (!isBlocked && loginBtn) loginBtn.disabled = false;
    });
}

// ========================================
// USER BLOCKING FUNCTIONALITY
// ========================================
/**
 * Blocks the user from attempting to log in for a specific duration
 * Block duration depends on how many consecutive failed attempts:
 * - 3 failed attempts = 15 seconds block
 * - 6 failed attempts = 30 seconds block
 * - 9 failed attempts = 60 seconds block
 * While blocked, the user cannot submit the login form
 */
function blockUser() {
    // Mark user as blocked so they cannot submit login form
    isBlocked = true;
    
    // ========================================
    // CALCULATE BLOCK DURATION
    // ========================================
    // Block duration increases based on number of consecutive failed attempts:
    // - 3 consecutive errors = 15 seconds
    // - 6 consecutive errors = 30 seconds  
    // - 9+ consecutive errors = 60 seconds (maintains 60s for all subsequent blocks)
    let blockDuration = 0;
    if (loginAttempts === 3) {
        // First block at 3 attempts = 15 seconds
        blockDuration = 15;
    } else if (loginAttempts === 6) {
        // Second block at 6 attempts = 30 seconds
        blockDuration = 30;
    } else if (loginAttempts >= 9 && loginAttempts % 3 === 0) {
        // Third block and all subsequent blocks at 9, 12, 15, 18, etc. = 60 seconds
        blockDuration = 60;
    }
    
    // Calculate when the block will end (current time + block duration in milliseconds)
    // Date.now() returns current time in milliseconds
    // blockDuration * 1000 converts seconds to milliseconds
    blockEndTime = Date.now() + (blockDuration * 1000);
    
    // ========================================
    // DISABLE FORM ELEMENTS
    // ========================================
    // Disable the "Sign In" button so user cannot click it
    const loginBtn = document.getElementById('login-button');
    if (loginBtn) {
        loginBtn.disabled = true; // Prevents button from being clicked
        loginBtn.classList.add('is-disabled'); // Visual styling (grayed out, reduced opacity)
    }
    
    // Disable the "Click here" link in "Don't have an account?" section
    const registerLink = document.getElementById('register-link');
    if (registerLink) {
        registerLink.classList.add('is-disabled');
    }
    
    // ========================================
    // START COUNTDOWN TIMER
    // ========================================
    // Display countdown timer showing remaining block time
    startCountdown(blockDuration);
    
    // ========================================
    // SAVE BLOCK STATE TO LOCALSTORAGE
    // ========================================
    // Store block information so it persists even if user refreshes the page
    // This prevents users from bypassing the block by refreshing
    localStorage.setItem('loginBlocked', 'true');
    localStorage.setItem('blockEndTime', blockEndTime.toString());
    localStorage.setItem('loginAttempts', loginAttempts.toString());
}

// ========================================
// CHECK BLOCK STATUS ON PAGE LOAD
// ========================================
/**
 * Checks if user was previously blocked (e.g., after page refresh)
 * If user is still within the block period, restores the block state
 * and continues the countdown timer
 */
function checkBlockStatus() {
    // Get stored block information from localStorage
    const isBlockedStored = localStorage.getItem('loginBlocked') === 'true';
    const blockEndTimeStored = parseInt(localStorage.getItem('blockEndTime') || '0');
    const attemptsStored = parseInt(localStorage.getItem('loginAttempts') || '0');
    
    // Check if user was blocked and the block period hasn't expired yet
    if (isBlockedStored && blockEndTimeStored > Date.now()) {
        // User is still blocked - restore the block state
        isBlocked = true;
        loginAttempts = attemptsStored; // Restore the attempt counter
        
        // Disable form elements again
        const loginBtn = document.getElementById('login-button');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.classList.add('is-disabled');
        }
        
        const registerLink = document.getElementById('register-link');
        if (registerLink) {
            registerLink.classList.add('is-disabled');
        }
        
        // Show "Forgot Password" link if attempts >= 2
        const forgotLink = document.getElementById('forgot-password-link');
        if (forgotLink && loginAttempts >= 2) {
            forgotLink.classList.add('show');
        }
        
        // Calculate how much time is remaining on the block
        // Math.ceil() rounds up to ensure we show at least 1 second
        const remainingTime = Math.ceil((blockEndTimeStored - Date.now()) / 1000);
        
        // Resume the countdown timer with the remaining time
        startCountdown(remainingTime);
    } else {
        // Block period has expired or no block was active
        // Clear all stored block information
        localStorage.removeItem('loginBlocked');
        localStorage.removeItem('blockEndTime');
        localStorage.removeItem('loginAttempts');
        loginAttempts = 0; // Reset attempt counter
    }
}

// ========================================
// COUNTDOWN TIMER
// ========================================
/**
 * Displays and updates a countdown timer showing remaining block time
 * Timer updates every second until it reaches 0, then automatically unblocks user
 * @param {number} seconds - The number of seconds to count down from
 */
function startCountdown(seconds) {
    // Get the timer message element
    const timerElement = document.getElementById('timer-message');
    
    // Make the timer visible by adding the 'show' class
    timerElement.classList.add('show');
    
    // Ensure Sign In button remains disabled while the timer is running
    // This prevents users from trying to log in while still blocked
    const loginBtn = document.getElementById('login-button');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.classList.add('is-disabled');
    }
    
    // ========================================
    // UPDATE TIMER EVERY SECOND
    // ========================================
    // setInterval() runs a function repeatedly at a specified interval
    // In this case, every 1000 milliseconds (1 second)
    const countdown = setInterval(() => {
        // Calculate minutes and remaining seconds
        // Math.floor() rounds down (e.g., 65 seconds = 1 minute, 5 seconds)
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        // Update the timer message text
        // padStart(2, '0') ensures seconds always show 2 digits (e.g., "05" instead of "5")
        timerElement.textContent = `Access denied. Please wait ${minutes}:${remainingSeconds.toString().padStart(2, '0')} before trying again.`;
        
        // Decrease the seconds counter by 1
        seconds--;
        
        // ========================================
        // TIMER REACHED ZERO
        // ========================================
        // When seconds becomes negative, the timer is complete
        if (seconds < 0) {
            // Stop the interval (stop updating the timer)
            clearInterval(countdown);
            // Unblock the user so they can try logging in again
            unblockUser();
        }
    }, 1000); // Run this code every 1000 milliseconds (1 second)
}

// ========================================
// UNBLOCK USER
// ========================================
/**
 * Removes the block and re-enables all form elements
 * Called automatically when the countdown timer reaches zero
 */
function unblockUser() {
    // Mark user as no longer blocked
    isBlocked = false;
    blockEndTime = 0;
    
    // ========================================
    // RE-ENABLE FORM ELEMENTS
    // ========================================
    // Re-enable the "Sign In" button
    const loginBtn = document.getElementById('login-button');
    if (loginBtn) {
        loginBtn.disabled = false; // Allow button to be clicked
        loginBtn.classList.remove('is-disabled'); // Remove visual disabled styling
    }
    
    // Re-enable the "Click here" link in "Don't have an account?" section
    const registerLink = document.getElementById('register-link');
    if (registerLink) {
        registerLink.classList.remove('is-disabled');
    }
    
    // ========================================
    // HIDE TIMER MESSAGE
    // ========================================
    // Remove the 'show' class to hide the countdown timer
    const timerElement = document.getElementById('timer-message');
    if (timerElement) {
        timerElement.classList.remove('show');
    }
    
    // ========================================
    // CLEAR LOCALSTORAGE
    // ========================================
    // Remove all stored block information since block is complete
    localStorage.removeItem('loginBlocked');
    localStorage.removeItem('blockEndTime');
    localStorage.removeItem('loginAttempts');
}

// ========================================
// TIMER MESSAGE DISPLAY
// ========================================
/**
 * Shows a message when user tries to submit form while blocked
 * This is a static message (not a countdown) shown when user clicks button during block
 */
function showTimerMessage() {
    const timerElement = document.getElementById('timer-message');
    if (timerElement) {
        timerElement.classList.add('show'); // Make timer element visible
        timerElement.textContent = 'Please wait before attempting to login again.';
    }
}

// ========================================
// BROWSER BACK BUTTON DISABLE
// ========================================
/**
 * Prevents users from using the browser's back button
 * This is a security measure to prevent users from going back to previous pages
 */
function disableBackButton() {
    // Add current page to browser history
    // This makes the current page the "last" page in history
    history.pushState(null, null, location.href);
    
    // When user tries to go back (by clicking back button or keyboard shortcut),
    // immediately go forward again, effectively canceling the back action
    window.onpopstate = function () {
        history.go(1); // Go forward 1 page (back to current page)
    };
}

// ========================================
// ERROR MESSAGE DISPLAY
// ========================================
/**
 * Displays an error message to the user
 * @param {string} elementId - The ID of the HTML element where the error will be shown
 * @param {string} message - The error message text to display
 */
function showError(elementId, message) {
    // Get the error element from the HTML
    const errorElement = document.getElementById(elementId);
    
    // Check if element exists before trying to modify it
    if (errorElement) {
        // Set the error message HTML
        errorElement.innerHTML = message;
        
        // Add 'show' class to make the error visible
        // The CSS handles the styling (red color, font size, etc.)
        errorElement.className = 'error-message show';
    }
}

// ========================================
// SUCCESS MESSAGE DISPLAY
// ========================================
/**
 * Displays a success message to the user (e.g., "Login successful!")
 * Success messages are styled in green to indicate positive feedback
 * @param {string} message - The success message text to display
 */
function showSuccess(message) {
    // Get the login error element (we reuse it for success messages too)
    const errorElement = document.getElementById('login-error');
    
    if (errorElement) {
        // Set the success message HTML
        errorElement.innerHTML = message;
        
        // Add both 'show' and 'success' classes
        // 'show' makes it visible, 'success' styles it in green color
        errorElement.className = 'error-message show success';
    }
}

// ========================================
// HIDE ERROR MESSAGE
// ========================================
/**
 * Hides an error message by removing the 'show' class
 * The element still exists in the HTML but is not visible
 * @param {string} elementId - The ID of the HTML element to hide
 */
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        // Clear the HTML content
        errorElement.innerHTML = '';
        // Remove 'show' class to hide the error
        // Only keep 'error-message' class for basic styling
        errorElement.className = 'error-message';
    }
}

// ========================================
// CLEAR ALL ERROR MESSAGES
// ========================================
/**
 * Removes all error messages from the form
 * Called before form validation or submission to clear previous errors
 */
function clearAllErrors() {
    // Find all elements with the 'error-message' class
    // querySelectorAll() returns a list of all matching elements
    const errorElements = document.querySelectorAll('.error-message');
    
    // Loop through each error element and hide it
    // forEach() executes a function for each item in the list
    errorElements.forEach(element => {
        // Clear the HTML content
        element.innerHTML = '';
        // Remove 'show' class to hide the error message
        element.className = 'error-message';
    });
}