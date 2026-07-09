const i18n = {
  currentLanguage: 'en',
  translations: {},

  async loadLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      this.applyTranslations();
      document.documentElement.lang = lang;
      const switcher = document.getElementById('language-switcher');
      if (switcher) switcher.value = lang;
      return;
    }

    try {
      const response = await fetch(`/${lang}.json`);
      if (!response.ok) throw new Error('Failed to load translations');
      const data = await response.json();
      this.translations[lang] = data;
      this.currentLanguage = lang;
      this.applyTranslations();
      document.documentElement.lang = lang;
      const switcher = document.getElementById('language-switcher');
      if (switcher) switcher.value = lang;
    } catch (error) {
      console.error('Error loading language bundle:', error);
    }
  },

  t(key, interpolationParams = {}) {
    let str = this.translations[this.currentLanguage]?.[key] 
           || this.translations['en']?.[key] 
           || key;

    for (const [paramKey, paramValue] of Object.entries(interpolationParams)) {
      str = str.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramValue);
    }
    return str;
  },

  applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = this.t(key);
      
      if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
        el.placeholder = translated;
      } else {
        el.textContent = translated;
      }
    });
  }
};
