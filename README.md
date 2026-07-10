# 🏔️ Yatri AR — Nepal Heritage AR Tourism Guide

> An immersive Augmented Reality tourism companion for exploring Nepal's UNESCO World Heritage Sites, temples, and natural wonders.

![Yatri AR Banner](./assets/images/og-banner.jpg)

## ✨ Features

- **AR Navigation** — Live compass arrow overlaid on the camera feed guides you to heritage sites
- **Interactive Site Explorer** — Tap on any site to read its history, legends, and travel tips
- **AR Waypoints** — Floating 3D markers appear in the real world at temple locations
- **Cultural Trivia Quiz** — Test your knowledge of Nepali history and culture
- **Offline-ready** — Core navigation works without internet after first load
- **Multi-language** — English & Nepali (Devanagari) interface toggle

## 📂 Project Structure

```
orchidhack/
├── index.html          # Landing / home page
├── explore.html        # Site explorer with AR markers
├── navigate.html       # AR compass navigation (renamed from direction.html)
├── quiz.html           # Cultural trivia quiz
├── waypoint.html       # Dev tool: GPS waypoint logger
├── assets/
│   ├── css/
│   │   ├── design-system.css   # Tokens, typography, utilities
│   │   └── components.css      # Reusable UI components
│   ├── js/
│   │   ├── geo.js              # Geo math utilities
│   │   ├── ar-engine.js        # AR.js integration helpers
│   │   ├── sites-data.js       # Heritage sites database
│   │   └── quiz-data.js        # Quiz questions & answers
│   └── images/
│       └── ...
```

## 🚀 Getting Started

Just open `index.html` in a mobile browser (Chrome/Safari) — no build step needed. For GPS and camera to work:

1. Use **HTTPS** (deploy to GitHub Pages, Netlify, or use `npx serve`)
2. Allow **Location** and **Camera** permissions when prompted
3. Go outside for best GPS accuracy

## 🗺️ Supported Destinations

| Site | Location | UNESCO Status |
|------|----------|---------------|
| Pashupatinath Temple | Kathmandu | ✅ World Heritage |
| Swayambhunath Stupa | Kathmandu | ✅ World Heritage |
| Boudhanath Stupa | Kathmandu | ✅ World Heritage |
| Kathmandu Durbar Square | Kathmandu | ✅ World Heritage |
| Patan Durbar Square | Lalitpur | ✅ World Heritage |
| Bhaktapur Durbar Square | Bhaktapur | ✅ World Heritage |
| Changu Narayan Temple | Bhaktapur | ✅ World Heritage |
| Lumbini | Rupandehi | ✅ World Heritage |

## 🛠️ Tech Stack

- **A-Frame** v1.5.0 — WebXR/AR scene rendering
- **AR.js** — Marker-less GPS-based AR
- **Vanilla JS** — Zero dependencies beyond AR libraries
- **CSS Custom Properties** — Theming and design tokens
- **Web APIs** — Geolocation, DeviceOrientation, WebRTC Camera

## 📄 License

MIT © 2026 Yatri AR / OrchidHack
