const ANSWER_TOGGLE_CONFIGS = [
  { inputId: 'answer1', buttonId: 'answer1-toggle', iconId: 'answer1-toggle-icon' },
  { inputId: 'answer2', buttonId: 'answer2-toggle', iconId: 'answer2-toggle-icon' },
  { inputId: 'answer3', buttonId: 'answer3-toggle', iconId: 'answer3-toggle-icon' },
  { inputId: 'answer1_confirm', buttonId: 'answer1-confirm-toggle', iconId: 'answer1-confirm-toggle-icon' },
  { inputId: 'answer2_confirm', buttonId: 'answer2-confirm-toggle', iconId: 'answer2-confirm-toggle-icon' },
  { inputId: 'answer3_confirm', buttonId: 'answer3-confirm-toggle', iconId: 'answer3-confirm-toggle-icon' },
];

let usernameForm;
let verifyForm;

document.addEventListener('DOMContentLoaded', function () {
  usernameForm = document.getElementById('usernameForm');
  verifyForm = document.getElementById('verifyForm');
  const cancelBtn1 = document.getElementById('cancelBtn1');
  const cancelBtn2 = document.getElementById('cancelBtn2');

  if (cancelBtn1) {
    cancelBtn1.addEventListener('click', function () {
      window.location.href = 'login.html';
    });
  }

  if (cancelBtn2) {
    cancelBtn2.addEventListener('click', function () {
      window.location.href = 'login.html';
    });
  }

  if (usernameForm) {
    usernameForm.addEventListener('submit', function (e) {
      e.preventDefault();
      handleUsernameSubmit();
    });
  }

  if (verifyForm) {
    verifyForm.addEventListener('submit', function (e) {
      e.preventDefault();
      handleVerifySubmit();
    });
  }

  ANSWER_TOGGLE_CONFIGS.forEach((config) =>
    setupVisibilityToggle({
      ...config,
      showLabel: 'Show answer',
      hideLabel: 'Hide answer',
    })
  );

  const usernameField = document.getElementById('username');
  if (usernameField) {
    usernameField.addEventListener('input', function () {
      // Clear any previous error
      hideError('username-error');

      // Enforce numeric-only ID format xxxx-xxxx
      let digits = this.value.replace(/\D/g, '');
      if (digits.length > 8) {
        digits = digits.slice(0, 8);
      }

      if (digits.length > 4) {
        this.value = digits.slice(0, 4) + '-' + digits.slice(4);
      } else {
        this.value = digits;
      }
    });
  }

  const answerFields = ['answer1', 'answer2', 'answer3'];
  answerFields.forEach((fieldId) => {
    const answerField = document.getElementById(fieldId);
    const confirmField = document.getElementById(fieldId + '_confirm');
    
    if (answerField) {
      answerField.addEventListener('input', function () {
        hideError(fieldId + '-error');
        if (confirmField && confirmField.value) {
          checkAnswerMatch(fieldId);
        }
      });
    }
    
    if (confirmField) {
      confirmField.addEventListener('input', function () {
        hideError(fieldId + '-confirm-error');
        if (this.value) {
          checkAnswerMatch(fieldId);
        }
      });
    }
  });
});

function handleUsernameSubmit() {
  const usernameField = document.getElementById('username');
  const username = usernameField.value.trim();

  hideError('username-error');

  if (!username) {
    showError('username-error', 'ID Number is required');
    return;
  }

  const submitBtn = usernameForm ? usernameForm.querySelector('button[type="submit"]') : null;
  if (submitBtn) submitBtn.disabled = true;

  const formData = new FormData();
  formData.append('username', username);

  fetch('php/fetch-questions.php', {
    method: 'POST',
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data && data.success && data.questions) {
        document.getElementById('question1_text').value = convertQuestionToText(data.questions[0]);
        document.getElementById('question1').value = data.questions[0];
        document.getElementById('question2_text').value = convertQuestionToText(data.questions[1]);
        document.getElementById('question2').value = data.questions[1];
        document.getElementById('question3_text').value = convertQuestionToText(data.questions[2]);
        document.getElementById('question3').value = data.questions[2];
        document.getElementById('hidden_username').value = username;

        // If ID/username display fields exist, populate them for user confirmation
        if (data.id_number && document.getElementById('id-number-display')) {
          document.getElementById('id-number-display').textContent = data.id_number;
        }
        if (data.username && document.getElementById('username-display')) {
          document.getElementById('username-display').textContent = data.username;
        }
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
          userInfo.style.display = 'block';
        }

        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
      } else {
        showError('username-error', data && data.message ? data.message : 'ID Number not found');
      }
    })
    .catch(() => {
      showError('username-error', 'Network error. Please try again.');
    })
    .finally(() => {
      if (submitBtn) submitBtn.disabled = false;
    });
}

function handleVerifySubmit() {
  hideError('form-error');
  hideError('answer1-error');
  hideError('answer2-error');
  hideError('answer3-error');
  hideError('answer1-confirm-error');
  hideError('answer2-confirm-error');
  hideError('answer3-confirm-error');

  const qConfigs = [
    { answerId: 'answer1', confirmId: 'answer1_confirm', errorId: 'answer1-error', confirmErrorId: 'answer1-confirm-error' },
    { answerId: 'answer2', confirmId: 'answer2_confirm', errorId: 'answer2-error', confirmErrorId: 'answer2-confirm-error' },
    { answerId: 'answer3', confirmId: 'answer3_confirm', errorId: 'answer3-error', confirmErrorId: 'answer3-confirm-error' },
  ];

  let isValid = true;
  let completeQuestions = 0;

  qConfigs.forEach(cfg => {
    const answer = document.getElementById(cfg.answerId).value.trim();
    const confirm = document.getElementById(cfg.confirmId).value.trim();

    // Check if both answer and confirm are provided
    if (answer && confirm) {
      if (answer === confirm) {
        completeQuestions++;
      } else {
        showError(cfg.confirmErrorId, 'Answers do not match');
        isValid = false;
      }
    } else {
      // If either field is missing, show appropriate errors
      if (!answer) {
        showError(cfg.errorId, 'Enter your answer to verify your identity.');
        isValid = false;
      }
      if (!confirm) {
        showError(cfg.confirmErrorId, 'Re-enter your answer to verify your identity.');
        isValid = false;
      }
    }
  });

  // Require all 3 questions to be completed
  if (completeQuestions < 3) {
    showError('form-error', '<i class="bi bi-exclamation-circle-fill"></i> Answer all three authentication questions to verify your identity.');
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
      const formError = document.getElementById('form-error');
      if (formError) {
        formError.innerHTML = '';
        formError.className = 'error-message';
      }
    }, 5000);
    
    isValid = false;
  }

  if (!isValid) return;

  const submitBtn = verifyForm ? verifyForm.querySelector('button[type="submit"]') : null;
  if (submitBtn) submitBtn.disabled = true;

  const formData = new FormData(document.getElementById('verifyForm'));

  fetch('php/forgot-password.php', {
    method: 'POST',
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data && data.success) {
        console.log('Identity verification successful');
        if (data.token) {
          console.log('Received reset token from server (length: ' + data.token.length + ')');
          console.log('Token first 16 chars:', data.token.substring(0, 16) + '...');
          sessionStorage.setItem('reset_token', data.token);
          console.log('Token stored in sessionStorage');
          
          const storedToken = sessionStorage.getItem('reset_token');
          if (storedToken && storedToken === data.token) {
            console.log('Verified: Token successfully stored in sessionStorage');
          } else {
            console.error('ERROR: Token was NOT properly stored in sessionStorage!');
          }
        } else {
          console.error('ERROR: No token received from server!');
        }
        console.log('Redirecting to:', data.redirect || 'change-password.html');
        window.location.href = data.redirect || 'change-password.html';
      } else if (data && data.errors) {
        showError('form-error', data.errors[0] || 'Verification failed. Please try again.');
      } else {
        showError('form-error', data && data.message ? data.message : 'Verification failed. Please try again.');
      }
    })
    .catch(() => {
      showError('form-error', 'Network error. Please try again.');
    })
    .finally(() => {
      if (submitBtn) submitBtn.disabled = false;
    });
}

function checkAnswerMatch(fieldId) {
  const answerField = document.getElementById(fieldId);
  const confirmField = document.getElementById(fieldId + '_confirm');
  
  if (!answerField || !confirmField) return;
  
  const answer = answerField.value.trim();
  const confirm = confirmField.value.trim();
  
  if (confirm === '') {
    hideError(fieldId + '-confirm-error');
    return;
  }
  
  if (answer !== confirm) {
    showError(fieldId + '-confirm-error', 'Answers do not match');
  } else {
    hideError(fieldId + '-confirm-error');
  }
}

function setupVisibilityToggle({ inputId, buttonId, iconId, showLabel, hideLabel }) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);
  const icon = document.getElementById(iconId);

  if (!input || !button || !icon) return;

  const showText = showLabel || 'Show value';
  const hideText = hideLabel || 'Hide value';

  button.addEventListener('click', function () {
    const isHidden = input.getAttribute('type') === 'password';

    input.setAttribute('type', isHidden ? 'text' : 'password');

    if (isHidden) {
      icon.classList.remove('bi-eye-fill');
      icon.classList.add('bi-eye-slash-fill');
      button.setAttribute('aria-label', hideText);
      button.setAttribute('title', hideText);
    } else {
      icon.classList.remove('bi-eye-slash-fill');
      icon.classList.add('bi-eye-fill');
      button.setAttribute('aria-label', showText);
      button.setAttribute('title', showText);
    }
  });
}

function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.innerHTML = message;
    errorElement.className = 'error-message show';
  }
}

function hideError(elementId) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.innerHTML = '';
    errorElement.className = 'error-message';
  }
}

function convertQuestionToText(question) {
  const questionMap = {
    'best_friend_elementary': 'Who is your best friend in Elementary?',
    'favorite_pet': 'What is the name of your favorite pet?',
    'favorite_teacher': 'Who is your favorite teacher in high school?'
  };
  
  if (questionMap[question]) {
    return questionMap[question];
  }
  
  return question;
}
