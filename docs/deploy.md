# Deployment Guide

## Requirements

> [!IMPORTANT]
> Camera and GPS APIs **require HTTPS**. The app will not function over plain HTTP on mobile devices.

## Option 1: GitHub Pages (Free, Recommended)

```bash
# 1. Create a public GitHub repo
# 2. Push this project to the main branch
git remote add origin https://github.com/YOUR_USERNAME/yatri-ar.git
git push -u origin main

# 3. Go to repo Settings → Pages → Source: main branch / root folder
# 4. Your app will be live at:
#    https://YOUR_USERNAME.github.io/yatri-ar/
```

**Pros:** Free, automatic HTTPS, custom domain support  
**Cons:** Slightly delayed deploys (1-2 min after push)

---

## Option 2: Netlify (Instant Deploy)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy from repo root
netlify deploy --prod --dir .
```

Or drag-and-drop the project folder at [app.netlify.com](https://app.netlify.com).

---

## Option 3: Local HTTPS with `serve`

For local testing with HTTPS (required for camera on mobile):

```bash
npx serve . --ssl-cert cert.pem --ssl-key key.pem
```

Generate self-signed cert:
```bash
openssl req -x509 -nodes -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -subj "/CN=localhost"
```

Then open `https://YOUR_LOCAL_IP:3000` on your phone (accept the self-signed cert warning).

---

## Camera Permissions

The AR camera view requires:
1. **HTTPS** — enforced by browsers for `getUserMedia`
2. **User gesture** — the "Start Navigating" button triggers permission requests
3. **iOS Safari** — DeviceOrientation permission also requires a user gesture (handled automatically)

## GPS Accuracy Tips

- Test outdoors with clear sky view
- GPS accuracy in `±5–15m` is ideal for AR placement
- Urban canyon environments (narrow streets, tall buildings) may reduce accuracy
- The Waypoint Logger (`waypoint.html`) shows live accuracy so you can choose the best testing spot
