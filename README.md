# UGAT Drills — IIM Bangalore UG Admissions Test practice app

A web app (works offline, installable on a phone) with 5,620 practice questions plus the 2025 paper (60): QADI 2,548 · LR 1,820 · Verbal 1,252 .
Of these, 2,023 are **exam level** (tier 3): multi-step questions modelled on the 2025 paper and the IIMB sample papers. The rest are standard drills (tier 2) and warm-ups (tier 1).
Lessons for 57 topics, daily mixed practice (100/150/200), spaced review, hints, XP/streak/combo, timed mocks with real −⅓ marking
and the 30/20/20 section weights, stats, and a JSON export for ASAP. All progress stays in the browser (no account, no server).

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
- Native iOS/macOS versions can be built later from this same question data.
