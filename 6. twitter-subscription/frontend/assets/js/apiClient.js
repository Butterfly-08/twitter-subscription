const apiClient = {
  csrfToken: null,
  token: null, // JWT token

  async init() {
    // Load persisted token
    this.token = localStorage.getItem('token');

    // Attempt to fetch CSRF token
    try {
      const res = await fetch('/api/auth/csrf-token', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        this.csrfToken = data.csrfToken;
      }
    } catch (e) {
      console.warn('Could not fetch CSRF token', e);
    }
  },

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.csrfToken && options.method && options.method !== 'GET') {
      headers['CSRF-Token'] = this.csrfToken;
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw { status: response.status, ...data };
    }

    return data;
  }
};
