const languageSwitcher = {
  element: null,

  init() {
    this.element = document.getElementById('language-switcher');
    this.element.addEventListener('change', (e) => this.onLanguageSelect(e.target.value));
  },

  async onLanguageSelect(langCode) {
    const previousLanguage = i18n.currentLanguage;

    // If not authenticated, just change directly
    if (!apiClient.token) {
      try {
        await apiClient.request('/api/language/guest-set', {
          method: 'POST',
          body: JSON.stringify({ language: langCode })
        });
        await i18n.loadLanguage(langCode);
        this.showToast(i18n.t('language_change_success'));
      } catch (e) {
        console.error('Failed to set guest language', e);
        // Revert select and show error
        this.element.value = previousLanguage;
        this.showToast(e.message || 'Failed to change language. Please try again.');
      }
      return;
    }

    // Authenticated user: trigger OTP flow
    try {
      const res = await apiClient.request('/api/language/request-change', {
        method: 'POST',
        body: JSON.stringify({ targetLanguage: langCode })
      });

      if (res.success) {
        await otpModal.show(res.channel, res.maskedDestination, res.expiresInSeconds, res.otpRequestId);
        // OTP verified successfully — load the new language
        await i18n.loadLanguage(langCode);
        // Persist new preferred language in localStorage so it survives page reload
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            user.preferredLanguage = langCode;
            localStorage.setItem('user', JSON.stringify(user));
          } catch (_) { }
        }
        this.showToast(i18n.t('language_change_success'));
      }
    } catch (err) {
      console.error(err);
      // Revert select dropdown
      this.element.value = previousLanguage;
      if (err.message !== 'User cancelled') {
        alert(err.message || 'Failed to request language change');
      }
    }
  },

  showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease-out reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};
