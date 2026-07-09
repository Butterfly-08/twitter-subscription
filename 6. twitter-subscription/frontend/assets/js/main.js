document.addEventListener('DOMContentLoaded', async () => {
  await apiClient.init();
  otpModal.init();
  // languageSwitcher.init() is called after i18n is loaded below

  // Elements
  const authSection = document.getElementById('auth-section');
  const appSection = document.getElementById('app-section');
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const otpForm = document.getElementById('otp-form');
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegisterBtn = document.getElementById('tab-register-btn');
  const tabBox = document.querySelector('.tab-box');
  const logoutBtn = document.getElementById('logout-btn');
  const userDisplay = document.getElementById('user-display');
  const welcomeUserHeading = document.getElementById('welcome-user-heading');

  const authTag = document.getElementById('auth-tag');
  const authHeadline = document.getElementById('auth-headline');
  const logoIcon = document.getElementById('logo-icon');

  const toggleLoginPass = document.getElementById('toggle-login-password');
  const loginPassInput = document.getElementById('login-password');
  const toggleRegPass = document.getElementById('toggle-reg-password');
  const regPassInput = document.getElementById('reg-password');
  const cancelOtpBtn = document.getElementById('cancel-otp-btn');

  // Load language: check localStorage user language preference, guest cookie, or default to en
  let initialLang = 'en';
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user.preferredLanguage) initialLang = user.preferredLanguage;
    } catch (e) {
      console.error(e);
    }
  } else {
    // Check cookie
    const match = document.cookie.match(new RegExp('(^| )guestLanguage=([^;]+)'));
    if (match) initialLang = match[2];
  }
  await i18n.loadLanguage(initialLang);
  languageSwitcher.init(); // Init after i18n so currentLanguage is set correctly

  // Authentication State Render
  function renderAuthState() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        window.activeTheme = 'loggedin';
        if (window.updateAmbientGlow) window.updateAmbientGlow();

        if (authSection) authSection.style.display = 'none';
        if (appSection) appSection.style.display = 'flex';
        
        if (userDisplay) {
          userDisplay.textContent = `@${user.username || user.name}`;
          userDisplay.style.display = 'inline-block';
        }
        if (logoutBtn) logoutBtn.style.display = 'inline-block';

        if (welcomeUserHeading) {
          welcomeUserHeading.textContent = i18n.t('welcome_back', { name: user.name });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      window.activeTheme = 'login';
      if (window.updateAmbientGlow) window.updateAmbientGlow();

      if (authSection) authSection.style.display = 'flex';
      if (appSection) appSection.style.display = 'none';

      if (userDisplay) {
        userDisplay.textContent = '';
        userDisplay.style.display = 'none';
      }
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  }

  renderAuthState();

  // Tab switching
  if (tabLoginBtn && tabRegisterBtn) {
    tabLoginBtn.addEventListener('click', () => {
      tabLoginBtn.classList.add('active');
      tabRegisterBtn.classList.remove('active');
      
      if (loginForm) loginForm.style.display = 'flex';
      if (regForm) regForm.style.display = 'none';
      if (otpForm) otpForm.style.display = 'none';

      window.activeTheme = 'login';
      if (window.updateAmbientGlow) window.updateAmbientGlow();

      // Theme UI Styling (Blue/Cyan)
      if (authTag) {
        authTag.textContent = i18n.t('auth_tag_login');
        authTag.style.background = 'rgba(29, 161, 242, 0.15)';
        authTag.style.borderColor = '#1da1f2';
        authTag.style.color = '#00f0ff';
      }
      if (authHeadline) {
        authHeadline.textContent = i18n.t('auth_headline_login');
        authHeadline.style.background = 'linear-gradient(135deg, #ffffff 30%, #94a3b8 70%, #00f0ff 100%)';
        authHeadline.style.webkitBackgroundClip = 'text';
      }
      if (logoIcon) logoIcon.setAttribute('fill', '#00f0ff');
    });

    tabRegisterBtn.addEventListener('click', () => {
      tabRegisterBtn.classList.add('active');
      tabLoginBtn.classList.remove('active');
      
      if (loginForm) loginForm.style.display = 'none';
      if (regForm) regForm.style.display = 'flex';
      if (otpForm) otpForm.style.display = 'none';

      window.activeTheme = 'register';
      if (window.updateAmbientGlow) window.updateAmbientGlow();

      // Theme UI Styling (Violet/Purple)
      if (authTag) {
        authTag.textContent = i18n.t('auth_tag_register');
        authTag.style.background = 'rgba(168, 85, 247, 0.15)';
        authTag.style.borderColor = '#a855f7';
        authTag.style.color = '#c084fc';
      }
      if (authHeadline) {
        authHeadline.textContent = i18n.t('auth_headline_register');
        authHeadline.style.background = 'linear-gradient(135deg, #ffffff 30%, #94a3b8 70%, #a855f7 100%)';
        authHeadline.style.webkitBackgroundClip = 'text';
      }
      if (logoIcon) logoIcon.setAttribute('fill', '#c084fc');
    });
  }

  // Toggle Password Visibility
  if (toggleLoginPass && loginPassInput) {
    toggleLoginPass.addEventListener('click', () => {
      const isPass = loginPassInput.type === 'password';
      loginPassInput.type = isPass ? 'text' : 'password';
      toggleLoginPass.textContent = isPass ? 'Hide' : 'Show';
    });
  }

  if (toggleRegPass && regPassInput) {
    toggleRegPass.addEventListener('click', () => {
      const isPass = regPassInput.type === 'password';
      regPassInput.type = isPass ? 'text' : 'password';
      toggleRegPass.textContent = isPass ? 'Hide' : 'Show';
    });
  }

  // Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = loginPassInput.value;

      try {
        const res = await apiClient.request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });

        if (res.success) {
          if (res.otpRequired) {
            // Switch to OTP Form
            loginForm.style.display = 'none';
            if (tabBox) tabBox.style.display = 'none';
            if (otpForm) {
              otpForm.style.display = 'flex';
              otpForm.dataset.userId = res.userId;
            }

            window.activeTheme = 'otp';
            if (window.updateAmbientGlow) window.updateAmbientGlow();

            // Set Warning/Amber theme UI
            if (authTag) {
              authTag.textContent = i18n.t('auth_tag_otp');
              authTag.style.background = 'rgba(245, 158, 11, 0.15)';
              authTag.style.borderColor = '#f59e0b';
              authTag.style.color = '#fbbf24';
            }
            if (authHeadline) {
              authHeadline.textContent = i18n.t('auth_headline_otp');
              authHeadline.style.background = 'linear-gradient(135deg, #ffffff 30%, #94a3b8 70%, #f59e0b 100%)';
              authHeadline.style.webkitBackgroundClip = 'text';
            }
            if (logoIcon) logoIcon.setAttribute('fill', '#f59e0b');

            // Alert dev code printed in console
            if (res.otp) {
              console.log('Development OTP token received:', res.otp);
              // Fill OTP placeholder to show developer
              document.getElementById('otp-value').placeholder = `Token: ${res.otp}`;
            }
          } else {
            // Straight login
            apiClient.setToken(res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            
            // Reload translations based on user preference
            if (res.user.preferredLanguage && res.user.preferredLanguage !== i18n.currentLanguage) {
              await i18n.loadLanguage(res.user.preferredLanguage);
            }
            
            renderAuthState();
          }
        }
      } catch (err) {
        alert(err.message || 'Login failed.');
      }
    });
  }

  // OTP Verification Form Submission
  if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userId = otpForm.dataset.userId;
      const otp = document.getElementById('otp-value').value;

      try {
        const res = await apiClient.request('/api/auth/verify-login-otp', {
          method: 'POST',
          body: JSON.stringify({ userId, otp })
        });

        if (res.success) {
          apiClient.setToken(res.token);
          localStorage.setItem('user', JSON.stringify(res.user));

          // Reset OTP form
          otpForm.style.display = 'none';
          if (tabBox) tabBox.style.display = 'grid';
          document.getElementById('otp-value').value = '';

          if (res.user.preferredLanguage && res.user.preferredLanguage !== i18n.currentLanguage) {
            await i18n.loadLanguage(res.user.preferredLanguage);
          }

          renderAuthState();
        }
      } catch (err) {
        alert(err.message || 'OTP verification failed.');
      }
    });

    // Cancel OTP action
    if (cancelOtpBtn) {
      cancelOtpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        otpForm.style.display = 'none';
        if (loginForm) loginForm.style.display = 'flex';
        if (tabBox) tabBox.style.display = 'grid';
        document.getElementById('otp-value').value = '';

        window.activeTheme = 'login';
        if (window.updateAmbientGlow) window.updateAmbientGlow();

        if (authTag) {
          authTag.textContent = i18n.t('auth_tag_login');
          authTag.style.background = 'rgba(29, 161, 242, 0.15)';
          authTag.style.borderColor = '#1da1f2';
          authTag.style.color = '#00f0ff';
        }
        if (authHeadline) {
          authHeadline.textContent = i18n.t('auth_headline_login');
          authHeadline.style.background = 'linear-gradient(135deg, #ffffff 30%, #94a3b8 70%, #00f0ff 100%)';
          authHeadline.style.webkitBackgroundClip = 'text';
        }
        if (logoIcon) logoIcon.setAttribute('fill', '#00f0ff');
      });
    }
  }

  // Registration Form Submission
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const username = document.getElementById('reg-username').value;
      const email = document.getElementById('reg-email').value;
      const mobileNumber = document.getElementById('reg-phone').value;
      const password = regPassInput.value;

      try {
        const res = await apiClient.request('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, username, email, mobileNumber, password })
        });

        if (res.success) {
          apiClient.setToken(res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          
          if (res.user.preferredLanguage && res.user.preferredLanguage !== i18n.currentLanguage) {
            await i18n.loadLanguage(res.user.preferredLanguage);
          }

          renderAuthState();
        }
      } catch (err) {
        alert(err.message || 'Registration failed.');
      }
    });
  }

  // Logout Button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      apiClient.setToken(null);
      localStorage.removeItem('user');
      
      // Revert password fields
      if (loginPassInput) loginPassInput.value = '';
      if (regPassInput) regPassInput.value = '';

      renderAuthState();
    });
  }
});
