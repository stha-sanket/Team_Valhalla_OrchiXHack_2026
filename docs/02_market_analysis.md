# 02 — Market Analysis

## 1. Problem Statement

> **Existing navigation systems stop at the entrance of heritage sites, leaving visitors without guidance to explore monuments, discover historical significance, or experience Nepal's cultural heritage in a structured and engaging way.**

Nepal's heritage sites receive over a million visitors annually, yet once past the gate tourists are on their own — no structured navigation, no contextual storytelling, no incentive to engage deeply. Orchid AR Campus Explorer is built to close that gap, starting with educational campuses as a proving ground.

---

## 2. Nepal Tourism: Why This Market Matters

| Statistic | Value | Source |
|-----------|-------|--------|
| International tourist arrivals (2024) | **1.147 million** | [Nepal Tourism Statistics 2024](https://tourism.gov.np/content/83/nepal-tourism-statistics-2024/) |
| Tourism's contribution to Nepal's GDP | **~7–8%** (direct + indirect) | [Nepal Promote Treks](https://nepalpromotetreks.com/blogs/nepal-tourism-statistics) |
| UNESCO World Heritage properties in Nepal | **10 total**, including 4 cultural sites in Kathmandu Valley alone | [UNESCO State Party Nepal](https://whc.unesco.org/en/statesparties/np/) |

These numbers demonstrate that a very large number of visitors — both international and domestic — could benefit directly from improved heritage-site navigation and storytelling tools.

---

## 3. Supporting Evidence

### 3.1 Lack of Tourism Infrastructure

> *"Tourism centers have been established in Nepal only in limited places. These centers provide different tourism services like information about pleasant places, tourism maps, exchanging foreign currency etc. for tourists. Due to limited tourist centers, there are possibilities for tourists to be cheated. In some places, tourists have lost even their lives. Thus the lack of tourism centers and proper security arrangements are a great deterrent to the development of tourism in Nepal."*
>
> — [Tourism: Importance, Prospects and Challenges with Special Reference to Nepal](https://andjournal.in/2018/07/13/tourism-importance-prospects-and-challenges-with-special-reference-to-nepal/)

This gap in physical infrastructure is exactly what a mobile-first digital platform can fill — at a fraction of the cost of building physical tourism centres.

### 3.2 Heritage Sites Must Provide Centralised Visitor Information

> UNESCO recommends that every heritage site should provide visitors with easily accessible information, including maps, navigation, transport details, accommodation, and cultural interpretation through a **centralised platform**. However, UNESCO also notes that **surprisingly few World Heritage sites provide such accessible digital resources**.
>
> — [UNESCO Sustainable Tourism Toolkit, Guide 5](https://whc.unesco.org/en/sustainabletourismtoolkit/guide5/)

Orchid AR directly addresses this UNESCO recommendation: it is a centralised digital platform that provides maps, GPS navigation, and cultural interpretation (via video/image media at each waypoint).

### 3.3 Digital Technologies Enhance Cultural Tourism

> UN Tourism emphasises that digital technologies play a **vital role** in improving cultural tourism by modernising heritage interpretation, increasing visitor engagement, and delivering innovative educational experiences.
>
> — [Session 3, UN Tourism & UNESCO Conference Concept Note (Istanbul, 2018)](https://webunwto.s3-eu-west-1.amazonaws.com/imported_images/50679/unwto_unesco_istanbul_conf_concept_note_22.11.2018_en.pdf)

AR-based storytelling at physical waypoints is precisely the kind of digital innovation these bodies advocate for.

### 3.4 Tourists Benefit from Integrated Navigation + Information Systems

> Research on Destination Information Management Systems concludes that tourists benefit significantly from **integrated platforms** that combine navigation, destination information, and visitor support into a single system.
>
> — [Destination Information Management Systems (arXiv:1402.1243)](https://arxiv.org/abs/1402.1243)

Orchid AR unifies GPS navigation, waypoint-specific media, quiz-based learning, and a reward system in a single progressive web app — matching this research conclusion.

---

## 4. Competitive Landscape

### Nepal-Specific Competitors

| # | Competitor | URL | Core Mechanic | Orchid AR Advantage |
|---|-----------|-----|---------------|---------------------|
| 1 | **HoneyGuide Nepal** | [honeyguideapps.com](https://honeyguideapps.com/) | Curated cultural heritage guides: walking tours, temple histories, ecological information — developed with local historians and cultural experts | HoneyGuide has no AR overlay, no indoor/campus navigation, and no gamification (badges, points, quizzes). Orchid AR adds all three. |
| 2 | **Nepal Heritage App (NHDP)** | [nepalheritage.app](https://nepalheritage.app/) | Archival documentation of individual heritage sites across Kathmandu Valley and West Nepal | Archival "database" model — not a guided journey. No navigation loop, no engagement mechanics. Orchid is experience-first. |
| 3 | **GPSmyCity (Kathmandu)** | [gpsmycity.com](https://www.gpsmycity.com) | Generic self-guided GPS tour platform with Kathmandu routes (e.g. 8-stop Durbar Square walk); works offline | Functionally close to the core navigation loop, but zero AR, zero quiz/badge mechanics, zero campus/small-premise focus. City-scale only. |
| 4 | **Kathmandu Durbar Smartphone App** | [nowthingstodo.com](https://www.nowthingstodo.com/activity/THDP7668/kathmandu/kathmandu-durbar-smartphone-app-self-guided-gps-walking-tour) | Self-guided GPS walking tour sold via Viator/Marriott Bonvoy; marketed as "walking tour + scavenger hunt" | Paid tourist product, not a platform. No AR, no institutional/educational focus, no admin configurability. |
| 5 | **Lokalee** | [business.lokalee.app](https://www.business.lokalee.app/) | Digital concierge app: dining, experiences, attraction tickets, with a Kathmandu Heritage Trail walking tour as one feature | Broader lifestyle/booking app — tours are a peripheral feature. Not a focused heritage or campus navigation tool. |
| 6 | **Saarang** | [saarang.com.np](https://saarang.com.np/) | QR-coded storyboards physically installed at heritage sites — scan to get multilingual text/audio stories. ~100 boards across Kathmandu Valley; expanded to Thamel, Lumbini, Pokhara, Mustang. NYEF KTM Startup Awards 2022 nominee. | Requires physical hardware installation at every site (cost, maintenance, vandalism risk). No real-time GPS navigation. No gamification. Orchid AR works with zero physical installation — any route is configurable via admin dashboard. |

### Orchid AR's Sustainable Differentiation

Every competitor listed above shares at least one of these weaknesses that Orchid AR directly addresses:

| Gap in Competitors | Orchid AR Solution |
|--------------------|--------------------|
| No AR camera overlay | A-Frame + AR.js location-based AR built-in |
| No real-time GPS wayfinding | Live compass arrow + WebSocket proximity stream |
| No gamification | AR Points, milestones, badges, quizzes, reward redemption |
| No admin-configurable routes | Waypoint Logger admin GUI; any route in minutes |
| Requires physical hardware (QR boards) | Zero hardware — browser-based, runs on any smartphone |
| No educational layer | Quiz system with scored knowledge checks after each route |
| Campus/small-premise blind spot | Designed specifically for controlled premises (campuses, museums) |

---

## 5. Market Segments

| Segment | Description | Estimated Market Size (2024) |
|---------|-------------|------------------------------|
| **Heritage & Cultural Tourism Tech** | Digital guides for UNESCO sites, museums, cultural institutions | $3.2 B globally |
| **EdTech — Campus Engagement** | Student orientation, retention, and campus engagement platforms | $4.5 B globally |
| **Location-Based AR** | Consumer/enterprise AR tied to real-world GPS coordinates | $8.8 B, ~35% CAGR |
| **Gamification in Education** | Points, badges, leaderboards applied to learning contexts | $1.8 B globally |

Orchid AR sits at the intersection of all four segments, and its Nepal-first positioning targets an **underserved, high-growth** market where digital heritage infrastructure is explicitly called out as lacking by UNESCO.

---

## 6. Target Users

### Primary: University Students & Campus Newcomers (Nepal)
- **Pain:** Orientation is chaotic; campus geography is unfamiliar; no incentive to explore.
- **Gain:** Self-guided AR tour, badge rewards, peer leaderboard, tangible perks.

### Secondary: Heritage Site Visitors (Domestic & International)
- **Pain:** No guide available; physical tourism centres are scarce; cultural context is inaccessible.
- **Gain:** GPS-guided route, video storytelling at each monument, quiz to reinforce learning.

### Tertiary: Site Administrators & Institutions
- **Pain:** Manual guide costs; no engagement data; one-and-done orientation events.
- **Gain:** Zero-hardware digital experience; admin dashboard; visitor count analytics.

---

## 7. Business Model (Post-Hackathon Roadmap)

| Revenue Stream | Description | Model |
|---------------|-------------|-------|
| **SaaS Licensing** | Annual license per institution (campus, museum, site) | $5,000–$25,000 / year |
| **Heritage Site Partnerships** | Revenue share with Nepal Tourism Board / NHDP for featuring official routes | Partnership |
| **Content Production Services** | Professional route design, video production, quiz authoring | Project-based |
| **Premium Analytics** | Visitor heatmaps, dwell-time, quiz engagement reports | Add-on module |
| **White-Label Customisation** | Custom branding, domain, reward catalog | One-time fee |

---

## 8. Market Opportunity Sizing (TAM / SAM / SOM)

| Level | Definition | Size |
|-------|-----------|------|
| **TAM** | All heritage sites + higher-ed institutions globally (~25,000 universities + ~50,000 major heritage sites) at avg. $10K/year | ~$750M / year |
| **SAM** | Nepal + South Asian universities and UNESCO heritage sites (est. 3,000 institutions) | ~$30M / year |
| **SOM** | Realistic 5% capture in 3 years, starting with Kathmandu Valley | ~$1.5M / year |

---

## 9. Regulatory & Technical Considerations

| Area | Consideration |
|------|--------------|
| **GPS Privacy** | Location data processed server-side only during an active WebSocket session; never stored persistently |
| **Browser Permissions** | Geolocation and `DeviceOrientation` APIs require explicit user consent |
| **HTTPS Requirement** | Camera (`getUserMedia`) and geolocation are gated behind secure contexts — production must run on TLS |
| **Nepal Data Localisation** | No current Nepal-specific data localisation law; standard GDPR-adjacent practices applied |
| **Accessibility** | Graceful degradation to compass-only HUD when camera is unavailable |
