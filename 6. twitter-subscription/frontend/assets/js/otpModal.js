const otpModal = {
  container: null,
  requestId: null,
  timerInterval: null,
  expiresInSeconds: 0,
  resolvePromise: null,
  rejectPromise: null,

  init() {
    this.container = document.getElementById('otp-modal-container');
  },

  show(channel, maskedDestination, expiresInSeconds, requestId) {
    this.requestId = requestId;
    this.expiresInSeconds = expiresInSeconds;
    
    return new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;
      
      this.render(channel, maskedDestination);
      this.startTimer();
      this.setupListeners();
    });
  },

  render(channel, maskedDestination) {
    const instructionKey = channel === 'email' ? 'otp_modal_email_instruction' : 'otp_modal_sms_instruction';
    const instructionText = i18n.t(instructionKey, { 
      maskedEmail: maskedDestination, 
      maskedMobile: maskedDestination 
    });

    this.container.innerHTML = `
      <div class="modal-overlay" role="dialog" aria-modal="true">
        <div class="modal-content">
          <h2 data-i18n="otp_modal_title">${i18n.t('otp_modal_title')}</h2>
          <p>${instructionText}</p>
          <div class="otp-inputs">
            <input type="text" maxlength="1" id="otp-1" autofocus>
            <input type="text" maxlength="1" id="otp-2">
            <input type="text" maxlength="1" id="otp-3">
            <input type="text" maxlength="1" id="otp-4">
            <input type="text" maxlength="1" id="otp-5">
            <input type="text" maxlength="1" id="otp-6">
          </div>
          <div id="otp-error"></div>
          <p>Time remaining: <span id="otp-timer"></span></p>
          <div class="modal-actions">
            <button id="verify-btn" data-i18n="otp_verify_button">${i18n.t('otp_verify_button')}</button>
            <button id="resend-btn" data-i18n="otp_resend_label" disabled>${i18n.t('otp_resend_label')}</button>
            <button id="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `;
  },

  setupListeners() {
    const inputs = this.container.querySelectorAll('.otp-inputs input');
    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
          inputs[index - 1].focus();
        }
      });
      // Paste support
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const chars = paste.replace(/[^0-9]/g, '').split('');
        inputs.forEach((inp, i) => {
          if (chars[i]) inp.value = chars[i];
        });
        if (chars.length > 0) {
          const focusIndex = Math.min(chars.length, inputs.length) - 1;
          inputs[focusIndex].focus();
        }
      });
    });

    this.container.querySelector('#verify-btn').addEventListener('click', () => this.handleVerify());
    this.container.querySelector('#cancel-btn').addEventListener('click', () => this.handleCancel());
    this.container.querySelector('#resend-btn').addEventListener('click', () => this.handleResend());
  },

  startTimer() {
    this.updateTimerDisplay();
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.expiresInSeconds--;
      this.updateTimerDisplay();
      if (this.expiresInSeconds <= 0) {
        clearInterval(this.timerInterval);
        this.showError(i18n.t('otp_error_expired'));
        this.container.querySelector('#verify-btn').disabled = true;
      }
      
      // Enable resend button after 30 seconds cooldown
      if (this.expiresInSeconds === (300 - 30)) { // Assuming 300 is max
        this.container.querySelector('#resend-btn').disabled = false;
      }
    }, 1000);
  },

  updateTimerDisplay() {
    const min = Math.floor(this.expiresInSeconds / 60);
    const sec = this.expiresInSeconds % 60;
    const display = this.container.querySelector('#otp-timer');
    if (display) {
      display.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
    }
  },

  getOtpValue() {
    const inputs = this.container.querySelectorAll('.otp-inputs input');
    return Array.from(inputs).map(i => i.value).join('');
  },

  showError(msg) {
    const errorEl = this.container.querySelector('#otp-error');
    if (errorEl) errorEl.textContent = msg;
  },

  async handleVerify() {
    const otp = this.getOtpValue();
    if (otp.length < 6) {
      this.showError('Please enter 6 digits');
      return;
    }

    try {
      this.container.querySelector('#verify-btn').disabled = true;
      const res = await apiClient.request('/api/language/verify-change', {
        method: 'POST',
        body: JSON.stringify({ otpRequestId: this.requestId, otp })
      });

      if (res.success) {
        this.close();
        this.resolvePromise(res);
      }
    } catch (err) {
      this.container.querySelector('#verify-btn').disabled = false;
      if (err.code === 'OTP_001') {
        this.showError(i18n.t('otp_error_invalid', { attemptsRemaining: err.attemptsRemaining }));
      } else {
        this.showError(err.message || 'Verification failed');
      }
    }
  },

  async handleResend() {
    try {
      const btn = this.container.querySelector('#resend-btn');
      btn.disabled = true;
      const res = await apiClient.request('/api/language/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ otpRequestId: this.requestId })
      });

      if (res.success) {
        this.expiresInSeconds = res.expiresInSeconds;
        this.startTimer();
        this.showError(''); // clear error
      }
    } catch (err) {
      this.showError(err.message || 'Failed to resend');
    }
  },

  handleCancel() {
    this.close();
    this.rejectPromise(new Error('User cancelled'));
  },

  close() {
    clearInterval(this.timerInterval);
    this.container.innerHTML = '';
  }
};
