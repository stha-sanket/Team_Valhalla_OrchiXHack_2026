/**
 * Yatri AR — AR Engine Helpers
 * Utilities for AR.js + A-Frame integration
 */

"use strict";

const ArEngine = (() => {
  /**
   * Place an A-Frame entity at GPS coordinates
   * @param {HTMLElement} entity - A-Frame entity element
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  function placeAtGPS(entity, lat, lng) {
    entity.setAttribute("gps-new-entity-place", `latitude: ${lat}; longitude: ${lng}`);
  }

  /**
   * Create the animated destination marker (pagoda pin)
   * Returns an A-Frame entity ready to append to a-scene
   */
  function createDestinationMarker(lat, lng, name) {
    const container = document.createElement("a-entity");
    placeAtGPS(container, lat, lng);

    // Base disc
    const base = document.createElement("a-cylinder");
    base.setAttribute("radius", "0.5");
    base.setAttribute("height", "0.1");
    base.setAttribute("color", "#c97b3d");

    // Stem
    const stem = document.createElement("a-cylinder");
    stem.setAttribute("radius", "0.13");
    stem.setAttribute("height", "1.1");
    stem.setAttribute("color", "#c97b3d");
    stem.setAttribute("position", "0 0.55 0");

    // Pagoda cone top
    const cone = document.createElement("a-cone");
    cone.setAttribute("radius-bottom", "0.55");
    cone.setAttribute("radius-top", "0");
    cone.setAttribute("height", "0.5");
    cone.setAttribute("color", "#7a2e2e");
    cone.setAttribute("position", "0 1.35 0");

    // Golden orb
    const orb = document.createElement("a-sphere");
    orb.setAttribute("radius", "0.14");
    orb.setAttribute("color", "#f1c40f");
    orb.setAttribute("position", "0 1.68 0");

    // Animated pulse ring
    const ring = document.createElement("a-ring");
    ring.setAttribute("radius-inner", "0.5");
    ring.setAttribute("radius-outer", "0.65");
    ring.setAttribute("color", "#f1c40f");
    ring.setAttribute("opacity", "0.55");
    ring.setAttribute("position", "0 0.06 0");
    ring.setAttribute("animation", [
      "property: scale; from: 1 1 1; to: 2.2 2.2 2.2",
      "dur: 1800; loop: true; easing: easeOutQuad"
    ].join("; "));
    ring.setAttribute("animation__fade", [
      "property: opacity; from: 0.55; to: 0",
      "dur: 1800; loop: true; easing: easeOutQuad"
    ].join("; "));

    container.appendChild(base);
    container.appendChild(stem);
    container.appendChild(cone);
    container.appendChild(orb);
    container.appendChild(ring);

    return container;
  }

  /**
   * Create a 3D text label for a site
   */
  function createSiteLabel(lat, lng, name) {
    const label = document.createElement("a-entity");
    placeAtGPS(label, lat, lng);
    label.setAttribute("position", "0 2.6 0");
    label.setAttribute("look-at", "[gps-new-camera]");

    const text = document.createElement("a-text");
    text.setAttribute("value", name);
    text.setAttribute("color", "#f5eedd");
    text.setAttribute("align", "center");
    text.setAttribute("scale", "4 4 4");
    text.setAttribute("font", "mozillavr");

    const arrow = document.createElement("a-text");
    arrow.setAttribute("value", "▼");
    arrow.setAttribute("color", "#f1c40f");
    arrow.setAttribute("align", "center");
    arrow.setAttribute("scale", "3 3 3");
    arrow.setAttribute("position", "0 -0.8 0");

    label.appendChild(text);
    label.appendChild(arrow);
    return { label, text };
  }

  /**
   * Create breadcrumb waypoint trail between two GPS points
   * @param {HTMLElement} container - Parent a-entity
   * @param {number} lat1 / lng1 - Start (user position)
   * @param {number} lat2 / lng2 - End (destination)
   * @param {number} count - Number of intermediate dots
   */
  function createWaypointTrail(container, lat1, lng1, lat2, lng2, count = 7) {
    container.innerHTML = "";
    const points = GeoUtils.generateWaypoints(lat1, lng1, lat2, lng2, count + 1);

    points.forEach((pt, i) => {
      const entity = document.createElement("a-entity");
      placeAtGPS(entity, pt.lat, pt.lng);
      entity.setAttribute("position", "0 0.12 0");

      const sphere = document.createElement("a-sphere");
      sphere.setAttribute("radius", "0.14");
      sphere.setAttribute("color", "#f1c40f");
      sphere.setAttribute("opacity", (0.4 + (i / count) * 0.5).toFixed(2));
      sphere.setAttribute(
        "animation",
        `property: scale; from: 1 1 1; to: 1.6 1.6 1.6; dur: ${1200 + i * 100}; dir: alternate; loop: true; easing: easeInOutSine`
      );

      entity.appendChild(sphere);
      container.appendChild(entity);
    });
  }

  /**
   * Play a temple bell tone using Web Audio API
   */
  function playArrivalBell() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 — bell-like
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 2.5);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.5);
    } catch (e) {
      // Silently fail — audio is a bonus
    }
  }

  /**
   * Haptic feedback for arrival
   */
  function hapticArrival() {
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }

  return {
    placeAtGPS,
    createDestinationMarker,
    createSiteLabel,
    createWaypointTrail,
    playArrivalBell,
    hapticArrival,
  };
})();

window.ArEngine = ArEngine;
