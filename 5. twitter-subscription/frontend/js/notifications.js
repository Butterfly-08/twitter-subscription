// Global Notification Logic (runs on all authenticated pages)

let notifyPreference = null;
let seenTweetIds = new Set();
let lastPollTimestamp = Date.now() - (60 * 1000); // look back 1 min initially to catch very recent
let pollIntervalId = null;

// Expose a way for profile.js to update the local state without needing a re-fetch
window.updateLocalNotificationPref = (enabled) => {
  notifyPreference = enabled;
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!isAuthenticated()) return;

  const user = getUser();
  
  // Create fallback toast element
  const toast = document.createElement('div');
  toast.className = 'fallback-toast';
  toast.innerHTML = `
    <div class="toast-title"></div>
    <div class="toast-body"></div>
    <div class="toast-progress"></div>
  `;
  document.body.appendChild(toast);
  window._fallbackToastEl = toast;

  toast.addEventListener('click', () => {
    toast.classList.remove('show');
    if (toast.dataset.tweetId) {
      window.location.hash = `#tweet-${toast.dataset.tweetId}`;
    }
  });

  // Fetch initial preference
  try {
    const data = await apiCall(`/users/${user.id}/notification-preference`);
    notifyPreference = data.enabled;
  } catch (err) {
    console.error('Notification logic: Failed to fetch preference', err);
    return; // abort if we can't get preference
  }

  // Start polling
  pollIntervalId = setInterval(pollForNewTweets, 10000);
});

async function pollForNewTweets() {
  if (notifyPreference !== true) {
    // If preference is off, backend won't send them anyway, but skip the call to save bandwidth
    lastPollTimestamp = Date.now();
    return;
  }

  try {
    const data = await apiCall(`/tweets/notifiable-since?since=${lastPollTimestamp}`);
    lastPollTimestamp = Date.now();

    if (data.tweets && data.tweets.length > 0) {
      // Small delay just to avoid overlapping if multiple arrive instantly
      data.tweets.forEach((tweet, idx) => {
        setTimeout(() => maybeNotify(tweet), idx * 500);
      });
    }
  } catch (err) {
    console.error('Polling error', err);
  }
}

function maybeNotify(tweet) {
  if (seenTweetIds.has(tweet.id)) return;
  
  // Double-check preference immediately before firing
  if (notifyPreference !== true) return;
  
  seenTweetIds.add(tweet.id);

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    showFallbackToast(tweet);
    return;
  }

  const n = new Notification(`New tweet from @${tweet.author}`, {
    body: tweet.content,
    tag: `tweet-${tweet.id}`,
    // icon: '/assets/logo-192.png' // Would add real icon in production
  });

  n.onclick = () => {
    window.focus();
    window.location.href = `index.html#tweet-${tweet.id}`;
    n.close();
  };

  setTimeout(() => n.close(), 8000);
}

function showFallbackToast(tweet) {
  const toast = window._fallbackToastEl;
  if (!toast) return;

  toast.dataset.tweetId = tweet.id;
  toast.querySelector('.toast-title').textContent = `New tweet from @${tweet.author}`;
  // Safe insertion
  toast.querySelector('.toast-body').textContent = tweet.content;
  
  toast.classList.add('show');
  
  // Auto dismiss
  setTimeout(() => {
    toast.classList.remove('show');
  }, 6000);
}
