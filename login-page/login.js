    // Login Page JavaScript

    document.addEventListener('DOMContentLoaded', function() {
        // Initialize login form
        initializeLoginForm();
        
        // Initialize password visibility toggle
        initializePasswordToggle();
        
        // Initialize remember me functionality
        initializeRememberMe();
        
        // Forgot Password Modal Logic
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        const forgotPasswordModal = document.getElementById('forgotPasswordModal');
        const closeForgotPasswordModal = document.getElementById('closeForgotPasswordModal');
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        const forgotPasswordMessage = document.getElementById('forgotPasswordMessage');

        if (forgotPasswordLink && forgotPasswordModal && closeForgotPasswordModal) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            forgotPasswordModal.classList.remove('hidden');
        });
        closeForgotPasswordModal.addEventListener('click', function() {
            forgotPasswordModal.classList.add('hidden');
            forgotPasswordMessage.textContent = '';
        });
        forgotPasswordModal.addEventListener('click', function(e) {
            if (e.target === forgotPasswordModal) {
            forgotPasswordModal.classList.add('hidden');
            forgotPasswordMessage.textContent = '';
            }
        });
        }
        if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value.trim();
            forgotPasswordMessage.textContent = '';
            if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            forgotPasswordMessage.textContent = 'Please enter a valid email address.';
            forgotPasswordMessage.className = 'text-red-600 mt-2';
            return;
            }
            fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
            })
            .then(res => res.json())
            .then(data => {
            if (data.success) {
                forgotPasswordMessage.textContent = 'Password reset link sent! Check your email.';
                forgotPasswordMessage.className = 'text-green-600 mt-2';
            } else {
                forgotPasswordMessage.textContent = data.message || 'Failed to send reset link.';
                forgotPasswordMessage.className = 'text-red-600 mt-2';
            }
            })
            .catch(() => {
            forgotPasswordMessage.textContent = 'An error occurred. Please try again.';
            forgotPasswordMessage.className = 'text-red-600 mt-2';
            });
        });
        }
    });

    function initializeLoginForm() {
        const loginForm = document.querySelector('#login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', function(event) {
                event.preventDefault();
                handleLogin();
            });
        }

        // Initialize input validation
        initializeInputValidation();
    }

    function handleLogin() {
        const email = document.querySelector('#email').value;
        const password = document.querySelector('#password').value;
        const rememberMe = document.querySelector('#remember-me').checked;
        const role = document.querySelector('#roleInput').value;
        
        // Validate inputs
        if (!validateInputs(email, password)) {
            return;
        }
        
        
        // Perform login via API
        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, role })
        })
        .then(async response => {
            const data = await response.json();
        
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
        
            // Login successful
    // Login successful
    localStorage.setItem('token', data.token); // ✅ correct key
    localStorage.setItem('userId', data.user._id);            // Optional but useful
    localStorage.setItem('userName', data.user.fullName);    // 🔥 Always set this


    if (rememberMe) {
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.setItem('rememberMe', true);
    }

    window.location.href = data.redirect;

        })
        .catch(error => {
            console.error('Login error:', error);
            showError(error.message || 'An error occurred during login. Please try again.');
        });
    }

    function initializePasswordToggle() {
        const toggleButton = document.querySelector('.password-toggle');
        const passwordInput = document.querySelector('#password');
        
        if (toggleButton && passwordInput) {
            toggleButton.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type');
                passwordInput.setAttribute('type', type === 'password' ? 'text' : 'password');
                toggleButton.classList.toggle('show-password');
            });
        }
    }

    function initializeRememberMe() {
        const rememberMe = document.querySelector('#remember-me');
        if (rememberMe) {
            // Check if there's a saved preference
            const savedPreference = localStorage.getItem('rememberMe');
            if (savedPreference) {
                rememberMe.checked = JSON.parse(savedPreference);
            }
            
            // Save preference when changed
            rememberMe.addEventListener('change', () => {
                localStorage.setItem('rememberMe', rememberMe.checked);


            });
        }
    }

    function initializeInputValidation() {
        const inputs = document.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                validateInput(input);
            });
            
            input.addEventListener('input', () => {
                // Remove error state while typing
                input.classList.remove('error');
                const errorElement = input.parentElement.querySelector('.error-message');
                if (errorElement) {
                    errorElement.remove();
                }
            });
        });
    }

    function validateInputs(email, password) {
        let isValid = true;
        
        // Validate email
        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            showError('email', 'Please enter a valid email address');
            isValid = false;
        }
        
        // Validate password
        if (!password || password.length < 6) {
            showError('password', 'Password must be at least 6 characters long');
            isValid = false;
        }
        
        return isValid;
    }

    function validateInput(input) {
        const value = input.value.trim();
        
        switch (input.id) {
            case 'email':
                if (!value || !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                    showError(input.id, 'Please enter a valid email address');
                }
                break;
                
            case 'password':
                if (!value || value.length < 6) {
                    showError(input.id, 'Password must be at least 6 characters long');
                }
                break;
        }
    }

    function showError(inputId, message) {
        const input = document.querySelector(`#${inputId}`);
        if (input) {
            input.classList.add('error');
            
            // Remove existing error message if any
            const existingError = input.parentElement.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Add new error message
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            input.parentElement.appendChild(errorElement);
        }
    }

    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");

    togglePassword.addEventListener("click", () => {
        const type = passwordInput.type === "password" ? "text" : "password";
        passwordInput.type = type;
        togglePassword.textContent = type === "password" ? "👁️" : "🙈";
    });

