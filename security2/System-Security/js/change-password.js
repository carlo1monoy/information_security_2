document.addEventListener("DOMContentLoaded", function () {
  const resetToken = sessionStorage.getItem('reset_token');
  
  console.log('Change Password Page Loaded');
  console.log('Reset token from sessionStorage:', resetToken ? 'Found (length: ' + resetToken.length + ')' : 'NOT FOUND');
  
  if (!resetToken) {
    console.error('No reset token found in sessionStorage. User must restart password reset process.');
    showError('form-error', 'Invalid password reset request. Please try the forgot password process again.');
    const form = document.getElementById("changePasswordForm");
    if (form) {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
    }
  } else {
    console.log('Reset token first 16 chars:', resetToken.substring(0, 16) + '...');

    // Fetch and display user info tied to this reset token
    const formData = new FormData();
    formData.append('reset_token', resetToken);

    fetch('php/get-reset-user.php', {
      method: 'POST',
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          if (data.id_number && document.getElementById('user-id-display')) {
            document.getElementById('user-id-display').textContent = data.id_number;
          }
          if (data.username && document.getElementById('username-display')) {
            document.getElementById('username-display').textContent = data.username;
          }
          const userInfo = document.getElementById('user-info');
          if (userInfo) {
            userInfo.style.display = 'block';
          }
        } else if (data && data.message) {
          showError('form-error', data.message);
        }
      })
      .catch(() => {
        showError('form-error', 'Unable to load account details. You may need to restart the password reset process.');
      });
  }

  const form = document.getElementById("changePasswordForm");
  const passwordInput = document.getElementById("password");
  const password2Input = document.getElementById("password2");
  const passwordToggleButton = document.getElementById("password-toggle");
  const passwordToggleIcon = document.getElementById("password-toggle-icon");
  const password2ToggleButton = document.getElementById("password2-toggle");
  const password2ToggleIcon = document.getElementById("password2-toggle-icon");

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

    validatePasswordBasic(this, false);
    checkPasswordStrength(this.value);

    if (password2Input.value) {
      checkPasswordMatch();
    }
  });

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

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (validateForm()) {
      submitPasswordChange();
    }
  });

  if (passwordToggleButton && passwordInput && passwordToggleIcon) {
    passwordToggleButton.addEventListener("click", function () {
      const isHidden = passwordInput.getAttribute("type") === "password";
      passwordInput.setAttribute("type", isHidden ? "text" : "password");

      if (isHidden) {
        passwordToggleIcon.classList.remove("bi-eye-fill");
        passwordToggleIcon.classList.add("bi-eye-slash-fill");
        passwordToggleButton.setAttribute("aria-label", "Hide password");
        passwordToggleButton.setAttribute("title", "Hide password");
      } else {
        passwordToggleIcon.classList.remove("bi-eye-slash-fill");
        passwordToggleIcon.classList.add("bi-eye-fill");
        passwordToggleButton.setAttribute("aria-label", "Show password");
        passwordToggleButton.setAttribute("title", "Show password");
      }
    });
  }

  if (password2ToggleButton && password2Input && password2ToggleIcon) {
    password2ToggleButton.addEventListener("click", function () {
      const isHidden = password2Input.getAttribute("type") === "password";
      password2Input.setAttribute("type", isHidden ? "text" : "password");

      if (isHidden) {
        password2ToggleIcon.classList.remove("bi-eye-fill");
        password2ToggleIcon.classList.add("bi-eye-slash-fill");
        password2ToggleButton.setAttribute("aria-label", "Hide password");
        password2ToggleButton.setAttribute("title", "Hide password");
      } else {
        password2ToggleIcon.classList.remove("bi-eye-slash-fill");
        password2ToggleIcon.classList.add("bi-eye-fill");
        password2ToggleButton.setAttribute("aria-label", "Show password");
        password2ToggleButton.setAttribute("title", "Show password");
      }
    });
  }
});

function submitPasswordChange() {
  const form = document.getElementById("changePasswordForm");
  const submitBtn = form.querySelector('button[type="submit"]');
  const resetToken = sessionStorage.getItem('reset_token');
  
  console.log('Submitting password change...');
  console.log('Token in sessionStorage:', resetToken ? 'Present (length: ' + resetToken.length + ')' : 'MISSING');
  
  if (!resetToken) {
    console.error('Cannot submit: No reset token available');
    showError('form-error', 'Session expired. Please restart the password reset process.');
    return;
  }
  
  if (submitBtn) submitBtn.disabled = true;
  
  const formData = new FormData(form);
  formData.append('reset_token', resetToken);
  
  console.log('Sending token to server (first 16 chars):', resetToken.substring(0, 16) + '...');
  
  fetch('php/change-password.php', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data && data.success) {
      sessionStorage.removeItem('reset_token');
      
      const successMessage = document.getElementById("success-message");
      if (successMessage) {
        successMessage.textContent = data.message || "Password successfully changed.";
        successMessage.style.display = "block";
      }
      
      hideError('form-error');
      
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else if (data && data.errors) {
      showError('form-error', data.errors[0] || 'Password change failed. Please try again.');
    } else {
      showError('form-error', data && data.message ? data.message : 'Password change failed. Please try again.');
    }
  })
  .catch(() => {
    showError('form-error', 'Network error. Please try again.');
  })
  .finally(() => {
    if (submitBtn) submitBtn.disabled = false;
  });
}

function validateForm() {
  let isValid = true;
  clearAllErrors();

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
    showError("password2-error", "Confirm your new password.");
    isValid = false;
  } else if (passwordValue !== password2Field.value) {
    isValid = false;
  }

  return isValid;
}

function checkPasswordStrength(password) {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const strengthContainer = document.getElementById("password-strength-container");
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
      setRuleItem("rule-required", "Enter your new password.", false);
    } else {
      removeRuleItem("rule-required");
    }
  } else {
    removeRuleItem("rule-required");
    if (!minLenOk) {
      setRuleItem("rule-length", "Password must be at least 8 characters.", false);
    } else {
      removeRuleItem("rule-length");
    }
    
    if (!maxLenOk) {
      setRuleItem("rule-max-length", "Password cannot exceed 60 characters.", false);
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
  return renderPasswordRules(value, showRequiredError, showStrengthError);
}

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

function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);

  if (errorElement) {
    errorElement.textContent = message;
    errorElement.className = "error-message show";
  }
}

function hideError(elementId) {
  const errorElement = document.getElementById(elementId);

  if (errorElement) {
    errorElement.textContent = "";
    errorElement.className = "error-message";
  }
}

function clearAllErrors() {
  const errorElements = document.querySelectorAll(".error-message");

  errorElements.forEach((element) => {
    element.textContent = "";
    element.className = "error-message";
  });
}
