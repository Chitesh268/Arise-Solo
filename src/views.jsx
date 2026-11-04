import { useState } from 'react';
import { Frame } from './fx.jsx';
import { Icon, Orb, Timer, XpBar } from './ui.jsx';
import {
  ACHS, ATTRS, FOCUS_OPTIONS, PENALTY_CHALLENGES, QUESTS, TREES, WORKOUTS,
  activePenalty, allClaimed, automaticAchievements, bodyChecked, bodyTasksForLevel, bossDesc, checked,
  dailyXP, dailyComplete, dailyCount, DAILY_GOAL, lv, pointsLeft, rank, rewarded, streak, weekKey,
} from './game.js';

export const TABS = [
  ['dashboard', 'Status', 'status'],
  ['quests', 'Daily Quests', 'quests'],
  ['stats', 'Attributes', 'stats'],
  ['skills', 'Skill Trees', 'skills'],
  ['bosses', 'Boss Room', 'bosses'],
  ['achievements', 'Achievements', 'achievements'],
  ['journal', 'Journal', 'journal'],
  ['settings', 'Save / Settings', 'settings'],
];

/* ---------- small building blocks ---------- */
function Card({ title, children, className = '', flames }) {
  return (
    <Frame className={`card ${className}`} flames={flames}>
      <h2 className="card-title"><i aria-hidden="true" />{title}</h2>
      {children}
    </Frame>
  );
}
const Tag = ({ children, locked }) => <span className={`tag ${locked ? 'locked' : ''}`}>{children}</span>;

function Check({ label, hint, ...input }) {
  return (
    <label className="body-task">
      <input type="checkbox" {...input} />
      <span><strong>{label}</strong>{hint && <small>{hint}</small>}</span>
    </label>
  );
}

/* ---------- quests ---------- */
function QuestList({ g }) {
  const { S, a } = g;
  const done = checked(S), paid = rewarded(S), pen = activePenalty(S);
  return (
    <>
      <div className={`goal-line ${dailyComplete(S) ? 'is-done' : ''}`}>
        <span>DAILY GOAL · {Math.min(dailyCount(S), DAILY_GOAL)} / {DAILY_GOAL} QUESTS</span>
        <b>{dailyComplete(S) ? 'DAY COMPLETE ✓ · NO PENALTY TOMORROW' : `COMPLETE ${DAILY_GOAL} OR THE PENALTY ZONE OPENS TOMORROW`}</b>
      </div>
      <div className="timer-line"><span>DAILY QUEST RESET</span><Timer /></div>
      {QUESTS.map((q) => {
        const isDone = done.includes(q.id), isPaid = paid.includes(q.id);
        return (
          <label className={`quest ${isDone ? 'is-done' : ''}`} key={q.id}>
            <input type="checkbox" checked={isDone} disabled={isPaid || pen} onChange={(e) => a.toggleQuest(q.id, e.target.checked)} />
            <div className="qbody">
              <div className="qname"><span className="qstat">{q.stat}</span>{q.name} {isPaid && <Tag>REWARD SEALED ✓</Tag>}</div>
              <div className="qdesc">{q.desc}</div>
            </div>
            <span className="xp">+{q.xp} XP</span>
          </label>
        );
      })}
    </>
  );
}

function ClaimBar({ g }) {
  const { S, a } = g;
  const amount = dailyXP(S), pen = activePenalty(S);
  if (amount > 0) {
    return (
      <>
        <div className="actions">
          <button className="primary" onClick={a.claimXP} disabled={pen}><Icon name="bolt" /> CLAIM SELECTED QUEST XP · +{amount}</button>
          <button onClick={a.clearChecks} disabled={pen}>Clear unclaimed checks</button>
        </div>
        <p className="notice">You can claim multiple times per day. Each quest pays XP once; claimed quests lock individually, not the entire checklist.</p>
      </>
    );
  }
  return <Tag>{allClaimed(S) ? 'ALL DAILY QUEST REWARDS CLAIMED ✓' : 'SELECT A COMPLETED QUEST TO CLAIM XP'}</Tag>;
}

function BodyTraining({ g }) {
  const { S, a } = g;
  const pen = activePenalty(S);
  const tasks = bodyTasksForLevel(S);
  const have = bodyChecked(S);
  const [workout, setWorkout] = useState(Object.keys(WORKOUTS)[0]);
  const [confirmed, setConfirmed] = useState(false);
  const [open, setOpen] = useState(false);
  const challenge = PENALTY_CHALLENGES[S.penalty && Number.isInteger(S.penalty.challenge) ? S.penalty.challenge : 0];
  return (
    <details className="body-training" open={open || pen} onToggle={(e) => { setOpen(e.currentTarget.open); if (e.currentTarget.open) a.sound('alert'); }}>
      <summary><Icon name="bolt" size={15} /> BODY TRAINING · DAILY PROTOCOL <Tag>{have.length}/{tasks.length}</Tag></summary>
      <div className="body-content">
        <p className="notice">Scale reps to your current ability. The 3 km target can be a walk. Rest when needed; pain, illness and unsafe weather always override the quest.</p>
        {tasks.map((t) => (
          <Check key={t.id} label={t.name} hint={t.desc} checked={have.includes(t.id)} disabled={pen} onChange={(e) => a.toggleBody(t.id, e.target.checked)} />
        ))}
        <div className="row space" style={{ marginTop: 12 }}>
          <label className="qname" htmlFor="workout-choice">WORKOUT OPTION</label>
          <select id="workout-choice" className="field" style={{ maxWidth: '58%' }} value={workout} onChange={(e) => { setWorkout(e.target.value); a.sound('tap'); }}>
            {Object.keys(WORKOUTS).map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="notice" style={{ marginTop: 8 }}>{WORKOUTS[workout]}</div>
        <div className="actions">
          <button className="primary" disabled={pen} onClick={() => a.workoutDone(workout)}>✓ MARK WORKOUT OPTION DONE</button>
          <button onClick={a.bodyReset}>RESET BODY CHECKS</button>
        </div>
        <p className="notice">Complete the five baseline tasks to mark Body Training as complete for daily XP. The optional workout is an extra choice, not a requirement on top of everything.</p>
        {pen && (
          <div className="penalty-zone">
            <h3><Icon name="warn" size={16} /> PENALTY ZONE · YOU FAILED · XP LOCKED</h3>
            <p><strong>−{S.penalty.loss} XP</strong> was taken from you. Every quest and reward stays frozen until this challenge is finished. Finishing it only restores access and awards <strong>0 XP</strong>. There is no shortcut and no one to blame but yourself.</p>
            <h4>{challenge.title}</h4>
            <p>{challenge.desc}</p>
            <Check label="I completed the challenge. Honestly." hint="The System knows when you lie to it, and you will know too. Only confirm if you truly did it. Safety, health and consent still come first." checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <button className="danger" disabled={!confirmed} onClick={() => { a.resolvePenalty(); setConfirmed(false); }}>I PAID THE PRICE · CLEAR PENALTY · +0 XP</button>
          </div>
        )}
      </div>
    </details>
  );
}

/* ---------- STATUS (the Player Record window) ---------- */
function StatusWindow({ g }) {
  const { S, go } = g;
  const level = lv(S), r = rank(S), pts = pointsLeft(S), pct = S.xp % 100;
  return (
    <Frame variant="hero" flames="both" className="status-window">
      <div className="sw-top">
        <span className="sw-tag">[ PLAYER RECORD // CLASSIFIED ]</span>
        <span className="sw-online"><i /> SYSTEM ONLINE</span>
      </div>
      <div className="sw-hero">
        <Orb level={level} rank={r} />
        <div className="sw-info">
          <div className="sw-rank">{r}-RANK AWAKENED</div>
          <dl className="sw-rec">
            <div><dt>IDENTITY</dt><dd>UNDISCLOSED</dd></div>
            <div><dt>PROTOCOL</dt><dd>ACTIVE</dd></div>
            <div><dt>DIRECTIVE</dt><dd>{S.focus}</dd></div>
            <div><dt>STREAK</dt><dd>{streak(S)} {streak(S) === 1 ? 'DAY' : 'DAYS'}</dd></div>
          </dl>
          <div className="sw-xp"><span>{pct} / 100 XP TO NEXT LEVEL</span><b>{S.xp} TOTAL XP</b></div>
          <XpBar pct={pct} />
          <div className="sw-pts"><em>{pts}</em> STAT POINTS AVAILABLE</div>
        </div>
      </div>
      <div className="attr-grid">
        {ATTRS.map(([id, name, desc]) => {
          const val = 1 + (S.stats[id] || 0);
          return (
            <div className="attr-tile" key={id} style={{ '--ph': `${-(ATTRS.findIndex((x) => x[0] === id) * 0.9)}s` }}>
              <div className="attr-head"><span className="attr-code">{id}</span><span className="muted tiny">ATTRIBUTE</span></div>
              <div className="attr-value">{val}</div>
              <div className="attr-name">{name}</div>
              <div className="attr-sub">{desc}</div>
              <div className="attr-bar"><span style={{ width: Math.min(100, Math.round((val / 20) * 100)) + '%' }} /></div>
            </div>
          );
        })}
      </div>
      <div className="actions">
        <button className="primary" onClick={() => go('stats')}><Icon name="stats" /> ALLOCATE STAT POINTS</button>
        <button onClick={() => go('quests')}><Icon name="quests" /> OPEN QUESTS</button>
      </div>
    </Frame>
  );
}

function Dashboard({ g }) {
  const { S, go } = g;
  const done = checked(S).length;
  return (
    <div className="col">
      <StatusWindow g={g} />
      <div className="layout">
        <div className="col">
          <Card title="TRANSMISSION // 001">
            <h3 className="transmission">You have been noticed.</h3>
            <p className="muted">Potential is meaningless without proof. Complete your trials, earn your evolution, and let no number define your limits. Recovery is part of the protocol.</p>
            <div className="row"><Tag>DIRECTIVE: {S.focus}</Tag><Tag>THREAT LEVEL: RISING</Tag></div>
          </Card>
          <Card title="DAILY QUEST BOARD">
            <BodyTraining g={g} />
            <QuestList g={g} />
            <ClaimBar g={g} />
          </Card>
          <Card title="HUNTER LOG">
            <div className="row space">
              <div><strong>{done} / {QUESTS.length}</strong><div className="muted">Daily quests checked · goal {DAILY_GOAL}</div></div>
              <div style={{ minWidth: '45%', flex: 1 }}><XpBar pct={(done / QUESTS.length) * 100} /></div>
            </div>
            <p className="notice">Check a quest only after completing it. Finish 5 of the 6 and the day counts as complete, so no penalty arrives tomorrow.</p>
          </Card>
        </div>
        <div className="col">
          <Card title="SYSTEM RECORD">
            <div className="stat"><div className="statcode">XP</div><div><div className="statname">Lifetime Experience</div><div className="statdesc">Total earned through completed quests</div></div><div className="statval">{S.xp}</div></div>
            <div className="stat"><div className="statcode">DAY</div><div><div className="statname">Daily Quest Progress</div><div className="statdesc">{done} of {QUESTS.length} completed</div></div><div className="statval">{Math.round((done / QUESTS.length) * 100)}%</div></div>
            <div className="stat"><div className="statcode">STK</div><div><div className="statname">Consistency Streak</div><div className="statdesc">Days with XP claimed</div></div><div className="statval">{streak(S)}</div></div>
          </Card>
          <Card title="WEEKLY BOSS">
            <div className="qname boss-name">{S.boss.name}</div>
            <p className="muted">{bossDesc(S)}</p>
            <div className="row space"><span className="xp">REWARD +25 XP</span><button onClick={() => go('bosses')}>OPEN BOSS ROOM →</button></div>
          </Card>
          <Card title="SYSTEM TIP">
            <p className="muted">Consistency beats intensity. Choose sustainable tasks, protect your sleep, and let real evidence—not the number on the screen—measure your growth.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- other pages ---------- */
function Quests({ g }) {
  return (
    <Card title="DAILY QUESTS">
      <p className="muted">TRIAL LOG // Mark only completed objectives. Experience is granted once per objective each day.</p>
      <BodyTraining g={g} />
      <QuestList g={g} />
      <ClaimBar g={g} />
    </Card>
  );
}

function Stats({ g }) {
  const { S, a } = g;
  const pts = pointsLeft(S);
  return (
    <Card title="ATTRIBUTE ALLOCATION">
      <div className="row space"><span className="muted">Available points</span><strong className="points">{pts}</strong></div>
      <p className="notice">Gain 3 points each time you level up. Starting attribute level is 1.</p>
      {ATTRS.map(([id, name, desc]) => (
        <div className="stat" key={id}>
          <div className="statcode">{id}</div>
          <div><div className="statname">{name}</div><div className="statdesc">{desc}</div><div className="notice">{S.stats[id] || 0} points invested</div></div>
          <div className="alloc"><div className="statval">Lv. {1 + (S.stats[id] || 0)}</div><button className="small" disabled={pts === 0} onClick={() => a.allocate(id)} aria-label={`Add a point to ${name}`}>+1</button></div>
        </div>
      ))}
      <p className="notice">Stats are motivational game attributes, not a scientific score.</p>
    </Card>
  );
}

function Skills({ g }) {
  const { S, a } = g;
  const pen = activePenalty(S);
  return (
    <Card title="SKILL TREES">
      <p className="muted">Unlock milestones by doing the work in real life. Ticking these is a record, not an automatic skill boost.</p>
      {TREES.map(([name, steps]) => (
        <div className="tree" key={name}>
          <h3>{name}</h3>
          {steps.map((step, i) => {
            const id = name + '::' + step, on = S.skills.includes(id);
            return (
              <div className={`skill ${on ? 'is-on' : ''}`} key={id}>
                <Check label={step} hint={on ? 'MILESTONE UNLOCKED' : 'MILESTONE ' + (i + 1)} checked={on} disabled={pen} onChange={(e) => a.toggleSkill(id, e.target.checked)} />
              </div>
            );
          })}
        </div>
      ))}
    </Card>
  );
}

function Bosses({ g }) {
  const { S, a } = g;
  const pen = activePenalty(S), claimed = S.boss.claimedWeek === weekKey();
  return (
    <Card title="WEEKLY BOSS ROOM" flames="top">
      <p className="muted">The System has randomly assigned one boss for this week. You cannot choose or reroll it. Complete the real-world condition and keep a brief evidence note before claiming the reward.</p>
      <Tag>RANDOM ASSIGNMENT · {S.boss.assignedWeek || weekKey()}</Tag>
      <div className="boss-box">
        <div className="sub">TARGET</div>
        <h3>{S.boss.name}</h3>
        <p>{bossDesc(S)}</p>
        <div className="xp">REWARD · +25 XP</div>
      </div>
      <label className="quest">
        <input type="checkbox" checked={!!S.boss.done} disabled={claimed || pen} onChange={(e) => a.bossDone(e.target.checked)} />
        <div className="qbody"><div className="qname">Boss condition completed</div><div className="qdesc">I completed the task and can show evidence.</div></div>
      </label>
      <div className="actions"><button className="primary" disabled={!S.boss.done || claimed || pen} onClick={a.claimBoss}>CLAIM BOSS REWARD</button></div>
      <p className="notice">One reward per week. No penalty for missing the boss; the challenge is designed to stretch you without requiring unsafe actions.</p>
      {claimed && <Tag>THIS WEEK’S BOSS REWARD CLAIMED ✓</Tag>}
    </Card>
  );
}

function Achievements({ g }) {
  const un = automaticAchievements(g.S);
  return (
    <Card title="ACHIEVEMENT ARCHIVE">
      <p className="muted">Achievements unlock automatically from your recorded progress. No manual claiming required. Some real-world milestones are detected through your quests and skill-tree records.</p>
      {ACHS.map(([id, name, desc]) => (
        <div className={`achievement ${un[id] ? 'is-on' : ''}`} key={id}>
          <div className="achicon">{un[id] ? '★' : '◇'}</div>
          <div className="grow"><strong>{name}</strong><div className="qdesc">{desc}</div></div>
          {un[id] ? <Tag>UNLOCKED</Tag> : <Tag locked>LOCKED</Tag>}
        </div>
      ))}
    </Card>
  );
}

function Journal({ g }) {
  const { S, a } = g;
  const [text, setText] = useState('');
  return (
    <Card title="HUNTER JOURNAL">
      <p className="muted">Log a win, a challenge and your next action. Entries are saved on this device.</p>
      <textarea className="field journal" value={text} onChange={(e) => setText(e.target.value)} placeholder="Today's wins… What I learned… What challenged me… Next quest…" />
      <div className="actions">
        <button className="primary" onClick={() => { if (a.saveJournal(text)) setText(''); }}>SAVE ENTRY</button>
        <button onClick={a.exportJournal}>EXPORT JOURNAL</button>
      </div>
      <h3 className="sec">PREVIOUS ENTRIES</h3>
      {(S.journal || []).length === 0 && <p className="muted">No entries yet.</p>}
      {(S.journal || []).slice().reverse().map((j) => (
        <div className="achievement" key={j.id}>
          <div className="grow"><strong>{j.date}</strong><div className="entry">{j.text}</div></div>
          <button className="small danger" onClick={() => a.deleteJournal(j.id)}>Delete</button>
        </div>
      ))}
    </Card>
  );
}

function Settings({ g }) {
  const { S, a, fx, setFx, reduced } = g;
  return (
    <Card title="SAVE & SETTINGS">
      <p>Your progress saves in this browser on this device. Use a backup to move progress between devices.</p>
      <div className="actions">
        <button className="primary" onClick={a.exportBackup}><Icon name="down" /> EXPORT BACKUP (.JSON)</button>
        <label className="filebtn"><Icon name="up" /> IMPORT BACKUP<input type="file" accept=".json,application/json" onChange={a.importBackup} /></label>
      </div>
      <hr />
      <label className="qname" htmlFor="fx">VISUAL EFFECTS {reduced && <Tag locked>OFF · REDUCED-MOTION IS ON</Tag>}</label>
      <select id="fx" className="field" value={fx} onChange={(e) => setFx(e.target.value)} disabled={reduced}>
        <option value="high">High · flames, aura dust, side light, lightning</option>
        <option value="medium">Medium · lighter effects, smooth on phones</option>
        <option value="off">Off · static frames only</option>
      </select>
      <p className="audio-help">If the app ever feels slow on your phone, choose Medium or Off. This is saved on this device only.</p>
      <hr />
      <Check label="System sound effects" hint="Alert sound for app opening and system notifications; quest sound for every button tap and checkbox change." checked={!!S.soundOn} onChange={(e) => a.setSound(e.target.checked)} />
      <div className="actions">
        <button className="primary" onClick={a.testSound}><Icon name="play" /> TEST ALERT SOUND</button>
        <button onClick={a.enableNotifications}>ENABLE PENALTY NOTIFICATIONS</button>
      </div>
      <p className="audio-help">Mobile notifications can appear over other apps after permission is granted while the app is running. Reliable alerts when the app is fully closed require push-service setup.</p>
      <label className="qname" htmlFor="focus">Current focus</label>
      <select id="focus" className="field" value={S.focus} onChange={(e) => a.setFocus(e.target.value)}>
        {FOCUS_OPTIONS.map((x) => <option key={x}>{x}</option>)}
      </select>
      <div className="actions">
        <button className="danger" onClick={a.resetLevel}>RESET PLAYER LEVEL · TWO WARNINGS</button>
        <button className="danger" onClick={a.resetAll}>RESET ALL PROGRESS</button>
      </div>
      <p className="notice">For use on another device, export the JSON backup here, transfer it to that device, open this app and import it. Import replaces current local data. This version does not cloud-sync automatically.</p>
    </Card>
  );
}

const PAGES = { dashboard: Dashboard, quests: Quests, stats: Stats, skills: Skills, bosses: Bosses, achievements: Achievements, journal: Journal, settings: Settings };
export function Page({ tab, g }) {
  const View = PAGES[tab] || Dashboard;
  return <View g={g} />;
}
