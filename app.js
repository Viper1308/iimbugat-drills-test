// UGAT Drills — offline practice app for the IIMB UG Admissions Test (QADI · LR · VARC)
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const KEY = 'ugat.v1';
const SECS = ['QADI', 'LR', 'VARC'];
const SEC_NAME = { QADI: 'Quant & DI', LR: 'Logical Reasoning', VARC: 'Verbal' };
const SEC_WEIGHT = { QADI: 30, LR: 20, VARC: 20 };          // points out of 70 (pre-interview)
const MOCK_SHAPE = { QADI: { n: 30, mins: 60 }, LR: { n: 15, mins: 45 }, VARC: { n: 15, mins: 30 } };
const LEVELS = ['New', 'Attempted', 'Familiar', 'Proficient', 'Mastered'];
const DAY = 86400000;
const COLORS = ['#1cb0f6', '#ff9600', '#58cc02', '#ce82ff', '#ff4b4b', '#ffc800'];

// ---------- state ----------
function fresh() { return { v: 1, xp: 0, streak: 0, best: 0, lastDay: null, goal: 100, level: 'exam', sound: true, theme: 'auto', q: {}, days: {}, mocks: [], bm: [], topics: {}, read: {} }; }
function load() { try { return Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { return fresh(); } }
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } }
const dayKey = (t = Date.now()) => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const today = () => S.days[dayKey()] || { n: 0, c: 0, xp: 0, ms: 0 };

// ---------- data ----------
let DATA = {}, BY = {}, TOPICS = {}, TQ = {}, LESSONS = {}, NOTES = {}, CON = {}, CONS = [];
async function loadData() {
  const get = f => fetch('data/' + f).then(r => r.json());
  const [a, b, c, p, l, n, cc] = await Promise.all([get('QADI.json'), get('LR.json'), get('VARC.json'), get('PYQ_2025_verified.json'), get('lessons.json'), get('notes.json'), get('concepts.json')]);
  DATA = { QADI: a, LR: b, VARC: c, PYQ: p }; LESSONS = l; NOTES = n; CONS = cc; for (const x of cc) CON[x.id] = x;
  for (const sec of SECS) {
    TOPICS[sec] = [];
    for (const q of DATA[sec]) { BY[q.id] = q; const k = q.concept || q.topic; (TQ[k] = TQ[k] || []).push(q); }
    TOPICS[sec] = CONS.filter(x => x.section === sec && TQ[x.id]).map(x => x.id);
  }
  for (const q of DATA.PYQ) BY[q.id] = q;
}
const shortName = t => CON[t] ? CON[t].title : t.replace(/^(LR|VARC): /, '').replace(' - ', ' – ');
const ICONS = [[/Percent/, '％'], [/Interest/, '💰'], [/Ratio/, '⚖️'], [/Average/, '📊'], [/Mixture/, '🧪'], [/Speed/, '🚆'], [/Work/, '🛠️'], [/LCM/, '🔢'], [/Cyclic/, '🔁'],
[/Linear & Quad/, 'x²'], [/Sequences/, '∑'], [/Coordinate/, '📐'], [/Sets/, '⭕'], [/Functions/, 'ƒ'], [/Modulus/, '|x|'], [/Triangles/, '△'], [/Circles/, '◯'], [/Trigon/, '📏'],
[/Set Theory/, '🔵'], [/Permut/, '🎲'], [/Statistics/, '📈'], [/DI: Theory/, '🧾'], [/DI: Bar/, '📊'], [/Matrices.*1/, '▦'], [/Matrices.*2/, '▩'], [/Limits/, '∞'], [/Differ/, 'dy'], [/Indefinite/, '∫'], [/Definite/, '∫ᵇ'],
[/Syllog/, '🧩'], [/Seating/, '🪑'], [/Schedul/, '📅'], [/Rank/, '🏅'], [/Blood/, '👪'], [/Direction/, '🧭'], [/Coding/, '🔐'], [/Series/, '🔢'], [/Alphabet/, '🔤'], [/Operations/, '➕'], [/Sufficiency/, '❓'], [/Statement/, '💬'],
[/Synonym/, '≈'], [/Antonym/, '≠'], [/Context/, '📝'], [/Meanings/, '📖'], [/Idiom/, '🗣️'], [/One-word/, '1️⃣'], [/Analog/, '🔗'], [/Agreement/, '✅'], [/Preposition/, '📍'], [/Tense/, '⏳'], [/Article/, '🅰️'], [/Error/, '🔍'], [/Confused/, '🤔'], [/Ordering/, '🔀'], [/Odd/, '🚫'], [/Comprehension/, '📚']];
const iconFor = t => CON[t] ? CON[t].icon : (ICONS.find(([r]) => r.test(t)) || [0, '⭐'])[1];

// ---------- mastery ----------
function topicStat(t) { const s = S.topics[t]; if (!s) return { n: 0, acc: 0, lvl: 0, c: 0 }; const rec = s.recent || []; const acc = rec.length ? rec.reduce((a, b) => a + b, 0) / rec.length : 0; let lvl = 1; if (s.n >= 60 && rec.length >= 30 && acc >= .85) lvl = 4; else if (s.n >= 40 && acc >= .75) lvl = 3; else if (s.n >= 20 && acc >= .6) lvl = 2; return { n: s.n, acc, lvl, c: s.c }; }
function recordAnswer(q, ok, ms, hinted) {
  const now = Date.now(); const k = dayKey();
  const r = S.q[q.id] || { b: 0, s: 0, r: 0 };
  r.s++; if (ok) r.r++; r.l = ok ? 1 : 0; r.t = now;
  r.b = ok ? Math.min(5, (r.b || 0) + (hinted ? 0 : 1)) : 1;
  r.d = now + [0, 0, DAY, 3 * DAY, 7 * DAY, 21 * DAY][r.b];
  S.q[q.id] = r;
  const tk = q.concept || q.topic; const t = S.topics[tk] || { n: 0, c: 0, recent: [] }; t.n++; if (ok) t.c++; t.recent.push(ok ? 1 : 0); if (t.recent.length > 30) t.recent.shift(); S.topics[tk] = t;
  const d = S.days[k] || { n: 0, c: 0, xp: 0, ms: 0 }; d.n++; if (ok) d.c++; d.ms += ms; S.days[k] = d;
  if (d.n === 10) bumpStreak();
}
function bumpStreak() {
  const y = dayKey(Date.now() - DAY), k = dayKey();
  if (S.lastDay === k) return;
  S.streak = S.lastDay === y ? S.streak + 1 : 1; S.lastDay = k; S.best = Math.max(S.best, S.streak); toast(`🔥 ${S.streak}-day streak!`);
}
const liveStreak = () => (S.lastDay === dayKey() || S.lastDay === dayKey(Date.now() - DAY)) ? S.streak : 0;
const playerLevel = () => Math.floor(Math.sqrt(S.xp / 60)) + 1;
function addXp(n) { const before = playerLevel(); S.xp += n; const d = S.days[dayKey()]; if (d) d.xp += n; if (playerLevel() > before) { toast(`⭐ Level ${playerLevel()}!`); confetti(); sfx('up'); } }

// ---------- difficulty tiers ----------
// tier 3 = exam-level (matches the 2025 paper / sample papers), 2 = standard drill, 1 = warm-up
const LEVEL_NAMES = { exam: 'Exam level (recommended)', mixed: 'Exam + standard', all: 'Everything, incl. warm-ups' };
function tierPool(list) {
  const lv = S.level || 'exam'; if (lv === 'all') return list;
  const at = t => list.filter(q => (q.tier || 2) === t);
  if (lv === 'mixed') { const p = list.filter(q => (q.tier || 2) >= 2); return p.length ? p : list; }
  const h = at(3); if (h.length) return h; const m = at(2); return m.length ? m : list;
}
// ---------- selection ----------
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
function dueIds(sec) { const now = Date.now(); return Object.entries(S.q).filter(([id, r]) => BY[id] && (!sec || BY[id].section === sec) && r.d <= now && (r.b < 5 || r.l === 0)).sort((a, b) => a[1].d - b[1].d).map(e => e[0]); }
function unseenIn(topic) { return tierPool((TQ[topic] || []).filter(q => !S.q[q.id])); }
function buildFor(sec, n, avoid) {
  const out = []; const used = new Set(avoid);
  const dues = dueIds(sec).filter(id => !used.has(id)); for (const id of dues.slice(0, Math.ceil(n * .3))) { out.push(id); used.add(id); }
  let topics = TOPICS[sec].slice(); let guard = 0;
  while (out.length < n && guard++ < n * 20) {
    const cand = topics.filter(t => unseenIn(t).some(q => !used.has(q.id)));
    if (!cand.length) break;
    const bestT = t => Math.max(...unseenIn(t).map(q => q.tier || 2)); const tw = { 3: 1, 2: .6, 1: .25 }; const w = cand.map(t => (5 - topicStat(t).lvl) * ((S.level || 'exam') === 'all' ? 1 : tw[bestT(t)])); const tot = w.reduce((a, b) => a + b, 0); let x = Math.random() * tot, t = cand[0];
    for (let i = 0; i < cand.length; i++) { x -= w[i]; if (x <= 0) { t = cand[i]; break; } }
    const lv = topicStat(t).lvl; const pool = unseenIn(t).filter(q => !used.has(q.id)); const ok = pool.filter(q => q.diff <= lv + 2);
    const q = pick(ok.length ? ok : pool, 1)[0]; out.push(q.id); used.add(q.id);
  }
  if (out.length < n) { const rest = DATA[sec].filter(q => !used.has(q.id)).sort((a, b) => ((S.q[a.id] || {}).b || 0) - ((S.q[b.id] || {}).b || 0)); for (const q of rest.slice(0, n - out.length)) out.push(q.id); }
  return out;
}
function buildDaily(n) {
  const share = { QADI: .43, LR: .29, VARC: .28 }; const ids = []; let rem = n;
  SECS.forEach((s, i) => { const k = i === 2 ? rem : Math.round(n * share[s]); rem -= k; ids.push(...buildFor(s, k, ids)); });
  // interleave in chunks of ~5 so sections alternate
  const by = {}; SECS.forEach(s => by[s] = shuffle(ids.filter(id => BY[id].section === s))); const out = [];
  while (out.length < ids.length) for (const s of shuffle(SECS)) out.push(...by[s].splice(0, 5));
  return out;
}
function buildTopicSet(topic, n = 10) {
  const lv = topicStat(topic).lvl; const all = TQ[topic]; const dues = dueIds().filter(id => (BY[id].concept || BY[id].topic) === topic).slice(0, 3);
  const un = unseenIn(topic).sort((a, b) => Math.abs(a.diff - (lv + 1.5)) - Math.abs(b.diff - (lv + 1.5)) + (Math.random() - .5)).map(q => q.id);
  let ids = [...dues]; for (const id of un) { if (ids.length >= n) break; if (!ids.includes(id)) ids.push(id); }
  if (ids.length < n) for (const q of shuffle(tierPool(all).concat(all))) { if (ids.length >= n) break; if (!ids.includes(q.id)) ids.push(q.id); }
  return shuffle(ids);
}

// ---------- audio / fx ----------
let ac; function sfx(kind) {
  if (!S.sound) return; try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const seq = { ok: [[660, .08], [880, .12]], bad: [[200, .18]], up: [[523, .1], [659, .1], [784, .1], [1046, .2]], tick: [[440, .04]] }[kind]; let t = ac.currentTime;
    for (const [f, d] of seq) { const o = ac.createOscillator(), g = ac.createGain(); o.type = kind === 'bad' ? 'sawtooth' : 'sine'; o.frequency.value = f; g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d); t += d; }
  } catch { }
}
function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p); } catch { } }
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800); }
function confetti() { const em = ['🎉', '⭐', '🔥', '✨', '💎']; for (let i = 0; i < 24; i++) { const e = document.createElement('div'); e.className = 'confetti'; e.textContent = em[i % em.length]; e.style.left = Math.random() * 100 + 'vw'; e.style.animationDelay = Math.random() * .5 + 's'; document.body.appendChild(e); setTimeout(() => e.remove(), 2400); } }

// ---------- stimulus rendering ----------
function tableHTML(st) { return `<div class="stim"><h4>${esc(st.title || '')}${st.unit ? ` <span class="small">(${esc(st.unit)})</span>` : ''}</h4><table class="t"><tr>${st.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr>${st.rows.map(r => `<tr>${r.map((c, i) => `<td${i === 0 ? ' style="text-align:left"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>`; }
function legend(names) { return `<div class="legend">${names.map((n, i) => `<span><i style="background:${COLORS[i % COLORS.length]}"></i>${esc(n)}</span>`).join('')}</div>`; }
function barSVG(st) {
  const W = 640, H = 270, L = 40, R = 40, T = 20, B = 36;
  const pct = st.series.map(s => /%/.test(s.name)); const hasLine = pct.some(Boolean) && pct.some(x => !x);
  const bars = st.series.filter((s, i) => !(hasLine && pct[i])), lines = st.series.filter((s, i) => hasLine && pct[i]);
  const n = st.labels.length; const stacked = !!st.stacked;
  const tot = stacked ? st.labels.map((_, i) => bars.reduce((a, s) => a + s.values[i], 0)) : null;
  const max = Math.ceil(Math.max(...(stacked ? tot : bars.flatMap(s => s.values))) * 1.12 / 10) * 10 || 10;
  const x0 = L, pw = W - L - R, ph = H - T - B; const gw = pw / n; const bw = stacked ? gw * .55 : gw * .8 / bars.length;
  let g = ''; for (let k = 0; k <= 4; k++) { const y = T + ph - ph * k / 4; g += `<line x1="${x0}" x2="${W - R}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${x0 - 6}" y="${y + 4}" font-size="11" text-anchor="end">${Math.round(max * k / 4)}</text>`; }
  bars.forEach((s, si) => st.labels.forEach((lb, i) => {
    let v = s.values[i], x, y, h;
    if (stacked) { const below = bars.slice(0, si).reduce((a, t) => a + t.values[i], 0); h = ph * v / max; y = T + ph - ph * below / max - h; x = x0 + gw * i + (gw - bw) / 2; }
    else { h = ph * v / max; y = T + ph - h; x = x0 + gw * i + gw * .1 + bw * si; }
    g += `<rect x="${x}" y="${y}" width="${bw - 2}" height="${h}" rx="3" fill="${COLORS[si % COLORS.length]}"/>`;
    if (n * bars.length <= 24 && h > 14) g += `<text x="${x + (bw - 2) / 2}" y="${stacked ? y + h / 2 + 4 : y - 4}" font-size="10" text-anchor="middle" ${stacked ? 'fill="#fff" style="fill:#fff"' : ''}>${v}</text>`;
  }));
  st.labels.forEach((lb, i) => g += `<text x="${x0 + gw * i + gw / 2}" y="${H - 14}" font-size="11" text-anchor="middle">${esc(lb)}</text>`);
  if (lines.length) { const lm = Math.ceil(Math.max(...lines.flatMap(s => s.values)) * 1.2 / 5) * 5; lines.forEach(s => { const pts = s.values.map((v, i) => [x0 + gw * i + gw / 2, T + ph - ph * v / lm]); g += `<polyline fill="none" stroke="#ff4b4b" stroke-width="3" points="${pts.map(p => p.join(',')).join(' ')}"/>` + pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#ff4b4b"/><text x="${p[0]}" y="${p[1] - 8}" font-size="10" text-anchor="middle" style="fill:#ff4b4b">${s.values[i]}%</text>`).join(''); g += `<text x="${W - R + 6}" y="${T + 10}" font-size="10">right: %</text>`; }); }
  return `<div class="stim"><h4>${esc(st.title)}${st.unit ? ` (${esc(st.unit)})` : ''}</h4><svg viewBox="0 0 ${W} ${H}" width="100%">${g}</svg>${legend(st.series.map(s => s.name))}</div>`;
}
function lineSVG(st) {
  const W = 640, H = 260, L = 40, R = 20, T = 20, B = 34; const n = st.labels.length; const all = st.series.flatMap(s => s.values); const max = Math.ceil(Math.max(...all) * 1.15 / 10) * 10, min = 0;
  const pw = W - L - R, ph = H - T - B; let g = '';
  for (let k = 0; k <= 4; k++) { const y = T + ph - ph * k / 4; g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${L - 6}" y="${y + 4}" font-size="11" text-anchor="end">${Math.round(max * k / 4)}</text>`; }
  st.series.forEach((s, si) => { const pts = s.values.map((v, i) => [L + pw * (n === 1 ? .5 : i / (n - 1)), T + ph - ph * (v - min) / (max - min)]); g += `<polyline fill="none" stroke="${COLORS[si % COLORS.length]}" stroke-width="3" points="${pts.map(p => p.join(',')).join(' ')}"/>` + pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="${COLORS[si % COLORS.length]}"/><text x="${p[0]}" y="${p[1] - 10}" font-size="11" text-anchor="middle">${s.values[i]}</text>`).join(''); });
  st.labels.forEach((lb, i) => g += `<text x="${L + pw * (n === 1 ? .5 : i / (n - 1))}" y="${H - 12}" font-size="11" text-anchor="middle">${esc(lb)}</text>`);
  return `<div class="stim"><h4>${esc(st.title)}</h4><svg viewBox="0 0 ${W} ${H}" width="100%">${g}</svg>${st.series.length > 1 ? legend(st.series.map(s => s.name)) : ''}</div>`;
}
function pieSVG(st, size = 220) {
  const tot = st.values.reduce((a, b) => a + b, 0); let a0 = -Math.PI / 2, g = ''; const c = size / 2, r = size / 2 - 8;
  st.values.forEach((v, i) => { const a1 = a0 + 2 * Math.PI * v / tot; const large = a1 - a0 > Math.PI ? 1 : 0; const p = (a, rr) => [c + rr * Math.cos(a), c + rr * Math.sin(a)];
    const [x0, y0] = p(a0, r), [x1, y1] = p(a1, r), [tx, ty] = p((a0 + a1) / 2, r * .65);
    g += st.values.length === 1 ? `<circle cx="${c}" cy="${c}" r="${r}" fill="${COLORS[0]}"/>` : `<path d="M${c},${c} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z" fill="${COLORS[i % COLORS.length]}" stroke="var(--card)" stroke-width="2"/>`;
    if (v / tot > .05) g += `<text x="${tx}" y="${ty + 4}" font-size="12" font-weight="800" text-anchor="middle" style="fill:#fff">${v}%</text>`; a0 = a1; });
  return `<div style="text-align:center">${st.title ? `<h4 style="margin:0 0 6px">${esc(st.title)}</h4>` : ''}<svg viewBox="0 0 ${size} ${size}" width="${size}" style="max-width:100%">${g}</svg>${legend(st.labels.map((l, i) => `${l} (${st.values[i]}%)`))}${st.note ? `<div class="small">${esc(st.note)}</div>` : ''}</div>`;
}
function stimHTML(st) {
  if (!st) return '';
  switch (st.type) {
    case 'table': return tableHTML(st);
    case 'tables2': return st.tables.map(tableHTML).join('');
    case 'bar': return barSVG(st);
    case 'line': return lineSVG(st);
    case 'pie': return `<div class="stim">${pieSVG(st)}</div>`;
    case 'pies2': return `<div class="stim"><h4>${esc(st.title)}</h4><div class="row" style="flex-wrap:wrap">${st.pies.map(p => `<div style="min-width:220px">${pieSVG(p, 190)}</div>`).join('')}</div></div>`;
    case 'passage': return `<div class="stim"><h4>${esc(st.title || 'Passage')}</h4><div class="passage">${esc(st.text)}</div></div>`;
    case 'di_data': { const d = st.data;
      if (d.categories) return barSVG({ title: d.title, labels: d.categories, series: Object.entries(d.series).map(([name, values]) => ({ name, values })) });
      if (d.pie_share_of_state_population_pct) { const ks = Object.keys(d.pie_share_of_state_population_pct); return `<div class="stim">${pieSVG({ title: 'Share of population (%)', labels: ks, values: ks.map(k => d.pie_share_of_state_population_pct[k]) })}${barSVG({ title: 'Male share of each state (%)', labels: ks, series: [{ name: 'Male %', values: ks.map(k => d.bar_male_pct[k]) }] })}</div>`; }
      return ''; }
  }
  return '';
}

// ---------- views ----------
const app = $('#app'); let SES = null, EX = null, timerH = null;
function setView(html) {
  clearInterval(timerH); app.innerHTML = `<div class="scroller">${html}</div>`;
  const f = app.querySelector('.scroller > .foot'); if (f) app.appendChild(f);
}
function topBar(back) { const d = today(); const p = Math.min(100, Math.round(d.n / S.goal * 100)); return `<div class="top">${back ? `<button class="back" data-go="${back}">✕</button>` : ''}<div class="grow"><b style="font-size:18px">Drills</b></div><span class="chip fire">🔥 ${liveStreak()}</span><span class="chip xp">⚡ ${S.xp}</span><div class="ring" style="--p:${p}" title="Daily goal"><span>${d.n}</span></div></div>`; }
let homeSec = 'QADI';
function lvlBadge(l) { return `<span class="lvl l${l}">${LEVELS[l]}</span>`; }
function crowns(l) { return `<div class="crowns">${[1, 2, 3, 4].map(i => `<i class="${l >= i ? 'on' : ''}"></i>`).join('')}</div>`; }
function viewHome() {
  const d = today(); const left = Math.max(0, S.goal - d.n); const dues = dueIds().length;
  const node = t => { const st = topicStat(t); const tot = TQ[t].length; const seen = TQ[t].filter(q => S.q[q.id]).length; return `<button class="node ${st.lvl >= 4 ? 'done' : st.lvl === 0 ? 'start' : ''}" data-topic="${esc(t)}"><div class="ico">${iconFor(t)}</div><div class="meta"><div class="name">${esc(shortName(t))}</div><div class="sub">${seen}/${tot} seen${st.n ? ` · ${Math.round(st.acc * 100)}% recent` : ''}</div>${crowns(st.lvl)}</div>${lvlBadge(st.lvl)}</button>`; };
  let nodes = ''; if (homeSec !== 'PYQ') { let g = null; for (const t of TOPICS[homeSec]) { if (CON[t].group !== g) { g = CON[t].group; nodes += `<div class="section-title grp">${esc(g)}</div>`; } nodes += node(t); } }
  const pyq = DATA.PYQ.filter(q => !q.needs_image);
  setView(`${topBar()}
  <div class="hero"><h2>${left ? `${left} more to hit today's goal` : 'Daily goal complete! 🎉'}</h2><p>${dues ? `${dues} questions due for review · ` : ''}Mixed practice weighted like the real test (30/20/20 points).</p><button class="btn white" data-act="daily">${left ? `Start daily ${left > 100 ? 100 : left}` : 'Keep going — 50 more'}</button></div>
  <div class="row"><button class="btn blue" data-act="mock">Mock test</button><button class="btn ghost" data-go="#/review">Review (${reviewIds().length})</button></div>
  <div class="tabs">${SECS.map(s => `<button class="tab ${homeSec === s ? 'on' : ''}" data-sec="${s}">${s}</button>`).join('')}<button class="tab ${homeSec === 'PYQ' ? 'on' : ''}" data-sec="PYQ">2025 Paper</button></div>
  ${homeSec === 'PYQ' ? `<div class="card"><h3>Official 2025 paper</h3><p class="small">${pyq.length} verified questions (${DATA.PYQ.length - pyq.length} that depend on a figure are left out).</p><button class="btn" data-act="pyq">Practise in order</button></div>` : `<div class="path">${nodes}</div>`}
  <div class="row" style="margin-top:12px"><button class="btn ghost" data-go="#/stats">Stats</button><button class="btn ghost" data-go="#/settings">Settings</button></div>`);
}
function reviewIds() { const wrong = Object.entries(S.q).filter(([id, r]) => BY[id] && r.l === 0).map(e => e[0]); return [...new Set([...wrong, ...S.bm.filter(id => BY[id])])]; }
function viewTopic(t) {
  const c = CON[t]; if (!c || !TQ[t]) return viewHome(); const st = topicStat(t); const left = TQ[t].filter(q => !S.q[q.id]).length;
  setView(`${topBar('#/')}
  <div style="padding:18px 0 4px"><div class="small">${esc(c.section)} · ${esc(c.group)} · ${lvlBadge(st.lvl)}</div><h1 style="font-size:26px;margin-top:4px">${c.icon} ${esc(c.title)}</h1><p class="small">Drills on this concept only. Stuck? The lesson is one swipe away.</p></div>
  <button class="btn ghost" data-learn="${esc(t)}" style="margin:10px 0">📘 Read the lesson</button>
  <div class="card"><div class="row"><div><b>${TQ[t].length}</b><div class="small">questions</div></div><div><b>${left}</b><div class="small">unseen</div></div><div><b>${st.n ? Math.round(st.acc * 100) + '%' : '–'}</b><div class="small">recent accuracy</div></div></div></div>
  <div class="foot"><div class="in row"><button class="btn" data-act="topic" data-t="${esc(t)}">Practise 10</button><button class="btn blue" data-act="topic20" data-t="${esc(t)}">Practise 25</button></div></div>`);
}
function explainHTML(q) {
  const n = NOTES[q.topic + '||' + q.sub];
  return `<div class="sol"><b>Solution</b><br>${esc(q.solution)}</div>` +
    (n ? `<div class="ex"><div class="ex-h">🧭 Method</div><p>${esc(n.m)}</p><div class="ex-h warn">⚠️ Watch out</div><p>${esc(n.w)}</p></div>` : '') +
    (CON[q.concept] ? `<button class="link" data-lesson="${esc(q.concept)}">📘 Review the lesson: ${esc(shortName(q.concept))}</button>` : '');
}
// ----- practice session -----
function startSession(ids, kind, title) { if (!ids.length) return toast('Nothing to practise yet'); SES = { ids, i: 0, kind, title, combo: 0, best: 0, xp: 0, ok: 0, n: 0, sel: null, checked: false, hint: 0, hinted: false, t0: Date.now(), wrong: [] }; location.hash = '#/play'; renderQ(); }
function renderQ() {
  if (!SES) return viewHome();
  if (SES.i >= SES.ids.length) return finishSession();
  const q = BY[SES.ids[SES.i]]; const pct = Math.round(SES.i / SES.ids.length * 100);
  const bm = S.bm.includes(q.id);
  setView(`<div class="top"><button class="back" data-act="quit">✕</button><div class="progress"><div style="width:${pct}%"></div></div><span class="chip fire">🔥 ${SES.combo}</span></div>
  <div class="qwrap"><div class="small">${esc(shortName(q.concept || q.topic))} · ${SES.i + 1}/${SES.ids.length} <button class="link" data-act="bm" style="float:right">${bm ? '★ Saved' : '☆ Save'}</button></div>
  ${stimHTML(q.stim)}<div class="stem">${esc(q.stem)}</div>
  <div id="opts">${q.options.map((o, i) => `<button class="opt" data-opt="${i}"><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`).join('')}</div>
  <div id="hints"></div><button class="link" data-act="hint">💡 Hint</button></div>
  <div class="foot" id="foot"><div class="in"><button class="btn" id="check" disabled>Check</button></div></div>`);
  SES.sel = null; SES.checked = false; SES.hint = 0; SES.hinted = false; SES.q0 = Date.now();
}
function lessonSheet(t) {
  const c = CON[t]; if (!c) return; document.querySelector('.sheet')?.remove();
  const el = document.createElement('div'); el.className = 'sheet';
  el.innerHTML = `<div class="sheet-in"><button class="back" data-close>✕</button>${conceptHTML(c, true)}</div>`;
  el.addEventListener('click', e => { if (e.target === el || e.target.closest('[data-close]')) el.remove(); });
  document.body.appendChild(el);
}
function pickOpt(i) { if (!SES || SES.checked) return; SES.sel = i; document.querySelectorAll('.opt').forEach((b, j) => b.classList.toggle('sel', j === i)); const c = $('#check'); if (c) { c.disabled = false; } }
function checkAns() {
  if (!SES || SES.checked || SES.sel == null) return; SES.checked = true; const q = BY[SES.ids[SES.i]]; const ok = SES.sel === q.answer; const ms = Date.now() - SES.q0;
  document.querySelectorAll('.opt').forEach((b, j) => { b.classList.remove('sel'); if (j === q.answer) b.classList.add('ok'); else if (j === SES.sel) b.classList.add('bad'); });
  let gain = 0;
  if (ok) { SES.combo++; SES.best = Math.max(SES.best, SES.combo); gain = SES.hinted ? 5 : 10 + Math.min(10, Math.max(0, SES.combo - 2) * 2) + (ms < (q.secs || 60) * 500 ? 3 : 0); SES.ok++; sfx('ok'); vibrate(15); }
  else { SES.combo = 0; SES.wrong.push(q.id); sfx('bad'); vibrate([30, 40, 30]); document.querySelector('.qwrap').classList.add('shake'); }
  SES.n++; SES.xp += gain; recordAnswer(q, ok, ms, SES.hinted); if (gain) addXp(gain); save();
  if (ok && SES.combo >= 3) { const c = document.createElement('div'); c.className = 'combo'; c.textContent = `🔥 ${SES.combo} in a row`; document.body.appendChild(c); setTimeout(() => c.remove(), 1200); }
  const last = SES.i + 1 >= SES.ids.length; const cp = (SES.i + 1) % 10 === 0 && !last;
  const f = $('#foot'); f.className = 'foot ' + (ok ? 'ok' : 'bad');
  f.innerHTML = `<div class="in"><div class="fb ${ok ? 'ok' : 'bad'}"><b>${ok ? ['Correct!', 'Nice!', 'Spot on!', 'Brilliant!'][Math.floor(Math.random() * 4)] : 'Not quite'}</b>${gain ? `<span>+${gain} XP</span>` : ''}</div>${explainHTML(q)}${cp ? `<div class="small" style="margin:6px 0">✅ ${SES.i + 1} done — ${SES.ok}/${SES.n} right</div>` : ''}<button class="btn ${ok ? '' : 'red'}" data-act="next" style="margin-top:10px">${last ? 'Finish' : 'Continue'}</button></div>`;
}
function nextQ() { if (!SES) return; SES.i++; renderQ(); }
function showHint() { if (!SES || SES.checked) return; const q = BY[SES.ids[SES.i]]; const hs = q.hints && q.hints.length ? q.hints : ['Re-read the question and eliminate options that cannot be right.']; if (SES.hint >= hs.length) return toast('No more hints'); $('#hints').insertAdjacentHTML('beforeend', `<div class="hint">💡 ${esc(hs[SES.hint])}</div>`); SES.hint++; SES.hinted = true; }
function finishSession() {
  const s = SES; const acc = s.n ? Math.round(s.ok / s.n * 100) : 0; const bonus = s.n >= 10 ? 20 : 0; if (bonus) addXp(bonus); save(); if (acc >= 80 && s.n >= 10) { confetti(); sfx('up'); }
  setView(`${topBar()}<div class="summary"><div class="big">${acc >= 80 ? '🏆' : acc >= 60 ? '💪' : '📚'}</div><h1>${acc >= 80 ? 'Excellent!' : acc >= 60 ? 'Good work' : 'Keep going'}</h1><p class="small">${esc(s.title || '')}</p>
  <div class="stats3"><div class="stat"><b>${acc}%</b><span>Accuracy</span></div><div class="stat"><b>+${s.xp + bonus}</b><span>XP</span></div><div class="stat"><b>${s.best}</b><span>Best combo</span></div></div>
  ${s.wrong.length ? `<button class="btn orange" data-act="retry">Retry ${s.wrong.length} missed</button>` : ''}<div style="height:10px"></div><button class="btn" data-go="#/">Done</button></div>`);
  const w = s.wrong; SES = null; EX = null; window._retry = w;
}
// ----- review -----
function viewReview() { const ids = reviewIds(); setView(`${topBar('#/')}<h2 style="margin:18px 0 6px">Review</h2><p class="small">Questions you missed last time, plus the ones you saved.</p>${ids.length ? `<button class="btn" data-act="reviewgo">Practise ${Math.min(ids.length, 20)}</button><div class="list card">${ids.slice(0, 40).map(id => `<div class="it"><span>${esc(shortName(BY[id].concept || BY[id].topic))}</span><span class="small">${S.bm.includes(id) ? '★' : '✗'}</span></div>`).join('')}</div>` : '<div class="card">Nothing to review — nice.</div>'}`); }
// ----- mock test -----
function buildMock(secs) {
  const sections = []; for (const s of secs) { const sh = MOCK_SHAPE[s]; const topics = TOPICS[s]; const used = new Set(); const ids = [];
    const unseen = DATA[s].filter(q => !S.q[q.id]); const poolBase = unseen.length >= sh.n * 2 ? unseen : DATA[s];
    const tm = {}; poolBase.forEach(q => (tm[q.topic] = tm[q.topic] || []).push(q)); const byT = {}; for (const t in tm) byT[t] = tierPool(tm[t]).map(q => q.id);
    const tl = shuffle(Object.keys(byT)); let i = 0; while (ids.length < sh.n && i < 500) { const t = tl[i++ % tl.length]; const id = pick(byT[t].filter(x => !used.has(x)), 1)[0]; if (id) { used.add(id); ids.push(id); } }
    sections.push({ sec: s, ids: shuffle(ids), mins: sh.mins * (ids.length / sh.n) }); }
  return sections;
}
function startMock(secs, label, custom) {
  const sections = custom || buildMock(secs);
  EX = { label, sections, si: 0, qi: 0, ans: {}, mark: {}, t0: Date.now(), secStart: Date.now(), results: [] }; location.hash = '#/exam'; renderExam(); timerH = setInterval(tickExam, 1000);
}
function renderExam() {
  if (!EX) return viewHome(); const sec = EX.sections[EX.si]; const id = sec.ids[EX.qi]; const q = BY[id];
  setView(`<div class="top"><div class="grow"><b>${esc(sec.sec)}</b> <span class="small">Q${EX.qi + 1}/${sec.ids.length}</span></div><span class="timer" id="tm">--:--</span></div>
  <div class="qwrap">${stimHTML(q.stim)}<div class="stem">${esc(q.stem)}</div>${q.options.map((o, i) => `<button class="opt ${EX.ans[id] === i ? 'sel' : ''}" data-xopt="${i}"><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`).join('')}
  <div class="pal">${sec.ids.map((x, i) => `<button data-xq="${i}" class="${EX.ans[x] != null ? 'ans' : ''} ${EX.mark[x] ? 'mark' : ''} ${i === EX.qi ? 'cur' : ''}">${i + 1}</button>`).join('')}</div>
  <div class="small">Correct +1 · wrong −⅓ · skipped 0</div></div>
  <div class="foot"><div class="in"><div class="row"><button class="btn ghost" data-xa="clear">Clear</button><button class="btn ghost" data-xa="mark">${EX.mark[id] ? 'Unmark' : 'Mark'}</button><button class="btn ${EX.qi + 1 < sec.ids.length ? '' : 'orange'}" data-xa="${EX.qi + 1 < sec.ids.length ? 'next' : 'submit'}">${EX.qi + 1 < sec.ids.length ? 'Next' : 'Submit section'}</button></div></div></div>`);
  tickExam(true);
}
function tickExam(first) {
  if (!EX) return; const sec = EX.sections[EX.si]; const left = Math.max(0, sec.mins * 60000 - (Date.now() - EX.secStart)); const el = $('#tm'); if (el) { const m = Math.floor(left / 60000), s = Math.floor(left % 60000 / 1000); el.textContent = `${m}:${String(s).padStart(2, '0')}`; }
  if (left <= 0 && !first) { toast('Time up for this section'); submitSection(); }
}
function submitSection() {
  const sec = EX.sections[EX.si]; let c = 0, w = 0, k = 0; sec.ids.forEach(id => { const a = EX.ans[id]; if (a == null) k++; else if (a === BY[id].answer) c++; else w++; });
  const raw = c - w / 3; const n = sec.ids.length;
  EX.results.push({ sec: sec.sec, n, c, w, k, raw, points: Math.max(0, raw / n) * (SEC_WEIGHT[sec.sec] || 0), maxPts: SEC_WEIGHT[sec.sec] || 0 });
  sec.ids.forEach(id => { const a = EX.ans[id]; if (a != null) recordAnswer(BY[id], a === BY[id].answer, 60000, false); }); save();
  if (EX.si + 1 < EX.sections.length) { EX.si++; EX.qi = 0; EX.secStart = Date.now(); renderExam(); } else finishExam();
}
function finishExam() {
  clearInterval(timerH); const r = EX.results; const tot = r.reduce((a, b) => a + b.points, 0), mx = r.reduce((a, b) => a + b.maxPts, 0);
  S.mocks.push({ t: Date.now(), label: EX.label, res: r.map(x => ({ sec: x.sec, raw: +x.raw.toFixed(2), n: x.n })), points: +tot.toFixed(1), max: mx }); save(); const ex = EX; window._exam = ex;
  setView(`${topBar()}<div class="summary"><div class="big">📝</div><h1>${esc(ex.label)} complete</h1><p class="small">Indicative score: ${tot.toFixed(1)} / ${mx} points</p>
  ${r.map(x => `<div class="card" style="text-align:left"><b>${x.sec}</b> <span class="small">· ${x.points.toFixed(1)}/${x.maxPts} pts</span><div class="small">${x.c} correct · ${x.w} wrong · ${x.k} skipped · raw ${x.raw.toFixed(2)} / ${x.n}</div>${x.raw <= 0 ? '<div class="small" style="color:var(--red)">Raw score must be positive in every section to qualify.</div>' : ''}<div class="bar"><div style="width:${Math.max(0, x.raw / x.n * 100)}%"></div></div></div>`).join('')}
  <button class="btn orange" data-act="exreview">Review all answers</button><div style="height:10px"></div><button class="btn" data-go="#/">Done</button></div>`);
  EX = null; confetti();
}
function viewExamReview() {
  const ex = window._exam; if (!ex) return viewHome(); const items = ex.sections.flatMap(s => s.ids);
  setView(`${topBar('#/')}<h2 style="margin:16px 0">Answer review</h2>${items.map((id, i) => { const q = BY[id], a = ex.ans[id]; const st = a == null ? 'Skipped' : a === q.answer ? 'Correct' : 'Wrong'; return `<div class="card">${stimHTML(q.stim)}<div class="small">${i + 1} · ${esc(shortName(q.topic))} · <b style="color:${st === 'Correct' ? 'var(--green-d)' : st === 'Wrong' ? 'var(--red)' : 'var(--muted)'}">${st}</b></div><div class="stem" style="font-size:16px">${esc(q.stem)}</div>${q.options.map((o, j) => `<div class="opt ${j === q.answer ? 'ok' : j === a ? 'bad' : ''}" style="margin:6px 0"><span class="k">${j + 1}</span><span>${esc(o)}</span></div>`).join('')}<div class="small">${explainHTML(q)}</div></div>`; }).join('')}`);
}
// ----- stats / settings -----
function viewStats() {
  const days = []; for (let i = 13; i >= 0; i--) days.push(S.days[dayKey(Date.now() - i * DAY)] || { n: 0 });
  const tot = Object.values(S.days).reduce((a, d) => ({ n: a.n + d.n, c: a.c + d.c, ms: a.ms + (d.ms || 0) }), { n: 0, c: 0, ms: 0 });
  const secRows = SECS.map(s => { let n = 0, c = 0; TOPICS[s].forEach(t => { const x = S.topics[t]; if (x) { n += x.n; c += x.c; } }); const seen = DATA[s].filter(q => S.q[q.id]).length; return `<div style="margin:10px 0"><b>${s}</b> <span class="small">${seen}/${DATA[s].length} seen · ${n ? Math.round(c / n * 100) : 0}% accuracy</span><div class="bar"><div style="width:${seen / DATA[s].length * 100}%"></div></div></div>`; }).join('');
  const weak = Object.keys(TQ).filter(t => CON[t]).map(t => ({ t, s: topicStat(t) })).filter(x => x.s.n >= 8).sort((a, b) => a.s.acc - b.s.acc).slice(0, 6);
  setView(`${topBar('#/')}<h2 style="margin:18px 0 8px">Your progress</h2>
  <div class="stats3"><div class="stat"><b>${tot.n}</b><span>Answered</span></div><div class="stat"><b>${tot.n ? Math.round(tot.c / tot.n * 100) : 0}%</b><span>Accuracy</span></div><div class="stat"><b>${tot.n ? Math.round(tot.ms / tot.n / 1000) : 0}s</b><span>Avg time</span></div></div>
  <div class="stats3"><div class="stat"><b>🔥 ${liveStreak()}</b><span>Streak</span></div><div class="stat"><b>${S.best}</b><span>Best streak</span></div><div class="stat"><b>Lv ${playerLevel()}</b><span>${S.xp} XP</span></div></div>
  <div class="card"><h3>Last 14 days</h3><div class="heatmap">${days.map(d => `<i class="${d.n >= S.goal ? 'a3' : d.n >= S.goal / 2 ? 'a2' : d.n ? 'a1' : ''}" title="${d.n}"></i>`).join('')}</div></div>
  <div class="card"><h3>Coverage</h3>${secRows}</div>
  <div class="card"><h3>Weakest topics</h3>${weak.length ? weak.map(x => `<div class="it" style="display:flex;justify-content:space-between;padding:6px 0"><span>${esc(shortName(x.t))}</span><b>${Math.round(x.s.acc * 100)}%</b></div>`).join('') : '<span class="small">Answer a few more questions to see this.</span>'}</div>
  <div class="card"><h3>Mock tests</h3>${S.mocks.length ? S.mocks.slice(-6).reverse().map(m => `<div class="it" style="display:flex;justify-content:space-between;padding:6px 0"><span>${new Date(m.t).toLocaleDateString()} · ${esc(m.label)}</span><b>${m.points}/${m.max}</b></div>`).join('') : '<span class="small">No mock tests yet.</span>'}</div>`);
}
function exportASAP() {
  const out = { app: 'ugat-drills', version: 1, exported: new Date().toISOString(), streak: liveStreak(), dailyGoal: S.goal, today: today(), due: dueIds().length,
    topics: Object.keys(TQ).map(t => { const st = topicStat(t); return { id: t, name: shortName(t), section: TQ[t][0].section, level: st.lvl, levelName: LEVELS[st.lvl], answered: st.n, recentAccuracy: +st.acc.toFixed(2) }; }), mocks: S.mocks };
  download('ugat-asap-export.json', JSON.stringify(out, null, 2));
}
function download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
function viewSettings() {
  setView(`${topBar('#/')}<h2 style="margin:18px 0 8px">Settings</h2>
  <div class="card"><label class="sw">Daily goal<select id="goal">${[50, 100, 150, 200].map(g => `<option ${S.goal === g ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
  <label class="sw">Question level<select id="lvl">${Object.entries(LEVEL_NAMES).map(([k, v]) => `<option value="${k}" ${(S.level || 'exam') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
  <p class="small" style="margin:0 0 8px">Exam level uses multi-step questions modelled on the 2025 paper and the sample papers. Where a topic has none left, easier questions fill in.</p>
  <label class="sw">Sound<input type="checkbox" id="snd" ${S.sound ? 'checked' : ''}></label>
  <label class="sw">Theme<select id="theme">${['auto', 'light', 'dark'].map(g => `<option ${S.theme === g ? 'selected' : ''}>${g}</option>`).join('')}</select></label></div>
  <div class="card"><h3>Your data</h3><p class="small">Progress is stored on this device only.</p><div class="row"><button class="btn ghost" data-act="backup">Back up</button><button class="btn ghost" data-act="restore">Restore</button></div><div style="height:10px"></div><button class="btn blue" data-act="asap">Export for ASAP</button><div style="height:10px"></div><button class="btn red" data-act="reset">Reset all progress</button></div>
  <p class="small" style="text-align:center">Questions: ${DATA.QADI.length} QADI · ${DATA.LR.length} LR · ${DATA.VARC.length} Verbal · ${DATA.PYQ.length} official · ${['QADI','LR','VARC'].reduce((a, k) => a + DATA[k].filter(q => q.tier === 3).length, 0)} at exam level</p>`);
}
function applyTheme() { const t = S.theme; if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }

// ---------- learn pane ----------
let LV = { id: null, sec: 'QADI', q: '' };
const learnEl = $('#learn'), pager = $('#pager'), seg = $('#seg');
const isWide = () => matchMedia('(min-width:900px)').matches;
function goPane(n) { if (isWide()) return; pager.scrollTo({ left: n * pager.clientWidth, behavior: 'smooth' }); }
const para = p => esc(p).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
function conceptHTML(c, sheet) {
  const st = topicStat(c.id); const nq = (TQ[c.id] || []).length;
  const part = (k, h, body) => body ? `<section class="lsec" data-k="${k}"><h3>${h}</h3>${body}</section>` : '';
  const explain = (c.explain || []).map(p => p.startsWith('## ') ? `<h4 class="sub">${para(p.slice(3))}</h4>` : `<p>${para(p)}</p>`).join('');
  const formulae = (c.formulae || []).length ? `<div class="fgrid">${c.formulae.map(f => `<div class="fm"><div class="fn">${esc(f[0])}</div><div class="fx">${esc(f[1])}</div>${f[2] ? `<div class="fnote">${para(f[2])}</div>` : ''}</div>`).join('')}</div>` : '';
  const deriv = (c.derivation || []).map(d => `<details class="dv"><summary>${para(d.t)}</summary><ol>${d.s.map(x => `<li>${para(x)}</li>`).join('')}</ol></details>`).join('');
  const diags = (c.diagrams || []).map(d => `<figure class="figbox">${d.svg}<figcaption>${para(d.cap || '')}</figcaption></figure>`).join('');
  const solved = (c.solved || []).map((x, i) => `<details class="sv"><summary><b>Q${i + 1}.</b> ${para(x.q)}</summary><ol>${x.s.map(y => `<li>${para(y)}</li>`).join('')}</ol><div class="ans">Answer: ${para(x.a)}</div></details>`).join('');
  const traps = (c.traps || []).length ? `<ul class="traps">${c.traps.map(x => `<li>${para(x)}</li>`).join('')}</ul>` : '';
  const pre = (c.prereq || []).filter(p => CON[p]).map(p => `<button class="chipbtn" ${sheet ? 'data-lesson' : 'data-lopen'}="${p}">${CON[p].icon} ${esc(CON[p].title)}</button>`).join('');
  const nav = [['analogy', 'Analogy', c.analogy], ['explain', 'Explanation', explain], ['formulae', 'Formulae', formulae], ['derive', 'Derivation', deriv], ['figs', 'Diagrams', diags], ['solved', 'Solved sums', solved]].filter(x => x[2]);
  return `<article class="lpage">
  <div class="small">${esc(c.section)} · ${esc(c.group)}</div>
  <h1 class="ltitle">${c.icon} ${esc(c.title)}</h1>
  ${c.ncert && c.ncert.length ? `<div class="ncert">${c.ncert.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
  ${pre ? `<div class="small" style="margin-top:10px">Builds on</div><div class="chips">${pre}</div>` : ''}
  <div class="jump">${nav.map(x => `<button data-jump="${x[0]}">${x[1]}</button>`).join('')}</div>
  ${part('analogy', '🎭 Analogy', c.analogy ? `<div class="analogy">${para(c.analogy)}</div>` : '')}
  ${part('explain', '📖 Explanation', explain)}
  ${part('formulae', '🧮 Formulae', formulae)}
  ${part('derive', '🔬 Derivations', deriv ? `<p class="small">Tap to open. Try to predict the next step before you read it.</p>${deriv}` : '')}
  ${part('figs', '📈 Diagrams', diags)}
  ${part('solved', '✏️ Solved sums', solved ? `<p class="small">Attempt each one on paper first, then open the solution.</p>${solved}` : '')}
  ${part('traps', '⚠️ Common traps', traps)}
  ${sheet ? '' : `<div class="lcta"><div class="small">${nq} drill questions on this concept${st.n ? ` · ${Math.round(st.acc * 100)}% recent` : ''}</div>${nq ? `<button class="btn" data-practise="${c.id}">Practise this concept →</button>` : ''}</div>`}
  </article>`;
}
function renderLearn(top = true) {
  let html;
  if (LV.id && CON[LV.id]) {
    const c = CON[LV.id]; const sib = CONS.filter(x => x.section === c.section); const i = sib.findIndex(x => x.id === c.id); const nx = sib[i + 1];
    html = `<div class="top"><button class="back" data-lback>‹</button><div class="grow"><b style="font-size:18px">Learn</b></div><span class="lvl l${topicStat(c.id).lvl}">${LEVELS[topicStat(c.id).lvl]}</span></div>${conceptHTML(c)}${nx ? `<button class="btn ghost" data-lopen="${nx.id}" style="margin-top:14px">Next: ${nx.icon} ${esc(nx.title)} →</button>` : ''}`;
  } else {
    const done = CONS.filter(x => S.read[x.id]).length;
    html = `<div class="top"><div class="grow"><b style="font-size:18px">Learn</b></div><span class="chip">${done}/${CONS.length} read</span></div>
    <p class="small" style="margin:12px 0 0">Every concept explained from first principles — analogy, logic, formulae, derivations, diagrams and worked sums. Swipe left for the drills.</p>
    <div class="tabs">${SECS.map(s => `<button class="tab ${LV.sec === s ? 'on' : ''}" data-lsec="${s}">${s === 'VARC' ? 'Verbal' : s}</button>`).join('')}</div>
    <input type="search" id="lq" class="lq" placeholder="Search concepts…" value="${esc(LV.q)}"><div id="llist">${learnList()}</div>`;
  }
  learnEl.innerHTML = `<div class="scroller">${html}</div>`;
  if (top) learnEl.firstChild.scrollTop = 0;
}
function learnList() {
  const q = LV.q.trim().toLowerCase(); let g = null, out = '';
  for (const c of CONS) {
    if (c.section !== LV.sec) continue;
    if (q && !(c.title + ' ' + c.group + ' ' + (c.ncert || []).join(' ')).toLowerCase().includes(q)) continue;
    if (c.group !== g) { g = c.group; out += `<div class="section-title grp">${esc(g)}</div>`; }
    const st = topicStat(c.id);
    out += `<button class="node" data-lopen="${c.id}"><div class="ico">${c.icon}</div><div class="meta"><div class="name">${esc(c.title)}</div><div class="sub">${esc((c.ncert || [])[0] || '')}</div>${crowns(st.lvl)}</div>${S.read[c.id] ? '<span class="lvl l1">Read ✓</span>' : '<span class="lvl">New</span>'}</button>`;
  }
  return out || '<div class="card small">No concept matches.</div>';
}
function openConcept(id, pane) { LV.id = id; LV.sec = CON[id].section; S.read[id] = S.read[id] || Date.now(); save(); renderLearn(); if (pane) goPane(0); }
document.addEventListener('click', e => {
  const t = e.target.closest('[data-lopen],[data-learn],[data-lback],[data-lsec],[data-jump],[data-practise],#seg [data-pane]'); if (!t) return; const d = t.dataset;
  if (d.pane != null) return goPane(+d.pane);
  if (d.lopen) { e.stopPropagation(); return openConcept(d.lopen); }
  if (d.learn) return openConcept(d.learn, true);
  if (d.lback != null) { LV.id = null; return renderLearn(); }
  if (d.lsec) { LV.sec = d.lsec; return renderLearn(); }
  if (d.jump) { const box = t.closest('.lpage'); const el = box && box.querySelector(`[data-k="${d.jump}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  if (d.practise) { startSession(buildTopicSet(d.practise, 10), 'topic', shortName(d.practise)); goPane(1); }
});
document.addEventListener('input', e => { if (e.target.id === 'lq') { LV.q = e.target.value; $('#llist').innerHTML = learnList(); } });
pager.addEventListener('scroll', () => { const p = pager.scrollLeft / Math.max(1, pager.clientWidth); seg.style.setProperty('--p', Math.min(1, Math.max(0, p))); const on = p > .5 ? 1 : 0; seg.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === on)); }, { passive: true });

// ---------- events ----------
document.addEventListener('click', e => {
  const t = e.target.closest('[data-lesson],[data-go],[data-act],[data-topic],[data-sec],[data-opt],[data-xopt],[data-xq],[data-xa]'); if (!t) return; const d = t.dataset;
  if (d.lesson) return lessonSheet(d.lesson);
  if (d.go) { if (d.go === '#/' ) { SES = null; EX && 0; } location.hash = d.go; return route(); }
  if (d.sec) { homeSec = d.sec; return viewHome(); }
  if (d.topic) { location.hash = '#/topic/' + encodeURIComponent(d.topic); return route(); }
  if (d.opt != null) return pickOpt(+d.opt);
  if (d.xopt != null) { const id = EX.sections[EX.si].ids[EX.qi]; EX.ans[id] = +d.xopt; return renderExam(); }
  if (d.xq != null) { EX.qi = +d.xq; return renderExam(); }
  if (d.xa) { const sec = EX.sections[EX.si], id = sec.ids[EX.qi];
    if (d.xa === 'clear') { delete EX.ans[id]; return renderExam(); } if (d.xa === 'mark') { EX.mark[id] = !EX.mark[id]; return renderExam(); }
    if (d.xa === 'next') { EX.qi++; return renderExam(); }
    if (d.xa === 'submit') { const un = sec.ids.filter(x => EX.ans[x] == null).length; if (un && !confirm(`${un} unanswered. Submit this section?`)) return; return submitSection(); } }
  switch (d.act) {
    case 'daily': { const left = Math.max(0, S.goal - today().n); return startSession(buildDaily(left ? Math.min(left, 100) : 50), 'daily', 'Daily practice'); }
    case 'topic': return startSession(buildTopicSet(d.t, 10), 'topic', shortName(d.t));
    case 'topic20': return startSession(buildTopicSet(d.t, 25), 'topic', shortName(d.t));
    case 'next': return nextQ(); case 'hint': return showHint();
    case 'bm': { const id = SES.ids[SES.i]; S.bm = S.bm.includes(id) ? S.bm.filter(x => x !== id) : [...S.bm, id]; save(); t.textContent = S.bm.includes(id) ? '★ Saved' : '☆ Save'; return; }
    case 'quit': if (SES && SES.n && !confirm('End this session? Your progress is saved.')) return; if (SES && SES.n) return finishSession(); SES = null; location.hash = '#/'; return route();
    case 'retry': return startSession(shuffle(window._retry || []), 'retry', 'Missed questions');
    case 'mock': return mockMenu();
    case 'mockfull': return startMock(SECS, 'Full mock');
    case 'mockQADI': return startMock(['QADI'], 'QADI sectional'); case 'mockLR': return startMock(['LR'], 'LR sectional'); case 'mockVARC': return startMock(['VARC'], 'Verbal sectional');
    case 'pyq': { const ids = DATA.PYQ.filter(q => !q.needs_image).map(q => q.id); return startSession(ids, 'pyq', '2025 official paper'); }
    case 'pyqtimed': { const secs = SECS.map(s => ({ sec: s, ids: DATA.PYQ.filter(q => q.section === s && !q.needs_image).map(q => q.id), mins: MOCK_SHAPE[s].mins })).filter(s => s.ids.length); return startMock(null, '2025 official paper', secs); }
    case 'reviewgo': return startSession(pick(reviewIds(), 20), 'review', 'Review');
    case 'exreview': return viewExamReview();
    case 'backup': return download('ugat-backup.json', JSON.stringify(S));
    case 'restore': { const i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json'; i.onchange = () => { const f = i.files[0]; if (!f) return; f.text().then(x => { try { S = Object.assign(fresh(), JSON.parse(x)); save(); toast('Restored'); viewSettings(); } catch { toast('Invalid file'); } }); }; return i.click(); }
    case 'asap': return exportASAP();
    case 'reset': if (confirm('Erase all progress on this device?')) { S = fresh(); save(); toast('Reset'); viewSettings(); } return;
  }
});
document.addEventListener('change', e => { const t = e.target; if (t.id === 'goal') { S.goal = +t.value; save(); } if (t.id === 'lvl') { S.level = t.value; save(); toast('Level updated'); } if (t.id === 'snd') { S.sound = t.checked; save(); } if (t.id === 'theme') { S.theme = t.value; save(); applyTheme(); } });
document.addEventListener('keydown', e => {
  if (!SES || location.hash !== '#/play') return; if (['1', '2', '3', '4'].includes(e.key)) pickOpt(+e.key - 1);
  if (e.key === 'Enter') { if (SES.checked) nextQ(); else checkAns(); }
});
document.addEventListener('click', e => { if (e.target.id === 'check') checkAns(); }, true);
function mockMenu() {
  setView(`${topBar('#/')}<h2 style="margin:18px 0 8px">Mock tests</h2><p class="small">Timed, with the real negative marking (−⅓) and section times. Questions are drawn from topics you have not seen where possible.</p>
  <div class="card"><h3>Full mock · 60 questions · 135 min</h3><p class="small">QADI 30 (60 min) · LR 15 (45 min) · Verbal 15 (30 min)</p><button class="btn" data-act="mockfull">Start full mock</button></div>
  <div class="card"><h3>Sectionals</h3><div class="row"><button class="btn blue" data-act="mockQADI">QADI</button><button class="btn blue" data-act="mockLR">LR</button><button class="btn blue" data-act="mockVARC">Verbal</button></div></div>
  <div class="card"><h3>2025 official paper</h3><p class="small">Timed, original questions that don't need a figure.</p><button class="btn orange" data-act="pyqtimed">Start timed paper</button></div>`);
}
function route() {
  const h = location.hash || '#/'; clearInterval(timerH);
  document.body.classList.toggle('focus', h === '#/exam'); if (h === '#/exam') goPane(1);
  if (h === '#/play') return SES ? renderQ() : (location.hash = '#/', viewHome());
  if (h === '#/exam') { if (EX) { timerH = setInterval(tickExam, 1000); return renderExam(); } location.hash = '#/'; return viewHome(); }
  if (h.startsWith('#/topic/')) return viewTopic(decodeURIComponent(h.slice(8)));
  if (h === '#/stats') return viewStats(); if (h === '#/settings') return viewSettings(); if (h === '#/review') return viewReview();
  return viewHome();
}
window.addEventListener('hashchange', route);
(async () => {
  applyTheme();
  try { await loadData(); } catch (e) { app.innerHTML = '<div class="boot">Could not load data. Open this app through a web server (see README).</div>'; return; }
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
  window.__ugat = { S: () => S, DATA, BY, CON, buildDaily, startSession, openConcept, goPane };
  renderLearn(); route();
})();
