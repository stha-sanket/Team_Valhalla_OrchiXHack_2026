# Contributing to Yatri AR

Thank you for helping improve Yatri AR! Here's how to contribute.

## Adding New Heritage Sites

Edit `assets/js/sites-data.js` and add a new entry to the `YATRI_SITES` array:

```js
{
  id: "your-site-id",           // kebab-case, unique
  name: "Site Name",            // English name
  nameNp: "नाम",               // Devanagari name
  category: "temple",           // "temple" | "stupa" | "durbar" | "natural"
  lat: 27.7000,                 // GPS latitude (6+ decimal places)
  lng: 85.3000,                 // GPS longitude
  emoji: "🛕",                 // Representative emoji
  unescoStatus: true,           // UNESCO World Heritage?
  district: "Kathmandu",        // District / city
  rating: 4.5,                  // Community rating (1-5)
  reviewCount: 1000,            // Number of reviews
  thumbnail: null,              // Path to image or null
  description: "...",           // 2-3 sentence overview
  history: "...",               // Historical background
  legend: "...",                // Myth or legend
  tips: [                       // Visitor tips (4 items recommended)
    "Tip one",
    "Tip two",
    "Tip three",
    "Tip four"
  ],
  walkTime: 30,                 // Approximate walk time from city center (minutes)
  tags: ["tag1", "tag2"]        // Searchable tags
}
```

## Adding Quiz Questions

Edit `assets/js/quiz-data.js` and add to the `questions` array:

```js
{
  id: 21,                       // Unique integer ID
  category: "heritage",         // heritage | religion | geography | culture | history
  question: "Your question?",
  options: ["A", "B", "C", "D"],
  answer: 0,                    // 0-indexed correct answer
  explanation: "Why this is correct...",
  points: 10                    // 5 | 10 | 15
}
```

## Code Style

- Vanilla JS, no frameworks or build steps
- Use `"use strict"` in all script blocks
- Follow the design system tokens in `assets/css/design-system.css`
- All interactive elements need `aria-label` attributes
- Test on mobile Chrome (Android) and Safari (iOS)

## Pull Request Checklist

- [ ] New site has accurate GPS coordinates (verified with Google Maps)
- [ ] Description is under 280 characters
- [ ] Quiz explanation cites a source or well-known fact
- [ ] Tested on both portrait and landscape orientations
- [ ] No console errors in Chrome DevTools

## GPS Coordinate Tips

Use the [Waypoint Logger](waypoint.html) tool to capture accurate coordinates on-site.
Alternatively, right-click any location in Google Maps → "What's here?" to copy coordinates.
