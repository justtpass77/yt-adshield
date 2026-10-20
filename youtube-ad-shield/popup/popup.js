/**
 * AdShield for YouTube - Popup Controller
 * Manages configuration toggles and live statistic views.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const toggleEnabled = document.getElementById('toggleEnabled');
  const toggleFastSkip = document.getElementById('toggleFastSkip');
  const toggleMute = document.getElementById('toggleMute');
  const toggleBanners = document.getElementById('toggleBanners');
  const toggleAntiAdblock = document.getElementById('toggleAntiAdblock');
  const statusBadge = document.getElementById('statusBadge');
  const masterStatusText = document.getElementById('masterStatusText');
  const adsBlockedCount = document.getElementById('adsBlockedCount');
  const timeSavedCount = document.getElementById('timeSavedCount');
  const btnResetStats = document.getElementById('btnResetStats');

  // Load current configuration
  const data = await chrome.storage.local.get([
    'enabled',
    'fastSkipAds',
    'muteAds',
    'blockBanners',
    'bypassAntiAdblock',
    'stats'
  ]);

  const enabled = data.enabled !== false;
  toggleEnabled.checked = enabled;
  toggleFastSkip.checked = data.fastSkipAds !== false;
  toggleMute.checked = data.muteAds !== false;
  toggleBanners.checked = data.blockBanners !== false;
  toggleAntiAdblock.checked = data.bypassAntiAdblock !== false;

  updateStatusUI(enabled);
  renderStats(data.stats);

  // Toggle handlers
  toggleEnabled.addEventListener('change', () => {
    const val = toggleEnabled.checked;
    chrome.storage.local.set({ enabled: val });
    updateStatusUI(val);
  });

  toggleFastSkip.addEventListener('change', () => {
    chrome.storage.local.set({ fastSkipAds: toggleFastSkip.checked });
  });

  toggleMute.addEventListener('change', () => {
    chrome.storage.local.set({ muteAds: toggleMute.checked });
  });

  toggleBanners.addEventListener('change', () => {
    chrome.storage.local.set({ blockBanners: toggleBanners.checked });
  });

  toggleAntiAdblock.addEventListener('change', () => {
    chrome.storage.local.set({ bypassAntiAdblock: toggleAntiAdblock.checked });
  });

  // Reset Stats button
  btnResetStats.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset your blocked stats?')) {
      chrome.runtime.sendMessage({ type: 'RESET_STATS' }, () => {
        renderStats({ adsBlocked: 0, timeSavedSeconds: 0 });
      });
    }
  });

  // Listen for storage changes in case background updates stats while popup is open
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.stats) {
      renderStats(changes.stats.newValue);
    }
  });

  function updateStatusUI(isActive) {
    if (isActive) {
      statusBadge.textContent = 'Protected';
      statusBadge.className = 'status-indicator active';
      masterStatusText.textContent = 'Active and blocking ads';
    } else {
      statusBadge.textContent = 'Disabled';
      statusBadge.className = 'status-indicator disabled';
      masterStatusText.textContent = 'Ad protection paused';
    }
  }

  function renderStats(stats) {
    const blocked = stats?.adsBlocked || 0;
    const seconds = stats?.timeSavedSeconds || 0;

    adsBlockedCount.textContent = blocked.toLocaleString();

    if (seconds < 60) {
      timeSavedCount.textContent = `${seconds}s`;
    } else if (seconds < 3600) {
      timeSavedCount.textContent = `${Math.floor(seconds / 60)}m`;
    } else {
      timeSavedCount.textContent = `${(seconds / 3600).toFixed(1)}h`;
    }
  }
});
