// Handle Auth Forms
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  
  // Tab Switcher Logic
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegisterBtn = document.getElementById('tab-register-btn');
  const authTag = document.getElementById('auth-tag');
  const authHeadline = document.getElementById('auth-headline');
  const logoIcon = document.getElementById('logo-icon');

  if (tabLoginBtn && tabRegisterBtn) {
    tabLoginBtn.addEventListener('click', () => {
      tabLoginBtn.classList.add('active');
      tabRegisterBtn.classList.remove('active');
      
      if (loginForm) loginForm.style.display = 'flex';
      if (regForm) regForm.style.display = 'none';

      // Update styling to Blue/Cyan (Login theme)
      if (authTag) {
        authTag.textContent = '⚡ Secure Access Node';
        authTag.style.background = 'rgba(29, 161, 242, 0.15)';
        authTag.style.borderColor = '#1da1f2';
        authTag.style.color = '#00f0ff';
      }
      if (authHeadline) {
        authHeadline.textContent = 'Secure your digital feed.';
        authHeadline.style.background = 'linear-gradient(135deg, #ffffff 30%, #94a3b8 70%, #00f0ff 100%)';
        authHeadline.style.webkitBackgroundClip = 'text';
      }
      if (logoIcon) {
        logoIcon.setAttribute('fill', '#00f0ff');
      }
      
      const toggleLoginPass = document.getElementById('toggle-login-password');
      if (toggleLoginPass) {
        toggleLoginPass.style.color = '#00f0ff';
      }

      // Update global background/glow (if they exist)
      const glow = document.getElementById('global-ambient-glow');
      if (glow) {
        glow.style.background = 'radial-gradient(circle, rgba(29, 161, 242, 0.08) 0%, rgba(0,0,0,0) 70%)';
      }
    });

    tabRegisterBtn.addEventListener('click', () => {
      tabRegisterBtn.classList.add('active');
      tabLoginBtn.classList.remove('active');
      
      if (loginForm) loginForm.style.display = 'none';
      if (regForm) regForm.style.display = 'flex';

      // Update styling to Violet/Purple (Register theme)
      if (authTag) {
        authTag.textContent = '🌌 Core Identity Build';
        authTag.style.background = 'rgba(168, 85, 247, 0.15)';
        authTag.style.borderColor = '#a855f7';
        authTag.style.color = '#c084fc';
      }
      if (authHeadline) {
        authHeadline.textContent = 'Join the secure channel.';
        authHeadline.style.background = 'linear-gradient(135deg, #ffffff 30%, #94a3b8 70%, #a855f7 100%)';
        authHeadline.style.webkitBackgroundClip = 'text';
      }
      if (logoIcon) {
        logoIcon.setAttribute('fill', '#c084fc');
      }
      
      const toggleRegPass = document.getElementById('toggle-reg-password');
      if (toggleRegPass) {
        toggleRegPass.style.color = '#c084fc';
      }

      // Update global background/glow (if they exist)
      const glow = document.getElementById('global-ambient-glow');
      if (glow) {
        glow.style.background = 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, rgba(0,0,0,0) 70%)';
      }
    });
  }

  // Password Visibility Toggle Logic
  const toggleLoginPass = document.getElementById('toggle-login-password');
  const loginPassInput = document.getElementById('login-password');
  if (toggleLoginPass && loginPassInput) {
    toggleLoginPass.addEventListener('click', () => {
      const isPass = loginPassInput.type === 'password';
      loginPassInput.type = isPass ? 'text' : 'password';
      toggleLoginPass.textContent = isPass ? 'Hide' : 'Show';
    });
  }

  const toggleRegPass = document.getElementById('toggle-reg-password');
  const regPassInput = document.getElementById('reg-password');
  if (toggleRegPass && regPassInput) {
    toggleRegPass.addEventListener('click', () => {
      const isPass = regPassInput.type === 'password';
      regPassInput.type = isPass ? 'text' : 'password';
      toggleRegPass.textContent = isPass ? 'Hide' : 'Show';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(`${API_BASE}/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: document.getElementById('login-username').value,
            password: document.getElementById('login-password').value
          })
        });
        const data = await res.json();
        if (res.ok) {
          if (data.otpRequired) {
            // Switch to OTP form
            loginForm.style.display = 'none';
            const otpForm = document.getElementById('otp-form');
            if (otpForm) {
              otpForm.style.display = 'flex';
              otpForm.dataset.userId = data.userId;
              
              // Dev/testing mode helper to allow reading OTP
              if (data.otp) {
                otpForm.dataset.devOtp = data.otp;
              }
            }

            // Hide the tab switcher
            const tabBox = document.querySelector('.tab-box');
            if (tabBox) tabBox.style.display = 'none';

            // Transition theme to orange/warning
            if (authTag) {
              authTag.textContent = '🔒 Multi-Factor Layer';
              authTag.style.background = 'rgba(245, 158, 11, 0.15)';
              authTag.style.borderColor = '#f59e0b';
              authTag.style.color = '#fbbf24';
            }
            if (authHeadline) {
              authHeadline.textContent = 'Confirm Entry Security.';
              authHeadline.style.background = 'linear-gradient(135deg, #ffffff 30%, #94a3b8 70%, #f59e0b 100%)';
              authHeadline.style.webkitBackgroundClip = 'text';
            }
            if (logoIcon) {
              logoIcon.setAttribute('fill', '#f59e0b');
            }
          } else {
            loginUser(data.token, data.user);
          }
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  const otpForm = document.getElementById('otp-form');
  if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const userId = otpForm.dataset.userId;
        const otpVal = document.getElementById('otp-value').value;
        const res = await fetch(`${API_BASE}/users/verify-login-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, otp: otpVal })
        });
        const data = await res.json();
        if (res.ok) {
          loginUser(data.token, data.user);
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error(err);
      }
    });

    const cancelOtpBtn = document.getElementById('cancel-otp-btn');
    if (cancelOtpBtn) {
      cancelOtpBtn.addEventListener('click', () => {
        // Revert to login form
        otpForm.style.display = 'none';
        if (loginForm) loginForm.style.display = 'flex';

        // Show tab switcher
        const tabBox = document.querySelector('.tab-box');
        if (tabBox) tabBox.style.display = 'grid';

        // Revert theme to Blue/Cyan
        if (authTag) {
          authTag.textContent = '⚡ Secure Access Node';
          authTag.style.background = 'rgba(29, 161, 242, 0.15)';
          authTag.style.borderColor = '#1da1f2';
          authTag.style.color = '#00f0ff';
        }
        if (authHeadline) {
          authHeadline.textContent = 'Secure your digital feed.';
          authHeadline.style.background = 'linear-gradient(135deg, #ffffff 30%, #94a3b8 70%, #00f0ff 100%)';
          authHeadline.style.webkitBackgroundClip = 'text';
        }
        if (logoIcon) {
          logoIcon.setAttribute('fill', '#00f0ff');
        }

        document.getElementById('otp-value').value = '';
      });
    }
  }

  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const phoneVal = document.getElementById('reg-phone').value;
        const phoneNotifChecked = document.getElementById('reg-phone-notif').checked;
        const res = await fetch(`${API_BASE}/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: document.getElementById('reg-username').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value,
            phone: phoneVal || undefined,
            phoneNotificationEnabled: phoneNotifChecked
          })
        });
        const data = await res.json();
        if (res.ok) {
          loginUser(data.token, data.user);
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  // Load Feed
  if (isAuthenticated() && document.getElementById('feed-container')) {
    loadFeed();

    const tweetForm = document.getElementById('tweet-form');
    tweetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const contentInput = document.getElementById('tweet-content');
      try {
        const data = await apiCall('/tweets', {
          method: 'POST',
          body: JSON.stringify({ content: contentInput.value })
        });
        contentInput.value = '';
        loadFeed(); // Reload to show new tweet
      } catch (err) {
        alert(err.message);
      }
    });
  }
});

async function loadFeed() {
  try {
    const data = await apiCall('/tweets');
    const container = document.getElementById('feed-container');
    container.innerHTML = '';
    
    if (data.tweets.length === 0) {
      container.innerHTML = '<p class="desc">No tweets yet.</p>';
      return;
    }

    data.tweets.forEach(tweet => {
      const el = document.createElement('div');
      el.className = 'tweet';
      el.id = `tweet-${tweet.id}`;
      // Basic escaping to prevent simple XSS
      const safeContent = tweet.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      el.innerHTML = `
        <div class="tweet-author">@${tweet.author}</div>
        <div class="tweet-content">${safeContent}</div>
        <div class="tweet-time">${new Date(tweet.createdAt).toLocaleString()}</div>
      `;
      container.appendChild(el);
    });
  } catch (err) {
    console.error(err);
    document.getElementById('feed-container').innerHTML = `<p style="color:red">Error loading feed</p>`;
  }
}
