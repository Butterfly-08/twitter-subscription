const socketClient = {
  socket: null,
  seenTweets: new Set(),
  heartbeatInterval: null,

  init() {
    if (this.socket) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}`;
    
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('[WebSocket] Connected to core routing node');
      this.heartbeatInterval = setInterval(() => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'new_tweet') {
          this.handleNewTweet(message.data);
        }
      } catch (err) {
        console.error('[WebSocket] Message processing error:', err);
      }
    };

    this.socket.onclose = () => {
      console.log('[WebSocket] Connection closed. Retrying in 5 seconds...');
      clearInterval(this.heartbeatInterval);
      this.socket = null;
      setTimeout(() => this.init(), 5000);
    };
  },

  handleNewTweet(tweet) {
    if (this.seenTweets.has(tweet.id)) return;
    this.seenTweets.add(tweet.id);

    // 1. Add to active feed
    if (window.appendTweetToFeed) {
      window.appendTweetToFeed(tweet);
    }

    // 2. Alert notifications if keywords match
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    try {
      const user = JSON.parse(userStr);
      // Skip alerts for user's own tweets
      if (tweet.userId === user.id) return;

      const settingsStr = localStorage.getItem('notificationSettings');
      if (!settingsStr) return;
      
      const settings = JSON.parse(settingsStr);
      if (!settings.enabled) return;

      const keywords = settings.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      const textToSearch = `${tweet.content || ''}`.toLowerCase();

      const match = keywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(textToSearch));

      if (match) {
        this.triggerNotification(tweet);
      }
    } catch (e) {
      console.error('[WebSocket] Failed checking notification preferences:', e);
    }
  },

  triggerNotification(tweet) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = `New alert from @${tweet.authorUsername}`;
      const n = new Notification(title, {
        body: tweet.content || (tweet.type === 'audio' ? '🔊 Posted an Audio Tweet' : ''),
        tag: `tweet-${tweet.id}`
      });

      n.onclick = () => {
        window.focus();
        const el = document.getElementById(`tweet-${tweet.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.boxShadow = '0 0 25px #00f0ff';
          setTimeout(() => { el.style.boxShadow = ''; }, 2000);
        }
        n.close();
      };
      
      setTimeout(() => n.close(), 6000);
    } else {
      this.showFallbackToast(tweet);
    }
  },

  showFallbackToast(tweet) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast notification-toast';
    toast.style.cursor = 'pointer';
    toast.innerHTML = `
      <div style="font-weight: bold; color: #fbbf24; margin-bottom: 3px;">🔔 Keyword Match Alert</div>
      <div style="font-size: 0.85rem; color: #a855f7; margin-bottom: 5px;">@${tweet.authorUsername}</div>
      <div style="font-size: 0.9rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${tweet.content || (tweet.type === 'audio' ? '🔊 Audio Tweet' : '')}
      </div>
    `;

    toast.addEventListener('click', () => {
      const el = document.getElementById(`tweet-${tweet.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.boxShadow = '0 0 25px #00f0ff';
        setTimeout(() => { el.style.boxShadow = ''; }, 2000);
      }
      toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease-out reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 6000);
  }
};
