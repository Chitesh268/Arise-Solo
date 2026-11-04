// Sound + notification helpers.
//   alert.mp3  → every notification / alert window that appears
//   quest.mp3  → every button click (including the buttons inside notifications)
// Browsers block audio until the first touch/click, so a notification that arrives right as the app opens is
// held behind a "TOUCH TO ENTER" screen (see App.jsx) and sounds the moment you tap.
let soundOn = true;
let unlocked = false;
let lastAlertAt = -1e9;

const make = (src, volume) => {
  try { const a = new Audio(src); a.preload = 'auto'; a.volume = volume; a.__vol = volume; a.__gen = 0; return a; } catch (e) { return null; }
};
let alertAudio = null;
let questAudio = null;
function ensure() {
  if (!alertAudio) alertAudio = make('./alert.mp3', 0.9);
  if (!questAudio) questAudio = make('./quest.mp3', 0.85);
}

export const setSoundOn = (v) => { soundOn = !!v; };
// true when a notification can sound right now (sound is off, or the player has already touched the page)
export const audioReady = () => !soundOn || unlocked;
export const markUnlocked = () => { unlocked = true; };

function play(audio) {
  if (!audio) return Promise.resolve(false);
  try {
    audio.__gen++;                       // cancels any unlock-priming still in flight on this element
    audio.muted = false; audio.volume = audio.__vol;
    audio.pause(); audio.currentTime = 0;
    const p = audio.play();
    if (p && p.then) return p.then(() => true).catch(() => false);
    return Promise.resolve(true);
  } catch (e) { return Promise.resolve(false); }
}

// The notification sound (alert.mp3).
export function playAlert() {
  ensure();
  if (!soundOn) return;
  const now = performance.now();
  if (now - lastAlertAt < 900) return; // one sound per notification even if two triggers land together
  lastAlertAt = now;
  play(alertAudio);
}

// The button sound (quest.mp3). No debounce: every click answers.
export function buttonBlip() {
  ensure();
  if (!soundOn) return;
  play(questAudio);
}

export function sfx(kind = 'tap') {
  ensure();
  if (!soundOn || ['tap', 'touch', 'check'].includes(kind)) return;
  if (kind === 'quest' || kind === 'checkbox') { buttonBlip(); return; }
  playAlert(); // alert, level, claim, penalty, testalert … = the notification sound
}

// Call on the first user gesture: lets later notifications sound without a fresh tap (iOS/Android).
export function unlockAudio() {
  markUnlocked();
  ensure();
  // silent (muted) touch of each element so later notifications may sound without a fresh tap;
  // a real play that starts meanwhile cancels the cleanup (see __gen), so it is never cut off
  [questAudio, alertAudio].forEach((a) => {
    if (!a) return;
    const g = ++a.__gen;
    a.muted = true;
    const undo = () => { if (a.__gen === g) { a.pause(); a.currentTime = 0; a.muted = false; a.volume = a.__vol; } };
    try {
      const p = a.play();
      if (p && p.then) p.then(undo).catch(() => { if (a.__gen === g) a.muted = false; }); else undo();
    } catch (e) { a.muted = false; }
  });
}

export function notifyPenalty(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body, tag: 'arise-penalty', renotify: true, requireInteraction: true, vibrate: [140, 60, 140], icon: './icon-192.png', badge: './icon-192.png' };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((r) => r.showNotification(title, opts)).catch(() => { try { new Notification(title, opts); } catch (e) { /* ignore */ } });
  } else {
    try { new Notification(title, opts); } catch (e) { /* ignore */ }
  }
}
