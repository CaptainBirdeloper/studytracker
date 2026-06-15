# STUDY.LOG 
### High-Performance Analytics for JEE Aspirants

[![Live Demo](https://img.shields.io/badge/demo-stdylog.vercel.app-white?style=for-the-badge&logo=vercel)](https://stdylog.vercel.app)
[![Tech Stack](https://img.shields.io/badge/stack-Vanilla%20JS%20|%20Tailwind%20CSS-000?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![PWA](https://img.shields.io/badge/PWA-Ready-orange?style=for-the-badge)](https://web.dev/progressive-web-apps/)

**STUDY.LOG** is a specialized, minimalist Progressive Web App (PWA) designed specifically for high-stakes exam preparation like JEE Mains & Advanced. Built with an AMOLED-black aesthetic and raw performance in mind, it transforms your daily study logs into tactical insights.

---

## 🚀 The Core Philosophy

Most study trackers are cluttered. **Study.Log** focuses on two mission-critical metrics: **Quantity** (Questions Solved) and **Density** (Minutes per Question). 

Success in JEE isn't just about how long you sit; it's about your **problem-solving velocity** and **subject balance**.

---

## 🛠 Features

### 1. Unified Study Log (Home)
The high-impact command center. Log your reps and time in seconds.
- **Smart Autofill**: Recognizes over 70+ JEE chapters across Physics, Chemistry, and Math with fuzzy matching.
- **Source Tracking**: Categorize sessions by material (Pathfinder, Blackbook, Allen/Kota Modules).
- **Desktop Grid**: Optimized for both rapid mobile entry and deep-dive desktop reviews.

### 2. Random Practice Engine
Overcome decision paralysis. 
- **Weighted Selection**: Uses real JEE weightage data to prioritize high-yield chapters (Calculus, Mechanics, Organic) when generating practice sets.
- **Sleek Dice UI**: Generate a randomized set of question numbers from any range in seconds.

### 3. Performance Analytics
Data-driven transparency for your preparation.
- **Visual Trends**: Weekly bar graphs for questions solved and time spent.
- **Subject Distribution**: Instantly see if you're neglecting a subject or over-focusing on one.
- **Question Density**: Real-time calculation of `min/q`.
- **Target Benchmarking**: Compare your speed against researched targets (e.g., 2m for Mains vs. 15m for Pathfinder).

### 4. Dynamic Advice Carousel
An AI-like engine that analyzes your metrics and provides tactical feedback:
- 🚩 **Neglected Areas**: Alerts you if a subject is lagging behind.
- ⚡ **Efficiency Bottlenecks**: Highlights where you are slower than the target pace.
- 🏆 **Core Strengths**: Identifies your "Elite" subjects and suggests tougher material.

### 5. Professional Settings
- **Data Portability**: Full JSON Export/Import functionality for local backups.
- **UI Customization**: Deep font-size and family customization (including support for custom system fonts like JetBrains Mono).
- **Privacy First**: All data is stored locally in your browser (`localStorage`). No servers, no tracking.

---

## 💻 Technical Stack

- **Frontend**: Vanilla JavaScript (ESM Architecture), Tailwind CSS (JIT Engine).
- **Architecture**: Modular logic separation (`analytics.js`, `storage.js`, `advice.js`).
- **PWA**: Custom Service Worker with versioned caching for full offline capability.
- **Design**: AMOLED-black (#000000) for maximum power efficiency and high-contrast focus.

---

## 📦 Local Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/CaptainBirdeloper/studytracker
   ```
2. Open `index.html` in any modern browser.
3. (Optional) Deploy to Vercel by simply connecting your GitHub repo.

---

## 📄 Blueprint & Import

Want to migrate your data? Check out `import.txt` for the JSON schema blueprint. We support full data portability so you are never locked into the platform.

---

Built for the ones who solve. **[Start Logging](https://stdylog.vercel.app)**.
