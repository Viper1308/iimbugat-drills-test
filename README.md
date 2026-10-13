# UGAT Drills — IIM Bangalore UG Admissions Test practice app

A web app (works offline, installable on a phone) with a **Learn** panel and a **Drills** panel side by side.

**Learn** (left): 70 concept pages — 52 Quant & DI concepts mapped to NCERT Class 10–12 (plus Class 6–9 foundations), 11 Logical Reasoning and 7 Verbal. Every page has: analogy → explanation from first principles → formulae → derivations → diagrams/graphs → solved sums → common traps. About 22,500 words, 69 diagrams, 105 derivations, 210 solved sums.
**Drills** (right): 6,922 questions (QADI 3,850 · LR 1,820 · Verbal 1,252) plus the 2025 paper, every one tagged to a concept, so each lesson has its own drill set. Daily mixed practice, spaced review, hints, XP/streak, timed mocks with the real −⅓ marking and 30/20/20 weights, stats and a JSON export for ASAP. Progress stays in the browser.

## How the two panels work
- **Phone / home-screen app:** you start on Learn. Swipe left for Drills, swipe right to come back (or tap the tabs at the top). "Practise this concept" on a lesson jumps you to the drills; "Read the lesson" on a concept's drill page, jumps you back.
- **During a question:** after answering, "Review the lesson" opens the concept as a pop-up so you keep your place.
- **Mock tests:** the Learn panel is hidden while a mock runs.
- **Laptop / tablet (wide screen):** both panels sit side by side.

## Try it on your computer first
1. Install Node.js from nodejs.org (the "LTS" button), or Python.
2. Open a terminal in this folder and run:  `python -m http.server 8000`   (or `npx serve`)
3. Open http://localhost:8000 in Chrome.
(Opening index.html by double-click will NOT work — browsers block loading the data files that way.)

## Put it online (free) — same way as ASAP
1. Create a GitHub account → New repository → name it `ugat-drills` → Upload files → drag in everything in this folder (keep the `data` folder) → Commit.
2. Go to vercel.com → sign in with GitHub → Add New → Project → pick `ugat-drills` → Deploy. No settings needed; you get a link like ugat-drills.vercel.app.
3. On the phone: open the link in Safari → Share → Add to Home Screen. After the first load it works without internet.

Every time you upload a changed file to GitHub, Vercel updates the site automatically.

## Difficulty levels
Settings → Question level. *Exam level* (default) serves the multi-step questions first and falls back to standard drills only for topics that have no exam-level questions left. *Exam + standard* skips warm-ups. *Everything* includes the easy single-formula drills.
Mock tests follow the same setting.

## Progress & ASAP
Settings → Back up / Restore (full progress file) and Export for ASAP (topic level + accuracy + streak + mock scores as JSON).
Progress lives in each device's browser; a Supabase sync can be added later if you want phone and laptop to share it.

## Notes
- 11 official-paper questions depend on a figure and are left out of practice.
- Native iOS/macOS versions can be built later from this same question and lesson data.
- Progress is now tracked per concept (70) instead of per topic, so progress saved by the previous version will not carry over.
