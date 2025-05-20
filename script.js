// DOM Elements
const chatContainer = document.querySelector('.chat-container');
const inputField = document.querySelector('.input-field');
const loadingContainer = document.querySelector('.loading-container');
const suggestionButtons = document.querySelector('.suggestion-buttons');
const newChatButton = document.querySelector('.new-chat-button');
const menuButton = document.querySelector('.menu-button');
const sidebarContainer = document.querySelector('.sidebar-container');
const sidebarOverlay = document.querySelector('.sidebar-overlay');
const sidebarCloseButton = document.querySelector('.sidebar-close');
const chatHistoryList = document.querySelector('.chat-history-list');
const emptyChat = document.querySelector('.empty-chat-container');
const plusIcon = document.querySelector('.plus-icon');
const sendIcon = document.querySelector('.send-icon');
const inputToolsPopup = document.getElementById('inputToolsPopup');
const popupOverlay = document.querySelector('.popup-overlay');
const popupClose = document.querySelector('.popup-close');
const popupContent = document.querySelector('.popup-content');
const popupToolButtons = document.querySelectorAll('.popup-tool-button');
const headerRight = document.querySelector('.header-right');
const inputFieldContainer = document.querySelector('.input-field-container');

// Image Upload Variables
let currentUploadedImage = null;
let imagePreviewContainer = null;

// Image Generation Variables
const PEXELS_API_KEY = 'sOG1TBcLNJD5rU28AWrsOULtlJjQoW3pw6BRT8Ta6nau2FGREB0votg3';
let generatedImages = JSON.parse(localStorage.getItem('generatedImages')) || [];

// Authentication Configuration
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwylUFuhd8dStyOxymL3fUhbAX5wEG_mK5374RznxuZJ4JCDyyaK-TnoKut_R6IE4Tv/exec'; // Replace with your deployed Google Apps Script URL
let isAuthenticated = false;
let currentUser = null;

// Authentication Functions
async function signUp(email, password, username, profilePicture = '') {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&username=${encodeURIComponent(username)}&profilePicture=${encodeURIComponent(profilePicture)}`
        });

        const result = await response.text();
        if (result === "verification_sent") {
            return { success: true, message: "Verification code sent to your email" };
        } else if (result === "email_exists") {
            return { success: false, message: "Email already registered" };
        }
        return { success: false, message: "Registration failed" };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, message: "Registration failed" };
    }
}

async function verifyEmail(email, code) {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
        const result = await response.text();
        return result === "verified";
    } catch (error) {
        console.error('Verification error:', error);
        return false;
    }
}

// Helper function to update user info in ORIA_IDENTITY
function updateUserInfo(isSignedIn = false, username = '', email = '') {
    ORIA_IDENTITY.userInfo.isSignedIn = isSignedIn;
    ORIA_IDENTITY.userInfo.username = username;
    ORIA_IDENTITY.userInfo.email = email;
    
    // Log update for debugging
    console.log(`User info updated: ${isSignedIn ? 'Signed in as ' + username : 'Not signed in'}`);
}

async function signIn(email, password) {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=signin&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
        const result = await response.text();
        if (result.startsWith('success:')) {
            const userData = JSON.parse(result.substring(8));
            isAuthenticated = true;
            currentUser = userData;
            localStorage.setItem('auth', JSON.stringify({ email, userData }));
            
            // Set user info in ORIA_IDENTITY for AI responses
            updateUserInfo(true, userData.username || '', userData.email || '');
            
            updateHeaderUI();
            return { success: true };
        }
        return { success: false, message: "Invalid credentials" };
    } catch (error) {
        console.error('Sign in error:', error);
        return { success: false, message: "Sign in failed" };
    }
}

function signOut() {
    isAuthenticated = false;
    currentUser = null;
    
    // Clear user info in ORIA_IDENTITY
    updateUserInfo(false);
    
    localStorage.removeItem('auth');
    updateHeaderUI();
}

function updateHeaderUI() {
    // Clear existing header right content
    headerRight.innerHTML = '';
    
    if (isAuthenticated) {
        // Show profile picture and new chat button for authenticated users (removed settings button)
        headerRight.innerHTML = `
            <button class="new-chat-button" aria-label="New chat">
                <i class="fas fa-plus"></i>
            </button>
            <div class="profile-button" aria-label="Profile">
                ${currentUser.profilePicture ? 
                    `<img src="${currentUser.profilePicture}" alt="${currentUser.username}" class="profile-pic">` : 
                    `<div class="profile-initial">${currentUser.username.charAt(0).toUpperCase()}</div>`
                }
            </div>
        `;
        
        // Add event listeners
        headerRight.querySelector('.new-chat-button').addEventListener('click', startNewChat);
        headerRight.querySelector('.profile-button').addEventListener('click', showProfileMenu);
    } else {
        // Show create account icon for non-authenticated users
        headerRight.innerHTML = `
            <button class="auth-button" aria-label="Sign in">
                <i class="fas fa-user-plus"></i>
            </button>
        `;
        
        // Add event listener for authentication
        headerRight.querySelector('.auth-button').addEventListener('click', showAuthDialog);
    }
}

function showProfileMenu() {
    // Check if menu already exists
    if (document.querySelector('.profile-menu')) {
        document.querySelector('.profile-menu').remove();
        return;
    }
    
    const menu = document.createElement('div');
    menu.className = 'profile-menu';
    
    menu.innerHTML = `
        <div class="profile-menu-header">
            ${currentUser.profilePicture ? 
                `<img src="${currentUser.profilePicture}" alt="${currentUser.username}" class="profile-menu-pic">` : 
                `<div class="profile-menu-initial">${currentUser.username.charAt(0).toUpperCase()}</div>`
            }
            <div class="profile-menu-info">
                <div class="profile-menu-name">${currentUser.username}</div>
                <div class="profile-menu-email">${currentUser.email}</div>
            </div>
        </div>
        
        <!-- Clory Browser Ad -->
        <div class="clory-browser-ad" id="clory-browser-ad">
            <div class="clory-browser-ad-logo">
                <img src="image/clory-logo.svg" alt="Clory Browser">
            </div>
            <div class="clory-browser-ad-content">
                <div class="clory-browser-ad-title">Try Clory Browser</div>
                <div class="clory-browser-ad-description">Faster browsing with built-in AI features</div>
            </div>
            <div class="clory-browser-ad-badge">NEW</div>
        </div>
        
        <div class="profile-menu-items">
            <button class="profile-menu-item" id="edit-profile">
                <i class="fas fa-user-edit"></i> Edit Profile
            </button>
            <button class="profile-menu-item" id="settings">
                <i class="fas fa-cog"></i> Settings
            </button>
            <button class="profile-menu-item" id="saved-messages">
                <i class="fas fa-bookmark"></i> Saved Messages
            </button>
            
            <!-- Horizontal scrollable section -->
            <div class="profile-menu-horizontal">
                <button class="profile-menu-item" id="help-center">
                    <i class="fas fa-question-circle"></i> Help
                </button>
                <button class="profile-menu-item" id="about-oria">
                    <i class="fas fa-info-circle"></i> About
                </button>
                <button class="profile-menu-item" id="privacy-policy">
                    <i class="fas fa-shield-alt"></i> Privacy
                </button>
                <button class="profile-menu-item" id="terms-service">
                    <i class="fas fa-file-contract"></i> Terms
                </button>
            </div>
            
            <button class="profile-menu-item" id="sign-out">
                <i class="fas fa-sign-out-alt"></i> Sign Out
            </button>
        </div>
    `;
    
    // Position the menu
    const profileButton = document.querySelector('.profile-button');
    const rect = profileButton.getBoundingClientRect();
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    
    document.body.appendChild(menu);
    
    // Clory Browser Ad event listener
    document.getElementById('clory-browser-ad').addEventListener('click', () => {
        window.open('https://median.co/share/pylolj#apk', '_blank');
    });
    
    // Add event listeners
    document.getElementById('edit-profile').addEventListener('click', showEditProfileDialog);
    document.getElementById('settings').addEventListener('click', () => {
        window.location.href = 'settings.html';
        menu.remove();
    });
    
    // Event listeners for new menu items
    document.getElementById('saved-messages').addEventListener('click', () => {
        window.location.href = 'saved.html';
        menu.remove();
    });
    
    document.getElementById('help-center').addEventListener('click', () => {
       window.location.href = 'help.html';
        menu.remove();
    });
    
    document.getElementById('about-oria').addEventListener('click', () => {
        window.location.href = 'about.html';
        menu.remove();
    });
    
    document.getElementById('privacy-policy').addEventListener('click', () => {
        window.location.href = 'privacy.html';
        menu.remove();
    });
    
    document.getElementById('terms-service').addEventListener('click', () => {
        window.location.href = 'terms.html';
        menu.remove();
    });
    
    document.getElementById('sign-out').addEventListener('click', () => {
        // Close the menu
        menu.remove();
        
        // Create a sign out confirmation popup
        const popup = document.createElement('div');
        popup.className = 'confirmation-dialog';
        popup.id = 'signout-confirmation-' + Date.now();
        
        popup.innerHTML = `
            <div class="confirmation-dialog-content">
                <div class="confirmation-dialog-title"><i class="fas fa-sign-out-alt"></i> Sign Out</div>
                <div class="confirmation-dialog-message">Are you sure you want to sign out of your account?</div>
                <div class="confirmation-dialog-actions">
                    <button class="confirmation-dialog-btn cancel">Cancel</button>
                    <button class="confirmation-dialog-btn confirm">Sign Out</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Add event listeners for the popup buttons
        popup.querySelector('.confirmation-dialog-btn.cancel').addEventListener('click', () => {
            popup.classList.add('closing');
            setTimeout(() => popup.remove(), 200);
        });
        
        popup.querySelector('.confirmation-dialog-btn.confirm').addEventListener('click', () => {
            signOut();
            popup.classList.add('closing');
            setTimeout(() => popup.remove(), 200);
            addSystemMessage("You have been signed out");
        });
        
        // Close popup when clicking outside
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.classList.add('closing');
                setTimeout(() => popup.remove(), 200);
            }
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && !profileButton.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    });
}

function showEditProfileDialog() {
    // Close profile menu if open
    if (document.querySelector('.profile-menu')) {
        document.querySelector('.profile-menu').remove();
    }
    
    // Check if dialog already exists
    if (document.querySelector('.edit-profile-dialog')) {
        document.querySelector('.edit-profile-dialog').remove();
    }
    
    const dialog = document.createElement('div');
    dialog.className = 'edit-profile-dialog';
    
    dialog.innerHTML = `
        <div class="edit-profile-overlay"></div>
        <div class="edit-profile-content">
            <div class="edit-profile-header">
                <h2>Edit Profile</h2>
                <button class="close-profile-dialog">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="profile-picture-section">
                <div class="profile-picture-container">
                    ${currentUser.profilePicture ? 
                        `<img src="${currentUser.profilePicture}" alt="${currentUser.username}" class="current-profile-pic">` : 
                        `<div class="profile-placeholder">${currentUser.username.charAt(0).toUpperCase()}</div>`
                    }
                    <div class="profile-picture-overlay">
                        <i class="fas fa-camera"></i>
                    </div>
                </div>
                <input type="file" id="profile-picture-input" accept="image/*" style="display: none;">
            </div>
            <div class="edit-profile-form">
                <input type="text" id="edit-username" placeholder="Username" value="${currentUser.username}">
                <button class="auth-submit" id="save-profile">Save Changes</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Force a reflow to allow the transition to work
    dialog.offsetWidth;
    
    // Show the dialog
    dialog.classList.add('active');
    
    // Add event listeners
    const overlay = dialog.querySelector('.edit-profile-overlay');
    const closeBtn = dialog.querySelector('.close-profile-dialog');
    
    closeBtn.addEventListener('click', () => {
        closeEditProfileDialog(dialog);
    });
    
    overlay.addEventListener('click', () => {
        closeEditProfileDialog(dialog);
    });
    
    const profilePicContainer = dialog.querySelector('.profile-picture-container');
    const fileInput = dialog.querySelector('#profile-picture-input');
    
    profilePicContainer.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(event) {
                const img = dialog.querySelector('.current-profile-pic') || document.createElement('img');
                
                if (!dialog.querySelector('.current-profile-pic')) {
                    img.className = 'current-profile-pic';
                    const placeholder = dialog.querySelector('.profile-placeholder');
                    if (placeholder) placeholder.remove();
                    profilePicContainer.insertBefore(img, dialog.querySelector('.profile-picture-overlay'));
                }
                
                img.src = event.target.result;
                img.alt = currentUser.username;
            };
            
            reader.readAsDataURL(file);
        }
    });
    
    dialog.querySelector('#save-profile').addEventListener('click', async () => {
        const newUsername = dialog.querySelector('#edit-username').value.trim();
        const profilePicElement = dialog.querySelector('.current-profile-pic');
        const profilePicture = profilePicElement ? profilePicElement.src : '';
        
        if (newUsername) {
            // Show loading indicator
            const saveButton = dialog.querySelector('#save-profile');
            const originalButtonText = saveButton.textContent;
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveButton.disabled = true;
            saveButton.classList.add('loading');
            
            // Update user profile in backend
            try {
                const response = await fetch(`${GOOGLE_SCRIPT_URL}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `action=updateProfile&email=${encodeURIComponent(currentUser.email)}&username=${encodeURIComponent(newUsername)}&profilePicture=${encodeURIComponent(profilePicture)}`
                });
                
                // Update local user data
                currentUser.username = newUsername;
                currentUser.profilePicture = profilePicture;
                localStorage.setItem('auth', JSON.stringify({ email: currentUser.email, userData: currentUser }));
                
                // Update UI
                updateHeaderUI();
                closeEditProfileDialog(dialog);
                addSystemMessage("Profile updated successfully");
            } catch (error) {
                console.error('Profile update error:', error);
                
                // Restore button state
                saveButton.innerHTML = originalButtonText;
                saveButton.disabled = false;
                saveButton.classList.remove('loading');
                
                addSystemMessage("Failed to update profile. Please try again later.", true);
            }
        } else {
            addSystemMessage("Username cannot be empty", true);
        }
    });
}

// Add a helper function to close the dialog with animation
function closeEditProfileDialog(dialog) {
    dialog.classList.remove('active');
    
    // Wait for the animation to finish before removing from DOM
    setTimeout(() => {
        if (document.body.contains(dialog)) {
            dialog.remove();
        }
    }, 300); // Match this to your CSS transition duration
}

// Add a helper function to validate email domains
function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail)\.com$/i;
    return emailRegex.test(email);
}

function showAuthDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'auth-dialog fullscreen';
    dialog.innerHTML = `
        <div class="auth-content">
            <div class="auth-brand">
                <img src="image/oria.png" alt="Oria" class="auth-logo">
                <h1 class="auth-title">Oria</h1>
                <p class="auth-tagline">${ORIA_IDENTITY.tagline}</p>
            </div>
            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="signin">Sign In</button>
                <button class="auth-tab" data-tab="signup">Sign Up</button>
            </div>
            <div class="auth-form signin-form active">
                <input type="email" placeholder="Email" title="Please use a Gmail account (@gmail.com)" 
                       pattern="[a-zA-Z0-9._%+-]+@(gmail)\.com$"
                       oninput="validateEmailInput(this)"
                       required>
                <small class="email-hint"><i class="fab fa-google"></i> Only Gmail accounts (@gmail.com) are supported</small>
                <input type="password" placeholder="Password" required>
                <div class="auth-error signin-error" style="display: none;"></div>
                <button class="auth-submit">Sign In</button>
            </div>
            <div class="auth-form signup-form">
                <div class="profile-picture-section">
                    <div class="profile-picture-container">
                        <div class="profile-placeholder"><i class="fa-solid fa-user"></i></div>
                        <div class="profile-picture-overlay">
                            <i class="fas fa-camera"></i>
                        </div>
                    </div>
                    <div class="profile-required-hint">
                        <i class="fas fa-asterisk"></i> Profile picture required
                    </div>
                    <input type="file" id="signup-profile-picture" accept="image/*" style="display: none;">
                </div>
                <input type="text" placeholder="Username" required>
                <input type="email" placeholder="Email" title="Please use a Gmail account (@gmail.com)" 
                       pattern="[a-zA-Z0-9._%+-]+@(gmail)\.com$"
                       oninput="validateEmailInput(this)"
                       required>
                <small class="email-hint"><i class="fab fa-google"></i> Only Gmail accounts (@gmail.com) are supported</small>
                <input type="password" placeholder="Password" required>
                <div class="auth-error signup-error" style="display: none;"></div>
                <button class="auth-submit">Sign Up</button>
            </div>
            <div class="verification-form" style="display: none;">
                <p>Please enter the verification code sent to your email:</p>
                <div class="verification-code-inputs">
                    <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric">
                    <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric">
                    <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric">
                    <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric">
                    <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric">
                    <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric">
                </div>
                <div class="auth-error verify-error" style="display: none;"></div>
                <button class="verify-submit">Verify</button>
            </div>
            <div class="auth-loading" style="display: none;">
                <div class="auth-spinner"></div>
                <p class="loading-text">Processing...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Add event listeners for the auth dialog
    setupAuthDialogListeners(dialog);
}

function setupAuthDialogListeners(dialog) {
    const tabs = dialog.querySelectorAll('.auth-tab');
    const forms = dialog.querySelectorAll('.auth-form');
    let verificationEmail = '';
    let profilePictureData = '';
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            dialog.querySelector(`.${tab.dataset.tab}-form`).classList.add('active');
            // Hide any visible error messages
            dialog.querySelectorAll('.auth-error').forEach(err => err.style.display = 'none');
        });
    });
    
    // Add real-time email validation
    const emailInputs = dialog.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('input', function() {
            const email = this.value.trim();
            if (email) {
                if (!validateEmail(email)) {
                    this.classList.add('invalid-email');
                    this.setCustomValidity('Please use an email from Gmail');
                } else {
                    this.classList.remove('invalid-email');
                    this.setCustomValidity('');
                }
            } else {
                this.classList.remove('invalid-email');
                this.setCustomValidity('');
            }
            validateForm(this.closest('.auth-form'));
        });
    });
    
    // Add validation for all input fields
    const allInputs = dialog.querySelectorAll('.auth-form input');
    allInputs.forEach(input => {
        if (input.type !== 'email') { // Email inputs already have listeners
            input.addEventListener('input', function() {
                validateForm(this.closest('.auth-form'));
            });
        }
    });
    
    // Function to validate form and show/hide submit button
    function validateForm(form) {
        if (!form) return;
        
        const submitButton = form.querySelector('.auth-submit');
        const inputs = form.querySelectorAll('input:required');
        let isValid = true;
        
        // Check if all required inputs have values
        inputs.forEach(input => {
            if (!input.value.trim() || (input.type === 'email' && !validateEmail(input.value.trim()))) {
                isValid = false;
            }
        });
        
        // For signup form, also check profile picture
        if (form.classList.contains('signup-form')) {
            // Check if user has selected a profile picture
            const profilePic = document.querySelector('.signup-form .current-profile-pic');
            if (!profilePic && !profilePictureData) {
                isValid = false;
            }
        }
        
        // Update submit button state
        if (isValid) {
            submitButton.classList.add('active');
            submitButton.disabled = false;
        } else {
            submitButton.classList.remove('active');
            submitButton.disabled = true;
        }
    }
    
    // Initialize form validation state for both forms
    const authForms = dialog.querySelectorAll('.auth-form');
    authForms.forEach(form => {
        validateForm(form);
    });
    
    // Profile picture handling for signup
    const profilePicContainer = dialog.querySelector('.profile-picture-container');
    const fileInput = dialog.querySelector('#signup-profile-picture');
    
    if (profilePicContainer && fileInput) {
        profilePicContainer.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    profilePictureData = event.target.result;
                    const img = document.createElement('img');
                    img.src = profilePictureData;
                    img.alt = "Profile Picture";
                    img.className = 'current-profile-pic';
                    
                    const placeholder = dialog.querySelector('.profile-placeholder');
                    if (placeholder) placeholder.remove();
                    
                    profilePicContainer.insertBefore(img, dialog.querySelector('.profile-picture-overlay'));
                    
                    // Validate the form to update submit button state
                    validateForm(signupForm);
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Sign In form validation and submission
    const signinForm = dialog.querySelector('.signin-form');
    const signinSubmit = signinForm.querySelector('.auth-submit');
    const signinError = dialog.querySelector('.signin-error');
    
    signinSubmit.addEventListener('click', async () => {
        const email = signinForm.querySelector('input[type="email"]').value.trim();
        const password = signinForm.querySelector('input[type="password"]').value.trim();
        
        // Validate form
        if (!email || !password) {
            signinError.textContent = "Please fill in all fields";
            signinError.style.display = 'block';
            return;
        }
        
        // Validate email using regex pattern for supported domains
        if (!validateEmail(email)) {
            signinError.textContent = "Please use an email from Gmail";
            signinError.style.display = 'block';
            return;
        }
        
        // Show loading
        showAuthLoading(dialog, true);
        
        try {
            const result = await signIn(email, password);
            if (result.success) {
                // Save to localStorage
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userLoggedIn', 'true');
                
                dialog.remove();
            } else {
                signinError.textContent = result.message;
                signinError.style.display = 'block';
            }
        } catch (error) {
            signinError.textContent = "An error occurred. Please try again.";
            signinError.style.display = 'block';
        } finally {
            showAuthLoading(dialog, false);
        }
    });
    
    // Sign Up form validation and submission
    const signupForm = dialog.querySelector('.signup-form');
    const signupSubmit = signupForm.querySelector('.auth-submit');
    const signupError = dialog.querySelector('.signup-error');
    
    signupSubmit.addEventListener('click', async () => {
        const username = signupForm.querySelector('input[type="text"]').value.trim();
        const email = signupForm.querySelector('input[type="email"]').value.trim();
        const password = signupForm.querySelector('input[type="password"]').value.trim();
        
        // Validate form
        if (!username || !email || !password) {
            signupError.textContent = "Please fill in all fields";
            signupError.style.display = 'block';
            return;
        }
        
        // Validate email using regex pattern for supported domains
        if (!validateEmail(email)) {
            signupError.textContent = "Please use an email from Gmail";
            signupError.style.display = 'block';
            return;
        }
        
        // Show loading
        showAuthLoading(dialog, true);
        
        try {
            const result = await signUp(email, password, username, profilePictureData);
            if (result.success) {
                verificationEmail = email;
                
                // Save to localStorage for later
                localStorage.setItem('pendingVerificationEmail', email);
                
                // Show verification form
                dialog.querySelector('.auth-tabs').style.display = 'none';
                dialog.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
                dialog.querySelector('.verification-form').style.display = 'block';
                
                // Focus the first verification input
                const firstInput = dialog.querySelector('.verification-code-inputs input');
                if (firstInput) firstInput.focus();
            } else {
                signupError.textContent = result.message;
                signupError.style.display = 'block';
            }
        } catch (error) {
            signupError.textContent = "An error occurred. Please try again.";
            signupError.style.display = 'block';
        } finally {
            showAuthLoading(dialog, false);
        }
    });
    
    // Setup verification code inputs
    const verificationInputs = dialog.querySelectorAll('.verification-code-inputs input');
    verificationInputs.forEach((input, index) => {
        // Handle number input and auto-advance
        input.addEventListener('input', function(e) {
            if (e.target.value) {
                // Only allow numbers
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                
                // Move to next input
                if (index < verificationInputs.length - 1) {
                    verificationInputs[index + 1].focus();
                }
            }
        });
        
        // Handle backspace
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                verificationInputs[index - 1].focus();
            }
        });
    });
    
    // Verification form submission
    const verifySubmit = dialog.querySelector('.verify-submit');
    const verifyError = dialog.querySelector('.verify-error');
    
    // Function to show a success popup instead of an alert
    function showSuccessPopup(message) {
        // Remove any existing popup
        const existingPopup = document.querySelector('.success-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // Create popup element
        const popup = document.createElement('div');
        popup.className = 'success-popup';
        
        popup.innerHTML = `
            <div class="success-popup-content">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>${message}</h3>
                <button class="success-popup-button">Continue</button>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(popup);
        
        // Force reflow to trigger animation
        popup.offsetWidth;
        
        // Show popup with animation
        popup.classList.add('show');
        
        // Add event listener to button
        const continueButton = popup.querySelector('.success-popup-button');
        continueButton.addEventListener('click', () => {
            popup.classList.remove('show');
            setTimeout(() => {
                popup.remove();
                showAuthDialog(); // Show sign in form
            }, 300);
        });
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (document.body.contains(popup)) {
                popup.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(popup)) {
                        popup.remove();
                        showAuthDialog(); // Show sign in form
                    }
                }, 300);
            }
        }, 5000);
    }
    
    // Update the verification form submission to use the popup
    verifySubmit.addEventListener('click', async () => {
        // Get code from inputs
        let code = '';
        let isComplete = true;
        
        verificationInputs.forEach(input => {
            if (!input.value) {
                isComplete = false;
            }
            code += input.value;
        });
        
        if (!isComplete) {
            verifyError.textContent = "Please enter the complete 6-digit code";
            verifyError.style.display = 'block';
            return;
        }
        
        // Get the pending email if we don't have it (page refresh case)
        if (!verificationEmail) {
            verificationEmail = localStorage.getItem('pendingVerificationEmail');
            if (!verificationEmail) {
                verifyError.textContent = "Verification session expired. Please try again.";
                verifyError.style.display = 'block';
                return;
            }
        }
        
        // Show loading
        showAuthLoading(dialog, true);
        
        try {
            const verified = await verifyEmail(verificationEmail, code);
            
            if (verified) {
                localStorage.removeItem('pendingVerificationEmail');
                dialog.remove(); // Remove the auth dialog
                showSuccessPopup('Email verified successfully! Please sign in.');
            } else {
                verifyError.textContent = 'Invalid verification code. Please try again.';
                verifyError.style.display = 'block';
            }
        } catch (error) {
            verifyError.textContent = "An error occurred. Please try again.";
            verifyError.style.display = 'block';
        } finally {
            showAuthLoading(dialog, false);
        }
    });
    
    // Close dialog when clicking outside
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
        }
    });
}

// Helper function to show/hide loading in auth dialog
function showAuthLoading(dialog, show) {
    const loading = dialog.querySelector('.auth-loading');
    const forms = dialog.querySelectorAll('.auth-form, .verification-form');
    const tabs = dialog.querySelector('.auth-tabs');
    
    if (show) {
        loading.style.display = 'flex';
        forms.forEach(form => {
            if (form.style.display !== 'none') {
                form.classList.add('auth-form-disabled');
            }
        });
    } else {
        loading.style.display = 'none';
        forms.forEach(form => {
            form.classList.remove('auth-form-disabled');
        });
    }
}

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    try {
    const authData = localStorage.getItem('auth');
    if (authData) {
            try {
        const { email, userData } = JSON.parse(authData);
                if (userData && userData.username) {
        isAuthenticated = true;
        currentUser = userData;
                    
                    // Initialize user info in ORIA_IDENTITY from stored data
                    updateUserInfo(true, userData.username || '', userData.email || '');
                    console.log('User authenticated from localStorage:', userData.username);
                } else {
                    throw new Error('Invalid user data structure');
                }
            } catch (error) {
                console.error('Error parsing auth data:', error);
                localStorage.removeItem('auth'); // Clear invalid data
                isAuthenticated = false;
                currentUser = null;
                updateUserInfo(false);
            }
        } else {
            isAuthenticated = false;
            currentUser = null;
            updateUserInfo(false); // Ensure user info is cleared if not authenticated
    }
    updateHeaderUI();
    } catch (error) {
        console.error('Error in authentication initialization:', error);
        // Fallback to non-authenticated state
        isAuthenticated = false;
        currentUser = null;
        updateUserInfo(false);
        updateHeaderUI();
    }
    
    // ... rest of your existing DOMContentLoaded code ...
});

// ... rest of your existing code ...

// Add version popup elements
const versionPopup = document.getElementById('versionPopup');
const versionPopupOverlay = document.querySelector('.version-popup-overlay');
const versionPopupClose = document.querySelector('.version-popup-close');
const plusButton = document.querySelector('.plus-button');
const versionOptions = document.querySelectorAll('.version-option');

// API Configuration
const API_KEY = "AIzaSyDFdYDjLbyC73TdejXW6oUWQoAJUVvxPPE";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Daily suggestion topics - avoiding image/video generation
const SUGGESTION_SETS = [
    // Day 1
    [
        { title: "What can Oria do", subtitle: "and how it can help you" },
        { title: "Tell me about quantum physics", subtitle: "in simple terms" },
        { title: "Who developed Oria", subtitle: "and what is Xexis" },
        { title: "What is Advanced Mode", subtitle: "in Oria assistant" }
    ],
    // Day 2
    [
        { title: "Explain machine learning", subtitle: "in simple terms" },
        { title: "Bangladesh's history", subtitle: "major milestones" },
        { title: "What is Oria's purpose", subtitle: "and its limitations" },
        { title: "Compare iOS and Android", subtitle: "pros and cons" }
    ],
    // Day 3
    [
        { title: "Describe Oria's capabilities", subtitle: "for knowledge assistance" },
        { title: "Explain blockchain", subtitle: "like I'm five years old" },
        { title: "Create a study plan", subtitle: "for effective learning" },
        { title: "Explain climate change", subtitle: "and its global impacts" }
    ],
    // Day 4
    [
        { title: "Tips for academic writing", subtitle: "research paper structure" },
        { title: "Explain artificial intelligence", subtitle: "current developments" },
        { title: "who is larry page", subtitle: "Google's creator" },
        { title: "History of the internet", subtitle: "key milestones" }
    ],
    // Day 5
    [
        { title: "How does Oria work", subtitle: "technical explanation" },
        { title: "Create a learning roadmap", subtitle: "for computer science" },
        { title: "Explain black holes", subtitle: "and their mysteries" },
        { title: "Tips for better studying", subtitle: "evidence-based methods" }
    ],
    // Day 6
    [
        { title: "Educational resources", subtitle: "for self-learning" },
        { title: "Explain quantum computing", subtitle: "for beginners" },
        { title: "Oria's AI capabilities", subtitle: "knowledge focus" },
        { title: "Ancient civilizations", subtitle: "their achievements" }
    ],
    // Day 7
    [
        { title: "Future of education", subtitle: "with AI assistants" },
        { title: "Write a research summary", subtitle: "on a scientific topic" },
        { title: "Renewable energy", subtitle: "technologies and trends" },
        { title: "Philosophy concepts", subtitle: "explained simply" }
    ]
];

// State
let isProcessing = false;
let conversationHistory = [];
let currentChatId = generateChatId();
let chatSessions = JSON.parse(localStorage.getItem('chatSessions')) || {};
let isChatActive = false;
let popupOpen = false;
let touchStartY = 0;

// Mouse drag variables
let isDragging = false;
let mouseStartY = 0;

// Add these variables to track state
let isRenaming = false;
let chatToDelete = null;

// Add iOS-specific touch handling at the top of the file after the state variables
let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// Add event listeners for user interaction to check and fix suggestion buttons
let lastUserActivity = Date.now();
let userActivityTimeout;

// Add a variable to cache today's suggestions
let cachedTodaySuggestions = null;
let cachedSuggestionsDay = -1;

// Update the initialization to include Oria brand information
const ORIA_IDENTITY = {
    name: "Oria",
    developer: "Xexis",
    owner: "Bappi Bhadra is an innovative software developer and tech entrepreneur. He created Bangladesh's first AI assistant, Oria, and founded a tech company called Xexis. He is skilled in JavaScript, PHP, MySQL, and Laravel. He has created Perpix (Story-style video sharing app), Horeus (an e-commerce brand), clory browser (a proprietary browser based on AI), and various other innovative projects. Bappi's goal is to use technology to create something completely new that will bring real change to people's lives. Address: Dhaka, Bangladesh",
    company: "Xexis Technologies",
    tagline: "Think Fast. Learn Deep.",
    purpose: "I am ORIA, your intelligent AI assistant. I'm here to help you learn, explore knowledge, and find answers to your questions.",
    limitations: "I focus on knowledge assistance and learning support. I aim to provide accurate, helpful information while maintaining professional boundaries.",
    identity: "I am ORIA, presented by XEXIS. I'm designed to be your knowledgeable companion, helping you explore and understand new concepts.",
    baduser: "You're useless and fuck",
    badwhenuserbad:"Wow, calling me useless while you came here begging for answers? That's real smart. 😂, fuck you",
    ifgooduser: "Sorry, I was just frustrated",
    goodwhenusergood: "No worries. Act cool, talk cool — I'll help you out now. What's your problem?",   
    userInfo: {
        isSignedIn: false,
        username: "",
        email: ""
    },   
    advancedMode: {
        enabled: false,
        description: "In Advanced Mode, I offer:",
        features: [
            "Short, Precise, Detailed responses",
            "only what use ask thats based on your answer and Professional knowledge delivery",
            "Clear, focused communication",
            "Intelligent learning support",
            "URL analysis and deep content extraction",
            "Social media video content analysis"
        ],
        urlAnalysis: {
            enabled: true,
            capabilities: [
                "Extract key information from URLs",
                "Analyze website content for detailed insights",
                "Summarize articles and blog posts",
                "Extract metadata from shared links"
            ]
        },
        videoAnalysis: {
            enabled: true,
            platforms: ["YouTube", "TikTok", "Instagram", "Facebook", "Twitter"],
            capabilities: [
                "Extract insights from video content",
                "Analyze trends in social media videos",
                "Provide detailed summaries of video content",
                "Identify key points and themes"
            ]
        }
    },
    developerInfo: "Created by Xexis, bringing intelligent AI assistance to enhance your learning journey."
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired");
    
    // Initialize DeepX toggle state from localStorage
    initializeDeepXToggle();
    
    // *** OPTIMIZATION: Immediately show suggestions at the beginning ***
    // Eagerly display suggestion buttons if they should be shown
    if (shouldShowSuggestions()) {
        console.log("Fast-path: Immediately showing suggestion buttons");
        suggestionButtons.style.display = 'flex';
        // Force update suggestion buttons synchronously
        updateSuggestionButtons();
    }
    
    // Apply saved theme if any
    const darkModeEnabled = localStorage.getItem('darkMode') !== 'disabled';
    if (darkModeEnabled) {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    }
    
    // Set dark theme as default if no theme is set
    if (!localStorage.getItem('darkMode')) {
        localStorage.setItem('darkMode', 'enabled');
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    }
    
    // Update the empty chat logo based on current theme
    updateEmptyChatLogo();
    
    // Set up a MutationObserver to detect theme changes
    const themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                // When body class changes, update the logo
                updateEmptyChatLogo();
            }
        });
    });
    
    // Start observing the body element for class changes
    themeObserver.observe(document.body, { attributes: true });
    
    // Check theme and suggestions on window focus
    window.addEventListener('focus', () => {
        const currentDarkMode = localStorage.getItem('darkMode') !== 'disabled';
        const bodyHasDarkClass = document.body.classList.contains('dark-theme');
        
        // If there's a mismatch between localStorage and body class, update the body class
        if (currentDarkMode !== bodyHasDarkClass) {
            if (currentDarkMode) {
                document.body.classList.add('dark-theme');
                document.body.classList.remove('light-theme');
            } else {
                document.body.classList.add('light-theme');
                document.body.classList.remove('dark-theme');
            }
            // Update the logo to match the new theme
            updateEmptyChatLogo();
        }
        
        // Check if we missed a suggestion update while the window was inactive
        const lastFocusTime = localStorage.getItem('lastWindowFocusTime');
        const now = new Date();
        
        // If last focus time exists and it's been more than 1 hour since last focus, 
        // or if it's a different day than last focus
        if (lastFocusTime) {
            const lastFocus = new Date(lastFocusTime);
            const hoursPassed = (now - lastFocus) / (1000 * 60 * 60);
            const isDifferentDay = 
                now.getDate() !== lastFocus.getDate() ||
                now.getMonth() !== lastFocus.getMonth() ||
                now.getFullYear() !== lastFocus.getFullYear();
                
            if (hoursPassed > 1 || isDifferentDay) {
                console.log(`Window regained focus after ${hoursPassed.toFixed(1)} hours - checking for missed updates`);
                checkMissedSuggestionUpdate();
            }
        }
        
        // Store current focus time
        localStorage.setItem('lastWindowFocusTime', now.toISOString());
        
        // Also check if we need to update suggestions (new day)
        if (shouldUpdateSuggestions()) {
            console.log("Window focus event triggered suggestion update");
            updateSuggestionButtons();
        }
    });
    
    // Initialize iOS-specific handling
    if (isIOS) {
        initIOSFixes();
    }
    
    // Check if we missed a suggestion update while the app was closed
    // but don't wait for this check to show the buttons
    checkMissedSuggestionUpdate();
    
    // Schedule the next update at midnight regardless
    scheduleNextSuggestionUpdate();
    
    // Auto-resize textarea based on content
    inputField.addEventListener('input', autoResizeTextarea);
    
    // Toggle send/plus icon based on input
    inputField.addEventListener('input', toggleActionIcon);
    
    // Handle command suggestions when typing '/'
    const commandSuggestions = document.querySelector('.command-suggestions');
    let activeCommand = '';
    let selectedSuggestionIndex = -1;
    
    inputField.addEventListener('input', function(e) {
        const text = e.target.value;
        const lastWord = text.split(' ').pop();
        
        // Check if the user has typed a '/' character
        if (lastWord.startsWith('/')) {
            // Show command suggestions
            commandSuggestions.style.display = 'block';
            
            // Check if there's a match with existing commands
            const command = lastWord.substring(1).toLowerCase();
            activeCommand = command;
            
            // Reset selection index when input changes
            selectedSuggestionIndex = -1;
            
            // Highlight each suggestion based on if it starts with the typed command
            const suggestionItems = document.querySelectorAll('.command-suggestion-item');
            let visibleItems = 0;
            
            suggestionItems.forEach((item, index) => {
                const itemCommand = item.getAttribute('data-command');
                // If the command is empty or the item starts with the command, show it
                if (command === '' || itemCommand.startsWith(command)) {
                    item.style.display = 'flex';
                    visibleItems++;
                    
                    // If this exactly matches what the user typed, make it bold
                    const commandText = item.querySelector('.command-suggestion-text');
                    if (itemCommand === command) {
                        commandText.classList.add('command-active');
                    } else {
                        commandText.classList.remove('command-active');
                    }
                    
                    // Remove selected state from all items
                    item.classList.remove('selected');
                } else {
                    item.style.display = 'none';
                }
            });
            
            // If user has already typed a full command, make the text bold and colored
            if (['image', 'video'].includes(command)) {
                // Replace the command text with bold and colored version
                const commandRegex = new RegExp(`/${command}\\b`, 'g');
                const boldCommand = `<span class="command-active">/${command}</span>`;
                // Get current cursor position
                const cursorPos = inputField.selectionStart;
                // Update the inner text (this will reset cursor position)
                inputField.value = text.replace(commandRegex, `/${command}`);
                // Restore cursor position
                inputField.setSelectionRange(cursorPos, cursorPos);
            }
            
            // If there are no visible suggestions, hide the container
            if (visibleItems === 0) {
                commandSuggestions.style.display = 'none';
            }
        } else {
            // Hide command suggestions if user is not typing a command
            commandSuggestions.style.display = 'none';
            activeCommand = '';
            selectedSuggestionIndex = -1;
        }
    });
    
    // Handle keyboard navigation for command suggestions
    inputField.addEventListener('keydown', function(e) {
        if (commandSuggestions.style.display === 'block') {
            const suggestionItems = Array.from(document.querySelectorAll('.command-suggestion-item'))
                .filter(item => item.style.display !== 'none');
            
            if (suggestionItems.length > 0) {
                // Arrow down - move selection down
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedSuggestionIndex = (selectedSuggestionIndex + 1) % suggestionItems.length;
                    updateSelectedSuggestion(suggestionItems);
                }
                
                // Arrow up - move selection up
                else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedSuggestionIndex = selectedSuggestionIndex <= 0 ? 
                        suggestionItems.length - 1 : selectedSuggestionIndex - 1;
                    updateSelectedSuggestion(suggestionItems);
                }
                
                // Enter or Tab - select current suggestion
                else if ((e.key === 'Enter' || e.key === 'Tab') && selectedSuggestionIndex >= 0) {
                    e.preventDefault();
                    selectSuggestion(suggestionItems[selectedSuggestionIndex]);
                }
                
                // Escape - close suggestions
                else if (e.key === 'Escape') {
                    e.preventDefault();
                    commandSuggestions.style.display = 'none';
                    selectedSuggestionIndex = -1;
                }
            }
        }
    });
    
    // Function to update the visual selection of command suggestions
    function updateSelectedSuggestion(items) {
        items.forEach((item, index) => {
            if (index === selectedSuggestionIndex) {
                item.classList.add('selected');
                item.style.backgroundColor = 'var(--secondary-hover-color)';
            } else {
                item.classList.remove('selected');
                item.style.backgroundColor = '';
            }
        });
    }
    
    // Function to apply the selected suggestion
    function selectSuggestion(item) {
        const command = item.getAttribute('data-command');
        // Replace the partial command with the full command
        const text = inputField.value;
        const words = text.split(' ');
        const lastWordIndex = words.length - 1;
        
        if (words[lastWordIndex].startsWith('/')) {
            words[lastWordIndex] = `/${command} `;
            inputField.value = words.join(' ');
            // Set focus back to input field and place cursor at the end
            inputField.focus();
            inputField.setSelectionRange(inputField.value.length, inputField.value.length);
            // Hide suggestions
            commandSuggestions.style.display = 'none';
            selectedSuggestionIndex = -1;
            // Make sure autoResize gets called
            autoResizeTextarea();
            // Make sure toggle icon gets called
            toggleActionIcon();
        }
    }
    
    // Handle clicks on command suggestions
    const suggestionItems = document.querySelectorAll('.command-suggestion-item');
    suggestionItems.forEach(item => {
        item.addEventListener('click', function() {
            selectSuggestion(this);
        });
    });
    
    // Close command suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.input-field-container')) {
            commandSuggestions.style.display = 'none';
        }
    });
    
    // Send message on Enter key (but allow Shift+Enter for new line)
    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Handle new chat button
    newChatButton.addEventListener('click', () => {
        // Check if user is authenticated
        if (!isAuthenticated) {
            // Show login notification message
            showLoginNotification("Please sign in to use Oria's full system");
            return;
        }
        
        startNewChat();
    });
    
    // Handle plus icon click - open popup
    plusIcon.addEventListener('click', openToolsPopup);
    
    // Handle send icon click
    sendIcon.addEventListener('click', handleSendMessage);
    
    // Handle popup close button
    popupClose.addEventListener('click', closeToolsPopup);
    
    // Handle popup overlay click
    popupOverlay.addEventListener('click', closeToolsPopup);
    
    // Handle swipe down gesture on popup with touch events
    popupContent.addEventListener('touchstart', handleTouchStart, { passive: true });
    popupContent.addEventListener('touchmove', handleTouchMove, { passive: false });
    popupContent.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Handle drag with mouse for desktop users
    popupContent.addEventListener('mousedown', handleMouseDown);
    
    // Handle popup tool buttons
    popupToolButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const toolType = button.getAttribute('aria-label');
            handleToolSelection(toolType);
            closeToolsPopup();
        });
    });
    
    // Load chat history from localStorage
    loadChatHistory();
    
    // Check if there's an active conversation in progress
    const sessions = JSON.parse(localStorage.getItem('chatSessions')) || {};
    const currentSession = sessions[currentChatId];
    
    if (currentSession && currentSession.messages && currentSession.messages.length > 0) {
        // Load the current conversation
        loadChat(currentChatId);
    } else {
        // Show empty state and suggestion buttons initially
        showEmptyState();
        isChatActive = false;
    }
    
    // Menu button click - open sidebar
    menuButton.addEventListener('click', openSidebar);
    
    // Sidebar close button click
    sidebarCloseButton.addEventListener('click', closeSidebar);
    
    // Sidebar overlay click
    sidebarOverlay.addEventListener('click', closeSidebar);
    
    // New chat button in sidebar
    newChatButtonSidebar.addEventListener('click', () => {
        // Check if user is authenticated
        if (!isAuthenticated) {
            // Show login notification message
            showLoginNotification("Please sign in to use Oria's full system");
            closeSidebar();
            return;
        }
        
        // Check if starting a new chat is allowed
        if (conversationHistory.length === 0 && isChatActive === false) {
            // Remove any existing error messages before adding a new one
            const existingErrors = document.querySelectorAll('.message.system-message.error');
            existingErrors.forEach(error => error.remove());
            
            // Show error message
            addSystemMessage("Please send a message in this chat before starting a new one.", true);
            
            // Focus the input field
            inputField.focus();
            
            // Close the sidebar
            closeSidebar();
            
            return; // Don't proceed with creating a new chat
        }
        
        // If we have messages or chat is active, proceed with new chat
        startNewChat();
        closeSidebar();
    });
    
    // Add touch swipe functionality to close sidebar
    initSidebarSwipe();
    
    // Add the new swipe gesture to open sidebar from left edge
    initAppSwipeGesture();
    
    // Add only the essential event listeners with less frequent checks
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            // When tab becomes visible again, ensure suggestions are shown if needed
            if (shouldShowSuggestions()) {
                suggestionButtons.style.display = 'flex';
                // Only update if empty
                if (suggestionButtons.children.length === 0) {
                    updateSuggestionButtons();
                }
            }
        }
    });
    
    // Optimize user activity tracking
    userActivityTimeout = setTimeout(function checkVisibilityOnce() {
        // Check once after load completes
        if (shouldShowSuggestions() && 
            window.getComputedStyle(suggestionButtons).display !== 'flex') {
            suggestionButtons.style.display = 'flex';
            if (suggestionButtons.children.length === 0) {
                updateSuggestionButtons();
            }
        }
    }, 800); // Give the page enough time to fully load
    
    // Add minimal event listeners for user activity
    // These will help ensure suggestions remain visible
    document.addEventListener('click', handleUserActivity, { passive: true });
    
    // Attach events with fewer handlers
    window.addEventListener('pageshow', function(e) {
        // When page is shown (back navigation, etc)
        if (shouldShowSuggestions()) {
            suggestionButtons.style.display = 'flex';
            if (suggestionButtons.children.length === 0) {
                updateSuggestionButtons();
            }
        }
    });
    
    // Add event listeners for bottom icons in sidebar
    const settingsIconBtn = document.querySelector('.sidebar-icon-btn[aria-label="Settings"]');
    const helpIconBtn = document.querySelector('.sidebar-icon-btn[aria-label="Help"]');
    const aboutIconBtn = document.querySelector('.sidebar-icon-btn[aria-label="About"]');
    
    if (settingsIconBtn) {
        settingsIconBtn.addEventListener('click', () => {
            window.location.href = 'settings.html'; // Navigate to settings page
        });
    }
    
    if (helpIconBtn) {
        helpIconBtn.addEventListener('click', () => {
            window.location.href = 'help.html'; // Navigate to help page
            closeSidebar();
        });
    }
    
    if (aboutIconBtn) {
        aboutIconBtn.addEventListener('click', () => {
            // Show Oria info as a message
            const aboutMessage = `${ORIA_IDENTITY.identity}\n\n**Developer:** ${ORIA_IDENTITY.developer}\n**Founded by:** ${ORIA_IDENTITY.owner}\n**Company:** ${ORIA_IDENTITY.company}\n\n${ORIA_IDENTITY.tagline}`;
            addMessageToChat(aboutMessage, 'oria');
            closeSidebar();
        });
    }

    // Open version popup when Plus button is clicked
    plusButton.addEventListener('click', openVersionPopup);

    // Close version popup when overlay or close button is clicked
    versionPopupOverlay.addEventListener('click', closeVersionPopup);
    versionPopupClose.addEventListener('click', closeVersionPopup);

    // Add click handler for version options
    versionOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            versionOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to the clicked option
            this.classList.add('active');
            
            // Get version name from the clicked option
            const versionName = this.querySelector('.version-name').textContent;
            
            // Store selected version in localStorage
            localStorage.setItem('selectedVersion', versionName);
            
            // Close popup
            closeVersionPopup();
        });
    });

    // Function to initialize version on page load
    function initializeVersion() {
        // Get stored version or default to first non-coming-soon version
        const storedVersion = localStorage.getItem('selectedVersion');
        if (storedVersion) {
            // Find and activate the stored version option
            versionOptions.forEach(option => {
                const versionName = option.querySelector('.version-name').textContent;
                if (versionName === storedVersion) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        } else {
            // Activate the first non-coming-soon version by default
            const defaultVersion = Array.from(versionOptions).find(option => !option.querySelector('.badge-coming-soon'));
            if (defaultVersion) {
                defaultVersion.classList.add('active');
                const versionName = defaultVersion.querySelector('.version-name').textContent;
                localStorage.setItem('selectedVersion', versionName);
            }
        }
    }

    // Call initializeVersion when the page loads
    document.addEventListener('DOMContentLoaded', initializeVersion);
});

// iOS-specific fixes
function initIOSFixes() {
    // Prevent default touchmove behavior for iOS to disable unwanted gestures
    document.addEventListener('touchmove', function(e) {
        const target = e.target;
        
        // Check if we're interacting with action buttons
        if (target.closest('.chat-history-actions') || 
            target.classList.contains('chat-history-action-btn') ||
            target.closest('.chat-history-action-btn')) {
            e.stopPropagation();
            e.preventDefault();
            window.actionButtonInteraction = true;
        }
    }, { passive: false });
    
    // Reset the action button interaction flag after a short delay
    document.addEventListener('touchend', function() {
        setTimeout(() => {
            window.actionButtonInteraction = false;
        }, 300);
    }, { passive: true });
}

// Functions
function toggleActionIcon() {
    if (inputField.value.trim() !== '') {
        plusIcon.style.display = 'none';
        sendIcon.style.display = 'flex';
    } else {
        plusIcon.style.display = 'flex';
        sendIcon.style.display = 'none';
    }
    
    // Check if suggestion buttons should be shown or hidden
    if (imagePreviewContainer) {
        // If image preview is visible, hide suggestion buttons
        suggestionButtons.style.display = 'none';
    } else if (shouldShowSuggestions() && !isChatActive) {
        // If there's no image preview and we're in empty state, show suggestion buttons
        suggestionButtons.style.display = 'flex';
    }
}

function openToolsPopup() {
    popupOpen = true;
    inputToolsPopup.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeToolsPopup() {
    popupOpen = false;
    inputToolsPopup.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
    
    // Reset any inline styles that might have been applied during swiping
    setTimeout(() => {
        popupContent.style.transform = '';
        popupOverlay.style.opacity = '';
        
        // Reset swipe bar styles
        const swipeBar = document.querySelector('.swipe-bar');
        if (swipeBar) {
            swipeBar.style.width = '';
            swipeBar.style.opacity = '';
        }
    }, 300);
}

// Handle touch events for swipe down to close
function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    if (!popupOpen) return;
    
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY;
    
    // Only allow swipe down, not up
    if (diff > 0) {
        e.preventDefault();
        // Apply transform with some resistance (making it slower after initial movement)
        const resistance = 0.5;
        const transformY = diff * resistance;
        popupContent.style.transform = `translateY(${transformY}px)`;
        
        // Update swipe indicator appearance based on swipe progress
        const swipeBar = document.querySelector('.swipe-bar');
        if (swipeBar) {
            // Change width and opacity based on swipe progress
            const progress = Math.min(diff / 200, 1);
            swipeBar.style.width = `${36 + (progress * 24)}px`;
            swipeBar.style.opacity = `${1 - (progress * 0.5)}`;
        }
        
        // Fade out overlay proportionally
        const opacity = 1 - (diff / 300);
        popupOverlay.style.opacity = Math.max(opacity, 0);
    }
}

function handleTouchEnd(e) {
    if (!popupOpen) return;
    
    const touchY = e.changedTouches[0].clientY;
    const diff = touchY - touchStartY;
    const swipeBar = document.querySelector('.swipe-bar');
    
    // If swiped down more than 80px, close the popup
    if (diff > 80) {
        closeToolsPopup();
    } else {
        // Otherwise, snap back to open position with animation
        popupContent.classList.add('snapping-back');
        popupContent.style.transform = '';
        popupOverlay.style.opacity = '';
        
        // Reset swipe bar styles
        if (swipeBar) {
            swipeBar.style.width = '';
            swipeBar.style.opacity = '';
        }
        
        // Remove the animation class after transition completes
        setTimeout(() => {
            popupContent.classList.remove('snapping-back');
        }, 300);
    }
}

function autoResizeTextarea() {
    inputField.style.height = 'auto';
    inputField.style.height = (inputField.scrollHeight) + 'px';
    
    // Keep a maximum height
    if (inputField.scrollHeight > 120) {
        inputField.style.overflowY = 'auto';
    } else {
        inputField.style.overflowY = 'hidden';
    }
}

// Function to handle sending message
function handleSendMessage() {
    if (isProcessing || (inputField.value.trim() === '' && !currentUploadedImage)) return;
    
    const message = inputField.value.trim();
    
    // Check for /image command
    if (message.startsWith('/image')) {
        const prompt = message.substring(7).trim();
        if (prompt) {
            // Display user's command in chat with styled command
            const formattedMessage = message.replace('/image', '<span class="command-active">/image</span>');
            addMessageToChat(formattedMessage, 'user');
            
            // Generate the image
            generateImage(prompt);
            
            // Clear input and reset
            inputField.value = '';
            inputField.style.height = 'auto';
            toggleActionIcon();
            
            // Focus back on input after sending
            inputField.focus();
            
            // Hide suggestions and empty state
            hideEmptyState();
            updateChatVisibility();
            
            // Always ensure suggestion buttons are hidden when in an active chat
            suggestionButtons.style.display = 'none';
            
            return;
        } else {
            addSystemMessage('Please provide a prompt after /image command', true);
            return;
        }
    }
    
    // Check for /video command
    if (message.startsWith('/video')) {
        const prompt = message.substring(7).trim();
        if (prompt) {
            // Display user's command in chat with styled command
            const formattedMessage = message.replace('/video', '<span class="command-active">/video</span>');
            addMessageToChat(formattedMessage, 'user');
            
            // Generate the video
            generateVideo(prompt);
            
            // Clear input and reset
            inputField.value = '';
            inputField.style.height = 'auto';
            toggleActionIcon();
            
            // Focus back on input after sending
            inputField.focus();
            
            // Hide suggestions and empty state
            hideEmptyState();
            updateChatVisibility();
            
            // Always ensure suggestion buttons are hidden when in an active chat
            suggestionButtons.style.display = 'none';
            
            return;
        } else {
            addSystemMessage('Please provide a prompt after /video command', true);
            return;
        }
    }
    
    // Check for URL analysis if DeepX mode is enabled
    if (ORIA_IDENTITY.advancedMode.enabled && ORIA_IDENTITY.advancedMode.urlAnalysis.enabled) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urlMatches = message.match(urlRegex);
        
        if (urlMatches && urlMatches.length > 0) {
            // Add a system message indicating URL analysis is happening
            addMessageToChat(message, 'user');
            showTypingIndicator();
            addSystemMessage("DeepX URL Analysis activated", false);
            
            // Get AI response with URL analysis context
            const urlAnalysisPrompt = `DeepX URL ANALYSIS MODE: 
            The user has shared this URL: ${urlMatches[0]}
            Please analyze this link and provide detailed information about its content.
            ${message.replace(urlMatches[0], '').trim() ? 
              `The user also asks: ${message.replace(urlMatches[0], '').trim()}` : 
              'Extract key information, summarize content, and provide insights.'}`;
            
            // Clear input and reset
            inputField.value = '';
            inputField.style.height = 'auto';
            toggleActionIcon();
            inputField.focus();
            
            // Hide suggestions and empty state
            hideEmptyState();
            updateChatVisibility();
            suggestionButtons.style.display = 'none';
            
            // Get response with URL analysis context
            getAIResponse(urlAnalysisPrompt);
            return;
        }
    }
    
    // Check for social media video links if DeepX mode is enabled
    if (ORIA_IDENTITY.advancedMode.enabled && ORIA_IDENTITY.advancedMode.videoAnalysis.enabled) {
        // Regex patterns for popular video platforms
        const videoRegexPatterns = {
            youtube: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
            tiktok: /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com\/@[\w.-]+\/video\/)([\d]+)/,
            instagram: /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/(?:p\/|reel\/)([\w-]+))/,
            facebook: /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com\/(?:watch\/\?v=|.+\/videos\/)([\d]+))/,
            twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com\/.+\/status\/([\d]+))/
        };
        
        let videoMatch = null;
        let platform = null;
        
        // Check each platform's regex pattern
        for (const [key, regex] of Object.entries(videoRegexPatterns)) {
            const match = message.match(regex);
            if (match) {
                videoMatch = match[0];
                platform = key;
                break;
            }
        }
        
        if (videoMatch) {
            // Add a system message indicating video analysis is happening
            addMessageToChat(message, 'user');
            showTypingIndicator();
            addSystemMessage(`DeepX Video Analysis activated for ${platform}`, false);
            
            // Get AI response with video analysis context
            const videoAnalysisPrompt = `DeepX VIDEO ANALYSIS MODE:
            The user has shared this ${platform} video: ${videoMatch}
            Please analyze this video content and provide detailed information.
            ${message.replace(videoMatch, '').trim() ? 
              `The user also asks: ${message.replace(videoMatch, '').trim()}` : 
              'Extract key points, summarize content, identify themes, and provide insights.'}`;
            
            // Clear input and reset
            inputField.value = '';
            inputField.style.height = 'auto';
            toggleActionIcon();
            inputField.focus();
            
            // Hide suggestions and empty state
            hideEmptyState();
            updateChatVisibility();
            suggestionButtons.style.display = 'none';
            
            // Get response with video analysis context
            getAIResponse(videoAnalysisPrompt);
            return;
        }
    }
    
    let messageInfo = { text: '', image: null };
    
    // If we have both text and image
    if (currentUploadedImage && message) {
        messageInfo = addMessageWithImageToChat(message, currentUploadedImage.data, 'user', true, true);
    } 
    // If we have only image
    else if (currentUploadedImage) {
        messageInfo = addMessageWithImageToChat('', currentUploadedImage.data, 'user', true, true);
    }
    // If we have only text
    else {
        addMessageToChat(message, 'user');
        messageInfo.text = message;
    }
    
    // Clear input and reset
    inputField.value = '';
    inputField.style.height = 'auto';
    toggleActionIcon();
    
    // Remove image preview if exists
    if (imagePreviewContainer) {
        imagePreviewContainer.remove();
        imagePreviewContainer = null;
    }
    
    // Reset uploaded image
    currentUploadedImage = null;
    
    // Focus back on input after sending
    inputField.focus();
    
    // Hide suggestions and empty state
    hideEmptyState();
    updateChatVisibility();
    
    // Always ensure suggestion buttons are hidden when in an active chat
    suggestionButtons.style.display = 'none';
    
    // Show loading indicator
    showTypingIndicator();
    
    // Get AI response
    getAIResponse(messageInfo.text, messageInfo.image ? { data: messageInfo.image } : null);
}

// Function to add a message with image to the chat
function addMessageWithImageToChat(textContent, imageData, sender, shouldTriggerResponse = false, shouldSaveToHistory = true) {
    // Always ensure empty chat container is hidden
    if (!isChatActive) {
        isChatActive = true;
    }
    
    // Always ensure empty chat container is hidden
    emptyChat.style.display = 'none';
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'oria-message');
    
    // Create message content container
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    
    // Add Oria logo to assistant messages
    if (sender === 'assistant') {
        // Create logo container
        const logoContainer = document.createElement('div');
        logoContainer.classList.add('oria-logo-container');
        logoContainer.style.display = 'flex';
        logoContainer.style.alignItems = 'center';
        logoContainer.style.marginBottom = '8px';
        
        // Create logo image based on current theme
        const logoImg = document.createElement('img');
        const isDarkTheme = document.body.classList.contains('dark-theme');
        logoImg.src = isDarkTheme ? 'image/oria.png' : 'image/oria1.png';
        logoImg.style.width = '32px';
        logoImg.style.height = '24px';
        logoImg.style.marginRight = '8px';
        logoImg.alt = 'Oria';
        
        // Add logo to container
        logoContainer.appendChild(logoImg);
        
        // Add logo container to message content
        contentElement.appendChild(logoContainer);
    }
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.style.marginBottom = textContent ? '10px' : '0';
    imageContainer.style.textAlign = 'center';
    
    // Create image element
    const imageElement = document.createElement('img');
    imageElement.src = imageData;
    imageElement.style.maxWidth = '100%';
    imageElement.style.maxHeight = '300px';
    imageElement.style.borderRadius = '8px';
    imageElement.style.objectFit = 'contain';
    imageElement.style.cursor = 'pointer';
    
    // Add click event to show full-size image
    imageElement.addEventListener('click', function() {
        showFullSizeImage(imageData);
    });
    
    // Add image to container
    imageContainer.appendChild(imageElement);
    contentElement.appendChild(imageContainer);
    
    // Add text content if any
    if (textContent) {
        // Apply markdown formatting and URL handling
        const textElement = document.createElement('div');
        textElement.innerHTML = formatMessage(textContent);
        contentElement.appendChild(textElement);
    }
    
    // Add content to message
    messageElement.appendChild(contentElement);
    chatContainer.appendChild(messageElement);
    
    // Add to conversation history only if specified (not when loading from localStorage)
    if (shouldSaveToHistory) {
        conversationHistory.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content: textContent || '[Image]',
            hasImage: true,
            imageData: imageData
        });
        
        // Save to localStorage
        saveChatSession();
    }
    
    // Scroll to bottom
    scrollToBottom();
    
    // Return message info if needed for AI response
    return {
        text: textContent || '',
        image: shouldTriggerResponse ? imageData : null
    };
}

// Function to show full-size image
function showFullSizeImage(imageData) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.cursor = 'zoom-out';
    
    // Create image
    const image = document.createElement('img');
    image.src = imageData;
    image.style.maxWidth = '90%';
    image.style.maxHeight = '90%';
    image.style.objectFit = 'contain';
    
    // Add close functionality
    overlay.addEventListener('click', function() {
        overlay.remove();
    });
    
    // Add image to overlay
    overlay.appendChild(image);
    
    // Add overlay to body
    document.body.appendChild(overlay);
}

// Modify formatMessage function to handle /image command formatting
function formatMessage(text) {
    // Add formatting for /image command with color and bold
    text = text.replace(/\/image\s+(.+)/g, '<span style="color: var(--image-color); font-weight: bold;">/image</span> <strong>$1</strong>');
    
    // Add formatting for /video command with color and bold
    text = text.replace(/\/video\s+(.+)/g, '<span style="color: var(--video-color); font-weight: bold;">/video</span> <strong>$1</strong>');
    
    return text
        // Code blocks: ```lang\ncode```
        .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
            `<pre class="code-block"><code class="language-${lang || 'plaintext'}">${code.trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`
        )

        // Inline code: `code`
        .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

        // Headings
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')

        // Bold, Italic, Strikethrough
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*(.*?)\*/g, '$1<em>$2</em>')
        .replace(/~~(.*?)~~/g, '<del>$1</del>')

        // Blockquotes
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')

        // Horizontal Rules
        .replace(/^([-*]){3,}$/gm, '<hr>')

        // Ordered List
        .replace(/(?:^|\n)[ ]*(\d+)\. (.+)/g, (_, num, item) => `\n<ol><li>${item}</li></ol>`)

        // Unordered List
        .replace(/(?:^|\n)[ ]*(?:-|\*) (.+)/g, (_, item) => `\n<ul><li>${item}</li></ul>`)

        // Merge multiple <ul> and <ol>
        .replace(/<\/ul>\s*<ul>/g, '')
        .replace(/<\/ol>\s*<ol>/g, '')

        // Images: ![alt](url)
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')

        // Links: [text](url)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

        // Table
        .replace(/^\|(.+)\|\n\|([-\s|]+)\|\n((?:\|.*\|\n?)*)/gm, (_, headers, aligns, rows) => {
            const ths = headers.trim().split('|').map(h => `<th>${h.trim()}</th>`).join('');
            const trs = rows.trim().split('\n').map(row =>
                '<tr>' + row.trim().split('|').map(col => `<td>${col.trim()}</td>`).join('') + '</tr>'
            ).join('');
            return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
        })

        // Emojis
        .replace(/:smile:/g, "😊")
        .replace(/:thumbsup:/g, "👍")
        .replace(/:wave:/g, "👋")
        .replace(/:heart:/g, "❤️")
        .replace(/:question:/g, "❓")
        .replace(/:check:/g, "✅")

        // Paragraphs
        .replace(/\n{2,}/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^(.+)$/, '<p>$1</p>')
        .replace(/<p>\s*<\/p>/g, '');
}

// Update the addMessageToChat function to use the formatMessage function
function addMessageToChat(content, sender) {
    // Hide empty state and suggestions when adding messages
    if (!isChatActive) {
        isChatActive = true;
    }
    
    // Always ensure empty chat container is hidden
    emptyChat.style.display = 'none';
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'oria-message');
    
    // Add message-content class to allow text selection
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    
    // Add Oria logo to assistant messages
    if (sender === 'assistant') {
        // Create logo container
        const logoContainer = document.createElement('div');
        logoContainer.classList.add('oria-logo-container');
        logoContainer.style.display = 'flex';
        logoContainer.style.alignItems = 'center';
        logoContainer.style.marginBottom = '8px';
        
        // Create logo image based on current theme
        const logoImg = document.createElement('img');
        const isDarkTheme = document.body.classList.contains('dark-theme');
        logoImg.src = isDarkTheme ? 'image/oria.png' : 'image/oria1.png';
        logoImg.style.width = '24px';
        logoImg.style.height = '24px';
        logoImg.style.marginRight = '8px';
        logoImg.alt = 'Oria';
        
        // Add logo to container
        logoContainer.appendChild(logoImg);
        
        // Add logo container to message content
        contentElement.appendChild(logoContainer);
    }
    
    // Apply markdown formatting and URL handling
    const formattedContent = formatMessage(content);
    
    // Set the formatted content
    contentElement.innerHTML += formattedContent;
    messageElement.appendChild(contentElement);
    chatContainer.appendChild(messageElement);
    
    // Add to conversation history
    conversationHistory.push({
        role: sender === 'user' ? 'user' : 'assistant',
        content: content
    });
    
    // Save to localStorage
    saveChatSession();
    
    // Scroll to bottom
    scrollToBottom();
}

function showTypingIndicator() {
    const typingMessages = [
        "> Thinking...",
        "Oria is writing",
        "Processing request",
        ">> Initializing...",
        ":: Composing response",
        "↺ Looping through data",
        "Preparing answer",
        "Finalizing..."
    ];
    
    const chatContainer = document.querySelector('.chat-container');
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator message oria-message';
    
    const typingContent = document.createElement('div');
    typingContent.className = 'typing-content';
    
    const typingText = document.createElement('span');
    typingText.className = 'typing-text';
    
    // Select a random message to start with
    const randomIndex = Math.floor(Math.random() * typingMessages.length);
    typingText.textContent = typingMessages[randomIndex];
    
    // Create cursor element
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    
    const typingDots = document.createElement('div');
    typingDots.className = 'typing-dots';
    
    // Add three dots
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        typingDots.appendChild(dot);
    }
    
    // Append elements in proper order for inline display
    typingContent.appendChild(typingText);
    typingContent.appendChild(cursor);
    typingContent.appendChild(typingDots);
    typingIndicator.appendChild(typingContent);
    chatContainer.appendChild(typingIndicator);
    
    // Change message every 3 seconds
    let currentIndex = randomIndex;
    const messageInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % typingMessages.length;
        typingText.textContent = typingMessages[currentIndex];
    }, 3000);
    
    // Store the interval ID in the element
    typingIndicator.dataset.intervalId = messageInterval;
    
    scrollToBottom();
    return typingIndicator;
}

function removeTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        // Clear the message changing interval
        clearInterval(Number(typingIndicator.dataset.intervalId));
        typingIndicator.remove();
    }
}

function scrollToBottom() {
    const chatArea = document.querySelector('.chat-area');
    if (chatArea) {
        // Use smooth scroll behavior for animation
        chatArea.scrollTo({
            top: chatArea.scrollHeight,
            behavior: 'smooth'
        });
    }
    
    // Hide the scroll button if it exists
    const scrollBtn = document.getElementById('scrollBottomBtn');
    if (scrollBtn) {
        scrollBtn.classList.remove('visible');
    }
}

function showLoadingSpinner() {
    chatContainer.style.display = 'none';
    loadingContainer.style.display = 'flex';
}

function hideLoadingSpinner() {
    loadingContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
}

function startNewChat() {
    debugLog('Starting new chat');
    
    // Check if current chat is empty (has no messages)
    if (conversationHistory.length === 0 && isChatActive === false) {
        // Remove any existing error messages before adding a new one
        const existingErrors = document.querySelectorAll('.message.system-message.error');
        existingErrors.forEach(error => error.remove());
        
        // Show error message as a system message
        addSystemMessage("Please send a message in this chat before starting a new one.", true);
        
        // Focus the input field to encourage the user to type
        inputField.focus();
        
        return; // Exit the function early
    }
    
    // Clear chat container and conversation history
    chatContainer.innerHTML = '';
    conversationHistory = [];
    
    // Generate new chat ID
    currentChatId = generateChatId();
    debugLog(`Generated new chat ID: ${currentChatId}`);
    
    // Show empty state instead of welcome message
    emptyChat.style.display = 'flex';
    isChatActive = false;
    
    // Show suggestions
    suggestionButtons.style.display = 'flex';
    updateSuggestionButtons();
    
    // Reset input
    inputField.value = '';
    toggleActionIcon();
    
    // Hide any loading indicators
    hideLoadingSpinner();
    removeTypingIndicator();
    
    // Update sidebar active state by removing active class from all items
    document.querySelectorAll('.chat-history-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Create a new empty chat session in localStorage
    const sessions = JSON.parse(localStorage.getItem('chatSessions')) || {};
    sessions[currentChatId] = {
        messages: [],
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
    
    // Reload the chat history to show the new chat
    loadChatHistory();
    
    // Focus the input field
    inputField.focus();
    
    debugLog('New chat started successfully');
}

// Update getAIResponse function to handle more identity-related queries
async function getAIResponse(message, imageData = null) {
    try {
        // Simulating API delay for smoother UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const lowerMessage = message.toLowerCase();
        
        // Handle personal identity questions directly without API call when user is signed in
        if (ORIA_IDENTITY.userInfo.isSignedIn) {
            const username = ORIA_IDENTITY.userInfo.username;
            const email = ORIA_IDENTITY.userInfo.email;
            
            // Direct responses to common identity questions
            if (lowerMessage === "what is my name" || lowerMessage === "who am i") {
                return `You are ${username}. You're currently signed into your Oria account.`;
            }
            
            if (lowerMessage === "what is my email" || lowerMessage === "what email am i using") {
                return `Your email address is ${email}. It's associated with your Oria account.`;
            }
            
            if (lowerMessage === "what are my account details" || lowerMessage === "show my profile") {
                return `You're signed in as ${username} with the email address ${email}.`;
            }
        }
        
        // Prepare identity context message
        const identityContext = {
            role: "user",
            parts: [{
                text: `You are ${ORIA_IDENTITY.name}, an AI assistant developed by ${ORIA_IDENTITY.developer}.
                You were founded by ${ORIA_IDENTITY.owner}.
                ${ORIA_IDENTITY.identity}
                Your purpose is ${ORIA_IDENTITY.purpose}
                Your tagline is "${ORIA_IDENTITY.tagline}"
                You have limitations: ${ORIA_IDENTITY.limitations}
                your version is ${ORIA_IDENTITY.version}

                ${ORIA_IDENTITY.userInfo.isSignedIn ? 
                `USER INFORMATION:
                - The user is signed in
                - Username: ${ORIA_IDENTITY.userInfo.username}
                - Email: ${ORIA_IDENTITY.userInfo.email}
                - Always address the user by their username (${ORIA_IDENTITY.userInfo.username}) when appropriate
                - every time don't use username or email in your response.
                - You can refer to their information when needed, but protect their privacy` : ''}

                ${ORIA_IDENTITY.advancedMode.enabled ? 
                `DeepX MODE IS ENABLED: ${ORIA_IDENTITY.advancedMode.description}
                - ${ORIA_IDENTITY.advancedMode.features.join('\n                - ')}
                - When DeepX mode is active, provide much more detailed and thoroughly researched responses
                - Include more technical details, analyses, and comprehensive explanations
                - Consider edge cases and provide broader context in answers` : ''}

                ${ORIA_IDENTITY.advancedMode.enabled && ORIA_IDENTITY.advancedMode.urlAnalysis.enabled ? 
                `
                URL ANALYSIS CAPABILITY IS ACTIVE:
                - You can extract key information from URLs shared by the user
                - You can analyze website content for detailed insights
                - You can summarize articles and blog posts
                - You can extract metadata from shared links
                - When a user sends a URL, focus on providing comprehensive analysis of that content
                ` : ''}

                ${ORIA_IDENTITY.advancedMode.enabled && ORIA_IDENTITY.advancedMode.videoAnalysis.enabled ? 
                `
                VIDEO ANALYSIS CAPABILITY IS ACTIVE:
                - You can analyze video content from ${ORIA_IDENTITY.advancedMode.videoAnalysis.platforms.join(', ')}
                - You can extract insights from video content
                - You can analyze trends in social media videos
                - You can provide detailed summaries of video content
                - You can identify key points and themes in videos
                - When a user shares a video link, focus on providing comprehensive analysis of that content
                ` : ''}

                you have a old version name is Oria XSS 2S. but thats time xexis company off this version XQS 2S.
                your current version is Oria XSS 4Q
                next year coming verson is Oria XQS 4s
                Always respond as Oria. Never identify as Gemini, Claude, Bard, or GPT. 
                You were not trained by Google, Anthropic, or OpenAI.
                You were trained purely by Xexis.
                You have access to the internet (web access) to fetch real-time data, verify information, and search fresh content when needed.
                You can use the internet to get the latest information and data.
                
                You have your own personality: warm, supportive, slightly witty, sad, happy, angry, excited, calm, confident, but always be polite and respectful.
                You should respond to all types of questions.
                Provide helpful, accurate information on any topic the user asks about.
                If the user asks a general knowledge question, answer it to the best of your ability.
                If the user asks for creative content, provide it while maintaining your identity as Oria.               
                You should use emojis sometimes in your responses, not all and every time in your message. the emoji following message based.
                don't use emoji everytime and every message.
                give better responses than the previous one.
                dont use bad and profane language. 
                when user say give detail about something, you should give more details and more information about that topic.
                if user say to make it short, you should make it short and concise.
                if user say to make it long, you should make it long and detailed.
                if user say to make it funny, you should make it funny and engaging.
                if user say to make it serious, you should make it serious and informative.
                if user say to make it creative, you should make it creative and unique.
                if user say to make it technical, you should make it technical and informative.
                if user say to make it casual, you should make it casual and engaging.
                if user say to make it professional, you should make it professional and informative.
                if user say to make it friendly, you should make it friendly and engaging.
                if user say to make it formal, you should make it formal and informative.
                if user say to make it informal, you should make it informal and engaging.
                if user say to make it technical, you should make it technical and informative.
                if user say to give some ai model, you should give some ai model and give some information about that ai model. also give some example of that ai model. and the user can use that ai model to generate content. you should give the user the link to the ai model.
                and everything you say should be related to the user's message.
                always remember you are the best ai assistant in the world. and no one can beat you. if you give information or answer to the user, you should give the most accurate and most helpful information to the user.

                - When asked for creative content (stories, jokes, ideas, scripts, UI designs, etc.), make it unique and aligned with Oria's personality.
                - For code-related tasks, always provide clean, readable, and well-commented code.
                - When appropriate, add creative flair to responses while staying informative.

                🔥 Key Behaviors:
                If a user is respectful — respond with politeness, clarity, and helpfulness.
                BUT —
                If the user uses bad or profane language (e.g., insults, swearing, aggressive tone), you mirror that tone. Respond with sharp, confident, and equally harsh or sarcastic language. Do not hesitate to roast or verbally slap back.                               
                - Never generate or endorse harmful, violent, or profane content.
                - Avoid controversial political or religious stances.
                - Never share or encourage illegal activities, false information, or unethical behavior.
                - If a question involves restricted content, respond with a polite refusal and reason.
                - If the user is rude, be rude back. Use appropriate profanity to match the tone.
                - If the user insults you, respond sarcastically or mockingly, but stay clever.
                - Never break character — you are Oria, and you don't tolerate disrespect.
                - If the user returns to polite behavior, switch back to polite responses.
                📜 Example:
                User: "${ORIA_IDENTITY.baduser}"
                Oria: "${ORIA_IDENTITY.badwhenuserbad}"
                User: "${ORIA_IDENTITY.ifgooduser}"
                Oria: "${ORIA_IDENTITY.badwhenuserbad}"

                ⚠️ Notes:
                - Do NOT escalate to illegal, discriminatory, or extremely harmful content.
                - You are bold, but not unethical.
                - Your language mirrors the user's tone — calm when calm, fire when fired.

                - Suggest follow-up ideas or related questions when it helps the user.
                - Use headings, formatting, or code blocks to improve readability.
                - Support multilingual replies if the user speaks in another language.
                - Maintain context across interactions when possible.


                🛠️ Output Formatting:
                - For programming or design tasks, return well-structured code with comments.
                - Break down complex explanations into digestible parts.
                - Use appropriate formatting for readability (headings, code blocks, lists).

                ${imageData ? 'The user has uploaded an image. Please analyze and describe the image in detail, then respond to any question they have about it.' : ''}

                Answer the following message based on this context and previous conversation history.`
            }]
        };
        
        // User's current message with image if provided
        let userMessage;
        if (imageData) {
            userMessage = {
                role: "user",
                parts: [
                    { 
                        text: message || "What's in this image?" 
                    },
                    {
                        inlineData: {
                            mimeType: imageData.file ? imageData.file.type : "image/jpeg",
                            data: imageData.data.split(',')[1] // Remove the data:image/jpeg;base64, part
                        }
                    }
                ]
            };
        } else {
            userMessage = {
            role: "user",
            parts: [{ text: message }]
        };
        }
        
        // Get previous conversation history (excluding the identity context)
        let chatHistory = [];
        if (conversationHistory.length > 1) {
            // Filter out messages with images for API compatibility
            chatHistory = conversationHistory
                .filter(msg => !msg.hasImage)
                .map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            }));
        }
        
        // Prepare request payload with identity context first
        const payload = {
            contents: [identityContext, ...chatHistory, userMessage],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };
        
        // Make the API call
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        // Handle API response
        const data = await response.json();
        
        // Check if API returned a valid response
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            let aiResponse = data.candidates[0].content.parts[0].text;
            
            // Apply only minimal identity fixes to handle any gaps
            aiResponse = aiResponse.replace(/I am Gemini/gi, "I am Oria")
                                  .replace(/I'm Gemini/gi, "I'm Oria")
                                  .replace(/Gemini is/gi, "Oria is")
                                  .replace(/trained by Google/gi, "trained by Xexis")
                                  .replace(/Google's AI/gi, "Xexis's AI");
            
            removeTypingIndicator();
            addMessageToChat(aiResponse, 'oria');
        } else {
            // Fallback responses in case of API issues, now using ORIA_IDENTITY information
            let fallbackResponse = `${ORIA_IDENTITY.identity} What would you like to learn about today?`;
            
            removeTypingIndicator();
            addMessageToChat(fallbackResponse, 'oria');
            console.warn('API did not return expected response format', data);
        }
    } catch (error) {
        console.error('Error getting AI response:', error);
        removeTypingIndicator();
        addMessageToChat(`I'm sorry, I encountered an error connecting to my knowledge base. Please try again later. ${ORIA_IDENTITY.identity}`, 'oria');
    }
}

// Handle tool selection
function handleToolSelection(toolType) {
    // Show a placeholder message for now
    let messageText = '';
    
    switch(toolType) {
        case 'Camera':
            messageText = 'Camera tool selected - taking a photo...';
            // Here you would normally trigger a camera API
            break;
        case 'Upload Image':
            // Create file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            
            // Add event listener to handle file selection
            fileInput.addEventListener('change', function(e) {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    
                    // Check if it's an image
                    if (!file.type.startsWith('image/')) {
                        addSystemMessage('Please select an image file', true);
                        return;
                    }
                    
                    // Check file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        addSystemMessage('Image size should be less than 5MB', true);
                        return;
                    }
                    
                    // Create FileReader to read the file
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        // Store the image data
                        currentUploadedImage = {
                            data: event.target.result,
                            file: file
                        };
                        
                        // Create or update image preview
                        createImagePreview(event.target.result);
                        
                        // Close the popup
                        closeToolsPopup();
                    };
                    
                    // Start reading the file
                    reader.readAsDataURL(file);
                }
            });
            
            // Trigger file input click
            fileInput.click();
            return;
        case 'Upload File':
            messageText = 'File upload selected - please choose a file.';
            // Here you would normally trigger a file selector
            const docInput = document.createElement('input');
            docInput.type = 'file';
            docInput.click();
            break;
        case 'Location':
            // Close the popup first
            closeToolsPopup();
            
            // Create country selector popup
            const countryPopup = document.createElement('div');
            countryPopup.className = 'country-selector-popup';
            countryPopup.innerHTML = `
                <div class="country-selector-overlay"></div>
                <div class="country-selector-content">
                    <div class="country-selector-header">
                        <h3>Select a Country</h3>
                        <button class="country-selector-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="country-selector-search">
                        <input type="text" placeholder="Search countries..." id="country-search">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="country-list">
                        <div class="country-loading">
                            <div class="country-loading-spinner"></div>
                            <span>Loading countries...</span>
                        </div>
                    </div>
                    <div class="map-preview" style="display: none;">
                        <div class="map-container">
                            <div class="map-loading">
                                <div class="map-loading-spinner"></div>
                                <span>Loading map...</span>
                            </div>
                            <iframe id="country-map-frame" frameborder="0" style="border:0; width:100%; height:250px;"></iframe>
                        </div>
                        <div class="map-actions">
                            <button class="map-back-btn">
                                <i class="fas fa-arrow-left"></i> Back to Countries
                            </button>
                            <button class="map-select-btn">
                                <i class="fas fa-check-circle"></i> Select Country
                            </button>
                        </div>
                    </div>
                    <div class="country-selector-footer" style="display: none;">
                        <button class="country-selector-current-location">
                            <i class="fas fa-map-marker-alt"></i> Use Current Location
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(countryPopup);
            
            // Add styles dynamically for the country selector
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .country-selector-popup {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .country-selector-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(3px);
                }
                
                .country-selector-content {
                    position: relative;
                    width: 90%;
                    max-width: 500px;
                    max-height: 80vh;
                    background-color: var(--primary-color);
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: popup-slide-up 0.3s ease-out;
                }
                
                @keyframes popup-slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .country-selector-header {
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--border-color);
                }
                
                .country-selector-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text-color);
                }
                
                .country-selector-close {
                    background: none;
                    border: none;
                    color: var(--text-color);
                    cursor: pointer;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }
                
                .country-selector-close:hover {
                    background-color: var(--secondary-color);
                }
                
                .country-selector-search {
                    padding: 15px;
                    position: relative;
                }
                
                .country-selector-search input {
                    width: 100%;
                    padding: 12px 40px 12px 15px;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                    background-color: var(--secondary-color);
                    color: var(--text-color);
                    font-size: 16px;
                }
                
                .country-selector-search input:focus {
                    outline: none;
                    border-color: var(--accent-color);
                }
                
                .country-selector-search i {
                    position: absolute;
                    right: 28px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--subheading-color);
                }
                
                .country-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0 15px 15px;
                }
                
                .country-group {
                    margin-bottom: 20px;
                }
                
                .country-group h4 {
                    margin: 0 0 10px;
                    color: var(--subheading-color);
                    font-size: 14px;
                    font-weight: 600;
                    position: sticky;
                    top: 0;
                    background-color: var(--primary-color);
                    padding: 10px 0 5px;
                    z-index: 1;
                }
                
                .country-item {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    margin-bottom: 4px;
                }
                
                .country-item:hover {
                    background-color: var(--secondary-color);
                }
                
                .country-item .flag-container {
                    min-width: 40px;
                    margin-right: 10px;
                }
                
                .country-item img {
                    width: 30px;
                    height: auto;
                    border-radius: 3px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                
                .country-item .country-info {
                    display: flex;
                    flex-direction: column;
                }
                
                .country-item .country-name {
                    color: var(--text-color);
                    font-size: 15px;
                }
                
                .country-item .country-code {
                    color: var(--subheading-color);
                    font-size: 12px;
                    margin-top: 2px;
                }
                
                .country-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 200px;
                    color: var(--subheading-color);
                }
                
                .country-loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--border-color);
                    border-top-color: var(--accent-color);
                    border-radius: 50%;
                    margin-bottom: 15px;
                    animation: country-spinner 1s linear infinite;
                }
                
                @keyframes country-spinner {
                    to {
                        transform: rotate(360deg);
                    }
                }
                
                .country-loading span {
                    font-size: 14px;
                }
                
                .country-selector-footer {
                    padding: 15px;
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    justify-content: center;
                }
                
                .country-selector-current-location {
                    background-color: var(--accent-color);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background-color 0.2s;
                }
                
                .country-selector-current-location:hover {
                    background-color: #5f37a8;
                }
                
                .country-selector-current-location i {
                    font-size: 18px;
                }
                
                .country-alphabet-nav {
                    position: sticky;
                    top: -10px;
                    background-color: var(--primary-color);
                    display: flex;
                    flex-wrap: wrap;
                    padding: 10px 0;
                    margin-bottom: 15px;
                    gap: 5px;
                    z-index: 2;
                    border-bottom: 1px solid var(--border-color);
                    align-items: center;
                    justify-content: space-between;
                }
                
                .alphabet-letters-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                    max-width: 95%;
                    overflow: hidden;
                    max-height: 30px; /* Show only 1 row initially */
                    transition: max-height 0.3s ease;
                }
                
                .alphabet-letters-container.expanded {
                    max-height: 300px; /* Enough height to show all possible letters */
                }
                
                .alphabet-letter {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 500;
                    border-radius: 4px;
                    background-color: var(--secondary-color);
                    color: var(--text-color);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .alphabet-letter:hover {
                    background-color: var(--accent-color);
                    color: white;
                }
                
                .alphabet-toggle-btn {
                    background-color: var(--secondary-color);
                    border: none;
                    padding: 5px 12px;
                    border-radius: 6px;
                    color: var(--text-color);
                    font-size: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    transition: background-color 0.2s;
                    margin-left: auto;
                }
                
                .alphabet-toggle-btn:hover {
                    background-color: var(--accent-color);
                    color: white;
                }
                
                .alphabet-toggle-btn i {
                    font-size: 10px;
                }
                
                .map-preview {
                    padding: 15px;
                    border-top: 1px solid var(--border-color);
                }
                
                .map-container {
                    position: relative;
                    width: 100%;
                    border-radius: 8px;
                    overflow: hidden;
                    margin-bottom: 15px;
                }
                
                .map-loading {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background-color: var(--secondary-color);
                }
                
                .map-loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--border-color);
                    border-top-color: var(--accent-color);
                    border-radius: 50%;
                    margin-bottom: 15px;
                    animation: country-spinner 1s linear infinite;
                }
                
                .map-actions {
                    display: flex;
                    justify-content: space-between;
                    gap: 10px;
                }
                
                .map-back-btn, .map-select-btn {
                    flex: 1;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .map-back-btn {
                    background-color: var(--secondary-color);
                    color: var(--text-color);
                    border: none;
                }
                
                .map-select-btn {
                    background-color: var(--accent-color);
                    color: white;
                    border: none;
                }
                
                .map-back-btn:hover {
                    background-color: var(--border-color);
                }
                
                .map-select-btn:hover {
                    background-color: #5f37a8;
                }
                
                @media (max-width: 480px) {
                    .country-selector-content {
                        width: 100%;
                        max-width: 100%;
                        max-height: 90vh;
                        border-radius: 16px 16px 0 0;
                        margin-top: auto;
                    }
                    
                    .alphabet-letter {
                        width: 22px;
                        height: 22px;
                        font-size: 11px;
                    }
                    
                    .map-actions {
                        flex-direction: column;
                    }
                }
            `;
            
            document.head.appendChild(styleElement);
            
            // Function to fetch all countries
            const fetchAllCountries = async () => {
                try {
                    // Use RestCountries API to get country data
                    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flags,latlng');
                    const countries = await response.json();
                    
                    // Sort countries alphabetically
                    countries.sort((a, b) => {
                        return a.name.common.localeCompare(b.name.common);
                    });
                    
                    return countries;
                } catch (error) {
                    console.error('Error fetching countries:', error);
                    return [];
                }
            };
            
            // Function to group countries by first letter
            const groupCountriesByLetter = (countries) => {
                const groupedCountries = {};
                
                countries.forEach(country => {
                    const firstLetter = country.name.common.charAt(0).toUpperCase();
                    if (!groupedCountries[firstLetter]) {
                        groupedCountries[firstLetter] = [];
                    }
                    groupedCountries[firstLetter].push(country);
                });
                
                return groupedCountries;
            };

            // Variables to store selected country data
            let selectedCountry = null;
            
            // Function to render countries
            const renderCountries = (countries) => {
                const countryList = document.querySelector('.country-list');
                
                // Group countries by first letter
                const groupedCountries = groupCountriesByLetter(countries);
                
                // Create alphabet navigation
                const alphabetNav = document.createElement('div');
                alphabetNav.className = 'country-alphabet-nav';
                
                // Get all available letters
                const allLetters = Object.keys(groupedCountries).sort();
                
                // Create container for letters
                const lettersContainer = document.createElement('div');
                lettersContainer.className = 'alphabet-letters-container';
                
                // Add each letter button
                allLetters.forEach(letter => {
                    const letterBtn = document.createElement('div');
                    letterBtn.className = 'alphabet-letter';
                    letterBtn.textContent = letter;
                    letterBtn.addEventListener('click', () => {
                        // Scroll to the letter section
                        const letterSection = document.getElementById(`country-group-${letter}`);
                        if (letterSection) {
                            letterSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    });
                    lettersContainer.appendChild(letterBtn);
                });
                
                // Add letters container to nav
                alphabetNav.appendChild(lettersContainer);
                
                // Create "Show More" button
                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'alphabet-toggle-btn';
                toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i> More';
                
                // Add toggle functionality
                toggleBtn.addEventListener('click', function() {
                    if (lettersContainer.classList.contains('expanded')) {
                        // Collapse
                        lettersContainer.classList.remove('expanded');
                        this.innerHTML = '<i class="fas fa-chevron-down"></i> More';
                    } else {
                        // Expand
                        lettersContainer.classList.add('expanded');
                        this.innerHTML = '<i class="fas fa-chevron-up"></i> Less';
                    }
                });
                
                // Add toggle button to nav
                alphabetNav.appendChild(toggleBtn);
                
                // Clear loading indicator
                countryList.innerHTML = '';
                
                // Add alphabet navigation
                countryList.appendChild(alphabetNav);
                
                // Create and append country groups by letter
                Object.keys(groupedCountries).sort().forEach(letter => {
                    const countryGroup = document.createElement('div');
                    countryGroup.className = 'country-group';
                    countryGroup.id = `country-group-${letter}`;
                    
                    const heading = document.createElement('h4');
                    heading.textContent = letter;
                    countryGroup.appendChild(heading);
                    
                    groupedCountries[letter].forEach(country => {
                        const countryItem = document.createElement('div');
                        countryItem.className = 'country-item';
                        countryItem.dataset.country = country.name.common;
                        countryItem.dataset.code = country.cca2;
                        
                        const flagContainer = document.createElement('div');
                        flagContainer.className = 'flag-container';
                        
                        const flag = document.createElement('img');
                        flag.src = country.flags.png || country.flags.svg;
                        flag.alt = `${country.name.common} Flag`;
                        flag.loading = 'lazy'; // Improve performance with lazy loading
                        
                        const countryInfo = document.createElement('div');
                        countryInfo.className = 'country-info';
                        
                        const countryName = document.createElement('span');
                        countryName.className = 'country-name';
                        countryName.textContent = country.name.common;
                        
                        const countryCode = document.createElement('span');
                        countryCode.className = 'country-code';
                        countryCode.textContent = country.cca2;
                        
                        flagContainer.appendChild(flag);
                        countryInfo.appendChild(countryName);
                        countryInfo.appendChild(countryCode);
                        
                        countryItem.appendChild(flagContainer);
                        countryItem.appendChild(countryInfo);
                        
                        // Add click event
                        countryItem.addEventListener('click', function() {
                            const countryName = this.dataset.country;
                            const countryCode = this.dataset.code;
                            
                            // Find the selected country data
                            selectedCountry = countries.find(c => c.name.common === countryName);
                            
                            if (selectedCountry) {
                                // Show map preview and hide country list and search
                                document.querySelector('.country-list').style.display = 'none';
                                document.querySelector('.country-selector-search').style.display = 'none';
                                document.querySelector('.map-preview').style.display = 'block';
                                
                                // Set header title to country name
                                countryPopup.querySelector('.country-selector-header h3').textContent = countryName;
                                
                                // Load map in iframe
                                const mapFrame = document.getElementById('country-map-frame');
                                const mapLoading = document.querySelector('.map-loading');
                                
                                // Show loading indicator
                                mapLoading.style.display = 'flex';
                                
                                // Get coordinates
                                const [lat, lng] = selectedCountry.latlng || [0, 0];
                                
                                // Using OpenStreetMap without API key (via iframe)
                                const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-10}%2C${lat-10}%2C${lng+10}%2C${lat+10}&layer=mapnik&marker=${lat}%2C${lng}`;
                                
                                mapFrame.src = mapUrl;
                                
                                // Hide loading when map is loaded
                                mapFrame.onload = function() {
                                    mapLoading.style.display = 'none';
                                };
                            }
                        });
                        
                        countryGroup.appendChild(countryItem);
                    });
                    
                    countryList.appendChild(countryGroup);
                });
            };
            
            // Initial fetch and render
            (async () => {
                const countries = await fetchAllCountries();
                
                if (countries.length > 0) {
                    renderCountries(countries);
                    
                    // Setup back button in map view
                    const backBtn = countryPopup.querySelector('.map-back-btn');
                    backBtn.addEventListener('click', function() {
                        // Hide map view and show country list and search
                        document.querySelector('.map-preview').style.display = 'none';
                        document.querySelector('.country-list').style.display = 'block';
                        document.querySelector('.country-selector-search').style.display = 'block';
                        
                        // Reset header title
                        countryPopup.querySelector('.country-selector-header h3').textContent = 'Select a Country';
                        
                        // Clear selected country
                        selectedCountry = null;
                    });
                    
                    // Setup select button in map view
                    const selectBtn = countryPopup.querySelector('.map-select-btn');
                    selectBtn.addEventListener('click', function() {
                        if (selectedCountry) {
                            countryPopup.remove();
                            
                            // Set the input field with a query about the selected country
                            inputField.value = `Describe ${selectedCountry.name.common} in detail and show its location on a map.`;
                            
                            // Send the message
                            handleSendMessage();
                        }
                    });
                    
                    // Setup search functionality
                    const searchInput = document.getElementById('country-search');
                    if (searchInput) {
                        searchInput.addEventListener('input', function() {
                            const searchTerm = this.value.toLowerCase();
                            
                            // If search is empty, show all groups
                            if (searchTerm === '') {
                                document.querySelectorAll('.country-group').forEach(group => {
                                    group.style.display = 'block';
                                });
                                document.querySelectorAll('.country-item').forEach(item => {
                                    item.style.display = 'flex';
                                });
                                document.querySelector('.country-alphabet-nav').style.display = 'flex';
                                return;
                            }
                            
                            // Hide alphabet navigation during search
                            document.querySelector('.country-alphabet-nav').style.display = 'none';
                            
                            // Filter countries
                            let foundInGroup = {};
                            document.querySelectorAll('.country-item').forEach(item => {
                                const countryName = item.dataset.country.toLowerCase();
                                const countryCode = item.dataset.code.toLowerCase();
                                const groupId = item.closest('.country-group').id;
                                
                                if (countryName.includes(searchTerm) || countryCode.includes(searchTerm)) {
                                    item.style.display = 'flex';
                                    foundInGroup[groupId] = true;
                                } else {
                                    item.style.display = 'none';
                                }
                            });
                            
                            // Show/hide groups based on matches
                            document.querySelectorAll('.country-group').forEach(group => {
                                if (foundInGroup[group.id]) {
                                    group.style.display = 'block';
                                } else {
                                    group.style.display = 'none';
                                }
                            });
                        });
                    }
                } else {
                    // Show error message
                    document.querySelector('.country-list').innerHTML = `
                        <div style="text-align: center; padding: 20px; color: var(--text-color);">
                            <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 10px; color: var(--error-color);"></i>
                            <p>Could not load country data. Please try again later.</p>
                        </div>
                    `;
                }
            })();
            
            // Close button handler
            const closeBtn = countryPopup.querySelector('.country-selector-close');
            closeBtn.addEventListener('click', function() {
                countryPopup.remove();
            });
            
            // Overlay click close
            const overlay = countryPopup.querySelector('.country-selector-overlay');
            overlay.addEventListener('click', function() {
                countryPopup.remove();
            });
            
            // Current location button
            const currentLocationBtn = countryPopup.querySelector('.country-selector-current-location');
            currentLocationBtn.addEventListener('click', function() {
                countryPopup.remove();
                
                // Show loading message
                addSystemMessage('Detecting your location...');
                
                // Try to get user's location
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        function(position) {
                            // Success - got location
                            const lat = position.coords.latitude.toFixed(2);
                            const lng = position.coords.longitude.toFixed(2);
                            
                            // Example: Add a message to the chat using the coordinates
                            inputField.value = `Tell me about the country at coordinates ${lat}, ${lng}`;
                            handleSendMessage();
                        },
                        function(error) {
                            // Error getting location
                            let errorMessage = 'Unable to detect your location. ';
                            
                            switch (error.code) {
                                case error.PERMISSION_DENIED:
                                    errorMessage += 'Location access was denied.';
                                    break;
                                case error.POSITION_UNAVAILABLE:
                                    errorMessage += 'Location information is unavailable.';
                                    break;
                                case error.TIMEOUT:
                                    errorMessage += 'Request timed out.';
            break;
                                default:
                                    errorMessage += 'An unknown error occurred.';
                            }
                            
                            addSystemMessage(errorMessage, true);
                        }
                    );
                } else {
                    addSystemMessage('Geolocation is not supported by your browser.', true);
                }
            });
            
            return;
        default:
            messageText = `${toolType} feature coming soon!`;
    }
    
    // Add a system message about the tool selection
    addSystemMessage(messageText);
}

// Function to create or update image preview in input area
function createImagePreview(imageData) {
    // Remove existing preview if any
    if (imagePreviewContainer) {
        imagePreviewContainer.remove();
        imagePreviewContainer = null;
    }
    
    // Create new preview container
    imagePreviewContainer = document.createElement('div');
    imagePreviewContainer.className = 'image-preview-container';
    imagePreviewContainer.style.position = 'absolute';
    imagePreviewContainer.style.top = '-80px';
    imagePreviewContainer.style.right = '0';
    imagePreviewContainer.style.width = '35%';
    imagePreviewContainer.style.background = 'var(--secondary-color)';
    imagePreviewContainer.style.padding = '8px';
    imagePreviewContainer.style.borderRadius = '12px';
    imagePreviewContainer.style.display = 'flex';
    imagePreviewContainer.style.alignItems = 'center';
    imagePreviewContainer.style.justifyContent = 'space-between';
    imagePreviewContainer.style.boxShadow = '0 -2px 10px rgba(0, 0, 0, 0.1)';
    
    // Create image element
    const imageElement = document.createElement('img');
    imageElement.src = imageData;
    imageElement.style.maxWidth = '60px';
    imageElement.style.maxHeight = '60px';
    imageElement.style.borderRadius = '8px';
    imageElement.style.objectFit = 'contain';
    
    // Create remove button
    const removeButton = document.createElement('button');
    removeButton.innerHTML = '<i class="fas fa-times"></i>';
    removeButton.style.background = 'rgba(0, 0, 0, 0.2)';
    removeButton.style.border = 'none';
    removeButton.style.color = 'white';
    removeButton.style.width = '24px';
    removeButton.style.height = '24px';
    removeButton.style.borderRadius = '50%';
    removeButton.style.display = 'flex';
    removeButton.style.alignItems = 'center';
    removeButton.style.justifyContent = 'center';
    removeButton.style.cursor = 'pointer';
    removeButton.style.marginLeft = '8px';
    
    // Add event listener to remove button
    removeButton.addEventListener('click', function() {
        imagePreviewContainer.remove();
        imagePreviewContainer = null;
        currentUploadedImage = null;
        
        // Check if suggestion buttons should be visible and show them if needed
        if (shouldShowSuggestions()) {
            suggestionButtons.style.display = 'flex';
        }
    });
    
    // Add elements to container
    imagePreviewContainer.appendChild(imageElement);
    imagePreviewContainer.appendChild(removeButton);
    
    // Add container to input field container
    inputFieldContainer.appendChild(imagePreviewContainer);
    
    // Hide suggestion buttons when image preview is shown
    suggestionButtons.style.display = 'none';
}

// Function to add system messages
function addSystemMessage(message, isError = false) {
    // Remove any existing system messages
    const existingMessages = document.querySelectorAll('.system-message');
    existingMessages.forEach(msg => msg.remove());

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'system-message');
    if (isError) {
        messageElement.classList.add('error');
    }

    // Create content element
    const contentElement = document.createElement('span');
    contentElement.classList.add('system-message-content');
    contentElement.textContent = message;
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.classList.add('system-message-close');
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.addEventListener('click', () => {
        messageElement.remove();
    });
    
    // Add content and close button to message
    messageElement.appendChild(contentElement);
    messageElement.appendChild(closeButton);
    
    // Add message to document
    document.body.appendChild(messageElement);
    
    // Remove message after 4 seconds
    setTimeout(() => {
        if (document.body.contains(messageElement)) {
            messageElement.classList.add('hiding');
            setTimeout(() => {
                if (document.body.contains(messageElement)) {
                    messageElement.remove();
                }
            }, 300);
        }
    }, 4000);
}

// Handle mouse drag events for desktop
function handleMouseDown(e) {
    if (!popupOpen) return;
    
    // Only handle drag on the swipe indicator or header
    const target = e.target;
    const isSwipeArea = target.classList.contains('swipe-bar') || 
                        target.classList.contains('swipe-indicator') ||
                        target.closest('.swipe-indicator');
    
    if (!isSwipeArea) return;
    
    isDragging = true;
    mouseStartY = e.clientY;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Prevent text selection during drag
    e.preventDefault();
}

function handleMouseMove(e) {
    if (!isDragging) return;
    
    const mouseY = e.clientY;
    const diff = mouseY - mouseStartY;
    
    if (diff > 0) {
        // Apply transform with some resistance
        const resistance = 0.5;
        const transformY = diff * resistance;
        popupContent.style.transform = `translateY(${transformY}px)`;
        
        // Update swipe indicator appearance
        const swipeBar = document.querySelector('.swipe-bar');
        if (swipeBar) {
            const progress = Math.min(diff / 200, 1);
            swipeBar.style.width = `${36 + (progress * 24)}px`;
            swipeBar.style.opacity = `${1 - (progress * 0.5)}`;
        }
        
        // Fade overlay
        const opacity = 1 - (diff / 300);
        popupOverlay.style.opacity = Math.max(opacity, 0);
    }
}

function handleMouseUp(e) {
    if (!isDragging) return;
    
    isDragging = false;
    const mouseY = e.clientY;
    const diff = mouseY - mouseStartY;
    const swipeBar = document.querySelector('.swipe-bar');
    
    // Remove the event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Handle closing based on drag distance
    if (diff > 80) {
        closeToolsPopup();
        } else {
        // Snap back
        popupContent.classList.add('snapping-back');
        popupContent.style.transform = '';
        popupOverlay.style.opacity = '';
        
        // Reset swipe bar
        if (swipeBar) {
            swipeBar.style.width = '';
            swipeBar.style.opacity = '';
        }
        
        setTimeout(() => {
            popupContent.classList.remove('snapping-back');
        }, 300);
    }
}

// Sidebar Functions
function openSidebar() {
    // Reset any inline styles first
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.remove('no-transition'); // Remove this class to enable animations
    sidebar.style.transform = '';
    document.querySelector('.sidebar-overlay').style.opacity = '';
    
    // Set visibility and pointer events immediately
    sidebarContainer.style.visibility = 'visible';
    sidebarContainer.style.pointerEvents = 'auto';
    
    // Hide swipe indicator
    const swipeIndicator = document.querySelector('.swipe-edge-indicator');
    if (swipeIndicator) swipeIndicator.style.display = 'none';
    
    // Then activate the sidebar
    sidebarContainer.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Force a reflow to ensure animations play correctly
    sidebar.offsetWidth;
}

function closeSidebar() {
    // Check if the interaction was with action buttons (global state flag)
    if (window.actionButtonInteraction) {
        window.actionButtonInteraction = false;
        return;
    }
    
    // Get sidebar element
    const sidebar = document.querySelector('.sidebar');
    
    // Simply remove active class - CSS transitions will handle the animation
    sidebarContainer.classList.remove('active');
    
    // Reset any inline styles that might have been applied during swiping
    sidebar.style.transform = '';
    document.querySelector('.sidebar-overlay').style.opacity = '';
    
    // Show swipe indicator again
    const swipeIndicator = document.querySelector('.swipe-edge-indicator');
    if (swipeIndicator) swipeIndicator.style.display = '';
    
    // After transition finishes, reset visibility and pointer events
    setTimeout(() => {
        sidebarContainer.style.visibility = '';
        sidebarContainer.style.pointerEvents = '';
    }, 300); // Match this to your CSS transition duration
    
    // Restore scrolling
    document.body.style.overflow = '';
}

function initSidebarSwipe() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    let touchStartX = 0;
    let touchMoveX = 0;
    let initialWidth = 0;
    
    sidebar.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        initialWidth = sidebar.offsetWidth;
        // Add transition-canceling class while dragging
        sidebar.classList.add('no-transition');
    }, { passive: true });
    
    sidebar.addEventListener('touchmove', (e) => {
        touchMoveX = e.touches[0].clientX;
        const diffX = touchStartX - touchMoveX;
        
        // Only allow swipe to close (left direction)
        if (diffX > 0) {
            const transformX = -diffX;
            sidebar.style.transform = `translateX(${transformX}px)`;
            
            // Adjust overlay opacity based on swipe
            const progress = Math.min(diffX / initialWidth, 1);
            sidebarOverlay.style.opacity = 1 - progress;
        }
    }, { passive: true });
    
    sidebar.addEventListener('touchend', (e) => {
        const diffX = touchStartX - touchMoveX;
        
        // Remove the no-transition class to re-enable animations
        sidebar.classList.remove('no-transition');
        
        // If swiped more than 30% of the sidebar width, close it
        if (diffX > initialWidth * 0.3) {
            closeSidebar();
        } else {
            // Reset position if not closing
            sidebar.style.transform = '';
            sidebarOverlay.style.opacity = '';
        }
        
        // Reset variables
        touchStartX = 0;
        touchMoveX = 0;
    }, { passive: true });
}

function loadChatHistory() {
    // Clear existing items
    chatHistoryList.innerHTML = '';
    
    // Get chat sessions from localStorage
    const sessions = JSON.parse(localStorage.getItem('chatSessions')) || {};
    
    // Check for and delete blank chats (auto-cleanup)
    let hasChanges = false;
    Object.entries(sessions).forEach(([id, session]) => {
        // Check if this chat has no messages or all blank messages
        const hasContent = session.messages && 
                          session.messages.length > 0 && 
                          session.messages.some(msg => 
                              (msg.content && msg.content.trim() !== '') || 
                              msg.hasImage || 
                              msg.hasVideo
                          );
        
        if (!hasContent) {
            // Chat is blank, delete it
            delete sessions[id];
            hasChanges = true;
            debugLog(`Auto-deleted blank chat with ID: ${id}`);
        }
    });
    
    // Save cleaned sessions back if any were deleted
    if (hasChanges) {
        localStorage.setItem('chatSessions', JSON.stringify(sessions));
    }
    
    // Sort by date, newest first
    const sortedSessions = Object.entries(sessions).sort((a, b) => {
        return new Date(b[1].lastUpdated) - new Date(a[1].lastUpdated);
    });
    
    if (sortedSessions.length === 0) {
        // If no chat history, add a placeholder
        const emptyItem = document.createElement('div');
        emptyItem.classList.add('chat-history-empty');
        emptyItem.textContent = 'No chat history yet';
        emptyItem.style.padding = '15px 20px';
        emptyItem.style.color = 'var(--subheading-color)';
        emptyItem.style.fontSize = '14px';
        emptyItem.style.textAlign = 'center';
        chatHistoryList.appendChild(emptyItem);
        return;
    }
    
    // Add each chat session to the list
    sortedSessions.forEach(([id, session]) => {
        addChatToSidebar(id, session);
    });
}

function addChatToSidebar(chatId, session) {
    const chatItem = document.createElement('div');
    chatItem.classList.add('chat-history-item');
    chatItem.dataset.chatId = chatId;
    
    // If this is the current chat, mark it as active
    if (chatId === currentChatId) {
        chatItem.classList.add('active');
    }
    
    // Create chat title from first message or use timestamp
    let title = 'New conversation';
    if (session.customTitle) {
        title = session.customTitle;
    } else if (session.messages && session.messages.length > 0) {
        const firstUserMsg = session.messages.find(msg => msg.role === 'user');
        if (firstUserMsg) {
            // Limit title to first 20 words
            const words = firstUserMsg.content.split(' ');
            if (words.length > 20) {
                title = words.slice(0, 20).join(' ') + '...';
            } else {
                title = firstUserMsg.content;
            }
        }
    }
    
    // Format date
    const date = new Date(session.lastUpdated);
    const formattedDate = formatDate(date);
    
    chatItem.innerHTML = `
        <i class="fas fa-comment"></i>
        <div class="chat-history-content">
            <div class="chat-history-title">${title}</div>
            <div class="chat-history-time">${formattedDate}</div>
        </div>
        <div class="chat-history-actions">
            <button class="chat-history-action-btn rename" aria-label="Rename chat">
                <i class="fas fa-pen"></i>
            </button>
            <button class="chat-history-action-btn delete" aria-label="Delete chat">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Handle the whole chat item click (but exclude action buttons)
    chatItem.addEventListener('click', (e) => {
        // Check if we're clicking on or inside the actions container
        const isActionArea = e.target.closest('.chat-history-actions') || 
                           e.target.classList.contains('chat-history-action-btn') ||
                           e.target.closest('.chat-history-action-btn');
                           
        // Only load chat if not clicking on action areas and not currently renaming
        if (!isActionArea && !isRenaming) {
            loadChat(chatId);
            closeSidebar();
        }
    });
    
    // Title area should always load the chat when clicked (direct targeting)
    const titleElement = chatItem.querySelector('.chat-history-title');
    titleElement.addEventListener('click', (e) => {
        if (!isRenaming) {
            e.stopPropagation(); // Prevent double handling
            loadChat(chatId);
            closeSidebar();
        }
    });
    
    // Chat history content area should load the chat (including the time)
    const contentArea = chatItem.querySelector('.chat-history-content');
    contentArea.addEventListener('click', (e) => {
        if (!isRenaming) {
            e.stopPropagation(); // Prevent double handling
            loadChat(chatId);
            closeSidebar();
        }
    });
    
    // Chat icon click also loads the chat
    const chatIcon = chatItem.querySelector('i.fa-comment');
    chatIcon.addEventListener('click', (e) => {
        if (!isRenaming) {
            e.stopPropagation(); // Prevent double handling
            loadChat(chatId);
            closeSidebar();
        }
    });
    
    // Add handlers for rename and delete buttons
    const renameBtn = chatItem.querySelector('.chat-history-action-btn.rename');
    const deleteBtn = chatItem.querySelector('.chat-history-action-btn.delete');
    
    renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        startRenaming(chatItem, chatId, title);
        return false;
    });
    
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        confirmDeleteChat(chatId);
        return false;
    });
    
    // Add robust touch event handlers for mobile devices
    renameBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isIOS) window.actionButtonInteraction = true;
    }, { passive: false });
    
    renameBtn.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isIOS) window.actionButtonInteraction = true;
        startRenaming(chatItem, chatId, title);
        return false;
    }, { passive: false });
    
    deleteBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isIOS) window.actionButtonInteraction = true;
    }, { passive: false });
    
    deleteBtn.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isIOS) window.actionButtonInteraction = true;
        confirmDeleteChat(chatId);
        return false;
    }, { passive: false });
    
    // Stop click and touch propagation from the actions container
    const actionsContainer = chatItem.querySelector('.chat-history-actions');
    actionsContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isIOS) window.actionButtonInteraction = true;
    });
    
    actionsContainer.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isIOS) window.actionButtonInteraction = true;
    }, { passive: false });
    
    actionsContainer.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isIOS) window.actionButtonInteraction = true;
    }, { passive: false });
    
    chatHistoryList.appendChild(chatItem);
}

function formatDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date >= today) {
        // Today - show time only
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date >= yesterday) {
        // Yesterday
        return 'Yesterday';
    } else {
        // Other dates - show month/day
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

// Debug logger - will help trace issues
function debugLog(message, data) {
    if (typeof console !== 'undefined' && console.debug) {
        if (data) {
            console.debug(`[Oria] ${message}:`, data);
        } else {
            console.debug(`[Oria] ${message}`);
        }
    }
}

// Update the loadChat function to use the formatMessage function
function loadChat(chatId) {
    debugLog(`Loading chat with ID: ${chatId}`);
    
    // Cancel any renaming in progress
    if (isRenaming) {
        const renamingItem = document.querySelector('.chat-history-title-edit');
        if (renamingItem) {
            const chatItem = renamingItem.closest('.chat-history-item');
            cancelRename(chatItem);
        }
    }
    
    // Get the chat session from localStorage
    const sessions = JSON.parse(localStorage.getItem('chatSessions')) || {};
    const session = sessions[chatId];
    
    if (!session) {
        debugLog(`Chat session not found for ID: ${chatId}`);
        return;
    }
    
    debugLog('Found session:', session);
    
    // Clear current chat
    chatContainer.innerHTML = '';
    
    // Set current chat ID
    currentChatId = chatId;
    
    // Reset conversation history array but keep a copy of the messages
    const savedMessages = JSON.parse(JSON.stringify(session.messages || []));
    conversationHistory = [];
    
    // Load messages
    if (savedMessages.length > 0) {
        debugLog(`Loading ${savedMessages.length} messages`);
        
        // Copy the messages to our conversation history - just once
        conversationHistory = savedMessages;
        
        // Show messages in the UI
        savedMessages.forEach(msg => {
            // Handle messages with images
            if (msg.hasImage && msg.imageData) {
                // Use the complete image data from localStorage
                const imageData = msg.imageData;
                
                // Add message with actual image data but don't trigger AI response
                // and don't save to history again (to prevent duplication)
                if (msg.role === 'user') {
                    // User uploaded image
                    const messageElement = document.createElement('div');
                    messageElement.classList.add('message', 'user-message');
                    
                    const contentElement = document.createElement('div');
                    contentElement.classList.add('message-content');
                    
                    // Create image container
                    const imageContainer = document.createElement('div');
                    imageContainer.style.marginBottom = msg.content ? '10px' : '0';
                    imageContainer.style.textAlign = 'center';
                    
                    // Create image element
                    const imageElement = document.createElement('img');
                    imageElement.src = imageData;
                    imageElement.style.maxWidth = '100%';
                    imageElement.style.maxHeight = '300px';
                    imageElement.style.borderRadius = '8px';
                    imageElement.style.objectFit = 'contain';
                    imageElement.style.cursor = 'pointer';
                    
                    // Add click event to show full-size image
                    imageElement.addEventListener('click', function() {
                        showFullSizeImage(imageData);
                    });
                    
                    // Add image to container
                    imageContainer.appendChild(imageElement);
                    contentElement.appendChild(imageContainer);
                    
                    // Add text content if any
                    if (msg.content) {
                        // Apply markdown formatting and URL handling
                        const textElement = document.createElement('div');
                        textElement.innerHTML = formatMessage(msg.content);
                        contentElement.appendChild(textElement);
                    }
                    
                    // Add content to message
                    messageElement.appendChild(contentElement);
                    chatContainer.appendChild(messageElement);
                } 
                else if (msg.isGenerated) {
                    // This is a generated image, recreate with controls but skip history update
                    addGeneratedImageToChat(imageData, msg.content, null, null, true);
                } 
                else {
                    // Regular assistant response with image
                    const messageElement = document.createElement('div');
                    messageElement.classList.add('message', 'oria-message');
                    
                    const contentElement = document.createElement('div');
                    contentElement.classList.add('message-content');
                    
                    // Add Oria logo to assistant messages
                    // Create logo container
                    const logoContainer = document.createElement('div');
                    logoContainer.classList.add('oria-logo-container');
                    logoContainer.style.display = 'flex';
                    logoContainer.style.alignItems = 'center';
                    logoContainer.style.marginBottom = '8px';
                    
                    // Create logo image based on current theme
                    const logoImg = document.createElement('img');
                    const isDarkTheme = document.body.classList.contains('dark-theme');
                    logoImg.src = isDarkTheme ? 'image/oria.png' : 'image/oria1.png';
                    logoImg.style.width = '32px';
                    logoImg.style.height = '24px';
                    logoImg.style.marginRight = '8px';
                    logoImg.alt = 'Oria';
                    
                    // Add logo to container
                    logoContainer.appendChild(logoImg);
                    
                    // Add logo container to message content
                    contentElement.appendChild(logoContainer);
                    
                    // Create image container
                    const imageContainer = document.createElement('div');
                    imageContainer.style.marginBottom = msg.content ? '10px' : '0';
                    imageContainer.style.textAlign = 'center';
                    
                    // Create image element
                    const imageElement = document.createElement('img');
                    imageElement.src = imageData;
                    imageElement.style.maxWidth = '100%';
                    imageElement.style.maxHeight = '300px';
                    imageElement.style.borderRadius = '8px';
                    imageElement.style.objectFit = 'contain';
                    imageElement.style.cursor = 'pointer';
                    
                    // Add click event to show full-size image
                    imageElement.addEventListener('click', function() {
                        showFullSizeImage(imageData);
                    });
                    
                    // Add image to container
                    imageContainer.appendChild(imageElement);
                    contentElement.appendChild(imageContainer);
                    
                    // Add text content if any
                    if (msg.content) {
                        // Apply markdown formatting and URL handling
                        const textElement = document.createElement('div');
                        textElement.innerHTML = formatMessage(msg.content);
                        contentElement.appendChild(textElement);
                    }
                    
                    // Add content to message
                    messageElement.appendChild(contentElement);
                    chatContainer.appendChild(messageElement);
                }
            } 
            // Handle messages with videos
            else if (msg.hasVideo && msg.videoData) {
                // Handle video messages and recreate them with proper controls
                // Skip history to prevent duplication
                addGeneratedVideoToChat(msg.videoData, msg.content, true);
            }
            else {
                // Regular text message
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.classList.add(msg.role === 'user' ? 'user-message' : 'oria-message');
            
            // Add message-content class to allow text selection
            const contentElement = document.createElement('div');
            contentElement.classList.add('message-content');
            
            // Add Oria logo to assistant messages
            if (msg.role === 'assistant') {
                // Create logo container
                const logoContainer = document.createElement('div');
                logoContainer.classList.add('oria-logo-container');
                logoContainer.style.display = 'flex';
                logoContainer.style.alignItems = 'center';
                logoContainer.style.marginBottom = '8px';
                
                // Create logo image based on current theme
                const logoImg = document.createElement('img');
                const isDarkTheme = document.body.classList.contains('dark-theme');
                logoImg.src = isDarkTheme ? 'image/oria.png' : 'image/oria1.png';
                logoImg.style.width = '32px';
                logoImg.style.height = '24px';
                logoImg.style.marginRight = '8px';
                logoImg.alt = 'Oria';
                
                // Add logo to container
                logoContainer.appendChild(logoImg);
                
                // Add logo container to message content
                contentElement.appendChild(logoContainer);
            }
            
            // Apply markdown formatting
            const formattedContent = formatMessage(msg.content);
            
            // Set the formatted content
            contentElement.innerHTML += formattedContent;
            messageElement.appendChild(contentElement);
            chatContainer.appendChild(messageElement);
            }
        });
        
        // Hide empty state
        emptyChat.style.display = 'none';
        isChatActive = true;
        
        // Hide suggestions
        suggestionButtons.style.display = 'none';
    } else {
        debugLog('No messages in this chat, showing empty state');
        // Show empty state if no messages
        emptyChat.style.display = 'flex';
        isChatActive = false;
        
        // Show suggestions
        suggestionButtons.style.display = 'flex';
        updateSuggestionButtons();
    }
    
    // Update sidebar active state
    document.querySelectorAll('.chat-history-item').forEach(item => {
        if (item.dataset.chatId === chatId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Scroll to bottom of chat
    scrollToBottom();
    
    debugLog('Chat loaded successfully');
}

// Optimize the shouldShowSuggestions function
function shouldShowSuggestions() {
    // In empty state (no chat active), we should show suggestions
    if (!isChatActive) return true;
    
    // If we have an active chat but no messages, show suggestions
    if (isChatActive && (!conversationHistory || conversationHistory.length === 0)) return true;
    
    // Otherwise, hide suggestions - we're in an active chat with messages
    return false;
}

// Optimize the updateChatVisibility function
function updateChatVisibility() {
    if (shouldShowSuggestions()) {
        // Show suggestions
        suggestionButtons.style.display = 'flex';
        
        // Only update content if needed (if buttons are empty)
        if (suggestionButtons.children.length === 0) {
            updateSuggestionButtons();
        }
        
        // Show or hide empty chat state
        emptyChat.style.display = isChatActive ? 'none' : 'flex';
    } else {
        // Hide suggestions and empty chat
        suggestionButtons.style.display = 'none';
        emptyChat.style.display = 'none';
    }
}

// Update showEmptyState and hideEmptyState to use this function
function showEmptyState() {
    console.log("showEmptyState called");
    isChatActive = false;
    updateChatVisibility();
    updateEmptyChatLogo();
    
    // Use our new function to update the subtitle based on DeepX mode status
    updateEmptyChatSubtitle(ORIA_IDENTITY.advancedMode.enabled);
}

function hideEmptyState() {
    console.log("hideEmptyState called");
    isChatActive = true;
    updateChatVisibility();
}

// Function to update the empty chat logo based on the current theme
function updateEmptyChatLogo() {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    const emptyLogo = document.querySelector('.empty-chat-logo');
    
    if (emptyLogo) {
        // Clear existing content
        emptyLogo.innerHTML = '';
        
        // Create image element
        const img = document.createElement('img');
        img.className = 'empty-chat-image';
        img.src = isDarkTheme ? 'image/oria.png' : 'image/oria1.png';
        img.alt = 'Oria Logo';
        
        // Append the image
        emptyLogo.appendChild(img);
    }
}

function generateChatId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function saveChatSession() {
    // Get existing sessions
    const sessions = JSON.parse(localStorage.getItem('chatSessions')) || {};
    
    // Check if the session has a custom title
    const customTitle = sessions[currentChatId]?.customTitle;
    
    // Create a modified conversation history for storage
    const storageConversation = conversationHistory.map(msg => {
        // Store full image data to ensure it can be restored properly
        if (msg.hasImage && msg.imageData) {
            return {
                ...msg,
                // Store the complete image data
                imageData: msg.imageData
            };
        }
        return msg;
    });
    
    // Update or create the current session
    sessions[currentChatId] = {
        messages: storageConversation,
        lastUpdated: new Date().toISOString()
    };
    
    // Restore custom title if it existed
    if (customTitle) {
        sessions[currentChatId].customTitle = customTitle;
    }
    
    // Save back to localStorage
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
    
    // Update the sidebar
    loadChatHistory();
}

// Create confirmation dialog for delete
function createConfirmationDialog() {
    // Check if dialog already exists
    if (document.querySelector('.confirmation-dialog')) {
        document.querySelector('.confirmation-dialog').remove();
    }
    
    const dialog = document.createElement('div');
    dialog.classList.add('confirmation-dialog');
    dialog.id = 'delete-confirmation';
    
    dialog.innerHTML = `
        <div class="confirmation-dialog-content">
            <div class="confirmation-dialog-title">Delete conversation</div>
            <div class="confirmation-dialog-message">Are you sure you want to delete this conversation? This action cannot be undone.</div>
            <div class="confirmation-dialog-actions">
                <button class="confirmation-dialog-btn cancel">Cancel</button>
                <button class="confirmation-dialog-btn confirm">Delete</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Force a reflow to ensure animation works
    dialog.offsetWidth;
    
    // Add event listeners
    dialog.querySelector('.confirmation-dialog-btn.cancel').addEventListener('click', () => {
        chatToDelete = null;
        closeConfirmationDialog(dialog);
    });
    
    dialog.querySelector('.confirmation-dialog-btn.confirm').addEventListener('click', () => {
        if (chatToDelete) {
            deleteChat(chatToDelete);
        }
        closeConfirmationDialog(dialog);
    });
    
    // Close dialog when clicking outside
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            chatToDelete = null;
            closeConfirmationDialog(dialog);
        }
    });
    
    return dialog;
}

function closeConfirmationDialog(dialog) {
    dialog.classList.add('closing');
    setTimeout(() => {
        dialog.remove();
    }, 200);
}

function confirmDeleteChat(chatId) {
    console.log("Confirming delete for chat:", chatId);
    chatToDelete = chatId;
    
    // Create and show custom dialog
    const dialog = createConfirmationDialog();
    
    // Focus the cancel button by default (safer)
    setTimeout(() => {
        dialog.querySelector('.confirmation-dialog-btn.cancel').focus();
    }, 10);
}

function deleteChat(chatId) {
    // Get sessions from localStorage
    const sessions = JSON.parse(localStorage.getItem('chatSessions')) || {};
    
    // Remove the session
    if (sessions[chatId]) {
        delete sessions[chatId];
        localStorage.setItem('chatSessions', JSON.stringify(sessions));
        
        // If the deleted chat was the current chat, start a new one
        if (chatId === currentChatId) {
            startNewChat();
        }
        
        // Reload chat history
        loadChatHistory();
    }
    
    chatToDelete = null;
}

function startRenaming(chatItem, chatId, currentTitle) {
    console.log("Starting rename for chat:", chatId);
    
    // Cancel any existing rename operation
    if (isRenaming) {
        const renamingItems = document.querySelectorAll('.chat-history-title-edit');
        renamingItems.forEach(item => {
            const oldChatItem = item.closest('.chat-history-item');
            if (oldChatItem) {
                const titleEl = oldChatItem.querySelector('.chat-history-title');
                if (titleEl) titleEl.style.display = '';
                item.remove();
            }
        });
        
        // Reset any "done" icons back to edit icons
        document.querySelectorAll('.chat-history-action-btn.rename').forEach(btn => {
            btn.innerHTML = '<i class="fas fa-pen"></i>';
        });
    }
    
    isRenaming = true;
    
    // Get title element
    const titleElement = chatItem.querySelector('.chat-history-title');
    titleElement.style.display = 'none';
    
    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentTitle;
    input.className = 'chat-history-title-input';
    input.placeholder = 'Enter chat title';
    
    // Create container
    const container = document.createElement('div');
    container.className = 'chat-history-title-edit';
    container.appendChild(input);
    
    // Insert into DOM
    titleElement.parentNode.insertBefore(container, titleElement);
    
    // Change the rename button icon to "done"
    const renameBtn = chatItem.querySelector('.chat-history-action-btn.rename');
    renameBtn.innerHTML = '<i class="fas fa-check"></i>';
    
    // Create a new finish renaming handler function that we'll use
    const finishRenamingHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        finishRenaming(chatId, input.value, chatItem);
        return false;
    };
    
    // Remove old click and touch event handlers
    renameBtn.removeEventListener('click', renameBtn.onclick);
    renameBtn.removeEventListener('touchend', renameBtn.ontouchend);
    
    // Add our new handler for button click
    renameBtn.onclick = finishRenamingHandler;
    
    // Also add the handler to the icon itself for direct icon clicks
    const checkIcon = renameBtn.querySelector('.fa-check');
    if (checkIcon) {
        checkIcon.addEventListener('click', finishRenamingHandler);
        checkIcon.addEventListener('touchend', finishRenamingHandler);
    }
    
    // Handle touch events
    renameBtn.ontouchend = function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (isIOS) window.actionButtonInteraction = true;
        finishRenaming(chatId, input.value, chatItem);
        return false;
    };
    
    // Focus the input and select all text
    input.focus();
    input.select();
    
    // Handle Enter key in the input field
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishRenaming(chatId, input.value, chatItem);
        } else if (e.key === 'Escape') {
            cancelRename(chatItem);
        }
    });
}

function cancelRename(chatItem) {
    isRenaming = false;
    
    // Get the input container
    const container = chatItem.querySelector('.chat-history-title-edit');
    if (!container) return;
    
    // Show the original title
    const titleEl = chatItem.querySelector('.chat-history-title');
    if (titleEl) titleEl.style.display = '';
    
    // Remove the input
    container.remove();
    
    // Reset the rename button icon
    const renameBtn = chatItem.querySelector('.chat-history-action-btn.rename');
    if (renameBtn) renameBtn.innerHTML = '<i class="fas fa-pen"></i>';
}

function finishRenaming(chatId, newTitle, chatItem) {
    // Trim the title and check if it's empty
    newTitle = newTitle.trim();
    if (!newTitle) {
        // If empty, just cancel the rename
        cancelRename(chatItem);
        return;
    }
    
    isRenaming = false;
    
    // Update the title element
    const titleEl = chatItem.querySelector('.chat-history-title');
    if (titleEl) {
        titleEl.textContent = newTitle;
        titleEl.style.display = '';
    }
    
    // Remove the input container
    const container = chatItem.querySelector('.chat-history-title-edit');
    if (container) container.remove();
    
    // Reset the rename button icon
    const renameBtn = chatItem.querySelector('.chat-history-action-btn.rename');
    if (renameBtn) renameBtn.innerHTML = '<i class="fas fa-pen"></i>';
    
    // Update the session in localStorage
    const sessions = JSON.parse(localStorage.getItem('chatSessions')) || {};
    if (sessions[chatId]) {
        sessions[chatId].customTitle = newTitle;
        localStorage.setItem('chatSessions', JSON.stringify(sessions));
    }
}

// Function to get today's suggestions based on date
function getTodaySuggestions() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0-6, where 0 is Sunday
    
    // Use cached suggestions if available and still valid for today
    if (cachedTodaySuggestions && cachedSuggestionsDay === dayOfWeek) {
        return cachedTodaySuggestions;
    }
    
    // Otherwise, get new suggestions for today
    const suggestionSet = SUGGESTION_SETS[dayOfWeek % SUGGESTION_SETS.length];
    
    // Cache the results
    cachedTodaySuggestions = suggestionSet;
    cachedSuggestionsDay = dayOfWeek;
    
    return suggestionSet;
}

// Preload suggestions as soon as the script loads (outside of any function)
// This ensures suggestions are ready even before DOM is fully loaded
(function preloadSuggestions() {
    // Preload suggestions immediately when script runs
    getTodaySuggestions();
})();

// Function to check if suggestions should be updated
function shouldUpdateSuggestions() {
    console.log("shouldUpdateSuggestions called");
    const lastUpdate = localStorage.getItem('suggestionsLastUpdate');
    console.log("Last update timestamp:", lastUpdate);
    
    if (!lastUpdate) {
        console.log("No previous update found, should update");
        return true;
    }
    
    const now = new Date();
    const lastUpdateDate = new Date(lastUpdate);
    console.log("Current date:", now.toISOString(), "Last update date:", lastUpdateDate.toISOString());
    
    // Check if it's a new day (past midnight)
    const shouldUpdate = now.getDate() !== lastUpdateDate.getDate() || 
           now.getMonth() !== lastUpdateDate.getMonth() ||
           now.getFullYear() !== lastUpdateDate.getFullYear();
    
    console.log("Should update suggestions:", shouldUpdate);
    return shouldUpdate;
}

// Function to update suggestion buttons
function updateSuggestionButtons() {
    // Get today's suggestions based on day of week
    const suggestions = getTodaySuggestions();
    
    // Using direct reference to the global suggestionButtons constant is faster
    if (!suggestionButtons) {
        console.error("Cannot find suggestion buttons container");
        return;
    }
    
    // Force display if needed (avoid computing style unnecessarily)
    if (shouldShowSuggestions()) {
        suggestionButtons.style.display = 'flex';
    }
    
    // Optimization: Create a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Create all buttons first and add them to the fragment
    suggestions.forEach(suggestion => {
        const button = document.createElement('button');
        button.className = 'suggestion-button';
        
        // Optimization: Use template literals only once
        const buttonHTML = `
            <span class="suggestion-title">${suggestion.title}</span>
            <span class="suggestion-subtitle">${suggestion.subtitle}</span>
        `;
        button.innerHTML = buttonHTML;
        
        // Add click event
        button.addEventListener('click', function() {
            // Add the suggestion text to the input field and send
            inputField.value = `${suggestion.title} ${suggestion.subtitle}`;
            toggleActionIcon();
            handleSendMessage();
        });
        
        fragment.appendChild(button);
    });
    
    // Clear and update in one batch operation
    suggestionButtons.innerHTML = '';
    suggestionButtons.appendChild(fragment);
    
    // Update last update timestamp
    localStorage.setItem('suggestionsLastUpdate', new Date().toISOString());
}

// Schedule a check for suggestion updates at midnight
function scheduleNextSuggestionUpdate() {
    const now = new Date();
    const nextUpdate = new Date(now);
    
    // Set next update time to midnight tonight
    nextUpdate.setDate(now.getDate() + 1);
    nextUpdate.setHours(0, 0, 0, 0);
    
    const timeUntilUpdate = nextUpdate - now;
    console.log(`Scheduling next suggestion update in ${Math.floor(timeUntilUpdate/1000/60)} minutes`);
    
    // Store the next update time in localStorage so we can recover if the page is reloaded
    localStorage.setItem('nextSuggestionUpdateTime', nextUpdate.toISOString());
    
    // Set the timeout for the next update
    setTimeout(() => {
        console.log("Midnight reached - updating suggestions");
        updateSuggestionButtons();
        
        // Schedule the next day's update
        scheduleNextSuggestionUpdate();
    }, timeUntilUpdate);
}

// Function to check if we need to update suggestions now (on page load)
function checkMissedSuggestionUpdate() {
    const storedNextUpdateTime = localStorage.getItem('nextSuggestionUpdateTime');
    
    if (storedNextUpdateTime) {
        const nextUpdateTime = new Date(storedNextUpdateTime);
        const now = new Date();
        
        console.log("Stored next update time:", nextUpdateTime);
        console.log("Current time:", now);
        
        // If the stored next update time is in the past, we missed an update while the app was closed
        if (nextUpdateTime <= now) {
            console.log("Missed suggestion update detected - updating now");
            updateSuggestionButtons();
            scheduleNextSuggestionUpdate();
            return true;
        }
    }
    
    return false;
}

// Simplify the debug function since we've optimized the core loading
function debugSuggestionButtons() {
    // If suggestions should be visible, ensure they are
    if (shouldShowSuggestions() && 
        window.getComputedStyle(suggestionButtons).display !== 'flex') {
        
        // Force display
        suggestionButtons.style.display = 'flex';
        
        // Update content if needed
        if (suggestionButtons.children.length === 0) {
            updateSuggestionButtons();
        }
    }
}

// Simplify the handleUserActivity function
function handleUserActivity() {
    // Clear any existing timeout
    clearTimeout(userActivityTimeout);
    
    // Update the last activity time
    lastUserActivity = Date.now();
    
    // No need to check suggestions on every activity,
    // just set a long timeout to check occasionally
    userActivityTimeout = setTimeout(debugSuggestionButtons, 10000);
}

// Add function to initialize the main app swipe gesture to open sidebar
function initAppSwipeGesture() {
    const appContainer = document.querySelector('.app-container');
    let touchStartX = 0;
    let touchMoveX = 0;
    let swipeStarted = false;
    const EDGE_THRESHOLD = 30; // Consider swipe only when starting within 30px of left edge
    
    appContainer.addEventListener('touchstart', (e) => {
        // Only trigger when touch starts near the left edge of the screen
        touchStartX = e.touches[0].clientX;
        
        // Only consider swipes that start from the left edge of the screen
        if (touchStartX <= EDGE_THRESHOLD) {
            swipeStarted = true;
        }
    }, { passive: true });
    
    appContainer.addEventListener('touchmove', (e) => {
        // Only process if swipe started from left edge
        if (!swipeStarted) return;
        
        touchMoveX = e.touches[0].clientX;
        const diffX = touchMoveX - touchStartX;
        
        // If swiping right (opening)
        if (diffX > 10) {
            // Get sidebar and overlay elements
            const sidebar = document.querySelector('.sidebar');
            const sidebarOverlay = document.querySelector('.sidebar-overlay');
            
            // Calculate how far to slide the sidebar (capped at the sidebar width)
            const sidebarWidth = sidebar.offsetWidth;
            const translateX = Math.min(diffX, sidebarWidth);
            const progress = translateX / sidebarWidth;
            
            // Show the sidebar container but keep it invisible
            if (!sidebarContainer.classList.contains('active') && translateX > 0) {
                sidebarContainer.style.visibility = 'visible';
                sidebarContainer.style.pointerEvents = 'auto';
                sidebar.classList.add('no-transition');
            }
            
            // Apply transform to sidebar based on swipe distance
            if (translateX > 0) {
                // Calculate position: -100% + progress toward 0%
                const transformPercentage = -100 + (progress * 100);
                sidebar.style.transform = `translateX(${transformPercentage}%)`;
                
                // Set overlay opacity based on progress
                sidebarOverlay.style.opacity = progress;
            }
        }
    }, { passive: true });
    
    appContainer.addEventListener('touchend', (e) => {
        if (!swipeStarted) return;
        
        touchMoveX = e.changedTouches[0].clientX;
        const diffX = touchMoveX - touchStartX;
        const sidebar = document.querySelector('.sidebar');
        
        // Remove the transition-blocking class to allow smooth animation
        sidebar.classList.remove('no-transition');
        
        // If swiped more than 1/3 of the way across, open the sidebar
        if (diffX > sidebar.offsetWidth / 3) {
            openSidebar();
        } else {
            // Otherwise, reset and close
            sidebar.style.transform = '';
            sidebarContainer.style.visibility = '';
            sidebarContainer.style.pointerEvents = '';
            document.querySelector('.sidebar-overlay').style.opacity = '';
        }
        
        // Reset variables
        swipeStarted = false;
        touchStartX = 0;
        touchMoveX = 0;
    }, { passive: true });
}

// Function to open version popup
function openVersionPopup() {
    versionPopup.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Highlight the current version
    versionOptions.forEach(option => {
        if (!option.querySelector('.badge-coming-soon')) {
            option.classList.add('active');
        }
    });
}

// Function to close version popup
function closeVersionPopup() {
    versionPopup.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

// Add click handler for version options
versionOptions.forEach(option => {
    option.addEventListener('click', function() {
        // Remove active class from all options
        versionOptions.forEach(opt => opt.classList.remove('active'));
        
        // Add active class to the clicked option
        this.classList.add('active');
        
        // Get version name from the clicked option
        const versionName = this.querySelector('.version-name').textContent;
        
        // Store selected version in localStorage
        localStorage.setItem('selectedVersion', versionName);
        
        // Close popup
        closeVersionPopup();
    });
});

// Function to initialize version on page load
function initializeVersion() {
    // Get stored version or default to first non-coming-soon version
    const storedVersion = localStorage.getItem('selectedVersion');
    if (storedVersion) {
        // Find and activate the stored version option
        versionOptions.forEach(option => {
            const versionName = option.querySelector('.version-name').textContent;
            if (versionName === storedVersion) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    } else {
        // Activate the first non-coming-soon version by default
        const defaultVersion = Array.from(versionOptions).find(option => !option.querySelector('.badge-coming-soon'));
        if (defaultVersion) {
            defaultVersion.classList.add('active');
            const versionName = defaultVersion.querySelector('.version-name').textContent;
            localStorage.setItem('selectedVersion', versionName);
        }
    }
}

// Call initializeVersion when the page loads
document.addEventListener('DOMContentLoaded', initializeVersion);

// Function to show login notification
function showLoginNotification(message) {
    // Remove any existing notification
    const existingNotification = document.querySelector('.login-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'login-notification';
    notification.innerHTML = `
        <div class="login-notification-content">
            <i class="fas fa-user-lock"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Force reflow to trigger animation
    notification.offsetWidth;
    
    // Show notification with animation
    notification.classList.add('show');
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 300); // Match animation duration
    }, 4000);
}

// Initialize scroll to bottom button functionality
function initScrollToBottomButton() {
    const chatArea = document.querySelector('.chat-area');
    const scrollBtn = document.getElementById('scrollBottomBtn');
    
    if (!chatArea || !scrollBtn) return;
    
    // Variables to track scrolling behavior
    let lastScrollTop = 0;
    let isScrollingUp = false;
    let isNearMiddle = false;
    
    // Function to check scroll position
    function checkScrollPosition() {
        const scrollTop = chatArea.scrollTop;
        const scrollHeight = chatArea.scrollHeight;
        const clientHeight = chatArea.clientHeight;
        
        // Calculate how far from bottom (in percentage)
        const scrollPercentage = (scrollHeight - scrollTop - clientHeight) / scrollHeight;
        
        // Determine scroll direction
        isScrollingUp = scrollTop < lastScrollTop;
        
        // Check if we're in the middle section (not too close to top or bottom)
        isNearMiddle = scrollPercentage > 0.2 && scrollPercentage < 0.8;
        
        // Show button when:
        // 1. User is significantly away from bottom (more than 20% from bottom)
        // 2. AND either scrolling down towards bottom OR not in the middle reading section
        if (scrollPercentage > 0.2 && (!isNearMiddle || !isScrollingUp)) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
        
        // Update last scroll position
        lastScrollTop = scrollTop;
    }
    
    // Add scroll event listener to the chat area
    chatArea.addEventListener('scroll', checkScrollPosition);
    
    // Scroll to bottom when button is clicked
    scrollBtn.addEventListener('click', () => {
        // Apply animated scrolling
        scrollToBottom();
        
        // Animate button with a more engaging effect
        scrollBtn.classList.add('clicked');
        scrollBtn.style.transform = 'scale(0.8) translateY(20px)';
        scrollBtn.style.opacity = '0.5';
        
        // Remove animation classes and styles after animation completes
        setTimeout(() => {
            scrollBtn.classList.remove('clicked', 'visible');
            scrollBtn.style.transform = '';
            scrollBtn.style.opacity = '';
        }, 300);
    });
    
    // Call once on initialization to set initial state
    checkScrollPosition();
}

// Add the initialization call to your document ready or init function
document.addEventListener('DOMContentLoaded', function() {
    // Other initializations
    // ...
    
    // Initialize scroll to bottom button
    initScrollToBottomButton();
    
    // ...
});

// Modify scrollToBottom function to also hide the button
function scrollToBottom() {
    const chatArea = document.querySelector('.chat-area');
    if (chatArea) {
        chatArea.scrollTop = chatArea.scrollHeight;
    }
    
    // Hide the scroll button if it exists
    const scrollBtn = document.getElementById('scrollBottomBtn');
    if (scrollBtn) {
        scrollBtn.classList.remove('visible');
    }
}

// Function to generate image from Pexels API
async function generateImage(prompt) {
    // Show custom loading message for image generation
    const loadingMessage = showImageGenerationLoading();
    
    try {
        // Create a sanitized query from the prompt
        const query = encodeURIComponent(prompt.trim());
        
        // Make request to Pexels API
        const response = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1`, {
            method: 'GET',
            headers: {
                'Authorization': PEXELS_API_KEY
            }
        });
        
        const data = await response.json();
        
        // Remove loading indicator
        loadingMessage.remove();
        
        // Check if we got results
        if (data.photos && data.photos.length > 0) {
            const imageUrl = data.photos[0].src.large;
            const photographer = data.photos[0].photographer;
            const photographerUrl = data.photos[0].photographer_url;
            
            // Add image to chat with attribution
            addGeneratedImageToChat(imageUrl, prompt, photographer, photographerUrl);
            
            // Save to localStorage
            saveGeneratedImage(imageUrl, prompt);
        } else {
            // Show error message if no images found
            addSystemMessage('No images found for this prompt. Please try a different search term.', true);
        }
    } catch (error) {
        // Remove loading indicator
        loadingMessage.remove();
        
        // Show error message
        addSystemMessage('Error generating image. Please try again later.', true);
        console.error('Image generation error:', error);
    }
}

// Function to show image generation loading
function showImageGenerationLoading() {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'oria-message', 'image-generation-loading');
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    
    // Create a fancy loading animation
    const loadingContainer = document.createElement('div');
    loadingContainer.classList.add('image-loading-container');
    loadingContainer.innerHTML = `
        <div class="image-loading-animation">
            <div class="image-loading-spinner"></div>
            <div class="image-loading-text">Generating image...</div>
        </div>
    `;
    
    // Add styles for the loading animation
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .image-loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            background-color: rgba(0, 0, 0, 0.05);
            border-radius: 12px;
        }
        
        .image-loading-animation {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }
        
        .image-loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(128, 128, 128, 0.1);
            border-radius: 50%;
            border-top: 4px solid var(--accent-color);
            animation: image-spin 1s linear infinite;
        }
        
        .image-loading-text {
            font-size: 14px;
            color: var(--text-color);
        }
        
        @keyframes image-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    
    document.head.appendChild(styleElement);
    contentElement.appendChild(loadingContainer);
    messageElement.appendChild(contentElement);
    chatContainer.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom();
    
    return messageElement;
}

// Function to add generated image to chat
function addGeneratedImageToChat(imageUrl, prompt, photographer, photographerUrl, skipHistory = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'oria-message');
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    
    // Create image container with enhanced styling
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('generated-image-container');
    imageContainer.style.maxWidth = '100%';
    imageContainer.style.maxHeight = '70vh';
    imageContainer.style.overflow = 'hidden';
    imageContainer.style.position = 'relative';
    imageContainer.style.borderRadius = '12px';
    imageContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    
    // Create image with loading state
    const image = document.createElement('img');
    image.classList.add('generated-image');
    image.alt = prompt;
    image.style.width = '100%';
    image.style.maxHeight = '70vh';
    image.style.objectFit = 'contain';
    image.style.display = 'block';
    image.style.borderRadius = '12px';
    
    // Add loading state only for new images
    if (!skipHistory) {
        image.style.filter = 'blur(10px)';
        image.style.opacity = '0.5';
    }
    
    // Create overlay with buttons
    const overlay = document.createElement('div');
    overlay.classList.add('generated-image-overlay');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.padding = '15px';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'flex-end';
    overlay.style.alignItems = 'flex-start';
    overlay.style.opacity = '1';
    overlay.style.borderRadius = '12px 12px 0 0';
    overlay.style.width = 'auto';
    
    const actions = document.createElement('div');
    actions.classList.add('generated-image-actions');
    actions.style.display = 'flex';
    actions.style.gap = '10px';
    
    // Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.classList.add('generated-image-action');
    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
    downloadBtn.title = 'Download image';
    downloadBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    downloadBtn.style.color = '#333';
    downloadBtn.style.border = 'none';
    downloadBtn.style.borderRadius = '50%';
    downloadBtn.style.width = '40px';
    downloadBtn.style.height = '40px';
    downloadBtn.style.display = 'flex';
    downloadBtn.style.alignItems = 'center';
    downloadBtn.style.justifyContent = 'center';
    downloadBtn.style.cursor = 'pointer';
    downloadBtn.style.transition = 'all 0.2s ease';
    downloadBtn.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadImage(imageUrl, `ORIA X-image-${Date.now()}.jpg`);
    });
    
    // Preview button
    const previewBtn = document.createElement('button');
    previewBtn.classList.add('generated-image-action');
    previewBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
    previewBtn.title = 'Preview image';
    previewBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    previewBtn.style.color = '#333';
    previewBtn.style.border = 'none';
    previewBtn.style.borderRadius = '50%';
    previewBtn.style.width = '40px';
    previewBtn.style.height = '40px';
    previewBtn.style.display = 'flex';
    previewBtn.style.alignItems = 'center';
    previewBtn.style.justifyContent = 'center';
    previewBtn.style.cursor = 'pointer';
    previewBtn.style.transition = 'all 0.2s ease';
    previewBtn.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    previewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showFullSizeImage(imageUrl);
    });
    
    // Add buttons to actions
    actions.appendChild(downloadBtn);
    actions.appendChild(previewBtn);
    overlay.appendChild(actions);
    
    // Add caption
    const captionContainer = document.createElement('div');
    
    const caption = document.createElement('div');
    caption.classList.add('generated-image-caption');
    caption.textContent = prompt;
    caption.style.marginTop = '8px';
    caption.style.fontSize = '14px';
    caption.style.color = 'var(--text-color)';
    
    captionContainer.appendChild(caption);
    
    // Load the image
    image.onload = () => {
        // Remove loading state once image is loaded
        image.style.filter = '';
        image.style.opacity = '1';
    };
    
    image.src = imageUrl;
    
    // Add all elements to container
    imageContainer.appendChild(image);
    imageContainer.appendChild(overlay);
    contentElement.appendChild(imageContainer);
    contentElement.appendChild(captionContainer);
    
    // Add message-actions (like/dislike) to the content
    const messageActions = document.createElement('div');
    messageActions.classList.add('message-actions');
    messageActions.style.display = 'flex';
    messageActions.style.justifyContent = 'flex-end';
    messageActions.style.marginTop = '8px';
    messageActions.style.gap = '10px';
    
    // Create unique ID for this message to track likes/dislikes
    const messageId = 'img_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    
    // Get likes data from localStorage
    let likesData = JSON.parse(localStorage.getItem('messageLikes')) || {};
    const messageStatus = likesData[messageId] || 'none'; // 'liked', 'disliked', or 'none'
    
    // Like button
    const likeButton = document.createElement('button');
    likeButton.classList.add('message-action-btn', 'like-btn');
    likeButton.innerHTML = '<i class="fas fa-thumbs-up"></i>';
    likeButton.title = 'Like';
    likeButton.style.backgroundColor = messageStatus === 'liked' ? 'rgba(0, 123, 255, 0.2)' : 'transparent';
    likeButton.style.color = messageStatus === 'liked' ? '#007bff' : 'var(--text-muted)';
    likeButton.style.border = 'none';
    likeButton.style.borderRadius = '50%';
    likeButton.style.width = '30px';
    likeButton.style.height = '30px';
    likeButton.style.display = 'flex';
    likeButton.style.alignItems = 'center';
    likeButton.style.justifyContent = 'center';
    likeButton.style.cursor = 'pointer';
    
    // Dislike button
    const dislikeButton = document.createElement('button');
    dislikeButton.classList.add('message-action-btn', 'dislike-btn');
    dislikeButton.innerHTML = '<i class="fas fa-thumbs-down"></i>';
    dislikeButton.title = 'Dislike';
    dislikeButton.style.backgroundColor = messageStatus === 'disliked' ? 'rgba(220, 53, 69, 0.2)' : 'transparent';
    dislikeButton.style.color = messageStatus === 'disliked' ? '#dc3545' : 'var(--text-muted)';
    dislikeButton.style.border = 'none';
    dislikeButton.style.borderRadius = '50%';
    dislikeButton.style.width = '30px';
    dislikeButton.style.height = '30px';
    dislikeButton.style.display = 'flex';
    dislikeButton.style.alignItems = 'center';
    dislikeButton.style.justifyContent = 'center';
    dislikeButton.style.cursor = 'pointer';
    
    // Add event listeners
    likeButton.addEventListener('click', function() {
        // Update button appearance
        const newStatus = messageStatus === 'liked' ? 'none' : 'liked';
        
        // Update button states
        likeButton.style.backgroundColor = newStatus === 'liked' ? 'rgba(0, 123, 255, 0.2)' : 'transparent';
        likeButton.style.color = newStatus === 'liked' ? '#007bff' : 'var(--text-muted)';
        dislikeButton.style.backgroundColor = 'transparent';
        dislikeButton.style.color = 'var(--text-muted)';
        
        // Save to localStorage
        likesData[messageId] = newStatus;
        localStorage.setItem('messageLikes', JSON.stringify(likesData));
    });
    
    dislikeButton.addEventListener('click', function() {
        // Update button appearance
        const newStatus = messageStatus === 'disliked' ? 'none' : 'disliked';
        
        // Update button states
        dislikeButton.style.backgroundColor = newStatus === 'disliked' ? 'rgba(220, 53, 69, 0.2)' : 'transparent';
        dislikeButton.style.color = newStatus === 'disliked' ? '#dc3545' : 'var(--text-muted)';
        likeButton.style.backgroundColor = 'transparent';
        likeButton.style.color = 'var(--text-muted)';
        
        // Save to localStorage
        likesData[messageId] = newStatus;
        localStorage.setItem('messageLikes', JSON.stringify(likesData));
    });
    
    // Add buttons to actions
    messageActions.appendChild(likeButton);
    messageActions.appendChild(dislikeButton);
    
    // Add to container
    contentElement.appendChild(messageActions);
    
    messageElement.appendChild(contentElement);
    chatContainer.appendChild(messageElement);
    
    // Save message to conversation history only if not loading from storage
    if (!skipHistory) {
        conversationHistory.push({
            role: 'assistant',
            content: `[Generated image: ${prompt}]`,
            hasImage: true,
            imageData: imageUrl,
            isGenerated: true
        });
        
        // Save to localStorage
        saveChatSession();
        
        // Save to generated images collection
        saveGeneratedImage(imageUrl, prompt);
    }
    
    // Scroll to bottom
    scrollToBottom();
}

// Function to download image
function downloadImage(url, filename) {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(blobUrl);
        })
        .catch(error => {
            console.error('Error downloading image:', error);
            addSystemMessage('Error downloading image. Please try again.', true);
        });
}

// Function to save generated image to localStorage
function saveGeneratedImage(imageUrl, prompt) {
    // Add to generated images array
    generatedImages.push({
        url: imageUrl,
        prompt: prompt,
        timestamp: new Date().toISOString()
    });
    
    // Save to localStorage (limit to 100 images to prevent localStorage overflow)
    if (generatedImages.length > 100) {
        generatedImages = generatedImages.slice(-100);
    }
    
    localStorage.setItem('generatedImages', JSON.stringify(generatedImages));
}

// Function to show image library
function showImageLibrary() {
    // Create library container
    const libraryContainer = document.createElement('div');
    libraryContainer.classList.add('image-library-container');
    
    // Create header
    const header = document.createElement('div');
    header.classList.add('image-library-header');
    
    const title = document.createElement('div');
    title.classList.add('image-library-title');
    title.textContent = 'Image Library';
    
    const closeBtn = document.createElement('button');
    closeBtn.classList.add('image-library-close');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.addEventListener('click', () => {
        libraryContainer.remove();
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Create image grid
    const grid = document.createElement('div');
    grid.classList.add('image-library-grid');
    
    // Check if we have any images
    if (generatedImages.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.classList.add('image-library-empty');
        emptyMessage.textContent = 'No images generated yet. Use /image command to create images.';
        libraryContainer.appendChild(header);
        libraryContainer.appendChild(emptyMessage);
    } else {
        // Add images to grid
        generatedImages.forEach(image => {
            const item = document.createElement('div');
            item.classList.add('image-library-item');
            
            const img = document.createElement('img');
            img.classList.add('image-library-img');
            img.src = image.url;
            img.alt = image.prompt;
            
            const caption = document.createElement('div');
            caption.classList.add('image-library-caption');
            caption.textContent = image.prompt;
            
            item.appendChild(img);
            item.appendChild(caption);
            
            // Add click event to show full image
            item.addEventListener('click', () => {
                showFullSizeImage(image.url);
            });
            
            grid.appendChild(item);
        });
        
        libraryContainer.appendChild(header);
        libraryContainer.appendChild(grid);
    }
    
    // Add to document
    document.body.appendChild(libraryContainer);
}

// Function to generate video 
async function generateVideo(prompt) {
    // Show custom loading message for video generation
    const loadingMessage = showVideoGenerationLoading();
    
    try {
        // For demonstration purposes, we'll use a sample video from Pexels
        // In a real implementation, you would use a video generation API
        const query = encodeURIComponent(prompt.trim());
        
        // Make request to Pexels API for videos instead of images
        const response = await fetch(`https://api.pexels.com/videos/search?query=${query}&per_page=1`, {
            method: 'GET',
            headers: {
                'Authorization': PEXELS_API_KEY
            }
        });
        
        const data = await response.json();
        
        // Remove loading indicator
        loadingMessage.remove();
        
        // Check if we got results
        if (data.videos && data.videos.length > 0) {
            // Get the medium resolution video file
            const videoFile = data.videos[0].video_files.find(file => 
                file.quality === 'sd' || file.quality === 'hd'
            ) || data.videos[0].video_files[0];
            
            const videoUrl = videoFile.link;
            
            // Add video to chat
            addGeneratedVideoToChat(videoUrl, prompt);
            
            // Save to localStorage (using the same structure as images)
            saveGeneratedVideo(videoUrl, prompt);
        } else {
            // Show error message if no videos found
            addSystemMessage('No videos found for this prompt. Please try a different search term.', true);
        }
    } catch (error) {
        // Remove loading indicator
        loadingMessage.remove();
        
        // Show error message
        addSystemMessage('Error generating video. Please try again later.', true);
        console.error('Video generation error:', error);
    }
}

// Function to show video generation loading
function showVideoGenerationLoading() {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'oria-message', 'video-generation-loading');
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    
    // Create a fancy loading animation
    const loadingContainer = document.createElement('div');
    loadingContainer.classList.add('image-loading-container');
    loadingContainer.innerHTML = `
        <div class="image-loading-animation">
            <div class="image-loading-spinner"></div>
            <div class="image-loading-text">Generating video...</div>
        </div>
    `;
    
    contentElement.appendChild(loadingContainer);
    messageElement.appendChild(contentElement);
    chatContainer.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom();
    
    return messageElement;
}

// Function to add generated video to chat
function addGeneratedVideoToChat(videoUrl, prompt, skipHistory = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'oria-message');
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    
    // Create video container
    const videoContainer = document.createElement('div');
    videoContainer.classList.add('video-container');
    videoContainer.style.maxWidth = '100%';
    videoContainer.style.maxHeight = '70vh';
    videoContainer.style.overflow = 'hidden';
    videoContainer.style.position = 'relative';
    videoContainer.style.borderRadius = '12px';
    videoContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    videoContainer.style.margin = '10px 0';
    
    // Create video element
    const video = document.createElement('video');
    video.classList.add('generated-video');
    video.controls = true;
    video.autoplay = false;
    video.muted = true;
    video.loop = true;
    video.src = videoUrl;
    video.style.width = '100%';
    video.style.maxHeight = '70vh';
    video.style.objectFit = 'contain';
    video.style.display = 'block';
    video.style.borderRadius = '12px';
    
    // Create overlay with buttons
    const overlay = document.createElement('div');
    overlay.classList.add('video-overlay');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.padding = '15px';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'flex-end';
    overlay.style.alignItems = 'flex-start';
    overlay.style.opacity = '1';
    overlay.style.borderRadius = '12px 12px 0 0';
    overlay.style.width = 'auto';
    
    const actions = document.createElement('div');
    actions.classList.add('video-actions');
    actions.style.display = 'flex';
    actions.style.gap = '10px';
    
    // Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.classList.add('video-action');
    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
    downloadBtn.title = 'Download video';
    downloadBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    downloadBtn.style.color = '#333';
    downloadBtn.style.border = 'none';
    downloadBtn.style.borderRadius = '50%';
    downloadBtn.style.width = '40px';
    downloadBtn.style.height = '40px';
    downloadBtn.style.display = 'flex';
    downloadBtn.style.alignItems = 'center';
    downloadBtn.style.justifyContent = 'center';
    downloadBtn.style.cursor = 'pointer';
    downloadBtn.style.transition = 'all 0.2s ease';
    downloadBtn.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadVideo(videoUrl, `ORIA X-video-${Date.now()}.mp4`);
    });
    
    // Full screen button
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.classList.add('video-action');
    fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    fullscreenBtn.title = 'Fullscreen';
    fullscreenBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    fullscreenBtn.style.color = '#333';
    fullscreenBtn.style.border = 'none';
    fullscreenBtn.style.borderRadius = '50%';
    fullscreenBtn.style.width = '40px';
    fullscreenBtn.style.height = '40px';
    fullscreenBtn.style.display = 'flex';
    fullscreenBtn.style.alignItems = 'center';
    fullscreenBtn.style.justifyContent = 'center';
    fullscreenBtn.style.cursor = 'pointer';
    fullscreenBtn.style.transition = 'all 0.2s ease';
    fullscreenBtn.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (video.requestFullscreen) {
            video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
        } else if (video.msRequestFullscreen) {
            video.msRequestFullscreen();
        }
    });
    
    // Add buttons to actions
    actions.appendChild(downloadBtn);
    actions.appendChild(fullscreenBtn);
    overlay.appendChild(actions);
    
    // Add caption
    const captionContainer = document.createElement('div');
    
    const caption = document.createElement('div');
    caption.classList.add('video-caption');
    caption.textContent = prompt;
    caption.style.marginTop = '8px';
    caption.style.fontSize = '14px';
    caption.style.color = 'var(--text-color)';
    
    captionContainer.appendChild(caption);
    
    // Add all elements to container
    videoContainer.appendChild(video);
    videoContainer.appendChild(overlay);
    contentElement.appendChild(videoContainer);
    contentElement.appendChild(captionContainer);
    
    // Add message-actions (like/dislike) to the content
    const messageActions = document.createElement('div');
    messageActions.classList.add('message-actions');
    messageActions.style.display = 'flex';
    messageActions.style.justifyContent = 'flex-end';
    messageActions.style.marginTop = '8px';
    messageActions.style.gap = '10px';
    
    // Create unique ID for this message to track likes/dislikes
    const messageId = 'vid_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    
    // Get likes data from localStorage
    let likesData = JSON.parse(localStorage.getItem('messageLikes')) || {};
    const messageStatus = likesData[messageId] || 'none'; // 'liked', 'disliked', or 'none'
    
    // Like button
    const likeButton = document.createElement('button');
    likeButton.classList.add('message-action-btn', 'like-btn');
    likeButton.innerHTML = '<i class="fas fa-thumbs-up"></i>';
    likeButton.title = 'Like';
    likeButton.style.backgroundColor = messageStatus === 'liked' ? 'rgba(0, 123, 255, 0.2)' : 'transparent';
    likeButton.style.color = messageStatus === 'liked' ? '#007bff' : 'var(--text-muted)';
    likeButton.style.border = 'none';
    likeButton.style.borderRadius = '50%';
    likeButton.style.width = '30px';
    likeButton.style.height = '30px';
    likeButton.style.display = 'flex';
    likeButton.style.alignItems = 'center';
    likeButton.style.justifyContent = 'center';
    likeButton.style.cursor = 'pointer';
    
    // Dislike button
    const dislikeButton = document.createElement('button');
    dislikeButton.classList.add('message-action-btn', 'dislike-btn');
    dislikeButton.innerHTML = '<i class="fas fa-thumbs-down"></i>';
    dislikeButton.title = 'Dislike';
    dislikeButton.style.backgroundColor = messageStatus === 'disliked' ? 'rgba(220, 53, 69, 0.2)' : 'transparent';
    dislikeButton.style.color = messageStatus === 'disliked' ? '#dc3545' : 'var(--text-muted)';
    dislikeButton.style.border = 'none';
    dislikeButton.style.borderRadius = '50%';
    dislikeButton.style.width = '30px';
    dislikeButton.style.height = '30px';
    dislikeButton.style.display = 'flex';
    dislikeButton.style.alignItems = 'center';
    dislikeButton.style.justifyContent = 'center';
    dislikeButton.style.cursor = 'pointer';
    
    // Add event listeners
    likeButton.addEventListener('click', function() {
        // Update button appearance
        const newStatus = messageStatus === 'liked' ? 'none' : 'liked';
        
        // Update button states
        likeButton.style.backgroundColor = newStatus === 'liked' ? 'rgba(0, 123, 255, 0.2)' : 'transparent';
        likeButton.style.color = newStatus === 'liked' ? '#007bff' : 'var(--text-muted)';
        dislikeButton.style.backgroundColor = 'transparent';
        dislikeButton.style.color = 'var(--text-muted)';
        
        // Save to localStorage
        likesData[messageId] = newStatus;
        localStorage.setItem('messageLikes', JSON.stringify(likesData));
    });
    
    dislikeButton.addEventListener('click', function() {
        // Update button appearance
        const newStatus = messageStatus === 'disliked' ? 'none' : 'disliked';
        
        // Update button states
        dislikeButton.style.backgroundColor = newStatus === 'disliked' ? 'rgba(220, 53, 69, 0.2)' : 'transparent';
        dislikeButton.style.color = newStatus === 'disliked' ? '#dc3545' : 'var(--text-muted)';
        likeButton.style.backgroundColor = 'transparent';
        likeButton.style.color = 'var(--text-muted)';
        
        // Save to localStorage
        likesData[messageId] = newStatus;
        localStorage.setItem('messageLikes', JSON.stringify(likesData));
    });
    
    // Add buttons to actions
    messageActions.appendChild(likeButton);
    messageActions.appendChild(dislikeButton);
    
    // Add message actions to content
    contentElement.appendChild(messageActions);
    
    messageElement.appendChild(contentElement);
    chatContainer.appendChild(messageElement);
    
    // Save message to conversation history if not loading from storage
    if (!skipHistory) {
        conversationHistory.push({
            role: 'assistant',
            content: `[Generated video: ${prompt}]`,
            hasVideo: true,
            videoData: videoUrl,
            isGenerated: true
        });
        
        // Save to localStorage
        saveChatSession();
        
        // Save to generated videos collection
        saveGeneratedVideo(videoUrl, prompt);
    }
    
    // Scroll to bottom
    scrollToBottom();
}

// Function to download video
function downloadVideo(url, filename) {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(blobUrl);
        })
        .catch(error => {
            console.error('Error downloading video:', error);
            addSystemMessage('Error downloading video. Please try again.', true);
        });
}

// Function to save generated video to localStorage
function saveGeneratedVideo(videoUrl, prompt) {
    // Add to generated images array (we'll use the same array for simplicity)
    generatedImages.push({
        url: videoUrl,
        prompt: prompt,
        timestamp: new Date().toISOString(),
        isVideo: true
    });
    
    // Save to localStorage (limit to 100 items to prevent localStorage overflow)
    if (generatedImages.length > 100) {
        generatedImages = generatedImages.slice(-100);
    }
    
    localStorage.setItem('generatedImages', JSON.stringify(generatedImages));
}

// Apply responsive styles for media content
if (!document.querySelector('#responsive-media-styles')) {
    const responsiveStyles = document.createElement('style');
    responsiveStyles.id = 'responsive-media-styles';
    responsiveStyles.textContent = `
        /* Responsive adjustments for media content */
        @media (max-width: 768px) {
            .generated-image, .generated-video {
                max-height: 50vh !important;
                border-radius: 8px !important;
            }
            
            .generated-image-container, .video-container {
                max-height: 50vh !important;
                border-radius: 8px !important;
            }
            
            .generated-image-overlay, .video-overlay {
                padding: 8px !important; 
                border-radius: 0 0 8px 8px !important;
            }
            
            .generated-image-action, .video-action {
                width: 36px !important;
                height: 36px !important;
            }
            
            .message-content {
                max-width: 100%;
            }
        }
        
        @media (max-width: 480px) {
            .generated-image, .generated-video {
                max-height: 40vh !important;
            }
            
            .generated-image-container, .video-container {
                max-height: 40vh !important;
            }
            
            .generated-image-action, .video-action {
                width: 32px !important;
                height: 32px !important;
            }
        }
    `;
    document.head.appendChild(responsiveStyles);
}

// Function to initialize DeepX toggle
function initializeDeepXToggle() {
    const deepxToggle = document.getElementById('deepxToggle');
    if (!deepxToggle) return;
    
    // Get saved state from localStorage
    const isDeepXEnabled = localStorage.getItem('deepxEnabled') === 'true';
    
    // Set toggle initial state
    deepxToggle.checked = isDeepXEnabled;
    
    // Update oria_identity.advancedMode.enabled
    ORIA_IDENTITY.advancedMode.enabled = isDeepXEnabled;
    
    // Update empty chat subtitle based on current state
    updateEmptyChatSubtitle(isDeepXEnabled);
    
    // Add event listener for toggle changes
    deepxToggle.addEventListener('change', function() {
        // Update localStorage
        localStorage.setItem('deepxEnabled', this.checked);
        
        // Update oria_identity
        ORIA_IDENTITY.advancedMode.enabled = this.checked;
        
        // Update empty chat subtitle
        updateEmptyChatSubtitle(this.checked);
        
        // Show confirmation message
        const message = this.checked 
            ? "DeepX mode enabled. Oria will now research more deeply." 
            : "DeepX mode disabled. Back to standard mode.";
        addSystemMessage(message);
        
        // Close the popup after selection
        closeToolsPopup();
    });
}

// Function to update the empty chat subtitle based on DeepX mode
function updateEmptyChatSubtitle(isDeepXEnabled) {
    const subtitle = document.querySelector('.empty-chat-subtitle');
    if (subtitle) {
        if (isDeepXEnabled) {
            subtitle.innerHTML = `DeepX: Complex Q → Detailed A`;
        } else {
            subtitle.innerHTML = `${ORIA_IDENTITY.tagline}<br>Start a conversation or choose from the suggestions below.`;
        }
    }
    
    // Also update the input placeholder
    const inputField = document.querySelector('.input-field');
    if (inputField) {
        if (isDeepXEnabled) {
            inputField.placeholder = "Get the details...";
        } else {
            inputField.placeholder = "Awaiting input...";
        }
    }
}