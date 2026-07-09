const apiClient = {
  token: null, // JWT token

  async init() {
    // Load persisted token
    this.token = localStorage.getItem('token');
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
    const headers = { ...options.headers };

    // Do not set Content-Type if we are sending FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
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
