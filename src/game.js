// ARISE game rules + persistence.
// The save format is IDENTICAL to the original tracker (localStorage key "solo-system-v2"),
// so existing progress and exported .json backups keep working.

export const STORAGE_KEY = 'solo-system-v2';

// Finish at least DAILY_GOAL of these in a day and the day counts as complete: no penalty tomorrow.
export const DAILY_GOAL = 5;

export const QUESTS = [
  { id: 'body', name: 'Body Training', desc: 'Planned workout, walk or suitable physical activity', xp: 15, stat: 'STR' },
  { id: 'discipline', name: 'Discipline · Brain Habit Practice', desc: 'Choose one unhelpful habit or impulse to interrupt; practise a replacement for 10 minutes and record the trigger and what you did differently.', xp: 15, stat: 'DIS' },
  { id: 'coding', name: 'Code & Build', desc: 'Complete one focused 45-minute coding or AI session', xp: 15, stat: 'TEC' },
  { id: 'career', name: 'Career Intelligence', desc: 'Learn about money, career or life for 45 minutes', xp: 10, stat: 'ECO' },
  { id: 'social', name: 'Social Development', desc: 'Practise communication or meaningful connection', xp: 10, stat: 'SOC' },
  { id: 'recovery', name: 'Recovery Protocol', desc: 'Prioritise sleep and recovery', xp: 10, stat: 'DIS' },
];

export const WORKOUTS = {
  'Full-body option': '2 rounds: 8 squats, 5–10 push-ups (wall/knee is fine), 10 glute bridges, 20-second plank. Rest between rounds.',
  'Mobility option': '5–10 minutes of easy shoulder circles, hip hinges, calf raises and gentle stretches.',
  'Low-energy option': '10-minute easy walk and light mobility. Recovery counts; do not push through pain.',
};

export const ATTRS = [
  ['STR', 'Strength', 'Fitness and physical capability'],
  ['INT', 'Intelligence', 'Learning and problem-solving'],
  ['DIS', 'Discipline', 'Consistency and follow-through'],
  ['TEC', 'Coding & AI', 'Technical mastery and projects'],
  ['ECO', 'Career & Money', 'Financial literacy and employability'],
  ['SOC', 'Social Ability', 'Communication and relationships'],
];

export const TREES = [
  ['STR · Physical', ['Foundation: 3 weeks of safe, consistent activity', 'Strength: record progress on suitable exercises', 'Endurance: improve an appropriate activity benchmark']],
  ['INT · Intelligence', ['Focus: complete 5 distraction-free study sessions', 'Understanding: explain a topic in your own words', 'Mastery: solve practice questions without notes']],
  ['DIS · Discipline', ['Routine: establish a realistic daily plan', 'Consistency: complete priority tasks on 5 days in a week', 'Self-management: complete a weekly review']],
  ['TEC · Coding & AI', ['Python: use functions, lists and dictionaries', 'Data: clean a dataset and analyse it', 'Machine learning: train and evaluate a baseline model', 'Deployment: publish a working project']],
  ['ECO · Career & Money', ['Literacy: make a simple budget', 'Portfolio: document a project', 'Employability: prepare a résumé and explain your work']],
  ['SOC · Social', ['Communication: ask clear questions and listen', 'Confidence: initiate a friendly conversation', 'Leadership: coordinate a small group task']],
];

export const ACHS = [
  ['first', 'First Quest', 'Earn XP for the first time'],
  ['levelup', 'Awakening', 'Reach Level 2'],
  ['builder', 'The Builder', 'Finish and demonstrate a coding feature'],
  ['knowledge', 'Knowledge Hunter', 'Explain a topic without notes'],
  ['consistency', 'Consistency', 'Complete priority tasks on five days'],
  ['social', 'Social Awakening', 'Practise a communication skill'],
  ['boss', 'Boss Slayer', 'Clear a weekly boss challenge'],
  ['monarch', 'Monarch Candidate', 'Reach Level 30 and show progress'],
];

export const FOCUS_OPTIONS = ['Balanced Growth', 'Physical Development', 'Intelligence & Study', 'Coding & AI', 'Career & Money', 'Social Confidence'];

export const BOSS_TYPES = ['Code Builder', 'Knowledge Keeper', 'Discipline Trial', 'Social Challenge', 'Strength Trial'];

const BOSS_DESC = {
  'Code Builder': 'Build and demonstrate one meaningful project feature; include a short note explaining the design and test it.',
  'Knowledge Keeper': 'Research a topic for 20 minutes, then explain it from memory and answer 10 practice questions without notes.',
  'Discipline Trial': 'Complete 3 focused 50-minute work blocks on your priority task in one day, with planned breaks; write a brief result log.',
  'Social Challenge': 'Choose one: have a safe, friendly conversation with an unfamiliar person for at least 5 minutes in a public/supervised setting; OR research two topics for 10 minutes each and speak about each for 5 minutes to a trusted person. Do not share personal details or put yourself in an unsafe situation.',
  'Strength Trial': 'Complete a challenging but scalable session: a 5 km walk at a sustainable pace OR your usual comfortable distance plus a controlled full-body circuit in sets. Rest between sets; no max-effort testing, and stop for pain, dizziness, or unusual breathlessness.',
};
export const bossDesc = (S) => BOSS_DESC[S.boss.name] || '';

export const PENALTY_CHALLENGES = [
  { title: 'THE GAUNTLET · 120 MINUTES OF NO MERCY', desc: 'No phone. No excuses. Complete two focused 55-minute work blocks with a 10-minute break, on one useful task. Record what you finished. No XP is awarded for the penalty itself.' },
  { title: 'FACE THE FEAR · 5 MINUTES', desc: 'Your comfort zone is what put you here. Have a friendly 5-minute conversation with someone you do not already know, only in a safe public or supervised setting. Do not share personal details or go anywhere with them. If that is not appropriate, do a 10-minute researched mini-talk to a trusted person instead.' },
  { title: 'EARN YOUR WAY BACK · STRENGTH & STEPS', desc: 'Your body paid for your laziness. Complete a comfortable brisk walk and a controlled bodyweight circuit suited to your current ability. Work in sets, rest as needed, and stop for pain, dizziness, or unusual shortness of breath. This is not a max-effort test.' },
];

/* ---------- dates ---------- */
export const today = () => new Date().toLocaleDateString('en-CA');
export const weekKey = () => {
  const d = new Date();
  const jan = new Date(d.getFullYear(), 0, 1);
  return d.getFullYear() + '-' + Math.ceil((((d - jan) / 86400000) + jan.getDay() + 1) / 7);
};
export function clockText() {
  const m = new Date();
  m.setHours(24, 0, 0, 0);
  const ms = m - new Date();
  if (ms <= 0) return '00:00:00';
  const sec = Math.floor(ms / 1000);
  return [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60].map((n) => String(n).padStart(2, '0')).join(':');
}

/* ---------- state ---------- */
export const fresh = () => ({
  xp: 0, quests: {}, claimed: [], stats: { STR: 0, INT: 0, DIS: 0, TEC: 0, ECO: 0, SOC: 0 }, skills: [], achievements: [],
  boss: { name: 'Code Builder', done: false, claimedWeek: '', assignedWeek: '' }, journal: [], focus: 'Balanced Growth',
  claimHistory: [], questRewards: {}, bodyTasks: {}, penalty: null, soundOn: true, lastActiveDay: '',
});

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch (e) { /* storage unavailable */ }
  return fresh();
}
export function saveState(S) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
}

/* ---------- derived values ---------- */
export const lv = (S) => Math.floor(S.xp / 100) + 1;
export const rank = (S) => (S.xp < 400 ? 'E' : S.xp < 900 ? 'D' : S.xp < 1400 ? 'C' : S.xp < 1900 ? 'B' : S.xp < 2900 ? 'A' : 'S');
export const earned = (S) => (lv(S) - 1) * 3;
export const spent = (S) => Object.values(S.stats).reduce((a, b) => a + b, 0);
export const pointsLeft = (S) => Math.max(0, earned(S) - spent(S));
const validIds = (ids) => (ids || []).filter((id) => QUESTS.some((q) => q.id === id));
export const checked = (S) => validIds(S.quests[today()]);
export const dailyCount = (S) => checked(S).length;
export const dailyComplete = (S) => dailyCount(S) >= DAILY_GOAL;
export const rewarded = (S) => (S.questRewards || {})[today()] || [];
export const dailyXP = (S) => QUESTS.filter((q) => checked(S).includes(q.id) && !rewarded(S).includes(q.id)).reduce((a, q) => a + q.xp, 0);
export const dailyClaimedXP = (S) => QUESTS.filter((q) => rewarded(S).includes(q.id)).reduce((a, q) => a + q.xp, 0);
export const allClaimed = (S) => QUESTS.every((q) => rewarded(S).includes(q.id));
export const bodyChecked = (S) => S.bodyTasks[today()] || [];
export const activePenalty = (S) => !!(S.penalty && !S.penalty.resolved);

export function streak(S) {
  let n = 0;
  const d = new Date();
  const hist = S.claimHistory || [];
  while (hist.includes(d.toLocaleDateString('en-CA'))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function bodyTasksForLevel(S) {
  const adv = lv(S) > 30;
  return [
    { id: 'distance', name: (adv ? '5 km' : '3 km') + ' walk or run', desc: 'A brisk walk counts. Build up gradually; stop if you feel unwell.' },
    { id: 'pushups', name: adv ? '40 total push-ups' : 'Push-ups', desc: adv ? 'Accumulate up to 40 quality reps across sets; wall or knee variations count. Stop if form or shoulder comfort changes.' : 'Use manageable sets of 5–10, including wall/knee push-ups. Keep form comfortable.' },
    { id: 'situps', name: adv ? '40 sit-ups or crunches' : 'Sit-ups or crunches', desc: adv ? 'Accumulate up to 40 controlled reps across sets; crunches are fine.' : '2 sets of 8–12 controlled reps; choose crunches if sit-ups feel uncomfortable.' },
    { id: 'plank', name: adv ? 'Plank · 2 minutes total' : 'Plank', desc: adv ? 'Build up to 2 minutes total across rounds; stop before form breaks.' : '2 rounds of 15–30 seconds; stop before form breaks.' },
    { id: 'squats', name: 'Bodyweight squats', desc: '2 sets of 8–12 controlled reps, within a comfortable range.' },
  ];
}
export const bodyComplete = (S) => bodyTasksForLevel(S).every((t) => bodyChecked(S).includes(t.id));

/* ---------- mutations (operate on a cloned draft) ---------- */
export function assignWeeklyBoss(S) {
  S.boss = S.boss || { name: 'Code Builder', done: false, claimedWeek: '', assignedWeek: '' };
  if (S.boss.assignedWeek !== weekKey()) {
    S.boss.name = BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
    S.boss.done = false;
    S.boss.assignedWeek = weekKey();
    return true;
  }
  return false;
}

// Applies the missed-day penalty. Returns { changed, alert?, notify? }.
export function checkDeadline(S) {
  const key = today();
  const prior = S.lastActiveDay || key;
  if (prior !== key) {
    const priorQuests = S.quests[prior] || [];
    // 5 of the daily quests done = the day is complete, no penalty.
    const neglected = validIds(priorQuests).length < DAILY_GOAL;
    let out = { changed: true };
    if (neglected && !activePenalty(S) && (!S.penalty || S.penalty.date !== key)) {
      const loss = 25 + Math.floor(Math.random() * 26);
      const actual = Math.min(S.xp, loss);
      S.xp -= actual;
      S.penalty = { date: key, loss: actual, resolved: false, sourceDay: prior, challenge: Math.floor(Math.random() * 3) };
      out.notify = 'PENALTY ZONE ARMED. You failed yesterday. XP is locked until you pay the price. Open ARISE now.';
      out.alert = {
        title: 'PENALTY ZONE ACTIVATED',
        label: 'WARNING',
        body: 'You failed yesterday. The System does not forgive weakness. ' + actual + ' XP was torn from you, and your XP is now locked. No rewards. No progress. Only the Penalty Challenge opens the way out. Skip it and you stay trapped here. (Stay safe: stop if you feel pain, dizziness or illness.)',
        reward: '−' + actual + ' XP · XP LOCKED · NO ESCAPE',
        variant: 'danger',
      };
    }
    S.lastActiveDay = key;
    return out;
  }
  if (!S.lastActiveDay) { S.lastActiveDay = key; return { changed: true }; }
  return { changed: false };
}

export function automaticAchievements(S) {
  const skillIds = (S.skills || []).map((x) => String(x).toLowerCase());
  const days = new Set(Object.entries(S.quests || {}).filter(([, ids]) => Array.isArray(ids) && ids.length > 0).map(([d]) => d));
  Object.entries(S.bodyTasks || {}).forEach(([d, ids]) => { if (Array.isArray(ids) && ids.length) days.add(d); });
  return {
    first: S.xp > 0,
    levelup: lv(S) >= 2,
    builder: skillIds.some((x) => x.startsWith('tec · coding & ai::') || x.includes('deployment: publish a working project')),
    knowledge: skillIds.some((x) => x.startsWith('int · intelligence::') || x.includes('mastery: solve practice questions')),
    consistency: days.size >= 5,
    social: skillIds.some((x) => x.startsWith('soc · social::') || x.includes('communication: ask clear questions')),
    boss: !!(S.boss && S.boss.claimedWeek),
    monarch: lv(S) >= 30,
  };
}

/* ---------- level theme ----------
   Smooth, per-level colour journey (no sudden jumps):
     Lv 1   bright system blue
     Lv 30  deep / dark blue
     Lv 60  purple
     Lv 90+ dark purple
   energy = lines, glows, bars · energy2 = bright highlight tint used for text on black */
const STOPS = [
  // level, hue, sat, light(energy), light(energy2)
  [1, 197, 100, 60, 90],
  [30, 226, 95, 44, 82],
  [60, 272, 86, 62, 88],
  [90, 272, 80, 38, 80],
];
const lerp = (a, b, t) => a + (b - a) * t;

export function themeFor(level) {
  const L = Math.max(1, level);
  let i = 0;
  while (i < STOPS.length - 2 && L > STOPS[i + 1][0]) i++;
  const [l0, h0, s0, e0, f0] = STOPS[i];
  const [l1, h1, s1, e1, f1] = STOPS[i + 1];
  const t = Math.min(1, Math.max(0, (L - l0) / (l1 - l0)));
  const h = Math.round(lerp(h0, h1, t)), s = Math.round(lerp(s0, s1, t));
  const e = Math.round(lerp(e0, e1, t)), f = Math.round(lerp(f0, f1, t));
  return {
    energy: `hsl(${h} ${s}% ${e}%)`,
    energy2: `hsl(${h} ${Math.min(100, s + 6)}% ${f}%)`,
    line: `hsl(${h} 50% 20%)`,
    chrome: `hsl(${h} 70% 4%)`,
  };
}

export function download(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
