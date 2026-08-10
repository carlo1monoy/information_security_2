// =============================================================
// CSUCC SafeMart - Registration Form (Client-Side Validation)
// Purpose: Enforce registration rules (formatting, validation, UX)
// Note: Logic and behavior are preserved; changes are comments/cleanup only.
// =============================================================

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registerForm");

  const birthdateInput = document.getElementById("birthdate");

  const ageInput = document.getElementById("age");

  const passwordInput = document.getElementById("password");

  const password2Input = document.getElementById("password2");

  // legacy element reference (not used in current UI) — removed to avoid confusion

  const passwordToggleButton = document.getElementById("password-toggle");

  const passwordToggleIcon = document.getElementById("password-toggle-icon");

  const password2ToggleButton = document.getElementById("password2-toggle");

  const password2ToggleIcon = document.getElementById("password2-toggle-icon");

  const authAnswer1Input = document.getElementById("auth_answer1");

  const authAnswer1ToggleButton = document.getElementById(
    "auth_answer1-toggle"
  );

  const authAnswer1ToggleIcon = document.getElementById(
    "auth_answer1-toggle-icon"
  );

  const authAnswer2Input = document.getElementById("auth_answer2");

  const authAnswer2ToggleButton = document.getElementById(
    "auth_answer2-toggle"
  );

  const authAnswer2ToggleIcon = document.getElementById(
    "auth_answer2-toggle-icon"
  );

  const authAnswer3Input = document.getElementById("auth_answer3");

  const authAnswer3ToggleButton = document.getElementById(
    "auth_answer3-toggle"
  );

  const authAnswer3ToggleIcon = document.getElementById(
    "auth_answer3-toggle-icon"
  );

  const usernameInput = document.getElementById("username");

  const emailInput = document.getElementById("email");

  const idnoInput = document.getElementById("idno");

  // ===== UPDATED: Server-side ID Number generation =====
  
  async function fetchNextIDNumber() {
    try {
      const response = await fetch('php/check_availability.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=get_next_id'
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching ID:', data.error);
        return '2025-0001'; // Fallback
      }
      
      return data.id_number;
    } catch (error) {
      console.error('Network error fetching ID:', error);
      return '2025-0001'; // Fallback
    }
  }
  
  // Auto-populate ID Number field when page loads
  if (idnoInput) {
    fetchNextIDNumber().then(idNumber => {
      idnoInput.value = idNumber;
    });

    // Enforce numeric-only ID format xxxx-xxxx on any manual input
    idnoInput.addEventListener("input", function () {
      hideError("idno-error");

      let digits = this.value.replace(/\D/g, "");
      if (digits.length > 8) {
        digits = digits.slice(0, 8);
      }

      if (digits.length > 4) {
        this.value = digits.slice(0, 4) + "-" + digits.slice(4);
      } else {
        this.value = digits;
      }
    });
  }

  // ===== ADDED: Name Extension Dropdown Handler =====

  const extnameSelect = document.getElementById("extname");

  const customExtensionRow = document.getElementById("custom-extension-row");

  const customExtnameInput = document.getElementById("custom_extname");

  if (extnameSelect) {
    extnameSelect.addEventListener("change", function () {
      if (this.value === "Other") {
        customExtensionRow.style.display = "block";

        customExtnameInput.required = true;
      } else {
        customExtensionRow.style.display = "none";

        customExtnameInput.required = false;

        customExtnameInput.value = "";

        hideError("custom-extname-error");
      }
    });
  }

  // ===== ADDED: Real-time validation for custom extension =====

  if (customExtnameInput) {
    customExtnameInput.addEventListener("input", function () {
      // Remove spaces

      this.value = this.value.replace(/\s/g, "");

      // Convert lowercase letters to uppercase automatically

      const cursorPosition = this.selectionStart;

      this.value = this.value.toUpperCase();

      // Restore cursor position after conversion

      this.setSelectionRange(cursorPosition, cursorPosition);

      validateCustomExtension(this);
    });

    // Handle paste event to convert pasted text to uppercase and remove spaces

    customExtnameInput.addEventListener("paste", function (e) {
      e.preventDefault();

      const pastedText = (e.clipboardData || window.clipboardData).getData(
        "text"
      );

      const upperText = pastedText.replace(/\s/g, "").toUpperCase();
    });
  }

  // ===== END ADDED =====

  // ===== UPDATED: Age calculation from birthdate with legal age check =====

  birthdateInput.addEventListener("change", function () {
    const ageDisplay = document.getElementById("age-display");
    
    // Clear "This field is required" error when date is selected
    if (this.value) {
      hideError("birthdate-error");
      
      const birthdate = new Date(this.value);
      const today = new Date();

      let age = today.getFullYear() - birthdate.getFullYear();

      const monthDiff = today.getMonth() - birthdate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthdate.getDate())
      ) {
        age--;
      }

      ageInput.value = age;

      // Update the age display span in the combined input
      if (ageDisplay) {
        ageDisplay.textContent = age || "--";
      }

      // Validate legal age (18+) - REQUIREMENT: Allow legal age only
      if (age < 18) {
        showError("age-error", "Must be at least 18 years old.");
      } else if (age > 120) {
        showError("age-error", "Invalid age.");
      } else {
        hideError("age-error");
      }
    } else {
      // Reset age display when birthdate is cleared
      ageInput.value = "";
      if (ageDisplay) {
        ageDisplay.textContent = "--";
      }
      hideError("age-error");
    }
  });

  // ===== END UPDATED =====

  // ===== ADDED: Clear error when sex is selected =====

  const sexSelect = document.getElementById("sex");

  if (sexSelect) {
    sexSelect.addEventListener("change", function () {
      // Clear "This field is required" error when sex is selected

      if (this.value) {
        hideError("sex-error");
      }
    });
  }

  // ===== END ADDED =====

  // ===== UPDATED: Enhanced password strength checker =====

  // REQUIREMENT: Password must check if weak, medium or strong

  passwordInput.addEventListener("input", function () {
    // Enforce maximum length (60 characters)
    if (this.value.length > 60) {
      this.value = this.value.substring(0, 60);
      
      // Show the max length error in the password rules
      const rulesContainer = document.getElementById("password-rules-container");
      if (rulesContainer) {
        setRuleItem("rule-max-length", "Password cannot exceed 60 characters.", false);
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          removeRuleItem("rule-max-length");
        }, 3000);
      }
      
      return; // Exit early to show only the max length error
    }

    // Live render rules
    validatePasswordBasic(this, false);

    checkPasswordStrength(this.value);

    // Check if passwords match when user types in first password field
    if (password2Input.value) {
      checkPasswordMatch();
    }
  });

  // ===== END UPDATED =====

  // ===== UPDATED: Password confirmation validation =====

  // REQUIREMENT: Re-enter password and the password must be equal

  password2Input.addEventListener("input", function () {
    // Enforce maximum length (60 characters)
    if (this.value.length > 60) {
      this.value = this.value.substring(0, 60);
      
      // Show maximum length error message
      showError("password2-error", "Password cannot exceed 60 characters.");
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        hideError("password2-error");
      }, 3000);
      
      return; // Exit early to show only the max length error
    }

    if (this.value.trim()) {
      hideError("password2-error");
    }

    checkPasswordMatch();
  });

  // Handle paste events for password fields
  passwordInput.addEventListener("paste", function () {
    setTimeout(() => {
      let value = this.value;
      
      // Enforce maximum length and show auto-dismissing message if trimmed
      if (value.length > 60) {
        this.value = value.substring(0, 60);
        
        // Show the max length error in the password rules
        const rulesContainer = document.getElementById("password-rules-container");
        if (rulesContainer) {
          setRuleItem("rule-max-length", "Password cannot exceed 60 characters.", false);
          
          // Auto-dismiss after 3 seconds
          setTimeout(() => {
            removeRuleItem("rule-max-length");
          }, 3000);
        }
      }
    }, 0);
  });

  password2Input.addEventListener("paste", function () {
    setTimeout(() => {
      let value = this.value;
      
      // Enforce maximum length and show auto-dismissing message if trimmed
      if (value.length > 60) {
        this.value = value.substring(0, 60);
        
        showError("password2-error", "Password cannot exceed 60 characters.");
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          hideError("password2-error");
        }, 3000);
      }
    }, 0);
  });

  // ===== END UPDATED =====

  // Form validation on submit

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (validateForm()) {
      // If validation passes, submit the form

      this.submit();
    }
  });

  // ===== UPDATED: Real-time validation for name fields =====

  // REQUIREMENT: Allow numbers and special characters to be typed/pasted, but show validation errors
  // REQUIREMENT: Show "Numbers are not allowed" and "Special characters are not allowed" errors
  // REQUIREMENT: Remove "Only letters are allowed" validation message

  const nameFields = ["firstname", "lastname", "mi"];

  nameFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);

    if (field) {
      const MSG_NO_DOUBLE_SPACES = "Double spaces are not allowed.";
      const MSG_NUMBERS_NOT_ALLOWED = "Numbers are not allowed.";
      const MSG_SPECIAL_CHARS_NOT_ALLOWED = "Special characters are not allowed.";

      // Handle input event - allow all input but validate and show errors
      field.addEventListener("input", function () {
        let value = this.value;

        // Enforce maximum length (50 characters for all name fields)
        if (value.length > 50) {
          this.value = value.substring(0, 50);
          value = this.value;
          
          // Show maximum length error message based on field
          let maxLengthMessage;
          if (fieldId === "firstname") {
            maxLengthMessage = "First name cannot exceed 50 characters.";
          } else if (fieldId === "mi") {
            maxLengthMessage = "Middle name cannot exceed 50 characters.";
          } else if (fieldId === "lastname") {
            maxLengthMessage = "Family name cannot exceed 50 characters.";
          }
          
          showError(fieldId + "-error", maxLengthMessage);
          
          // Auto-dismiss after 3 seconds
          setTimeout(() => {
            hideError(fieldId + "-error");
          }, 3000);
          
          return; // Exit early to show only the max length error
        }

        // Check for double spaces
        if (/\s{2,}/.test(value)) {
          showError(fieldId + "-error", MSG_NO_DOUBLE_SPACES);
          return;
        }

        // Check for numbers and special characters
        const hasNumbers = /[0-9]/.test(value);
        const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(value);

        // Show appropriate error messages
        if (hasNumbers && hasSpecialChars) {
          // Check which type of character appears first
          const firstNumberIndex = value.search(/[0-9]/);
          const firstSpecialCharIndex = value.search(/[^a-zA-Z0-9\s]/);
          
          if (firstNumberIndex < firstSpecialCharIndex) {
            showError(fieldId + "-error", "Numbers and special characters are not allowed.");
          } else {
            showError(fieldId + "-error", "Special characters and numbers are not allowed.");
          }
        } else if (hasSpecialChars) {
          showError(fieldId + "-error", MSG_SPECIAL_CHARS_NOT_ALLOWED);
        } else if (hasNumbers) {
          showError(fieldId + "-error", MSG_NUMBERS_NOT_ALLOWED);
        } else {
          // No numbers or special characters, clear error if it was about numbers/special chars
          const errorElement = document.getElementById(fieldId + "-error");
          if (errorElement) {
            const errorText = errorElement.textContent;
            if (
              errorText === MSG_NUMBERS_NOT_ALLOWED ||
              errorText === MSG_SPECIAL_CHARS_NOT_ALLOWED ||
              errorText === MSG_NO_DOUBLE_SPACES ||
              errorText === "Numbers and special characters are not allowed." ||
              errorText === "Special characters and numbers are not allowed."
            ) {
              hideError(fieldId + "-error");
            }
          }
        }

        validateNameField(this, false);
      });

      // Handle paste event - allow paste but validate
      field.addEventListener("paste", function (e) {
        // Allow default paste behavior, validation will happen in input event
        // We just need to validate after paste
        setTimeout(() => {
          let value = this.value;
          let wasTrimmed = false;

          // Enforce maximum length and show auto-dismissing message if trimmed
          if (value.length > 50) {
            this.value = value.substring(0, 50);
            value = this.value;
            wasTrimmed = true;
            
            // Show appropriate max length message based on field
            let maxLengthMessage;
            if (fieldId === "firstname") {
              maxLengthMessage = "First name cannot exceed 50 characters.";
            } else if (fieldId === "mi") {
              maxLengthMessage = "Middle name cannot exceed 50 characters.";
            } else if (fieldId === "lastname") {
              maxLengthMessage = "Family name cannot exceed 50 characters.";
            }
            
            showError(fieldId + "-error", maxLengthMessage);
            
            // Auto-dismiss after 3 seconds
            setTimeout(() => {
              hideError(fieldId + "-error");
            }, 3000);
            
            return; // Don't continue with other validations if trimmed
          }

          // Check for double spaces
          if (/\s{2,}/.test(value)) {
            showError(fieldId + "-error", MSG_NO_DOUBLE_SPACES);
            return;
          }

          // Check for numbers and special characters
          const hasNumbers = /[0-9]/.test(value);
          const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(value);

          // Show appropriate error messages
          if (hasNumbers && hasSpecialChars) {
            // Check which type of character appears first
            const firstNumberIndex = value.search(/[0-9]/);
            const firstSpecialCharIndex = value.search(/[^a-zA-Z0-9\s]/);
            
            if (firstNumberIndex < firstSpecialCharIndex) {
              showError(fieldId + "-error", "Numbers and special characters are not allowed.");
            } else {
              showError(fieldId + "-error", "Special characters and numbers are not allowed.");
            }
          } else if (hasSpecialChars) {
            showError(fieldId + "-error", MSG_SPECIAL_CHARS_NOT_ALLOWED);
          } else if (hasNumbers) {
            showError(fieldId + "-error", MSG_NUMBERS_NOT_ALLOWED);
          } else {
            // Clear error if no numbers or special characters
            const errorElement = document.getElementById(fieldId + "-error");
            if (errorElement) {
              const errorText = errorElement.textContent;
              if (
                errorText === MSG_NUMBERS_NOT_ALLOWED ||
                errorText === MSG_SPECIAL_CHARS_NOT_ALLOWED ||
                errorText === MSG_NO_DOUBLE_SPACES ||
                errorText === "Numbers and special characters are not allowed." ||
                errorText === "Special characters and numbers are not allowed."
              ) {
                hideError(fieldId + "-error");
              }
            }
          }

          validateNameField(this, false);
        }, 0);
      });

    }
  });

  // ===== END UPDATED =====

  // ===== UPDATED: ID Number is now auto-generated and readonly =====

  // ID Number is automatically generated and readonly, no manual input validation needed

  // ===== END UPDATED =====

  // ===== UPDATED: Username availability check with real-time feedback =====

  // REQUIREMENT: It automatically checks if there is an existing username

  if (usernameInput) {
    let usernameTimeout;

    usernameInput.addEventListener("input", function () {
      clearTimeout(usernameTimeout);

      // Enforce maximum length (15 characters)
      if (this.value.length > 15) {
        this.value = this.value.substring(0, 15);
        
        // Show maximum length error message
        showError("username-error", "Username cannot exceed 15 characters.");
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          hideError("username-error");
        }, 3000);
        
        return; // Exit early to show only the max length error
      }

      // Check for spaces in username
      if (/\s/.test(this.value)) {
        hideUsernameStatus();
        showError("username-error", "No spaces are allowed in username.");
        return;
      }

      const username = this.value.trim();

      // Length validation
      if (username.length > 0 && username.length < 4) {
        hideUsernameStatus();
        showError("username-error", "Username must be at least 4 characters.");
        return;
      }
      
      if (username.length > 15) {
        hideUsernameStatus();
        showError("username-error", "Username cannot exceed 15 characters.");
        return;
      }

      if (username.length >= 4) {
        usernameTimeout = setTimeout(() => {
          checkUsernameAvailability(username);
        }, 500);

        hideError("username-error");
      } else if (username.length === 0) {
        hideUsernameStatus();
        hideError("username-error");
      }
    });

    // Handle paste event for username
    usernameInput.addEventListener("paste", function () {
      setTimeout(() => {
        let value = this.value;
        
        // Enforce maximum length and show auto-dismissing message if trimmed
        if (value.length > 15) {
          this.value = value.substring(0, 15);
          
          showError("username-error", "Username cannot exceed 15 characters.");
          
          // Auto-dismiss after 3 seconds
          setTimeout(() => {
            hideError("username-error");
          }, 3000);
        }
        
        // Check for spaces in pasted username
        if (/\s/.test(this.value)) {
          hideUsernameStatus();
          showError("username-error", "No spaces are allowed in username.");
        }
      }, 0);
    });
  }

  // ===== END UPDATED =====

  // ===== UPDATED: Email validation (live checks) =====

  // REQUIREMENT: Live checks for spaces, consecutive dots, and disallowed characters

  if (emailInput) {
    emailInput.addEventListener("input", function () {
      // Enforce maximum length (100 characters)
      if (this.value.length > 100) {
        this.value = this.value.substring(0, 100);
        
        // Show maximum length error message
        showError("email-error", "Email cannot exceed 100 characters.");
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          hideError("email-error");
        }, 3000);
        
        return; // Exit early to show only the max length error
      }

      const v = this.value;
      // 1) No spaces
      if (/\s/.test(v)) {
        showError("email-error", "No spaces are allowed.");
        return;
      }
      // 2) No consecutive dots
      if (/\.\./.test(v)) {
        showError("email-error", "Email address cannot contain consecutive dots.");
        return;
      }
      // 3) Disallowed special characters
      //    Disallowed: ! # $ % ^ & * ( ) = { } [ ] : ; " ' < > , ? / \\ | ~
      if (/[!#$%\^&*()={}\[\]:;"'<> ,?\/\\|~]/.test(v)) {
        showError(
          "email-error",
          "Please enter a valid email address (e.g., chael@gmail.com)."
        );
        return;
      }
      // If none of the live checks failed and there's input, clear error (format checked on blur)
      if (v) hideError("email-error");
    });

    emailInput.addEventListener("blur", function () {
      const isValid = validateEmail(this, false);
      if (isValid) {
        checkEmailAvailability(this.value.trim());
      }
    });

    // Handle paste event for email
    emailInput.addEventListener("paste", function () {
      setTimeout(() => {
        let value = this.value;
        
        // Enforce maximum length and show auto-dismissing message if trimmed
        if (value.length > 100) {
          this.value = value.substring(0, 100);
          
          showError("email-error", "Email address cannot exceed 100 characters.");
          
          // Auto-dismiss after 3 seconds
          setTimeout(() => {
            hideError("email-error");
          }, 3000);
        }
      }, 0);
    });
  }

  // ===== END ADDED =====

  // ===== ADDED: Address fields validation =====

  const addressFields = [
    "purok",
    "barangay",
    "municipality",
    "province",
    "country",
  ];

  addressFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (!field) return;

    const isAlphaSpaceOnly =
      fieldId === "municipality" ||
      fieldId === "province" ||
      fieldId === "country";
    const isPurok = fieldId === "purok";
    const isBarangay = fieldId === "barangay";
    const errorId = fieldId + "-error";
    const MSG_SPECIALS_NOT_ALLOWED = "Special characters are not allowed.";
    const MSG_NUMBERS_SPECIALS_NOT_ALLOWED =
      "Numbers and special characters are not allowed.";
    const MSG_NO_DOUBLE_SPACES = "Double spaces are not allowed.";

    field.addEventListener("input", function () {
      let value = this.value;

      // Enforce maximum length based on field type
      let maxLength;
      if (isPurok) maxLength = 60;
      else if (isBarangay) maxLength = 60;
      else if (fieldId === "municipality") maxLength = 100;
      else if (fieldId === "province") maxLength = 60;
      else if (fieldId === "country") maxLength = 60;

      if (value.length > maxLength) {
        this.value = value.substring(0, maxLength);
        value = this.value;
        
        // Show maximum length error message based on field type
        let maxLengthMessage;
        if (isPurok) {
          maxLengthMessage = "Purok/Street cannot exceed 60 characters.";
        } else if (isBarangay) {
          maxLengthMessage = "Barangay cannot exceed 60 characters.";
        } else if (fieldId === "municipality") {
          maxLengthMessage = "Municipality/City cannot exceed 100 characters.";
        } else if (fieldId === "province") {
          maxLengthMessage = "Province cannot exceed 60 characters.";
        } else if (fieldId === "country") {
          maxLengthMessage = "Country cannot exceed 60 characters.";
        }
        
        showError(errorId, maxLengthMessage);
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          hideError(errorId);
        }, 3000);
        
        return; // Exit early to show only the max length error
      }
      
      // Check for double spaces
      if (/\s{2,}/.test(value)) {
        showError(errorId, MSG_NO_DOUBLE_SPACES);
        return;
      }

      // Check if starts with number for Purok/Street and Barangay
      if (isPurok && value.length > 0 && /^[0-9]/.test(value)) {
        showError(errorId, "Enter a valid Purok/Street (e.g., Purok 1).");
        return;
      }
      
      if (isBarangay && value.length > 0 && /^[0-9]/.test(value)) {
        showError(errorId, "Enter a valid Barangay (e.g., Barangay 7).");
        return;
      }

      // Check for invalid characters based on field type
      let isValid = true;
      if (isAlphaSpaceOnly) {
        isValid = /^[a-zA-Z\s]*$/.test(value);
        if (!isValid) {
          const hasNumbers = /[0-9]/.test(value);
          const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(value);
          
          if (hasNumbers && hasSpecialChars) {
            // Check which type of character appears first
            const firstNumberIndex = value.search(/[0-9]/);
            const firstSpecialCharIndex = value.search(/[^a-zA-Z0-9\s]/);
            
            if (firstNumberIndex < firstSpecialCharIndex) {
              showError(errorId, "Numbers and special characters are not allowed.");
            } else {
              showError(errorId, "Special characters and numbers are not allowed.");
            }
          } else if (hasNumbers && !hasSpecialChars) {
            showError(errorId, "Numbers are not allowed.");
          } else if (hasSpecialChars && !hasNumbers) {
            showError(errorId, MSG_SPECIALS_NOT_ALLOWED);
          }
        } else {
          hideError(errorId);
        }
      } else if (isPurok) {
        isValid = /^[a-zA-Z0-9\s-]*$/.test(value);
        if (!isValid) {
          showError(errorId, MSG_SPECIALS_NOT_ALLOWED);
        } else {
          hideError(errorId);
        }
      } else if (isBarangay) {
        isValid = /^[a-zA-Z0-9\s]*$/.test(value);
        if (!isValid) {
          showError(errorId, MSG_SPECIALS_NOT_ALLOWED);
        } else {
          hideError(errorId);
        }
      } else {
        isValid = /^[a-zA-Z0-9\s]*$/.test(value);
        if (!isValid) {
          showError(errorId, MSG_SPECIALS_NOT_ALLOWED);
        } else {
          hideError(errorId);
        }
      }
      
      validateAddressField(this, false);
    });

    // Allow paste but validate after
    field.addEventListener("paste", function () {
      setTimeout(() => {
        let value = this.value;

        // Enforce maximum length and show auto-dismissing message if trimmed
        let maxLength;
        if (isPurok) maxLength = 60;
        else if (isBarangay) maxLength = 60;
        else if (fieldId === "municipality") maxLength = 100;
        else if (fieldId === "province") maxLength = 60;
        else if (fieldId === "country") maxLength = 60;

        if (value.length > maxLength) {
          this.value = value.substring(0, maxLength);
          value = this.value;
          
          // Show appropriate max length message based on field
          let maxLengthMessage;
          if (isPurok) {
            maxLengthMessage = "Purok/Street cannot exceed 60 characters.";
          } else if (isBarangay) {
            maxLengthMessage = "Barangay cannot exceed 60 characters.";
          } else if (fieldId === "municipality") {
            maxLengthMessage = "Municipality/City cannot exceed 100 characters.";
          } else if (fieldId === "province") {
            maxLengthMessage = "Province cannot exceed 60 characters.";
          } else if (fieldId === "country") {
            maxLengthMessage = "Country cannot exceed 60 characters.";
          }
          
          showError(errorId, maxLengthMessage);
          
          // Auto-dismiss after 3 seconds
          setTimeout(() => {
            hideError(errorId);
          }, 3000);
          
          return; // Don't continue with other validations if trimmed
        }
        
        // Check for double spaces
        if (/\s{2,}/.test(value)) {
          showError(errorId, MSG_NO_DOUBLE_SPACES);
          return;
        }

        // Check if starts with number for Purok/Street and Barangay
        if (isPurok && value.length > 0 && /^[0-9]/.test(value)) {
          showError(errorId, "Please enter a valid Purok/Street (e.g., Purok 1).");
          return;
        }
        
        if (isBarangay && value.length > 0 && /^[0-9]/.test(value)) {
          showError(errorId, "Please enter a valid Barangay name (e.g., Barangay 7).");
          return;
        }

        // Check for invalid characters
        let isValid = true;
        if (isAlphaSpaceOnly) {
          isValid = /^[a-zA-Z\s]*$/.test(value);
          if (!isValid) {
            const hasNumbers = /[0-9]/.test(value);
            const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(value);
            
            if (hasNumbers && hasSpecialChars) {
              // Check which type of character appears first
              const firstNumberIndex = value.search(/[0-9]/);
              const firstSpecialCharIndex = value.search(/[^a-zA-Z0-9\s]/);
              
              if (firstNumberIndex < firstSpecialCharIndex) {
                showError(errorId, "Numbers and special characters are not allowed.");
              } else {
                showError(errorId, "Special characters and numbers are not allowed.");
              }
            } else if (hasNumbers && !hasSpecialChars) {
              showError(errorId, "Numbers are not allowed");
            } else if (hasSpecialChars && !hasNumbers) {
              showError(errorId, MSG_SPECIALS_NOT_ALLOWED);
            }
          } else {
            hideError(errorId);
          }
        } else if (isPurok) {
          isValid = /^[a-zA-Z0-9\s-]*$/.test(value);
          if (!isValid) {
            showError(errorId, MSG_SPECIALS_NOT_ALLOWED);
          } else {
            hideError(errorId);
          }
        } else if (isBarangay) {
          isValid = /^[a-zA-Z0-9\s]*$/.test(value);
          if (!isValid) {
            showError(errorId, MSG_SPECIALS_NOT_ALLOWED);
          } else {
            hideError(errorId);
          }
        } else {
          isValid = /^[a-zA-Z0-9\s]*$/.test(value);
          if (!isValid) {
            showError(errorId, MSG_SPECIALS_NOT_ALLOWED);
          } else {
            hideError(errorId);
          }
        }
        
        validateAddressField(this, false);
      }, 0);
    });
  });

  // Zip code validation

  const zipInput = document.getElementById("zip");

  if (zipInput) {
    const ZIP_INVALID_LENGTH_MESSAGE =
      "Please enter a valid 4-digit ZIP Code (e.g., 1000).";

    zipInput.addEventListener("input", function () {
      // Remove any non-numeric characters immediately (same as ID Number field)
      this.value = this.value.replace(/[^0-9]/g, "");
      
      // Show immediate feedback for invalid length (not 4 digits)
      if (this.value.length > 0 && this.value.length < 4) {
        showError("zip-error", ZIP_INVALID_LENGTH_MESSAGE);
      } else {
        // Clear error if length is 4 or field is empty
        hideError("zip-error");
      }
      
      validateZipCode(this, false);
    });

    zipInput.addEventListener("paste", function () {
      setTimeout(() => {
        // Remove any non-numeric characters immediately (same as ID Number field)
        this.value = this.value.replace(/[^0-9]/g, "");
        
        // Show immediate feedback for invalid length (not 4 digits)
        if (this.value.length > 0 && this.value.length < 4) {
          showError("zip-error", ZIP_INVALID_LENGTH_MESSAGE);
        } else {
          // Clear error if length is 4 or field is empty
          hideError("zip-error");
        }
        
        validateZipCode(this, false);
      }, 0);
    });
  }

  // ===== END ADDED =====

  // ===== ADDED: Real-time validation for authentication answer fields =====

  const authAnswerFields = ["auth_answer1", "auth_answer2", "auth_answer3"];

  authAnswerFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener("input", function () {
        // Enforce maximum length (60 characters)
        if (this.value.length > 60) {
          this.value = this.value.substring(0, 60);
          
          // Show maximum length error message
          const errorId = fieldId + "-error";
          showError(errorId, "Answer cannot exceed 60 characters.");
          
          // Auto-dismiss after 3 seconds
          setTimeout(() => {
            hideError(errorId);
          }, 3000);
          
          return; // Exit early to show only the max length error
        }

        const value = this.value.trim();
        const errorId = fieldId + "-error";

        if (value.length === 0) {
          hideError(errorId);
        } else {
          // Length validation only (authentication answers don't have other format restrictions)
          if (value.length < 2) {
            showError(errorId, "Answer must be at least 2 characters.");
          } else if (value.length > 60) {
            showError(errorId, "Answer cannot exceed 60 characters.");
          } else {
            hideError(errorId);
          }
        }
      });

      // Handle paste event for authentication answer fields
      field.addEventListener("paste", function () {
        setTimeout(() => {
          let value = this.value;
          
          // Enforce maximum length and show auto-dismissing message if trimmed
          if (value.length > 60) {
            this.value = value.substring(0, 60);
            
            showError(fieldId + "-error", "Answer cannot exceed 60 characters.");
            
            // Auto-dismiss after 3 seconds
            setTimeout(() => {
              hideError(fieldId + "-error");
            }, 3000);
          }
        }, 0);
      });
    }
  });

  // ===== END ADDED =====

  function setupVisibilityToggle({
    input,
    button,
    icon,
    showLabel,
    hideLabel,
  }) {
    if (!input || !button || !icon) return;

    const showText = showLabel || "Show value";
    const hideText = hideLabel || "Hide value";

    button.addEventListener("click", function () {
      const isHidden = input.getAttribute("type") === "password";

      input.setAttribute("type", isHidden ? "text" : "password");

      if (isHidden) {
        icon.classList.remove("bi-eye-fill");

        icon.classList.add("bi-eye-slash-fill");

        button.setAttribute("aria-label", hideText);

        button.setAttribute("title", hideText);
      } else {
        icon.classList.remove("bi-eye-slash-fill");

        icon.classList.add("bi-eye-fill");

        button.setAttribute("aria-label", showText);

        button.setAttribute("title", showText);
      }
    });
  }

  setupVisibilityToggle({
    input: passwordInput,
    button: passwordToggleButton,
    icon: passwordToggleIcon,
    showLabel: "Show password",
    hideLabel: "Hide password",
  });

  setupVisibilityToggle({
    input: password2Input,
    button: password2ToggleButton,
    icon: password2ToggleIcon,
    showLabel: "Show password",
    hideLabel: "Hide password",
  });

  [
    {
      input: authAnswer1Input,
      button: authAnswer1ToggleButton,
      icon: authAnswer1ToggleIcon,
    },
    {
      input: authAnswer2Input,
      button: authAnswer2ToggleButton,
      icon: authAnswer2ToggleIcon,
    },
    {
      input: authAnswer3Input,
      button: authAnswer3ToggleButton,
      icon: authAnswer3ToggleIcon,
    },
  ].forEach((config) =>
    setupVisibilityToggle({
      ...config,
      showLabel: "Show answer",
      hideLabel: "Hide answer",
    })
  );
  // ========================================
  // MULTI-STEP FORM NAVIGATION
  // ========================================
  // This section handles step-by-step navigation with comprehensive validation.
  // Users cannot proceed to the next step if any field has validation errors.

  // Step navigation state
  let currentStep = 1;
  const totalSteps = 2; // Updated: two-step flow (Details, Authentication)

  // DOM element references for step navigation
  const formSteps = document.querySelectorAll(".form-step");
  const stepIndicators = document.querySelectorAll(".step");
  const stepLines = document.querySelectorAll(".step-line");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");

  // ========================================
  // SHOW SPECIFIC STEP
  // Updates the visible step and UI elements
  // ========================================
  function showStep(step) {
    // Hide all form steps first
    formSteps.forEach((formStep) => {
      formStep.classList.remove("active");
    });

    // Show the current step
    const currentFormStep = document.querySelector(
      `.form-step[data-step="${step}"]`
    );
    if (currentFormStep) {
      currentFormStep.classList.add("active");
    }

    // Update step indicators
    updateStepIndicators(step);

    // Update button visibility
    updateButtons(step);

    // Scroll to top of form smoothly
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ========================================
  // UPDATE STEP INDICATORS
  // Highlights current step and marks completed steps
  // ========================================
  function updateStepIndicators(step) {
    stepIndicators.forEach((indicator, index) => {
      const stepNumber = index + 1;

      // Remove all state classes first
      indicator.classList.remove("active", "completed");

      // Add appropriate class based on step position
      if (stepNumber < step) {
        indicator.classList.add("completed");
      } else if (stepNumber === step) {
        indicator.classList.add("active");
      }
    });

    // Update connecting lines between steps
    stepLines.forEach((line, index) => {
      if (index < step - 1) {
        line.classList.add("completed");
      } else {
        line.classList.remove("completed");
      }
    });
  }

  // ========================================
  // UPDATE BUTTONS
  // Shows/hides navigation buttons based on current step
  // ========================================
  function updateButtons(step) {
    // Hide/show Previous button (hide on first step)
    if (step === 1) {
      prevBtn.style.display = "none";
    } else {
      prevBtn.style.display = "flex";
    }

    // Hide/show Next vs Submit button
    if (step === totalSteps) {
      nextBtn.style.display = "none";
      submitBtn.style.display = "flex";
    } else {
      nextBtn.style.display = "flex";
      submitBtn.style.display = "none";
    }
  }

  // ========================================
  // VALIDATE CURRENT STEP
  // Comprehensive validation of all fields in the current step.
  // Returns true only if ALL fields pass validation with no errors.
  // ========================================
  function validateCurrentStep() {
    const currentFormStep = document.querySelector(
      `.form-step[data-step="${currentStep}"]`
    );
    if (!currentFormStep) return true;

    let isValid = true;

    // ===== STEP 1 (NEW): PERSONAL + ADDRESS + ACCOUNT =====
    if (currentStep === 1) {
      // Validate ID Number
      const idnoField = document.getElementById("idno");
      if (!idnoField.value.trim()) {
        showError("idno-error", "This field is required.");
        isValid = false;
      } else if (!validateIDNumber(idnoField)) {
        isValid = false;
      }

      // Validate Birthdate
      const birthdateField = document.getElementById("birthdate");
      if (!birthdateField.value) {
        showError("birthdate-error", "This field is required.");
        isValid = false;
      }

      // Validate Age (must be calculated and valid)
      const ageField = document.getElementById("age");
      const age = parseInt(ageField.value);
      if (!ageField.value || isNaN(age)) {
        isValid = false;
      } else if (age < 18) {
        showError("age-error", "Must be at least 18 years old.");
        isValid = false;
      } else if (age > 120) {
        showError("age-error", "Invalid age.");
        isValid = false;
      }

      // Validate Sex
      const sexField = document.getElementById("sex");
      if (!sexField.value) {
        showError("sex-error", "This field is required.");
        isValid = false;
      }

      // Validate First Name
      const firstnameField = document.getElementById("firstname");
      if (!firstnameField.value.trim()) {
        showError("firstname-error", "This field is required.");
        isValid = false;
      } else if (!validateNameField(firstnameField)) {
        isValid = false;
      }

      // Validate Last Name
      const lastnameField = document.getElementById("lastname");
      if (!lastnameField.value.trim()) {
        showError("lastname-error", "This field is required.");
        isValid = false;
      } else if (!validateNameField(lastnameField)) {
        isValid = false;
      }

      // Validate Middle Name (optional, but if filled, must be valid)
      const miField = document.getElementById("mi");
      if (miField.value.trim() !== "") {
        if (!validateNameField(miField)) {
          isValid = false;
        }
      }

      // Validate Name Extension (if "Other" is selected, custom extension is required)
      const extnameField = document.getElementById("extname");
      const customExtnameField = document.getElementById("custom_extname");
      if (extnameField.value === "Other") {
        if (!validateCustomExtension(customExtnameField)) {
          isValid = false;
        }
      }
      // Address fields
      const addressFields = [
        { id: "purok", label: "Purok/Street" },
        { id: "barangay", label: "Barangay" },
        { id: "municipality", label: "Municipality/City" },
        { id: "province", label: "Province" },
        { id: "country", label: "Country" },
      ];
      addressFields.forEach((field) => {
        const input = document.getElementById(field.id);
        if (!validateAddressField(input)) {
          isValid = false;
        }
      });
      // Zip Code
      const zipField = document.getElementById("zip");
      if (!validateZipCode(zipField)) {
        isValid = false;
      }

      // ===== Account Details =====
      const usernameField = document.getElementById("username");
      if (!usernameField.value.trim()) {
        showError("username-error", "This field is required.");
        isValid = false;
      } else if (usernameField.value.trim().length < 3) {
        showError("username-error", "Username must be at least 3 characters.");
        isValid = false;
      } else {
        const usernameError = document.getElementById("username-error");
        if (usernameError && usernameError.textContent.trim() !== "") {
          isValid = false;
        }
      }

      const emailField = document.getElementById("email");
      if (!emailField.value.trim()) {
        showError("email-error", "This field is required.");
        isValid = false;
      } else if (!validateEmail(emailField)) {
        isValid = false;
      }

      const passwordField = document.getElementById("password");
      if (!passwordField.value) {
        renderPasswordRules("", true, false);
        isValid = false;
      } else if (!validatePasswordBasic(passwordField, true, true)) {
        isValid = false;
      }

      const password2Field = document.getElementById("password2");
      const passwordValue = passwordField.value;
      if (!password2Field.value) {
        showError("password2-error", "Please re-enter password");
        isValid = false;
      } else if (passwordValue !== password2Field.value) {
        isValid = false;
      }
    }
    // ===== STEP 2 (NEW): AUTHENTICATION QUESTIONS =====
    else if (currentStep === 2) {
      const authQuestions = [
        "auth_question1",
        "auth_question2",
        "auth_question3",
      ];
      const authAnswers = ["auth_answer1", "auth_answer2", "auth_answer3"];

      // Validate each question and answer pair
      authQuestions.forEach((questionId, index) => {
        const question = document.getElementById(questionId);
        const answer = document.getElementById(authAnswers[index]);

        if (!question.value) {
          showError(questionId + "-error", "Please select a question.");
          isValid = false;
        }

        if (!answer.value.trim()) {
          showError(
            authAnswers[index] + "-error",
            "Please provide an answer"
          );
          isValid = false;
        }
      });

    }

    // Final check: Ensure no error messages are visible in the current step
    // This catches any errors that might have been set by async validation
    const errorElements = currentFormStep.querySelectorAll(".error-message");
    errorElements.forEach((errorEl) => {
      // Check if error element has visible content
      if (errorEl.textContent.trim() !== "") {
        isValid = false;
      }
    });

    // Show form-level error message if validation fails
    if (!isValid) {
      const formError = document.getElementById("form-error");
      if (formError && !formError.textContent.trim()) {
        formError.innerHTML =
          '<i class="bi bi-exclamation-circle-fill"></i> Please complete all fields correctly before proceeding.';

        // Auto-hide error after 5 seconds
        setTimeout(() => {
          formError.innerHTML = "";
        }, 5000);
      }
    } else {
      // Clear form error if validation passes
      const formError = document.getElementById("form-error");
      if (formError) {
        formError.innerHTML = "";
      }
    }

    return isValid;
  }

  // ========================================
  // NEXT BUTTON EVENT HANDLER
  // Moves to next step only if current step is fully valid
  // ========================================
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      // Validate current step before proceeding
      if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
          currentStep++;
          showStep(currentStep);
        }
      }
    });
  }

  // ========================================
  // PREVIOUS BUTTON EVENT HANDLER
  // Moves to previous step (no validation needed)
  // ========================================
  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
      }
    });
  }

  // ========================================
  // KEYBOARD NAVIGATION SUPPORT
  // Allow Enter key to advance to next step (only if valid)
  // ========================================
  document.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      // Prevent default form submission
      e.preventDefault();

      // If not on last step, trigger Next button
      if (currentStep < totalSteps && nextBtn) {
        nextBtn.click();
      }
    }
  });

  // ========================================
  // INITIALIZE FORM
  // Show first step on page load
  // ========================================
  showStep(currentStep);

  // ========================================
  // PREVENT FORM SUBMISSION ON ENTER
  // Except when on the final step with submit button visible
  // ========================================
  if (form) {
    form.addEventListener("keypress", function (e) {
      if (e.key === "Enter" && currentStep !== totalSteps) {
        e.preventDefault();
        return false;
      }
    });
  }

  // ===== END MULTI-STEP NAVIGATION =====
});

// ===== UPDATED: Complete form validation function =====

// REQUIREMENT: Comprehensive validation before submission

function validateForm() {
  let isValid = true;

  // Clear all previous errors

  clearAllErrors();

  hideUsernameStatus();

  // Validate ID Number

  const idno = document.getElementById("idno").value;

  if (!idno) {
    showError("idno-error", "This field is required.");

    isValid = false;
  } else if (!validateIDNumber(document.getElementById("idno"))) {
    isValid = false;
  }

  // ===== ADDED: Validate all name fields with proper rules =====

  // REQUIREMENT: All name validation rules

  const requiredNameFields = [
    { id: "firstname", label: "First Name" },

    { id: "lastname", label: "Family Name" },
  ];

  requiredNameFields.forEach((field) => {
    const input = document.getElementById(field.id);

    if (!input.value.trim()) {
      isValid = false;
    } else if (!validateNameField(input)) {
      isValid = false;
    }
  });

  // Validate optional middle name if filled

  const miInput = document.getElementById("mi");

  if (miInput.value.trim() !== "") {
    if (!validateNameField(miInput)) {
      isValid = false;
    }
  }

  // Validate name extension

  const extnameSelect = document.getElementById("extname");

  const customExtnameInput = document.getElementById("custom_extname");

  if (extnameSelect.value === "Other") {
    if (!validateCustomExtension(customExtnameInput)) {
      isValid = false;
    }
  }

  // ===== END ADDED =====

  // Validate birthdate

  const birthdate = document.getElementById("birthdate");

  if (!birthdate.value) {
    isValid = false;
  }

  // Validate age

  const age = parseInt(document.getElementById("age").value);

  if (!age || isNaN(age)) {
    isValid = false;
  } else if (age < 18) {
    showError("age-error", "Must be at least 18 years old.");

    isValid = false;
  } else if (age > 120) {
    showError("age-error", "Invalid age.");

    isValid = false;
  }

  // Validate sex

  const sex = document.getElementById("sex");

  if (!sex.value) {
    isValid = false;
  }

  // Validate username

  const username = document.getElementById("username");

  if (!username.value.trim()) {
    showError("username-error", "This field is required.");

    isValid = false;
  } else if (username.value.trim().length < 4) {
    showError("username-error", "Username must be at least 4 characters.");

    isValid = false;
  } else if (username.value.trim().length > 15) {
    showError("username-error", "Username cannot exceed 15 characters.");

    isValid = false;
  }

  // Validate email

  const email = document.getElementById("email");

  if (!email.value.trim()) {
    showError("email-error", "This field is required.");

    isValid = false;
  } else if (!validateEmail(email)) {
    isValid = false;
  }

  // ===== UPDATED: Validate password with strength check =====

  const password = document.getElementById("password").value;

  const password2 = document.getElementById("password2").value;

  if (!password) {
    // Render required and other rules in the rules list; do not use legacy error element
    renderPasswordRules("", true, false);
    isValid = false;
  } else {
    const passwordField = document.getElementById("password");
    if (!validatePasswordBasic(passwordField, true, true)) {
      isValid = false;
    }
  }

  if (!password2) {
    showError("password2-error", "Please re-enter password.");

    isValid = false;
  } else if (password !== password2) {
    isValid = false;
  }

  // ===== END UPDATED =====

  // ===== ADDED: Validate all address fields =====

  const addressFields = [
    { id: "purok", label: "Purok/Street" },

    { id: "barangay", label: "Barangay" },

    { id: "municipality", label: "Municipality/City" },

    { id: "province", label: "Province" },

    { id: "country", label: "Country" },

    { id: "zip", label: "Zip Code" },
  ];

  addressFields.forEach((field) => {
    const input = document.getElementById(field.id);

    if (field.id === "zip") {
      if (!validateZipCode(input)) {
        isValid = false;
      }
    } else {
      if (!validateAddressField(input)) {
        isValid = false;
      }
    }
  });

  // ===== END ADDED =====

  // ===== UPDATED: Validate authentication questions =====

  const authQuestions = ["auth_question1", "auth_question2", "auth_question3"];

  const authAnswers = ["auth_answer1", "auth_answer2", "auth_answer3"];

  authQuestions.forEach((questionId, index) => {
    const question = document.getElementById(questionId);

    const answer = document.getElementById(authAnswers[index]);

    if (!question.value) {
      showError(questionId + "-error", "Please select a question.");

      isValid = false;
    }

    if (!answer.value.trim()) {
      showError(authAnswers[index] + "-error", "Please provide an answer.");

      isValid = false;
    } else if (answer.value.trim().length < 2) {
      showError(authAnswers[index] + "-error", "Answer must be at least 2 characters.");

      isValid = false;
    } else if (answer.value.trim().length > 60) {
      showError(authAnswers[index] + "-error", "Answer cannot exceed 60 characters.");

      isValid = false;
    }
  });

  // ===== END UPDATED =====

  return isValid;
}

// ===== END UPDATED =====

// ===== UPDATED: Enhanced name field validation =====

// REQUIREMENT: All name validation rules from instructions
// REQUIREMENT: Check for numbers and special characters separately

function validateNameField(field, showRequiredError = true) {
  const rawValue = field.value;
  const value = rawValue.trim();

  const fieldId = field.id;

  if (value === "") {
    if (field.hasAttribute("required") && showRequiredError) {
      showError(fieldId + "-error", "This field is required.");

      return false;
    }

    hideError(fieldId + "-error");

    return true;
  }

  // REQUIREMENT: Check for numbers and special characters first
  const MSG_NUMBERS_NOT_ALLOWED = "Numbers are not allowed.";
  const MSG_SPECIAL_CHARS_NOT_ALLOWED = "Special characters are not allowed.";
  
  const hasNumbers = /[0-9]/.test(value);
  const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(value);

  if (hasNumbers && hasSpecialChars) {
    // Check which type of character appears first
    const firstNumberIndex = value.search(/[0-9]/);
    const firstSpecialCharIndex = value.search(/[^a-zA-Z0-9\s]/);
    
    if (firstNumberIndex < firstSpecialCharIndex) {
      showError(fieldId + "-error", "Numbers and special characters are not allowed.");
    } else {
      showError(fieldId + "-error", "Special characters and numbers are not allowed.");
    }
    return false;
  } else if (hasSpecialChars) {
    showError(fieldId + "-error", MSG_SPECIAL_CHARS_NOT_ALLOWED);
    return false;
  } else if (hasNumbers) {
    showError(fieldId + "-error", MSG_NUMBERS_NOT_ALLOWED);
    return false;
  }

  // REQUIREMENT: Double spaces not allowed
  if (rawValue.includes("  ")) {
    showError(fieldId + "-error", "Double spaces are not allowed.");
    return false;
  }

  // REQUIREMENT: Three consecutive identical letters not allowed (case-insensitive)
  // Note: check this BEFORE the all-caps rule so AAA shows this specific error
  // Also restrict to letters only to avoid false positives on spaces/symbols
  if (/([a-z])\1{2}/i.test(value)) {
    showError(
      fieldId + "-error",
      "Three consecutive identical letters are not allowed."
    );

    return false;
  }

  // REQUIREMENT: All capital letters not allowed

  if (value === value.toUpperCase() && value.length > 1) {
    showError(fieldId + "-error", "All capital letters are not allowed.");

    return false;
  }

  // REQUIREMENT: Proper capitalization - First letter capital, rest lowercase

  const words = value.split(" ");

  for (let word of words) {
    if (word.length > 0) {
      const firstLetter = word[0];

      const restLetters = word.slice(1);

      if (firstLetter !== firstLetter.toUpperCase()) {
        showError(
          fieldId + "-error",
          "First letter must be capital (e.g., Juan Carlo)."
        );

        return false;
      }

      if (restLetters !== restLetters.toLowerCase()) {
        showError(
          fieldId + "-error",
          "Only first letter should be capital, rest must be lowercase (e.g., Juan Carlo)."
        );

        return false;
      }
    }
  }

  // Length validation for name fields (only after other validations pass)
  if (fieldId === "firstname") {
    if (value.length < 2) {
      showError(fieldId + "-error", "First name must be at least 2 characters.");
      return false;
    }
    if (value.length > 50) {
      showError(fieldId + "-error", "First name cannot exceed 50 characters.");
      return false;
    }
  } else if (fieldId === "mi") {
    if (value.length > 50) {
      showError(fieldId + "-error", "Middle name cannot exceed 50 characters.");
      return false;
    }
  } else if (fieldId === "lastname") {
    if (value.length < 2) {
      showError(fieldId + "-error", "Family name must be at least 2 characters.");
      return false;
    }
    if (value.length > 50) {
      showError(fieldId + "-error", "Family name cannot exceed 50 characters.");
      return false;
    }
  }

  hideError(fieldId + "-error");

  return true;
}

// ===== END UPDATED =====

// ===== ADDED: Custom extension validation =====

// REQUIREMENT: Validate custom extension - Roman numerals only (I-XXII), no spaces, no numbers, no ordinal indicators

function validateCustomExtension(field) {
  const value = field.value;

  // Roman numerals only: I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, XIII, XIV, XV, XVI, XVII, XVIII, XIX, XX, XXI, XXII

  const romanNumerals =
    /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|XXI|XXII)$/i;

  // Check if value matches Roman numerals pattern only

  if (!romanNumerals.test(value)) {
    showError(
      "custom-extname-error",
      "Please enter a valid extension (Roman numerals, e.g., II, III, IV)."
    );

    return false;
  }

  hideError("custom-extname-error");

  return true;
}

// ===== END ADDED =====

// ===== UPDATED: ID Number validation =====

// REQUIREMENT: ID Number format xxxx-xxxx with proper validation

function validateIDNumber(field, showRequiredError = true) {
  const value = field.value.trim();

  const idPattern = /^[0-9]{4}-[0-9]{4}$/;

  if (!value) {
    if (showRequiredError) {
      showError("idno-error", "This field is required.");
    }

    return false;
  }

  if (!idPattern.test(value)) {
    showError("idno-error", "ID Number must be in format xxxx-xxxx");

    return false;
  }

  hideError("idno-error");

  return true;
}

// ===== END UPDATED =====

// ===== ADDED: Check ID Number availability in database =====

// REQUIREMENT: ID number is primary key, check for duplicates

function checkIDNumberAvailability(idNumber) {
  const errorElement = document.getElementById("idno-error");

  // Create form data

  const formData = new FormData();

  formData.append("action", "check_id");

  formData.append("idno", idNumber);

  // Make AJAX call to check availability

  fetch("php/check_availability.php", {
    method: "POST",

    body: formData,
  })
    .then((response) => response.json())

    .then((data) => {
      if (data.exists) {
        showError("idno-error", "ID Number already exists.");
      } else {
        hideError("idno-error");
      }
    })

    .catch((error) => {
      console.error("Error checking ID number:", error);
    });
}

// ===== END ADDED =====

// ===== UPDATED: Enhanced password strength checker =====

// REQUIREMENT: Check if password is weak, medium, or strong

function checkPasswordStrength(password) {
  let strength = 0;

  // Check length

  if (password.length >= 8) strength++;

  if (password.length >= 12) strength++;

  // Check for lowercase

  if (/[a-z]/.test(password)) strength++;

  // Check for uppercase

  if (/[A-Z]/.test(password)) strength++;

  // Check for numbers

  if (/[0-9]/.test(password)) strength++;

  // Check for special characters

  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const strengthContainer = document.getElementById(
    "password-strength-container"
  );

  const strengthLabel = document.getElementById("password-strength-label");

  if (password.length === 0) {
    strengthContainer.style.display = "none";

    strengthContainer.className = "password-strength-container";
  } else if (strength < 3) {
    strengthContainer.style.display = "flex";

    strengthContainer.className = "password-strength-container weak";

    strengthLabel.textContent = "Weak";
  } else if (strength < 5) {
    strengthContainer.style.display = "flex";

    strengthContainer.className = "password-strength-container medium";

    strengthLabel.textContent = "Medium";
  } else {
    strengthContainer.style.display = "flex";

    strengthContainer.className = "password-strength-container strong";

    strengthLabel.textContent = "Strong";
  }
}

// ===== END UPDATED =====

// ===== ADDED: Basic password policy validation =====

// REQUIREMENT: Min length 8 and at least 3 of 4 types (A-Z, a-z, 0-9, !@#$%^&*)
function passwordCategoryCount(password) {
  let count = 0;
  if (/[A-Z]/.test(password)) count++;
  if (/[a-z]/.test(password)) count++;
  if (/[0-9]/.test(password)) count++;
  if (/[!@#$%^&*]/.test(password)) count++;
  return count;
}

function ensurePasswordRulesContainer() {
  let container = document.getElementById("password-rules-container");
  if (!container) {
    const strengthContainer = document.getElementById("password-strength-container");
    if (!strengthContainer) return null;
    container = document.createElement("div");
    container.id = "password-rules-container";
    container.className = "password-rules-container";
    const list = document.createElement("ul");
    list.id = "password-rules";
    list.className = "password-rules";
    container.appendChild(list);

    // Insert after the password strength indicator
    strengthContainer.parentNode.insertBefore(container, strengthContainer.nextSibling);
  }
  return container;
}

function setRuleItem(id, text, isValid) {
  const list = document.getElementById("password-rules") || (function(){
    const container = ensurePasswordRulesContainer();
    if (!container) return null;
    return document.getElementById("password-rules");
  })();
  if (!list) return;

  let item = document.getElementById(id);
  if (!item) {
    item = document.createElement("li");
    item.id = id;
    item.className = "rule-item";
    list.appendChild(item);
  }
  item.innerHTML = text;
  item.className = isValid ? "rule-item valid" : "rule-item invalid";
}

function removeRuleItem(id) {
  const item = document.getElementById(id);
  if (item && item.parentNode) {
    item.parentNode.removeChild(item);
  }
}

function renderPasswordRules(value, showRequiredError = true, showStrengthError = false) {
  ensurePasswordRulesContainer();
  const isEmpty = (value || "").length === 0;
  const requiredOk = !isEmpty || !showRequiredError;
  const minLenOk = value.length >= 8;
  const maxLenOk = value.length <= 60;
  
  // Check password strength
  let strength = 0;
  if (value.length >= 8) strength++;
  if (value.length >= 12) strength++;
  if (/[a-z]/.test(value)) strength++;
  if (/[A-Z]/.test(value)) strength++;
  if (/[0-9]/.test(value)) strength++;
  if (/[^A-Za-z0-9]/.test(value)) strength++;
  
  const isStrengthOk = isEmpty || strength >= 3; // Allow medium or strong passwords

  if (isEmpty) {
    removeRuleItem("rule-length");
    removeRuleItem("rule-max-length");
    removeRuleItem("rule-spaces");
    removeRuleItem("rule-mix");
    removeRuleItem("rule-strength");
    if (showRequiredError) {
      setRuleItem("rule-required", "This field is required.", false);
    } else {
      removeRuleItem("rule-required");
    }
  } else {
    removeRuleItem("rule-required");
    if (!minLenOk) {
      setRuleItem(
        "rule-length",
        "Password must be at least 8 characters.",
        false
      );
    } else {
      removeRuleItem("rule-length");
    }
    
    if (!maxLenOk) {
      setRuleItem(
        "rule-max-length",
        "Password cannot exceed 60 characters.",
        false
      );
    } else {
      removeRuleItem("rule-max-length");
    }
    
    // Only show strength error when explicitly requested (on form submission)
    if (showStrengthError && !isStrengthOk) {
      setRuleItem(
        "rule-strength",
        '<i class="bi bi-exclamation-circle-fill"></i> Your password is too weak. Please make it stronger to continue.',
        false
      );
    } else {
      removeRuleItem("rule-strength");
    }
    
    removeRuleItem("rule-spaces");
    removeRuleItem("rule-mix");
  }

  return requiredOk && minLenOk && maxLenOk && isStrengthOk;
}

function validatePasswordBasic(field, showRequiredError = true, showStrengthError = false) {
  const value = field.value || "";

  // Update rules UI and return validity
  return renderPasswordRules(value, showRequiredError, showStrengthError);
}

// ===== END ADDED =====

// ===== ADDED: Check password match =====

// REQUIREMENT: Re-enter password must match password

function checkPasswordMatch() {
  const password = document.getElementById("password").value;
  const password2 = document.getElementById("password2").value;
  const matchContainer = document.getElementById("password-match-container");
  const matchLabel = document.getElementById("password-match-label");

  if (password2 === "") {
    // Hide indicator when field is empty
    if (matchContainer) {
      matchContainer.style.display = "none";
      matchContainer.className = "password-match-container";
    }
    hideError("password2-error");
    return;
  }

  // Show indicator when user starts typing
  if (matchContainer) {
    matchContainer.style.display = "flex";
  }

  if (password === password2) {
    // Passwords match perfectly - show full green indicator
    if (matchContainer && matchLabel) {
      matchContainer.className = "password-match-container match";
      matchLabel.textContent = "Passwords match";
    }
    hideError("password2-error");
  } else if (password2.length <= 3) {
    // User just started typing - show partial progress
    if (matchContainer && matchLabel) {
      matchContainer.className = "password-match-container partial";
      matchLabel.textContent = "Keep typing...";
    }
  } else {
    // Passwords don't match and user has typed more - show more progress but still red
    if (matchContainer && matchLabel) {
      matchContainer.className = "password-match-container no-match";
      matchLabel.textContent = "Passwords do not match";
    }
  }
}

// ===== END ADDED =====

// ===== UPDATED: Username availability check with status indicator =====

// REQUIREMENT: Automatically check if username exists

function checkUsernameAvailability(username) {
  if (username.length < 4) return;

  const statusElement = document.getElementById("username-status");

  const errorElement = document.getElementById("username-error");

  // Show checking status

  statusElement.textContent = "Checking username...";

  statusElement.className = "username-status checking";

  hideError("username-error");

  // Create form data

  const formData = new FormData();

  formData.append("action", "check_username");

  formData.append("username", username);

  // Make AJAX call to check availability

  fetch("php/check_availability.php", {
    method: "POST",

    body: formData,
  })
    .then((response) => response.json())

    .then((data) => {
      if (data.exists) {
        statusElement.textContent = "Username already exists";

        statusElement.className = "username-status taken";
      } else {
        statusElement.textContent = "Username available";

        statusElement.className = "username-status available";

        hideError("username-error");
      }
    })

    .catch((error) => {
      console.error("Error checking username:", error);

      hideUsernameStatus();
    });
}

// ===== END UPDATED =====

// ===== UPDATED: Email availability check =====

// REQUIREMENT: Check if email already exists in database
function checkEmailAvailability(email) {
  if (!email || email.length < 3) return;

  const errorElement = document.getElementById("email-error");

  hideError("email-error");

  const formData = new FormData();
  formData.append("action", "check_email");
  formData.append("email", email);

  fetch("php/check_availability.php", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.exists) {
        showError("email-error", "Email Address already exists.");
      } else {
        hideError("email-error");
      }
    })
    .catch((error) => {
      console.error("Error checking email:", error);
    });
}

// ===== END UPDATED =====

// ===== UPDATED: Email validation =====

// REQUIREMENT: Email rules (no spaces, no consecutive dots, disallow specific symbols,
// case-insensitive, and must be in name@domain.tld format)
function validateEmail(field, showRequiredError = true) {
  const value = field.value.trim();

  // Required check
  if (!value) {
    if (showRequiredError) {
      showError("email-error", "This field is required");
    }
    return false;
  }

  // 1) No spaces allowed anywhere in the email
  if (/\s/.test(value)) {
    showError("email-error", "No spaces are allowed.");
    return false;
  }

  // 2) No consecutive dots allowed
  if (/\.\./.test(value)) {
    showError("email-error", "Email address cannot contain consecutive dots.");
    return false;
  }

  // 3) Disallow specific special characters regardless of position
  //    Disallowed: ! # $ % ^ & * ( ) = { } [ ] : ; " ' < > , ? / \\ | ~
  if (/[!#$%\^&*()={}\[\]:;"'<> ,?\/\\|~]/.test(value)) {
    showError(
      "email-error",
      "Please enter a valid email address (e.g., chael@gmail.com)."
    );
    return false;
  }

  // 4) Valid email format (case-insensitive)
  //    Basic RFC-like pattern: name@domain.tld with at least 2-letter TLD
  const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (!emailPattern.test(value)) {
    showError(
      "email-error",
      "Please enter a valid email address (e.g., chael@gmail.com)."
    );
    return false;
  }

  // Length validation (only after other validations pass)
  if (value.length < 6) {
    showError("email-error", "Email is too short. Enter at least 6 characters.");
    return false;
  }
  
  if (value.length > 100) {
    showError("email-error", "Email address cannot exceed 100 characters.");
    return false;
  }

  hideError("email-error");
  return true;
}

// ===== END ADDED =====

// ===== ADDED: Address field validation =====

// REQUIREMENT: Basic input validation for address fields

function validateAddressField(field, showRequiredError = true) {
  const rawValue = field.value;
  const value = rawValue.trim();

  const fieldId = field.id;

  if (value === "") {
    if (field.hasAttribute("required") && showRequiredError) {
      showError(fieldId + "-error", "This field is required");

      return false;
    }

    hideError(fieldId + "-error");

    return true;
  }

  // SIMPLE PER-FIELD RULES to match input restrictions
  const alnumSpace = /^[a-zA-Z0-9\s]+$/; // letters, numbers, spaces
  const alnumSpaceHyphen = /^[a-zA-Z0-9\s-]+$/; // letters, numbers, spaces, hyphen (for purok only)
  const alphaSpace = /^[a-zA-Z\s]+$/; // letters, spaces

  if (fieldId === "purok") {
    // Special case: if user enters just "-", show specific Purok message
    if (value === "-") {
      showError(fieldId + "-error", "Enter a valid Purok/Street (e.g., P-1, Purok 1).");
      return false;
    }
    if (!alnumSpaceHyphen.test(value)) {
      showError(fieldId + "-error", "Special characters are not allowed.");
      return false;
    }
  } else if (fieldId === "barangay") {
    if (!alnumSpace.test(value)) {
      showError(fieldId + "-error", "Special characters are not allowed.");
      return false;
    }
  } else if (
    fieldId === "municipality" ||
    fieldId === "province" ||
    fieldId === "country"
  ) {
    if (!alphaSpace.test(value)) {
      const hasNumbers = /[0-9]/.test(value);
      const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(value);
      
      if (hasNumbers && hasSpecialChars) {
        // Check which type of character appears first
        const firstNumberIndex = value.search(/[0-9]/);
        const firstSpecialCharIndex = value.search(/[^a-zA-Z0-9\s]/);
        
        if (firstNumberIndex < firstSpecialCharIndex) {
          showError(fieldId + "-error", "Numbers and special characters are not allowed.");
        } else {
          showError(fieldId + "-error", "Special characters and numbers are not allowed.");
        }
      } else if (hasNumbers && !hasSpecialChars) {
        showError(fieldId + "-error", "Numbers are not allowed.");
      } else if (hasSpecialChars && !hasNumbers) {
        showError(fieldId + "-error", "Special characters are not allowed.");
      }
      return false;
    }
  }

  // EXTRA RULES: no double spaces, and each word must start with a capital letter
  if (rawValue.includes("  ")) {
    showError(fieldId + "-error", "Double spaces are not allowed.");
    return false;
  }

  // Check capitalization for each word (e.g., "Los Angeles")
  // EXCEPTION: In purok and barangay, numeric-only words (e.g., 1, 5) are allowed
  const words = value.split(/\s+/).filter(Boolean);
  const allWordsCapitalized =
    fieldId === "purok" || fieldId === "barangay"
      ? words.every((w) => /^\d+$/.test(w) || /^[A-Z]/.test(w))
      : words.every((w) => /^[A-Z]/.test(w));
  if (!allWordsCapitalized) {
    showError(
      fieldId + "-error",
      "Each word must start with a capital letter (e.g., Los Angeles)."
    );
    return false;
  }

  // Length validation for address fields (only after other validations pass)
  if (fieldId === "purok") {
    if (value.length < 2) {
      showError(fieldId + "-error", "Purok/Street must be at least 2 characters.");
      return false;
    }
    if (value.length > 60) {
      showError(fieldId + "-error", "Purok/Street cannot exceed 60 characters.");
      return false;
    }
  } else if (fieldId === "barangay") {
    if (value.length < 5) {
      showError(fieldId + "-error", "Barangay must be at least 5 characters.");
      return false;
    }
    if (value.length > 60) {
      showError(fieldId + "-error", "Barangay cannot exceed 60 characters.");
      return false;
    }
  } else if (fieldId === "municipality") {
    if (value.length < 3) {
      showError(fieldId + "-error", "Municipality/City must be at least 3 characters.");
      return false;
    }
    if (value.length > 100) {
      showError(fieldId + "-error", "Municipality/City cannot exceed 100 characters.");
      return false;
    }
  } else if (fieldId === "province") {
    if (value.length < 4) {
      showError(fieldId + "-error", "Province must be at least 4 characters.");
      return false;
    }
    if (value.length > 60) {
      showError(fieldId + "-error", "Province cannot exceed 60 characters.");
      return false;
    }
  } else if (fieldId === "country") {
    if (value.length < 4) {
      showError(fieldId + "-error", "Country must be at least 4 characters.");
      return false;
    }
    if (value.length > 60) {
      showError(fieldId + "-error", "Country cannot exceed 60 characters.");
      return false;
    }
  }

  hideError(fieldId + "-error");

  return true;
}

// ===== END ADDED =====

// ===== ADDED: Zip code validation =====

// REQUIREMENT: Zip code validation

function validateZipCode(field, showRequiredError = true) {
  const value = field.value.trim();

  if (value === "") {
    if (field.hasAttribute("required") && showRequiredError) {
      showError("zip-error", "This field is required.");

      return false;
    }

    hideError("zip-error");

    return true;
  }

  // Enforce exactly 4 digits for Philippine ZIP codes
  if (!/^[0-9]{4}$/.test(value)) {
    showError(
      "zip-error",
      "Please enter a valid 4-digit ZIP Code (e.g., 1000)."
    );

    return false;
  }

  hideError("zip-error");

  return true;
}

// ===== END ADDED =====

// ===== ADDED: Hide username status =====

function hideUsernameStatus() {
  const statusElement = document.getElementById("username-status");

  if (statusElement) {
    statusElement.className = "username-status";
  }
}

// ===== END ADDED =====

// Show error message

function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);

  if (errorElement) {
    errorElement.innerHTML = message;

    errorElement.className = "error-message show";
  }
}

// Hide error message

function hideError(elementId) {
  const errorElement = document.getElementById(elementId);

  if (errorElement) {
    errorElement.innerHTML = "";

    errorElement.className = "error-message";
  }
}

// Clear all error messages

function clearAllErrors() {
  const errorElements = document.querySelectorAll(".error-message");

  errorElements.forEach((element) => {
    element.textContent = "";

    element.className = "error-message";
  });
}