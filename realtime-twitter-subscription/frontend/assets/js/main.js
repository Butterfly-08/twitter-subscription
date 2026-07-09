document.addEventListener('DOMContentLoaded', async () => {
  await apiClient.init();
  otpModal.init();
  
  // Elements
  const authSection = document.getElementById('auth-section');
  const appSection = document.getElementById('app-section');
  
  // Forms & Buttons
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const otpForm = document.getElementById('otp-form');
  const textTweetForm = document.getElementById('text-tweet-form');
  const audioTweetForm = document.getElementById('audio-tweet-form');
  const forgotPassForm = document.getElementById('forgot-password-form');
  
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegisterBtn = document.getElementById('tab-register-btn');
  const tabBox = document.querySelector('.tab-box');
  const logoutBtn = document.getElementById('logout-btn');
  const userDisplay = document.getElementById('user-display');
  
  // Modals
  const forgotPassModal = document.getElementById('forgot-password-modal');
  const forgotPassLink = document.getElementById('forgot-password-link');
  const closeForgotModalBtn = document.getElementById('close-forgot-modal-btn');
  
  // Audio upload OTP lock elements
  const sendUploadOtpBtn = document.getElementById('send-upload-otp-btn');
  const uploadOtpInputs = document.getElementById('upload-otp-verify-inputs');
  const verifyUploadOtpBtn = document.getElementById('verify-upload-otp-btn');
  const uploadOtpVal = document.getElementById('upload-otp-val');
  const uploadTokenStatus = document.getElementById('upload-token-status');
  const audioComposerWrapper = document.getElementById('audio-composer-wrapper');
  const audioPostSubmitBtn = document.getElementById('audio-post-submit-btn');

  // Voice recording elements
  const recordActionBtn = document.getElementById('record-action-btn');
  const recordingTimer = document.getElementById('recording-timer');
  const voiceCanvas = document.getElementById('voice-waveform-canvas');
  const audioPreviewPlayer = document.getElementById('audio-preview-player');
  const recordingPreviewEl = document.getElementById('recording-preview-el');
  const discardAudioBtn = document.getElementById('discard-audio-btn');
  const dropZone = document.getElementById('drop-zone');

  // Text Tweet character counter
  const tweetTextContent = document.getElementById('tweet-text-content');
  const textCharCount = document.getElementById('text-char-count');

  // Settings elements
  const smartNotificationsToggle = document.getElementById('smart-notifications-toggle');
  const subKeywordsInput = document.getElementById('sub-keywords-input');
  const saveKeywordsBtn = document.getElementById('save-keywords-btn');
  const phoneSmsInput = document.getElementById('phone-sms-input');
  const phoneSmsToggle = document.getElementById('phone-sms-toggle');
  const savePhoneBtn = document.getElementById('save-phone-btn');

  // Audio Recording Variables
  let mediaRecorder = null;
  let audioChunks = [];
  let recordingInterval = null;
  let secondsRecorded = 0;
  let audioBlob = null;
  let audioFile = null; // Can hold file from drag-drop
  let visualizerStream = null;
  let audioCtx = null;
  let analyser = null;
  let dataArray = null;
  let bufferLength = 0;
  let isRecording = false;
  let uploadOtpToken = null;

  // Language switcher setup
  let initialLang = 'en';
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user.preferredLanguage) initialLang = user.preferredLanguage;
    } catch (_) {}
  } else {
    const match = document.cookie.match(new RegExp('(^| )guestLanguage=([^;]+)'));
    if (match) initialLang = match[2];
  }
  await i18n.loadLanguage(initialLang);
  languageSwitcher.init();

  // Tab switching inside Dashboard
  const sidebarBtns = document.querySelectorAll('.sidebar-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  sidebarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sidebarBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(t => t.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');

      // Hook up specific tab loads
      if (tabId === 'history-tab') {
        loadLoginHistory();
      } else if (tabId === 'settings-tab') {
        loadNotificationPreferences();
      } else if (tabId === 'feed-tab') {
        loadFeed();
      }
    });
  });

  // Render Authentication State
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

        // Connect WebSocket and fetch details
        socketClient.init();
        loadFeed();
        loadSecurityTimeWindows();
        syncNotificationState(user.id);
        renderUserPlan(user);
        
        // Request Browser Notification Permission
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
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

  // Load Feed
  async function loadFeed() {
    const container = document.getElementById('tweets-feed-container');
    if (!container) return;

    try {
      const res = await apiClient.request('/api/tweets/feed');
      if (res.success) {
        container.innerHTML = '';
        if (res.tweets.length === 0) {
          container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No tweets yet. Establish connection and be the first to broadcast!</p>`;
          return;
        }
        res.tweets.forEach(tweet => {
          renderTweetCard(tweet, container, 'append');
        });
      }
    } catch (e) {
      container.innerHTML = `<p style="color: #ef4444; text-align: center;">Failed to load timeline feed: ${e.message}</p>`;
    }
  }

  // Render individual tweet card
  function renderTweetCard(tweet, container, mode = 'append') {
    const dateStr = new Date(tweet.createdAt).toLocaleString();
    const isAudio = tweet.type === 'audio';

    const card = document.createElement('div');
    card.className = 'tweet-card';
    card.id = `tweet-${tweet.id || tweet._id}`;

    let mediaHtml = '';
    if (isAudio && tweet.audioUrl) {
      mediaHtml = `
        <div class="audio-player-container">
          <span>🔊 Voice Node (${tweet.durationSeconds}s)</span>
          <audio src="${tweet.audioUrl}" controls></audio>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="tweet-header">
        <div class="tweet-author-info">
          <span class="tweet-author-name">${tweet.authorName}</span>
          <span class="tweet-author-handle">@${tweet.authorUsername}</span>
        </div>
        <span class="tweet-time">${dateStr}</span>
      </div>
      <div class="tweet-content">${tweet.content || ''}</div>
      ${mediaHtml}
    `;

    if (mode === 'prepend') {
      container.prepend(card);
    } else {
      container.appendChild(card);
    }
  }

  // Append new tweet to feed in Real-Time (called globally by socketClient)
  window.appendTweetToFeed = (tweet) => {
    const container = document.getElementById('tweets-feed-container');
    const loadingMsg = document.getElementById('feed-loading-msg');
    if (loadingMsg) loadingMsg.remove();
    
    if (container) {
      // Check if it's already rendered
      if (document.getElementById(`tweet-${tweet.id || tweet._id}`)) return;
      renderTweetCard(tweet, container, 'prepend');
    }
  };

  // Load User Notification settings from Server
  async function syncNotificationState(userId) {
    try {
      const res = await apiClient.request('/api/language/notifications');
      if (res.success) {
        localStorage.setItem('notificationSettings', JSON.stringify({
          enabled: res.enabled,
          keywords: res.keywords
        }));
      }
    } catch (_) {}
  }

  // Load Settings preferences
  async function loadNotificationPreferences() {
    try {
      const res = await apiClient.request('/api/language/notifications');
      if (res.success) {
        smartNotificationsToggle.checked = res.enabled;
        subKeywordsInput.value = res.keywords || '';
        phoneSmsInput.value = res.phone || '';
        phoneSmsToggle.checked = res.phoneNotificationEnabled;
      }
    } catch (e) {
      languageSwitcher.showToast('Failed to load settings preferences.');
    }
  }

  // Save Smart notification toggle and keywords list
  async function saveNotificationsSettings() {
    try {
      const enabled = smartNotificationsToggle.checked;
      const keywords = subKeywordsInput.value;

      const res = await apiClient.request('/api/language/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ enabled, keywords })
      });

      if (res.success) {
        localStorage.setItem('notificationSettings', JSON.stringify({
          enabled: res.enabled,
          keywords: res.keywords
        }));
        languageSwitcher.showToast('Notifications preferences saved.');
      }
    } catch (e) {
      alert(e.message || 'Failed to save notifications settings');
    }
  }

  saveKeywordsBtn.addEventListener('click', saveNotificationsSettings);
  smartNotificationsToggle.addEventListener('change', saveNotificationsSettings);

  // Save SMS settings
  savePhoneBtn.addEventListener('click', async () => {
    try {
      const phone = phoneSmsInput.value;
      const phoneNotificationEnabled = phoneSmsToggle.checked;

      const res = await apiClient.request('/api/language/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ phone, phoneNotificationEnabled })
      });

      if (res.success) {
        phoneSmsInput.value = res.phone || '';
        phoneSmsToggle.checked = res.phoneNotificationEnabled;
        languageSwitcher.showToast('SMS verification binding updated.');
      }
    } catch (e) {
      alert(e.message || 'Failed to update SMS settings.');
    }
  });

  // Render Plan Card UI active markers
  function renderUserPlan(user) {
    const plans = ['free', 'bronze', 'silver', 'gold'];
    plans.forEach(p => {
      const card = document.getElementById(`plan-${p}-card`);
      if (card) {
        if (p === user.plan) {
          card.classList.add('current-plan');
          const btn = card.querySelector('.buy-btn');
          if (btn) {
            btn.textContent = 'Current Plan';
            btn.disabled = true;
          }
        } else {
          card.classList.remove('current-plan');
          const btn = card.querySelector('.buy-btn');
          if (btn) {
            btn.textContent = 'Upgrade';
            btn.disabled = false;
          }
        }
      }
    });
  }

  // Load Login History
  async function loadLoginHistory() {
    const container = document.getElementById('login-history-rows-container');
    if (!container) return;

    try {
      const res = await apiClient.request('/api/auth/login-history');
      if (res.success) {
        container.innerHTML = '';
        if (res.history.length === 0) {
          container.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No records found.</td></tr>`;
          return;
        }
        res.history.forEach(log => {
          const row = document.createElement('tr');
          const time = new Date(log.createdAt).toLocaleString();
          let statusBadge = `<span class="badge badge-success">Success</span>`;
          if (log.status === 'otp_pending') {
            statusBadge = `<span class="badge badge-pending">OTP Pending</span>`;
          } else if (log.status === 'failed') {
            statusBadge = `<span class="badge badge-failed">Failed</span>`;
          }

          row.innerHTML = `
            <td>${time}</td>
            <td>${log.ipAddress || '127.0.0.1'}</td>
            <td>${log.browser}</td>
            <td>${log.os}</td>
            <td>${log.deviceType.toUpperCase()}</td>
            <td>${statusBadge}</td>
          `;
          container.appendChild(row);
        });
      }
    } catch (e) {
      container.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444;">Failed to load history: ${e.message}</td></tr>`;
    }
  }

  // Load Time Windows Statuses
  async function loadSecurityTimeWindows() {
    // 1. Audio upload window status
    const audioStatusEl = document.getElementById('audio-window-status');
    const audioBanner = document.getElementById('audio-time-window-banner');
    try {
      const res = await apiClient.request('/api/tweets/upload-window-status');
      if (audioStatusEl && audioBanner) {
        audioStatusEl.textContent = res.isAllowed ? 'Open' : 'Closed';
        if (res.isAllowed) {
          audioBanner.classList.remove('closed');
        } else {
          audioBanner.classList.add('closed');
        }
      }
    } catch (_) {}

    // 2. Payment Window Status
    const paymentStatusEl = document.getElementById('payment-window-status');
    const paymentBanner = document.getElementById('payment-time-window-banner');
    if (paymentStatusEl && paymentBanner) {
      // Calculate locally (10 AM - 11 AM IST)
      const d = new Date();
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      const nd = new Date(utc + (3600000 * 5.5)); 
      const hr = nd.getHours();
      const open = hr === 10;
      paymentStatusEl.textContent = open ? 'Open' : 'Closed';
      if (open) {
        paymentBanner.classList.remove('closed');
      } else {
        paymentBanner.classList.add('closed');
      }
    }
  }

  // Handle purchases (simulated Razorpay flow)
  window.purchaseSubscription = async (planName) => {
    try {
      const res = await apiClient.request('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ planName })
      });

      if (res.success) {
        // Simulated checkout automatically triggers verifying
        if (res.demoMode) {
          languageSwitcher.showToast('Connecting to simulation payment node...');
          
          const verifyRes = await apiClient.request('/api/payments/verify-payment', {
            method: 'POST',
            body: JSON.stringify({
              orderId: res.orderId,
              paymentId: 'pay_demo_' + Math.random().toString(36).substring(3, 10)
            })
          });

          if (verifyRes.success) {
            localStorage.setItem('user', JSON.stringify(verifyRes.user));
            renderUserPlan(verifyRes.user);
            languageSwitcher.showToast(`Upgraded to ${planName.toUpperCase()} plan successfully! Invoice: ${verifyRes.invoiceNumber}`);
            
            // Reload page or re-init dashboard to sync limits
            renderAuthState();
          }
        }
      }
    } catch (e) {
      alert(e.message || 'Payment processing failed. Ensure payments window (10:00 - 11:00 AM IST) is open.');
    }
  };

  // Text tweet input listener (character count warning style)
  if (tweetTextContent) {
    tweetTextContent.addEventListener('input', () => {
      const len = tweetTextContent.value.length;
      textCharCount.textContent = `${len} / 280`;
      
      if (len >= 270) {
        textCharCount.className = 'char-count error';
      } else if (len >= 250) {
        textCharCount.className = 'char-count warning';
      } else {
        textCharCount.className = 'char-count';
      }
    });
  }

  // Submit Text Tweet
  if (textTweetForm) {
    textTweetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const content = tweetTextContent.value.trim();
      
      try {
        const res = await apiClient.request('/api/tweets/text', {
          method: 'POST',
          body: JSON.stringify({ content })
        });

        if (res.success) {
          tweetTextContent.value = '';
          textCharCount.textContent = '0 / 280';
          languageSwitcher.showToast('Text tweet posted successfully!');
        }
      } catch (err) {
        alert(err.message || 'Posting failed.');
      }
    });
  }

  // Request Upload OTP
  sendUploadOtpBtn.addEventListener('click', async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
      sendUploadOtpBtn.disabled = true;
      const res = await apiClient.request('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: user.email })
      });

      if (res.success) {
        uploadOtpInputs.style.display = 'flex';
        languageSwitcher.showToast('Verification code sent.');
        
        // Prefill verification placeholder locally if printed in console for dev convenience
        if (res.otp) {
          uploadOtpVal.placeholder = `Token: ${res.otp}`;
          console.log(`[DEV UPLOAD OTP]: ${res.otp}`);
        }
      }
    } catch (err) {
      sendUploadOtpBtn.disabled = false;
      alert(err.message || 'Failed to send OTP.');
    }
  });

  // Verify Upload OTP
  verifyUploadOtpBtn.addEventListener('click', async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    const otp = uploadOtpVal.value;

    try {
      const res = await apiClient.request('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: user.email, otp })
      });

      if (res.success) {
        uploadOtpToken = res.otpToken;
        
        // Unlock Uploader
        sendUploadOtpBtn.style.display = 'none';
        uploadOtpInputs.style.display = 'none';
        uploadTokenStatus.style.display = 'block';
        
        audioComposerWrapper.style.opacity = '1';
        audioComposerWrapper.style.pointerEvents = 'auto';
        audioPostSubmitBtn.disabled = false;
      }
    } catch (err) {
      alert(err.message || 'OTP verification failed.');
    }
  });

  // Voice recording visualizer helper
  function startRecordingVisualizer(stream) {
    if (audioCtx) {
      audioCtx.close();
    }
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    
    analyser.fftSize = 64;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    isRecording = true;
    drawVoiceWaveform();
  }

  function drawVoiceWaveform() {
    if (!isRecording) return;
    requestAnimationFrame(drawVoiceWaveform);
    
    analyser.getByteFrequencyData(dataArray);
    
    const ctx = voiceCanvas.getContext('2d');
    const width = voiceCanvas.width;
    const height = voiceCanvas.height;
    
    ctx.fillStyle = 'rgba(11, 15, 25, 0.4)';
    ctx.fillRect(0, 0, width, height);
    
    const barWidth = (width / bufferLength) * 1.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2;
      
      const grad = ctx.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, '#8b5cf6');
      grad.addColorStop(1, '#00f0ff');
      
      ctx.fillStyle = grad;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      
      x += barWidth + 2;
    }
  }

  // Voice recording toggle buttons
  recordActionBtn.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        visualizerStream = stream;
        
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          recordingPreviewEl.src = audioUrl;
          
          audioPreviewPlayer.style.display = 'flex';
          recordingTimer.style.display = 'none';
          
          // Stop stream tracks
          visualizerStream.getTracks().forEach(t => t.stop());
          isRecording = false;
        };

        mediaRecorder.start();
        startRecordingVisualizer(stream);

        // Start timer
        secondsRecorded = 0;
        recordingTimer.textContent = '00:00';
        recordingTimer.style.display = 'inline';
        recordActionBtn.textContent = '⏹️';
        recordActionBtn.classList.add('recording');

        recordingInterval = setInterval(() => {
          secondsRecorded++;
          const mins = Math.floor(secondsRecorded / 60).toString().padStart(2, '0');
          const secs = (secondsRecorded % 60).toString().padStart(2, '0');
          recordingTimer.textContent = `${mins}:${secs}`;
          
          if (secondsRecorded >= 300) { // 5 minutes max duration auto stop
            recordActionBtn.click();
          }
        }, 1000);

      } catch (err) {
        alert('Could not access microphone: ' + err.message);
      }
    } else {
      // Stop recording
      clearInterval(recordingInterval);
      mediaRecorder.stop();
      recordActionBtn.textContent = '🎤';
      recordActionBtn.classList.remove('recording');
    }
  });

  // Discard recorded audio
  discardAudioBtn.addEventListener('click', () => {
    audioBlob = null;
    audioFile = null;
    recordingPreviewEl.src = '';
    audioPreviewPlayer.style.display = 'none';
    
    // Clear canvas
    const ctx = voiceCanvas.getContext('2d');
    ctx.clearRect(0, 0, voiceCanvas.width, voiceCanvas.height);
  });

  // Drop zone drag and drop file handling
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|webm)$/i.test(file.name)) {
        audioFile = file;
        audioBlob = null; // discard any recording
        
        const audioUrl = URL.createObjectURL(file);
        recordingPreviewEl.src = audioUrl;
        audioPreviewPlayer.style.display = 'flex';
        languageSwitcher.showToast(`Selected file: ${file.name}`);
      } else {
        alert('Please drop a valid audio file.');
      }
    }
  });

  // Submit/Post Audio Tweet
  if (audioTweetForm) {
    audioTweetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!audioBlob && !audioFile) {
        alert('Please record an audio clip or drop an audio file first.');
        return;
      }

      if (!uploadOtpToken) {
        alert('Verification token required. Verify OTP first.');
        return;
      }

      const caption = document.getElementById('audio-caption-content').value.trim();
      const formData = new FormData();
      
      if (audioBlob) {
        formData.append('audioFile', audioBlob, 'voice-recording.webm');
      } else if (audioFile) {
        formData.append('audioFile', audioFile);
      }

      formData.append('caption', caption);

      try {
        audioPostSubmitBtn.disabled = true;
        audioPostSubmitBtn.textContent = 'Posting node...';

        const res = await apiClient.request('/api/tweets/audio-upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${uploadOtpToken}`
          },
          body: formData
        });

        if (res.success) {
          // Reset
          discardAudioBtn.click();
          document.getElementById('audio-caption-content').value = '';
          
          // Re-lock upload settings
          uploadOtpToken = null;
          sendUploadOtpBtn.style.display = 'inline-block';
          sendUploadOtpBtn.disabled = false;
          uploadTokenStatus.style.display = 'none';
          uploadOtpVal.value = '';
          audioComposerWrapper.style.opacity = '0.5';
          audioComposerWrapper.style.pointerEvents = 'none';
          audioPostSubmitBtn.disabled = true;

          languageSwitcher.showToast('Audio tweet posted successfully!');
        }
      } catch (err) {
        alert(err.message || 'Failed to post audio tweet.');
      } finally {
        audioPostSubmitBtn.textContent = 'Post Audio Tweet';
      }
    });
  }

  // Forgot password modal
  forgotPassLink.addEventListener('click', (e) => {
    e.preventDefault();
    forgotPassModal.style.display = 'flex';
  });

  closeForgotModalBtn.addEventListener('click', () => {
    forgotPassModal.style.display = 'none';
  });

  if (forgotPassForm) {
    forgotPassForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = document.getElementById('forgot-identifier').value.trim();

      try {
        const res = await apiClient.request('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ identifier })
        });

        if (res.success) {
          forgotPassModal.style.display = 'none';
          document.getElementById('forgot-identifier').value = '';
          alert(res.message);
        }
      } catch (err) {
        alert(err.message || 'Failed to request password reset');
      }
    });
  }

  // Toggle Login/Register Forms
  if (tabLoginBtn && tabRegisterBtn) {
    tabLoginBtn.addEventListener('click', () => {
      tabLoginBtn.classList.add('active');
      tabRegisterBtn.classList.remove('active');
      loginForm.style.display = 'flex';
      regForm.style.display = 'none';
      otpForm.style.display = 'none';

      window.activeTheme = 'login';
      if (window.updateAmbientGlow) window.updateAmbientGlow();
    });

    tabRegisterBtn.addEventListener('click', () => {
      tabRegisterBtn.classList.add('active');
      tabLoginBtn.classList.remove('active');
      loginForm.style.display = 'none';
      regForm.style.display = 'flex';
      otpForm.style.display = 'none';

      window.activeTheme = 'register';
      if (window.updateAmbientGlow) window.updateAmbientGlow();
    });
  }

  // Toggle Password Text Views
  document.getElementById('toggle-login-password').addEventListener('click', () => {
    const el = document.getElementById('login-password');
    const isPass = el.type === 'password';
    el.type = isPass ? 'text' : 'password';
    document.getElementById('toggle-login-password').textContent = isPass ? 'Hide' : 'Show';
  });

  document.getElementById('toggle-reg-password').addEventListener('click', () => {
    const el = document.getElementById('reg-password');
    const isPass = el.type === 'password';
    el.type = isPass ? 'text' : 'password';
    document.getElementById('toggle-reg-password').textContent = isPass ? 'Hide' : 'Show';
  });

  // Login submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;

      try {
        const res = await apiClient.request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });

        if (res.success) {
          if (res.otpRequired) {
            // Chrome users require OTP
            loginForm.style.display = 'none';
            tabBox.style.display = 'none';
            otpForm.style.display = 'flex';
            otpForm.dataset.userId = res.userId;
            
            window.activeTheme = 'otp';
            if (window.updateAmbientGlow) window.updateAmbientGlow();

            if (res.otp) {
              document.getElementById('otp-value').placeholder = `Token: ${res.otp}`;
              console.log(`[DEV CHROME OTP]: ${res.otp}`);
            }
          } else {
            apiClient.setToken(res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            renderAuthState();
          }
        }
      } catch (err) {
        alert(err.message || 'Login failed.');
      }
    });
  }

  // Cancel login OTP
  document.getElementById('cancel-otp-btn').addEventListener('click', (e) => {
    e.preventDefault();
    otpForm.style.display = 'none';
    loginForm.style.display = 'flex';
    tabBox.style.display = 'grid';
    document.getElementById('otp-value').value = '';

    window.activeTheme = 'login';
    if (window.updateAmbientGlow) window.updateAmbientGlow();
  });

  // Verify Login OTP
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
          
          otpForm.style.display = 'none';
          tabBox.style.display = 'grid';
          document.getElementById('otp-value').value = '';

          renderAuthState();
        }
      } catch (err) {
        alert(err.message || 'OTP verification failed.');
      }
    });
  }

  // Registration submission
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const username = document.getElementById('reg-username').value;
      const email = document.getElementById('reg-email').value;
      const phone = document.getElementById('reg-phone').value;
      const password = document.getElementById('reg-password').value;

      try {
        const res = await apiClient.request('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, username, email, phone, password })
        });

        if (res.success) {
          apiClient.setToken(res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          renderAuthState();
        }
      } catch (err) {
        alert(err.message || 'Registration failed.');
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      apiClient.setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('notificationSettings');
      
      // Reset forms
      document.getElementById('login-password').value = '';
      if (document.getElementById('reg-password')) document.getElementById('reg-password').value = '';

      // Close sockets if active
      if (socketClient.socket) {
        socketClient.socket.close();
      }

      renderAuthState();
    });
  }

  // Run initial state load
  renderAuthState();
});
