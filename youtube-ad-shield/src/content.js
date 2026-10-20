/**
 * AdShield for YouTube - Content Script
 * High-performance, undetectable video ad speedup, instant skip,
 * cosmetic banner cleanup, and anti-adblock modal bypass engine.
 */

(function () {
  'use strict';

  // Configuration state (synced with storage)
  let config = {
    enabled: true,
    fastSkipAds: true,
    muteAds: true,
    blockBanners: true,
    bypassAntiAdblock: true
  };

  // State tracker for active ad handling
  let isHandlingAd = false;
  let userPlaybackRate = 1.0;
  let userMutedState = false;
  let lastAdSkipTimestamp = 0;

  // Initialize configuration from background/storage
  chrome.storage.local.get(['enabled', 'fastSkipAds', 'muteAds', 'blockBanners', 'bypassAntiAdblock'], (items) => {
    config = { ...config, ...items };
    if (config.enabled) {
      initAdShield();
    }
  });

  // Listen for configuration updates from popup
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      for (const [key, change] of Object.entries(changes)) {
        if (key in config) {
          config[key] = change.newValue;
        }
      }
    }
  });

  /**
   * Main entry point
   */
  function initAdShield() {
    console.log('[AdShield] Engine activated. Monitoring for ads and enforcement modals.');
    
    // 1. Observe DOM mutations for dynamic player & popup creation
    observeDOM();

    // 2. High-precision ticker for instantaneous ad detection (every 100ms)
    setInterval(tickAdShield, 100);

    // 3. Listen to YouTube SPA navigation events
    window.addEventListener('yt-navigate-finish', onNavigationChange);
    window.addEventListener('spfdone', onNavigationChange);
  }

  function onNavigationChange() {
    isHandlingAd = false;
    bypassAntiAdblockDialogs();
  }

  /**
   * Main evaluation loop executed on high-frequency interval
   */
  function tickAdShield() {
    if (!config.enabled) return;

    if (config.fastSkipAds) {
      processInstreamVideoAds();
    }

    if (config.bypassAntiAdblock) {
      bypassAntiAdblockDialogs();
    }
  }

  /**
   * Instream Video Ads Processing Engine
   * Detects active ads, fast-forwards at 16x speed, mutes, and triggers skip button.
   */
  function processInstreamVideoAds() {
    const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
    const video = document.querySelector('video.html5-main-video') || document.querySelector('video');

    if (!player || !video) return;

    // Detect if YouTube is currently displaying an ad
    const isAdShowing = player.classList.contains('ad-showing') ||
                        player.classList.contains('ad-interrupting') ||
                        Boolean(document.querySelector('.ytp-ad-player-overlay')) ||
                        Boolean(document.querySelector('.ytp-ad-text'));

    if (isAdShowing) {
      if (!isHandlingAd) {
        // First frame of ad detection
        isHandlingAd = true;
        // Save user's playback speed (if reasonable value)
        if (video.playbackRate <= 4.0 && video.playbackRate > 0) {
          userPlaybackRate = video.playbackRate;
        }
        userMutedState = video.muted;
      }

      // 1. Instantly mute audio if configured
      if (config.muteAds && !video.muted) {
        video.muted = true;
      }

      // 2. Accelerate ad to maximum supported playback speed
      try {
        if (video.playbackRate !== 16.0) {
          video.playbackRate = 16.0;
        }
      } catch (err) {
        // Fallback for browsers that cap at 8x or 4x
        video.playbackRate = 8.0;
      }

      // 3. Fast-forward video to the end if duration is valid and finite
      if (Number.isFinite(video.duration) && video.duration > 0) {
        if (video.currentTime < video.duration) {
          video.currentTime = video.duration;
        }
      }

      // 4. Trigger Skip Ad buttons
      clickSkipButtons();

      // 5. Unpause if paused during ad
      if (video.paused && !video.ended) {
        video.play().catch(() => {});
      }

    } else if (isHandlingAd) {
      // Ad has completed or was skipped!
      isHandlingAd = false;
      const now = Date.now();

      // Restore user's normal playback rate
      if (video.playbackRate > 4.0) {
        video.playbackRate = userPlaybackRate || 1.0;
      }

      // Restore original mute state
      if (config.muteAds) {
        video.muted = userMutedState;
      }

      // Avoid double-counting within 1 second
      if (now - lastAdSkipTimestamp > 1000) {
        lastAdSkipTimestamp = now;
        notifyAdBlocked(15); // Average YouTube ad duration
      }
    }
  }

  /**
   * Trigger any visible YouTube ad skip/dismiss button
   */
  function clickSkipButtons() {
    const skipSelectors = [
      '.ytp-skip-ad-button',
      '.ytp-ad-skip-button-modern',
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-slot button',
      'button.ytp-ad-skip-button-modern',
      '.ytp-ad-overlay-close-button',
      '.ytp-ad-survey-skip-button',
      'button[id^="skip-button"]',
      'button[aria-label*="Skip ad" i]',
      'button[aria-label*="Skip ads" i]',
      '.ytp-ad-preview-container .ytp-ad-skip-button-container'
    ];

    for (const selector of skipSelectors) {
      const btn = document.querySelector(selector);
      if (btn && typeof btn.click === 'function') {
        btn.click();
        break;
      }
    }
  }

  /**
   * Anti-Adblock Enforcement Modal Defeater
   * Detects YouTube's "Ad blockers violate YouTube's Terms of Service" popup,
   * completely unmounts it, removes backdrops, and resumes playback.
   */
  function bypassAntiAdblockDialogs() {
    const enforcementModal = document.querySelector('ytd-enforcement-message-view-model');
    if (enforcementModal) {
      console.warn('[AdShield] Anti-adblock modal detected. Dismissing & unlocking player.');

      // Find parent paper-dialog or popup container
      const dialog = enforcementModal.closest('tp-yt-paper-dialog') || enforcementModal.parentElement;
      if (dialog) {
        dialog.remove();
      } else {
        enforcementModal.remove();
      }

      // Remove backdrops
      document.querySelectorAll('tp-yt-iron-overlay-backdrop').forEach((backdrop) => {
        backdrop.remove();
      });

      // Unlock body scroll and interaction
      document.body.classList.add('adshield-unlocked');
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';

      // Resume video playback
      const video = document.querySelector('video.html5-main-video') || document.querySelector('video');
      if (video && video.paused) {
        video.play().catch(() => {});
      }
    }
  }

  /**
   * Send notification to background script for statistics tracking
   */
  function notifyAdBlocked(estimatedDuration) {
    chrome.runtime.sendMessage({
      type: 'AD_BLOCKED',
      duration: estimatedDuration
    }).catch(() => {
      // Background worker might be sleeping; safe to ignore
    });
  }

  /**
   * Efficient MutationObserver for DOM alterations
   */
  function observeDOM() {
    const observer = new MutationObserver((mutations) => {
      if (!config.enabled) return;

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check for anti-adblock modal insertion
          if (config.bypassAntiAdblock) {
            bypassAntiAdblockDialogs();
          }
          // Quick skip button check on DOM additions
          if (config.fastSkipAds) {
            clickSkipButtons();
          }
        }
      }
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true
    });
  }

})();
