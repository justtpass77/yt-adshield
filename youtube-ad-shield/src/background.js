/**
 * AdShield for YouTube - Background Service Worker
 * Manages configuration storage, telemetry aggregation, and action badges.
 */

const DEFAULT_SETTINGS = {
  enabled: true,
  fastSkipAds: true,
  muteAds: true,
  blockBanners: true,
  bypassAntiAdblock: true,
  stats: {
    adsBlocked: 0,
    timeSavedSeconds: 0
  }
};

// Initialize settings on install
chrome.runtime.onInstalled.addListener(async (details) => {
  const current = await chrome.storage.local.get(null);
  const initialized = { ...DEFAULT_SETTINGS, ...current };
  if (!current.stats) {
    initialized.stats = DEFAULT_SETTINGS.stats;
  }
  await chrome.storage.local.set(initialized);
  console.log('[AdShield] Initialized with settings:', initialized);
  updateBadge(initialized.stats.adsBlocked);
});

// Update extension icon badge
function updateBadge(count) {
  if (count > 0) {
    const text = count > 999 ? `${(count / 1000).toFixed(1)}k` : String(count);
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#FF1E27' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AD_BLOCKED') {
    handleAdBlocked(message.duration || 15, sender.tab?.id);
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    chrome.storage.local.get(null).then((settings) => {
      sendResponse(settings);
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'RESET_STATS') {
    chrome.storage.local.set({
      stats: { adsBlocked: 0, timeSavedSeconds: 0 }
    }).then(() => {
      updateBadge(0);
      sendResponse({ success: true });
    });
    return true;
  }
});

async function handleAdBlocked(adDurationSeconds, tabId) {
  const data = await chrome.storage.local.get(['stats']);
  const stats = data.stats || { adsBlocked: 0, timeSavedSeconds: 0 };
  stats.adsBlocked += 1;
  stats.timeSavedSeconds += Math.round(adDurationSeconds);

  await chrome.storage.local.set({ stats });
  updateBadge(stats.adsBlocked);
}
