/**
 * Compass module - handles device orientation and heading calculation.
 * Uses the DeviceOrientationEvent API with fallbacks for iOS/Android differences.
 */
const Compass = (() => {
  let currentHeading = 0;
  let listeners = [];
  let isActive = false;
  let smoothedHeading = 0;
  const SMOOTHING = 0.3; // Lower = smoother, higher = more responsive

  /**
   * Check if the device supports orientation events.
   */
  function isSupported() {
    return 'DeviceOrientationEvent' in window;
  }

  /**
   * Check if we're on a mobile device (basic heuristic).
   */
  function isMobile() {
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
  }

  /**
   * Request permission for device orientation (required on iOS 13+).
   * Returns a promise that resolves to true if granted.
   */
  async function requestPermission() {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        return response === 'granted';
      } catch (e) {
        console.error('Permission request failed:', e);
        return false;
      }
    }
    // Non-iOS or older iOS - permission not needed
    return true;
  }

  /**
   * Normalize a heading to 0-360 range.
   */
  function normalizeHeading(h) {
    return ((h % 360) + 360) % 360;
  }

  /**
   * Calculate the shortest angular difference between two headings.
   * Returns a value between -180 and 180.
   */
  function angleDifference(a, b) {
    let diff = normalizeHeading(b) - normalizeHeading(a);
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff;
  }

  /**
   * Smooth heading transitions to avoid jitter.
   */
  function smoothHeading(newHeading) {
    const diff = angleDifference(smoothedHeading, newHeading);
    smoothedHeading = normalizeHeading(smoothedHeading + diff * SMOOTHING);
    return smoothedHeading;
  }

  /**
   * Handle device orientation event.
   */
  function handleOrientation(event) {
    let heading;

    if (event.webkitCompassHeading !== undefined) {
      // iOS: webkitCompassHeading gives magnetic north heading directly
      heading = event.webkitCompassHeading;
    } else if (event.alpha !== null) {
      // Android: alpha is the rotation around z-axis
      // alpha=0 means the device points to the same direction as during init
      // We need to convert to compass heading
      heading = 360 - event.alpha;

      // If absolute is available, use it for better accuracy
      if (event.absolute === false && event.alpha !== null) {
        heading = 360 - event.alpha;
      }
    } else {
      return; // No usable data
    }

    heading = normalizeHeading(heading);
    currentHeading = smoothHeading(heading);

    // Notify all listeners
    listeners.forEach(fn => fn(currentHeading));
  }

  /**
   * Start listening to compass events.
   */
  function start() {
    if (isActive) return;
    isActive = true;
    window.addEventListener('deviceorientation', handleOrientation, true);
  }

  /**
   * Stop listening to compass events.
   */
  function stop() {
    isActive = false;
    window.removeEventListener('deviceorientation', handleOrientation, true);
  }

  /**
   * Subscribe to heading updates.
   * Callback receives heading in degrees (0-360).
   */
  function onHeadingChange(callback) {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter(fn => fn !== callback);
    };
  }

  /**
   * Get the current heading.
   */
  function getHeading() {
    return currentHeading;
  }

  /**
   * Get the cardinal/intercardinal direction name for a heading.
   */
  function getDirectionName(heading) {
    const directions = [
      'N', 'NNE', 'NE', 'ENE',
      'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW',
      'W', 'WNW', 'NW', 'NNW'
    ];
    const index = Math.round(normalizeHeading(heading) / 22.5) % 16;
    return directions[index];
  }

  /**
   * Get a simple cardinal direction (N, E, S, W, NE, SE, SW, NW).
   */
  function getSimpleDirection(heading) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(normalizeHeading(heading) / 45) % 8;
    return directions[index];
  }

  return {
    isSupported,
    isMobile,
    requestPermission,
    start,
    stop,
    onHeadingChange,
    getHeading,
    getDirectionName,
    getSimpleDirection,
    normalizeHeading,
    angleDifference
  };
})();
