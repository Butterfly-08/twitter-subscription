document.addEventListener('DOMContentLoaded', async () => {
  if (!isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  const user = getUser();
  const toggle = document.getElementById('notification-toggle');
  const statusText = document.getElementById('status-text');
  const statusDot = document.getElementById('status-dot');
  const helpLink = document.getElementById('help-link');
  const savedConfirm = document.getElementById('saved-confirm');

  // Load current preference
  const phoneToggle = document.getElementById('phone-notification-toggle');
  const phoneInput = document.getElementById('profile-phone');
  const savePhoneBtn = document.getElementById('save-phone-btn');
  const phoneSavedConfirm = document.getElementById('phone-saved-confirm');

  let currentPref = false;
  try {
    const data = await apiCall(`/users/${user.id}/notification-preference`);
    currentPref = data.enabled;
    toggle.checked = currentPref;
    toggle.setAttribute('aria-checked', currentPref.toString());
    renderStatus();

    if (phoneInput && data.phone !== undefined) {
      phoneInput.value = data.phone || '';
    }
    if (phoneToggle && data.phoneNotificationEnabled !== undefined) {
      phoneToggle.checked = data.phoneNotificationEnabled;
      phoneToggle.setAttribute('aria-checked', data.phoneNotificationEnabled.toString());
    }
  } catch (err) {
    console.error('Failed to load preference', err);
    statusText.textContent = 'Error loading status';
  }

  function renderStatus() {
    helpLink.style.display = 'none';
    
    if (!currentPref) {
      statusText.textContent = 'Disabled';
      statusDot.className = 'status-dot'; // grey
    } else {
      const perm = ('Notification' in window) ? Notification.permission : 'denied';
      if (perm === 'granted') {
        statusText.textContent = 'Enabled — browser permission granted';
        statusDot.className = 'status-dot active'; // green pulsing
      } else if (perm === 'default') {
        statusText.textContent = 'Enabled — waiting for browser permission';
        statusDot.className = 'status-dot blocked'; // amber
      } else {
        statusText.textContent = 'Enabled — blocked by browser';
        statusDot.className = 'status-dot blocked'; // amber
        helpLink.style.display = 'inline-block';
      }
    }
  }

  async function updatePreference(enabled) {
    try {
      if (enabled && 'Notification' in window && Notification.permission === 'default') {
        // Request immediately if toggled ON and unasked
        await Notification.requestPermission();
        // State might have changed, re-render
      }

      await apiCall(`/users/${user.id}/notification-preference`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled })
      });
      
      currentPref = enabled;
      
      // Update global preference for current session if available
      if (window.updateLocalNotificationPref) {
        window.updateLocalNotificationPref(enabled);
      }

      renderStatus();

      // Show Saved ✓
      savedConfirm.classList.add('show');
      setTimeout(() => {
        savedConfirm.classList.remove('show');
      }, 1500);

    } catch (err) {
      console.error(err);
      // Revert UI on failure
      toggle.checked = !enabled;
      toggle.setAttribute('aria-checked', (!enabled).toString());
      alert('Failed to update preference: ' + err.message);
    }
  }

  toggle.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    e.target.setAttribute('aria-checked', isChecked.toString());
    updatePreference(isChecked);
  });

  if (savePhoneBtn) {
    savePhoneBtn.addEventListener('click', async () => {
      try {
        const phoneVal = phoneInput.value;
        const phoneNotifChecked = phoneToggle.checked;
        
        await apiCall(`/users/${user.id}/notification-preference`, {
          method: 'PATCH',
          body: JSON.stringify({ 
            phone: phoneVal || '',
            phoneNotificationEnabled: phoneNotifChecked 
          })
        });
        
        // Show Saved ✓
        if (phoneSavedConfirm) {
          phoneSavedConfirm.classList.add('show');
          setTimeout(() => {
            phoneSavedConfirm.classList.remove('show');
          }, 1500);
        }
      } catch (err) {
        alert('Failed to update phone settings: ' + err.message);
      }
    });
  }

  if (phoneToggle) {
    phoneToggle.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      e.target.setAttribute('aria-checked', isChecked.toString());
      
      apiCall(`/users/${user.id}/notification-preference`, {
        method: 'PATCH',
        body: JSON.stringify({ phoneNotificationEnabled: isChecked })
      }).then(() => {
        if (phoneSavedConfirm) {
          phoneSavedConfirm.classList.add('show');
          setTimeout(() => {
            phoneSavedConfirm.classList.remove('show');
          }, 1500);
        }
      }).catch(err => {
        phoneToggle.checked = !isChecked;
        phoneToggle.setAttribute('aria-checked', (!isChecked).toString());
        alert('Failed to update phone notification: ' + err.message);
      });
    });
  }
});
