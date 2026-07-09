const API_BASE = 'http://localhost:5000/api';

// Utility for making API requests with auto auth token injection
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
}

// Authentication state management
function isAuthenticated() {
  return !!localStorage.getItem('token');
}

function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

function loginUser(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  window.location.reload();
}

function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.reload();
}

// Setup common UI logic (Auth guard)
document.addEventListener('DOMContentLoaded', () => {
  const authSection = document.getElementById('auth-section');
  const appSection = document.getElementById('app-section');
  const logoutBtn = document.getElementById('logout-btn');
  const profileLink = document.getElementById('profile-link');
  const homeLink = document.getElementById('home-link');
  const currentUsername = document.getElementById('current-username');
  
  if (isAuthenticated()) {
    if (authSection) authSection.style.display = 'none';
    if (appSection) appSection.style.display = 'block';
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
      });
    }
    if (profileLink) profileLink.style.display = 'inline-block';
    if (homeLink) homeLink.style.display = 'inline-block';
    if (currentUsername) currentUsername.textContent = `@${getUser().username}`;
  } else {
    if (authSection) authSection.style.display = 'block';
    if (appSection) appSection.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (profileLink) profileLink.style.display = 'none';
    if (homeLink) homeLink.style.display = 'none';
  }
});
