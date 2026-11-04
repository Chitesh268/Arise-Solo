import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Frame, FxCanvas } from './fx.jsx';
import { Icon, SystemWindow, Toast } from './ui.jsx';
import { Page, TABS } from './views.jsx';
import { audioReady, buttonBlip, markUnlocked, notifyPenalty, playAlert, setSoundOn, sfx, unlockAudio } from './audio.js';
import {
  DAILY_GOAL, QUESTS, activePenalty, assignWeeklyBoss, bodyComplete, checkDeadline, checked, dailyClaimedXP, dailyCount,
  download, fresh, loadState, lv, pointsLeft, rank, rewarded, saveState, streak, themeFor, today, weekKey,
} from './game.js';

const uniq = (arr) => [...new Set(arr)];
const FX_KEY = 'arise-fx';
const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function defaultFx() {
  try {
    const saved = localStorage.getItem(FX_KEY);
    if (saved === 'high' || saved === 'medium' || saved === 'off') return saved;
  } catch (e) { /* ignore */ }
  const phone = window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 800;
  return phone ? 'medium' : 'high';
}

export default function App() {
  const [S, setS] = useState(() => { const s = loadState(); if (assignWeeklyBoss(s)) saveState(s); return s; });
  const live = useRef(S);
  const [tab, setTab] = useState('dashboard');
  const [fx, setFxState] = useState(defaultFx);
  const [reduced] = useState(prefersReduced);
  const [alerts, setAlerts] = useState([]);
  const [toast, setToast] = useState(null);
  const [burst, setBurst] = useState(0);
  const [gate, setGate] = useState(false);   // 'touch to enter' screen: browsers only allow sound after a tap
  const pending = useRef([]);
  const navRef = useRef(null);
  const toastTimers = useRef([]);
  const alertId = useRef(0);
  const introDone = useRef(false);

  const effectiveFx = reduced ? 'off' : fx;
  const setFx = (v) => { setFxState(v); try { localStorage.setItem(FX_KEY, v); } catch (e) { /* ignore */ } };

  /* ----- state plumbing: mutate a clone, save, render ----- */
  const commit = useCallback((fn) => {
    const next = structuredClone(live.current);
    const r = fn(next);
    if (r === false) return null;
    live.current = next;
    saveState(next);
    setS(next);
    return next;
  }, []);

  /* ----- notifications ----- */
  const showToast = useCallback((msg) => {
    toastTimers.current.forEach(clearTimeout);
    const id = Date.now();
    setToast({ id, msg, closing: false });
    toastTimers.current = [
      setTimeout(() => setToast((t) => (t && t.id === id ? { ...t, closing: true } : t)), 2600),
      setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 2950),
    ];
  }, []);

  const showAlert = useCallback((data) => {
    // Notification before the very first tap (app just opened): hold it behind a TOUCH TO ENTER screen so
    // the open sound is guaranteed to play together with the notification.
    if (!audioReady()) {
      pending.current.push(data);
      setGate(true);
      return;
    }
    const t = data.title || '';
    playAlert();
    if (/LEVEL UP|PENALTY|ARISE|WARNING|NO TURNING BACK/.test(t)) {
      setBurst((b) => b + 1);
      document.body.classList.add('thunder-hit');
      setTimeout(() => document.body.classList.remove('thunder-hit'), 520);
    }
    setAlerts((q) => [...q, { ...data, id: ++alertId.current }]);
  }, []);
  const enterSystem = useCallback(() => {
    markUnlocked();
    unlockAudio();
    playAlert();                      // inside the tap, so it is allowed
    setGate(false);
    const held = pending.current; pending.current = [];
    setTimeout(() => held.forEach((d) => showAlert(d)), 160);
  }, [showAlert]);
  const closeAlert = useCallback((id) => setAlerts((q) => q.filter((x) => x.id !== id)), []);

  const go = useCallback((id) => {
    setTab(id);
    sfx('tap');
    const nav = navRef.current;
    if (nav && window.scrollY > nav.offsetTop - 8) window.scrollTo({ top: Math.max(0, nav.offsetTop - 8), behavior: 'smooth' });
  }, []);

  /* ----- theme (blue → dark blue @30 → purple @60 → dark purple, smooth per level) ----- */
  const level = lv(S);
  useLayoutEffect(() => {
    const th = themeFor(level);
    const root = document.documentElement;
    root.style.setProperty('--energy', th.energy);
    root.style.setProperty('--energy2', th.energy2);
    root.style.setProperty('--line', th.line);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', th.chrome);
  }, [level]);
  useLayoutEffect(() => { document.body.dataset.fx = effectiveFx; }, [effectiveFx]);
  useEffect(() => { setSoundOn(S.soundOn); }, [S.soundOn]);

  /* ----- boot: deadline check, intro notification, button blips ----- */
  useEffect(() => {
    const runDeadline = () => {
      let result = null;
      commit((d) => { result = checkDeadline(d); return result.changed ? undefined : false; });
      if (result?.notify) notifyPenalty('ARISE · PENALTY ACTIVE', result.notify);
      if (result?.alert) setTimeout(() => showAlert(result.alert), 300);
    };
    runDeadline();
    const id = setInterval(runDeadline, 30000);

    if (!introDone.current) {
      introDone.current = true;
      let shown = false;
      try { shown = !!sessionStorage.getItem('solo-system-intro-shown'); sessionStorage.setItem('solo-system-intro-shown', '1'); } catch (e) { /* ignore */ }
      if (!shown) {
        setTimeout(() => showAlert({
          title: 'THERE IS NO TURNING BACK',
          label: 'WARNING',
          body: 'You are bound to the System now. Every skipped quest is recorded. Every excuse costs you XP. Miss a single day and the Penalty Zone opens, and no one is coming to save you. Only discipline keeps you standing. Show up. Every day.',
          reward: 'WEAKNESS WILL BE PUNISHED',
          variant: 'danger',
        }), 450);
      }
    }

    // quest.mp3 on EVERY button click. Capture phase, so buttons inside notifications (which stop the
    // click from bubbling) answer too. The touch-to-enter button is skipped: it plays the alert sound.
    const onClick = (e) => {
      const b = e.target?.closest?.('button');
      if (!b || b.disabled || b.classList.contains('gate')) return;
      buttonBlip();
    };
    // browsers hold audio until a real tap/click/key press: that is when sound becomes allowed
    let gestured = false;
    const onGesture = () => {
      if (gestured) return;
      gestured = true;
      unlockAudio();
    };
    document.addEventListener('click', onClick, true);
    const GESTURES = ['pointerup', 'touchend', 'mousedown', 'keydown'];
    GESTURES.forEach((ev) => window.addEventListener(ev, onGesture, { passive: true }));
    if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
    return () => {
      clearInterval(id);
      document.removeEventListener('click', onClick, true);
      GESTURES.forEach((ev) => window.removeEventListener(ev, onGesture));
    };
  }, [commit, showAlert]);

  /* ----- game actions ----- */
  const goalCheck = (before, after) => {
    if (before < DAILY_GOAL && after >= DAILY_GOAL) {
      setTimeout(() => showAlert({
        title: 'DAILY QUESTS COMPLETE',
        body: `${DAILY_GOAL} daily quests recorded. Today is marked complete, so no penalty will be issued tomorrow. Claim your XP whenever you are ready.`,
        reward: 'PENALTY SHIELD ACTIVE',
      }), 250);
    }
  };

  const a = {
    sound: sfx,
    toggleQuest(id, on) {
      const cur = live.current;
      if (id === 'body' && on && !bodyComplete(cur)) { showToast('COMPLETE THE BODY TRAINING BASELINE FIRST'); sfx('penalty'); return; }
      const before = dailyCount(cur);
      const next = commit((d) => { const arr = checked(d); d.quests[today()] = on ? uniq([...arr, id]) : arr.filter((x) => x !== id); });
      sfx('quest');
      goalCheck(before, dailyCount(next));
    },
    toggleBody(id, on) {
      let completed = false;
      const before = dailyCount(live.current);
      const after = commit((d) => {
        const arr = d.bodyTasks[today()] || [];
        d.bodyTasks[today()] = on ? uniq([...arr, id]) : arr.filter((x) => x !== id);
        if (bodyComplete(d)) { d.quests[today()] = uniq([...(d.quests[today()] || []), 'body']); completed = true; }
      });
      sfx('quest');
      goalCheck(before, dailyCount(after));
      if (completed) {
        sfx('claim');
        setTimeout(() => showAlert({ title: 'BODY PROTOCOL COMPLETE', body: 'All five baseline body tasks have been recorded. Remember: consistency and safe form matter more than speed.', reward: 'STRENGTH QUEST READY' }), 100);
      }
    },
    workoutDone(name) {
      sfx('claim');
      showAlert({ title: 'WORKOUT OPTION LOGGED', body: 'You selected: ' + name + '. Use this as an optional routine and scale it to your ability.', reward: 'BONUS TRAINING RECORDED' });
    },
    bodyReset() {
      showAlert({
        title: 'CLEAR BODY CHECKS?', label: 'SYSTEM PROMPT · CONFIRM', variant: 'danger',
        body: 'Today’s body-training checks will be cleared and Body Training will be unmarked.',
        actions: [{ label: 'ABORT' }, { label: 'CLEAR', kind: 'danger', onClick: () => commit((d) => { d.bodyTasks[today()] = []; if (d.quests[today()]) d.quests[today()] = d.quests[today()].filter((x) => x !== 'body'); }) }],
      });
    },
    resolvePenalty() {
      if (!activePenalty(live.current)) return;
      commit((d) => { d.penalty.resolved = true; d.penalty.resolvedAt = new Date().toISOString(); });
      sfx('level');
      showAlert({ title: 'PENALTY CLEARED', body: 'Challenge recorded. No XP was awarded for penalty completion; ordinary XP progression is now unlocked.', reward: 'SYSTEM ACCESS RESTORED · +0 XP' });
    },
    claimXP() {
      const cur = live.current;
      if (activePenalty(cur)) { showToast('XP CLAIMS PAUSED · COMPLETE THE PENALTY PROTOCOL'); return; }
      const sel = QUESTS.filter((q) => checked(cur).includes(q.id) && !rewarded(cur).includes(q.id));
      if (!sel.length) return;
      const amount = sel.reduce((s, q) => s + q.xp, 0), old = lv(cur);
      const next = commit((d) => {
        d.xp += amount;
        d.questRewards = d.questRewards || {};
        d.questRewards[today()] = uniq([...rewarded(d), ...sel.map((q) => q.id)]);
        d.claimed = uniq([...(d.claimed || []), today()]);
        d.claimHistory = uniq([...(d.claimHistory || []), today()]);
      });
      const nl = lv(next);
      sfx(nl > old ? 'level' : 'claim');
      if (nl > old) showAlert({ title: 'LEVEL UP!', body: 'Quest rewards increased your Hunter Level. Three stat points are now available to allocate.', reward: `LEVEL ${old}  →  LEVEL ${nl}  ·  +3 STAT POINTS` });
      else showAlert({ title: 'QUEST REWARDS ACQUIRED', body: 'XP awarded for ' + sel.length + ' quest' + (sel.length === 1 ? '' : 's') + '. Other unclaimed quests remain available.', reward: '+' + amount + ' XP ACQUIRED' });
    },
    clearChecks() { commit((d) => { d.quests[today()] = checked(d).filter((id) => rewarded(d).includes(id)); }); },
    allocate(id) { if (pointsLeft(live.current) > 0) commit((d) => { d.stats[id] = (d.stats[id] || 0) + 1; }); },
    toggleSkill(id, on) {
      if (activePenalty(live.current)) return;
      commit((d) => { d.skills = on ? uniq([...d.skills, id]) : d.skills.filter((x) => x !== id); });
    },
    bossDone(on) { if (!activePenalty(live.current)) commit((d) => { d.boss.done = on; }); },
    claimBoss() {
      const cur = live.current;
      if (activePenalty(cur)) { showToast('XP REWARDS PAUSED DURING PENALTY'); return; }
      if (!cur.boss.done || cur.boss.claimedWeek === weekKey()) return;
      const old = lv(cur);
      const next = commit((d) => { d.xp += 25; d.boss.claimedWeek = weekKey(); });
      const nl = lv(next);
      sfx(nl > old ? 'level' : 'claim');
      if (nl > old) showAlert({ title: 'LEVEL UP!', body: 'The weekly boss reward pushed your level higher. Three stat points are now available.', reward: `LEVEL ${old}  →  LEVEL ${nl}` });
      else showAlert({ title: 'BOSS DEFEATED', body: 'You completed your weekly real-life challenge. Your record has been updated.', reward: '+25 XP ACQUIRED' });
    },
    saveJournal(text) {
      const t = text.trim();
      if (!t) return false;
      commit((d) => { d.journal.push({ id: Date.now().toString(), date: today(), text: t }); });
      showToast('JOURNAL ENTRY SAVED');
      return true;
    },
    deleteJournal(id) { commit((d) => { d.journal = d.journal.filter((j) => j.id !== id); }); },
    exportJournal() { download('solo-system-journal.txt', live.current.journal.map((j) => j.date + '\n' + j.text).join('\n\n'), 'text/plain'); },
    exportBackup() { download('solo-system-backup.json', JSON.stringify(live.current, null, 2), 'application/json'); },
    async importBackup(e) {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      try {
        const x = JSON.parse(await file.text());
        if (typeof x.xp !== 'number' || !x.stats || !x.quests) throw new Error('invalid');
        commit((d) => { Object.keys(d).forEach((k) => delete d[k]); Object.assign(d, { ...fresh(), ...x }); });
        showToast('BACKUP IMPORTED');
      } catch (err) {
        showAlert({ title: 'INVALID BACKUP', body: 'This backup file is not valid. Nothing was changed.', reward: 'IMPORT CANCELLED', variant: 'danger' });
      }
    },
    setSound(on) { commit((d) => { d.soundOn = on; }); setSoundOn(on); if (on) { playAlert(); showToast('SYSTEM AUDIO ENABLED'); } },
    testSound() { commit((d) => { d.soundOn = true; }); setSoundOn(true); sfx('testalert'); showToast('ALERT SOUND · alert.mp3'); },
    setFocus(v) { commit((d) => { d.focus = v; }); },
    async enableNotifications() {
      if (!('Notification' in window)) { showAlert({ title: 'NOTIFICATIONS UNAVAILABLE', body: 'This browser does not support web notifications. Install/open the app in a supported browser.', reward: 'NOT SUPPORTED' }); return; }
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          notifyPenalty('ARISE · TEST ALERT', 'Notifications enabled. Penalty alerts can be shown when ARISE is running.');
          showAlert({ title: 'ALERTS ENABLED', body: 'System notifications are allowed. Browsers may still limit alerts if the app is closed or background execution is suspended.', reward: 'PERMISSION GRANTED' });
        } else showAlert({ title: 'PERMISSION NOT GRANTED', body: 'Allow notifications in your browser or phone settings to receive system alerts.', reward: 'ALERTS OFF' });
      } catch (err) { showToast('COULD NOT REQUEST NOTIFICATION PERMISSION'); }
    },
    resetLevel() {
      const cur = live.current;
      showAlert({
        title: 'RESET THE PLAYER?', label: 'SYSTEM WARNING · IRREVERSIBLE COMMAND', variant: 'danger',
        body: `Your current level is ${lv(cur)}. This command will erase your XP and allocated attribute points, returning you to Level 1. Your journal, skill records, achievements, and daily checklist will remain.`,
        actions: [{ label: 'ABORT' }, {
          label: 'PROCEED', kind: 'danger',
          onClick: () => showAlert({
            title: 'CONFIRM ERASURE', label: 'FINAL AUTHORIZATION · SECOND WARNING', variant: 'danger',
            body: 'This is your final confirmation. Player Level and XP will return to zero progress. Allocated attribute points will also be cleared. This cannot be undone unless you previously exported a backup.',
            actions: [{ label: 'KEEP MY PROGRESS' }, {
              label: 'ERASE LEVEL DATA', kind: 'danger',
              onClick: () => {
                commit((d) => { d.xp = 0; d.stats = fresh().stats; if (activePenalty(d)) { d.penalty.resolved = true; d.penalty.resetByPlayer = true; } });
                setTab('dashboard');
                showAlert({ title: 'PLAYER REINITIALIZED', body: 'Your level has been reset. The system retains your recorded memories, but your power must be rebuilt.', reward: 'LEVEL 1 · XP 0' });
              },
            }],
          }),
        }],
      });
    },
    resetAll() {
      showAlert({
        title: 'TOTAL PURGE WARNING', label: 'SYSTEM WARNING · IRREVERSIBLE COMMAND', variant: 'danger',
        body: 'This will erase XP, attributes, quests, journal, achievements and all locally saved player data. Export a backup before continuing.',
        reward: 'SECOND CONFIRMATION REQUIRED',
        actions: [{ label: 'ABORT' }, {
          label: 'CONFIRM TOTAL PURGE', kind: 'danger',
          onClick: () => showAlert({
            title: 'FINAL WARNING', label: 'FINAL AUTHORIZATION · LAST CHANCE', variant: 'danger',
            body: 'Erase ALL Solo System data on this device? There is no undo.',
            actions: [{ label: 'KEEP EVERYTHING' }, {
              label: 'ERASE EVERYTHING', kind: 'danger',
              onClick: () => {
                commit((d) => { Object.keys(d).forEach((k) => delete d[k]); Object.assign(d, fresh(), { lastActiveDay: today() }); assignWeeklyBoss(d); });
                setTab('dashboard');
                showAlert({ title: 'SYSTEM PURGED', body: 'All local player data has been erased. The record begins again.', reward: 'LEVEL 1 · ARISE' });
              },
            }],
          }),
        }],
      });
    },
  };

  const g = { S, a, go, fx, setFx, reduced };
  const r = rank(S), pct = S.xp % 100, pen = activePenalty(S), done = checked(S).length;

  return (
    <>
      <div className="bg" aria-hidden="true"><i className="bg__grid" /><i className="bg__mist bg__mist--a" /><i className="bg__mist bg__mist--b" /><i className="bg__vig" /></div>
      <FxCanvas level={effectiveFx} burst={burst} />
      <div className="flash" aria-hidden="true" />
      <div className="scan" aria-hidden="true" />

      <main className="app">
        <Frame as="header" variant="head" flames="top" className="top">
          <div className="toprow">
            <img className="sigil" src="./logo-arise.jpg" alt="ARISE logo" />
            <div className="brandbox">
              <div className="brand">ARISE</div>
              <div className="sub">THE SYSTEM HAS AWAKENED · PROVE YOUR WORTH</div>
            </div>
            <div className="spacer" />
            <div className="rankbox"><div className="rank">{r}-RANK</div><div className="lv">LV. {level}</div></div>
          </div>
          <XpLine pct={pct} />
        </Frame>

        <div className="metrics">
          <Metric label="TOTAL EXPERIENCE" value={S.xp} sub="Lifetime XP" />
          <Metric label="DAILY REWARD" value={dailyClaimedXP(S)} sub={`${done} quests complete`} />
          <Metric label="STAT POINTS" value={pointsLeft(S)} sub="Available to allocate" />
          <Metric label="STREAK" value={`${streak(S)} DAYS`} sub="Days with XP claimed" />
        </div>

        {pen && (
          <div className="penalty-banner" role="alert" aria-live="assertive">
            <div><strong><Icon name="warn" size={15} /> PENALTY ZONE ACTIVE · −{S.penalty.loss} XP TAKEN</strong><small>You failed. Quests and XP are frozen, and the System is waiting. The only way out is through the challenge.</small></div>
            <button type="button" onClick={() => { setTab('quests'); sfx('penalty'); setTimeout(() => document.querySelector('.penalty-zone')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80); }}>FACE IT ▸</button>
          </div>
        )}

        <nav className="nav" id="nav" ref={navRef} aria-label="System modules">
          {TABS.map(([id, label, icon]) => (
            <button key={id} className={tab === id ? 'active' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => go(id)}>
              <Icon name={icon} size={15} /><span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="view" key={tab}><Page tab={tab} g={g} /></div>
        <div className="footer">THE SYSTEM REMEMBERS · LOCAL SAVE ACTIVE</div>
      </main>

      <Toast toast={toast} />
      {gate && (
        <button type="button" className="gate" onClick={enterSystem}>
          <span className="gate__brand">ARISE</span>
          <span className="gate__sub">THE SYSTEM IS WAITING</span>
          <span className="gate__tap">▸ TOUCH TO ENTER ◂</span>
        </button>
      )}
      {!gate && alerts[0] && <SystemWindow key={alerts[0].id} data={alerts[0]} onClose={closeAlert} fx={effectiveFx} />}
    </>
  );
}

function XpLine({ pct }) {
  return (
    <div className="topxp">
      <div className="xpbar"><span style={{ width: pct + '%' }} /></div>
      <div className="xplabel"><span>{pct} / 100 XP</span><span>{100 - pct} XP TO LEVEL UP</span></div>
    </div>
  );
}

function Metric({ label, value, sub }) {
  return (
    <Frame variant="tile" gem={false} className="metric">
      <label>{label}</label>
      <strong>{value}</strong>
      <small>{sub}</small>
    </Frame>
  );
}
