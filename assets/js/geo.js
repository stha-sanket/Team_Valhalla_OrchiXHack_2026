/**
 * Yatri AR — Geo Math Utilities
 * Bearing, distance, and heading smoothing functions
 */

"use strict";

const GeoUtils = (() => {
  const R = 6371000; // Earth radius in metres

  /** Convert degrees to radians */
  function toRad(deg) {
    return (deg * Math.PI) / 180;
  }

  /**
   * Calculate compass bearing from point 1 → point 2 (degrees, 0–360)
   * @param {number} lat1 - Origin latitude
   * @param {number} lng1 - Origin longitude
   * @param {number} lat2 - Destination latitude
   * @param {number} lng2 - Destination longitude
   * @returns {number} Bearing in degrees (0 = North, 90 = East)
   */
  function calculateBearing(lat1, lng1, lat2, lng2) {
    const dLng = toRad(lng2 - lng1);
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const x = Math.sin(dLng) * Math.cos(phi2);
    const y =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
    return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
  }

  /**
   * Haversine distance between two GPS points (in metres)
   */
  function calculateDistance(lat1, lng1, lat2, lng2) {
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const dPhi = toRad(lat2 - lat1);
    const dLambda = toRad(lng2 - lng1);
    const a =
      Math.sin(dPhi / 2) ** 2 +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Format distance for display
   * @param {number} metres
   * @returns {string} "450 m" or "1.23 km"
   */
  function formatDistance(metres) {
    if (metres < 1000) return `${Math.round(metres)} m`;
    return `${(metres / 1000).toFixed(2)} km`;
  }

  /**
   * Estimate walk time in minutes given distance in metres
   * Assumes 5 km/h walking speed
   */
  function estimateWalkMinutes(metres) {
    return Math.round(metres / 83); // 83 m/min = 5 km/h
  }

  /**
   * Low-pass heading smoother (k = 0.15)
   * Avoids spinning the long way around 0/360 boundary.
   * Call this on each new compass reading.
   * @param {number|null} smoothed - Current smoothed value (null on first call)
   * @param {number} raw - New raw compass reading (degrees 0-360)
   * @param {number} [k=0.15] - Smoothing factor (higher = more responsive)
   * @returns {number} Updated smoothed heading
   */
  function smoothHeading(smoothed, raw, k = 0.15) {
    if (smoothed == null) return raw;
    let diff = raw - smoothed;
    // Shortest angular path
    diff = ((diff + 180) % 360 + 360) % 360 - 180;
    return (smoothed + k * diff + 360) % 360;
  }

  /**
   * Normalize angle to -180..180 range
   */
  function normAngle(deg) {
    return ((deg + 180) % 360 + 360) % 360 - 180;
  }

  /**
   * Interpolate between two lat/lng points by factor t (0..1)
   */
  function lerpLatLng(lat1, lng1, lat2, lng2, t) {
    return {
      lat: lat1 + (lat2 - lat1) * t,
      lng: lng1 + (lng2 - lng1) * t,
    };
  }

  /**
   * Generate N evenly-spaced waypoints between two coordinates
   * (used for breadcrumb trail in AR scene)
   */
  function generateWaypoints(lat1, lng1, lat2, lng2, count = 8) {
    const points = [];
    for (let i = 1; i < count; i++) {
      points.push(lerpLatLng(lat1, lng1, lat2, lng2, i / count));
    }
    return points;
  }

  /**
   * Is the device likely iOS?
   */
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  /**
   * Request DeviceOrientation permission (iOS 13+)
   * Returns a Promise<boolean> — true if granted
   */
  async function requestOrientationPermission() {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      try {
        const result = await DeviceOrientationEvent.requestPermission();
        return result === "granted";
      } catch {
        return false;
      }
    }
    // Non-iOS — no explicit permission needed
    return true;
  }

  return {
    toRad,
    calculateBearing,
    calculateDistance,
    formatDistance,
    estimateWalkMinutes,
    smoothHeading,
    normAngle,
    lerpLatLng,
    generateWaypoints,
    isIOS,
    requestOrientationPermission,
  };
})();

// Global alias for use in HTML script tags
window.GeoUtils = GeoUtils;
