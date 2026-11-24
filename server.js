/*
 * Titan Forge game server
 * -----------------------
 * 1. Serves the game itself (index.html, the js files, art and models).
 * 2. Runs the PeerJS relay at /tforge, which connects players for
 *    online co-op and PvP duels.
 * 3. Runs the leaderboards (/api/lb) and clans (/api/clan...).
 *
 * Saved data (scores and clans):
 *  - If the DATABASE_URL environment variable is set (a Render Postgres
 *    database), everything is stored there and survives restarts.
 *  - Otherwise it is kept in data.json next to this file. On Render's free
 *    plan that file is wiped whenever the server restarts or redeploys.
 */
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { ExpressPeerServer } = require('peer');

const PORT = process.env.PORT || 3000;
const BOARDS = ['score', 'wave', 'rush', 'trial'];
const LOWER_IS_BETTER = new Set(['rush', 'trial']); // these boards are times
const LB_KEEP = 100;          // entries kept per board
const LB_SHOW = 50;           // entries sent to players
const CLAN_MAX = 30;          // pilots per clan

const app = express();
const server = http.createServer(app);
app.set('trust proxy', true);
app.use(express.json({ limit: '20kb' }));

// Let the game call the API even when it is opened from another address
// (for example the downloaded HTML file).
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* ---------------- data storage ---------------- */
let db = { lb: {}, clans: {}, members: {} };
for (const b of BOARDS) db.lb[b] = [];

const store = (() => {
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    const ssl = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false };
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl });
    return {
      kind: 'Postgres',
      async load() {
        await pool.query('CREATE TABLE IF NOT EXISTS tforge_state (k TEXT PRIMARY KEY, v JSONB NOT NULL)');
        const r = await pool.query("SELECT v FROM tforge_state WHERE k='main'");
        return r.rows[0] ? r.rows[0].v : null;
      },
      async save(data) {
        await pool.query(
          "INSERT INTO tforge_state (k, v) VALUES ('main', $1) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v",
          [JSON.stringify(data)]
        );
      },
    };
  }
  const file = path.join(__dirname, 'data.json');
  return {
    kind: 'file (data.json)',
    async load() { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return null; } },
    async save(data) { fs.writeFileSync(file + '.tmp', JSON.stringify(data)); fs.renameSync(file + '.tmp', file); },
  };
})();

let saveTimer = null;
function saveSoon() {
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    try { await store.save(db); } catch (e) { console.error('Save failed:', e.message); }
  }, 1500);
}

/* ---------------- helpers ---------------- */
// Names are shown inside the game's HTML, so strip anything that could act as code.
function clean(s, max) {
  return String(s == null ? '' : s).replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}
const validId = (id) => typeof id === 'string' && /^p[a-z0-9]{4,16}$/.test(id);
const key = (name) => clean(name, 20).toLowerCase();
function fail(res, code, msg) { return res.status(code).json({ error: msg }); }

// Simple flood protection: at most 60 saves per minute from one address.
const hits = new Map();
function limited(req) {
  const ip = req.ip || 'x', now = Date.now();
  let h = hits.get(ip);
  if (!h || now - h.t > 60000) { h = { t: now, n: 0 }; hits.set(ip, h); }
  return ++h.n > 60;
}
setInterval(() => { const now = Date.now(); for (const [ip, h] of hits) if (now - h.t > 60000) hits.delete(ip); }, 60000).unref();

// The bank record (who took out how much, and when) is only sent to the
// leader and treasurers.
function clanView(c, viewerId) {
  const v = {
    name: c.name, tag: c.tag, bank: c.bank, war: c.war,
    members: Object.entries(c.members).map(([id, m]) => ({ id, name: m.name, role: m.role, war: m.war })),
  };
  const viewer = viewerId && c.members[viewerId];
  if (viewer && (viewer.role === 'leader' || viewer.role === 'treasurer')) {
    v.log = (c.log || []).slice(-100).reverse();
    v.taken = Object.entries(c.taken || {}).map(([id, t]) => ({
      id, name: (c.members[id] && c.members[id].name) || t.name, total: t.total, times: t.times, last: t.last,
      left: !c.members[id],
    })).sort((a, b) => b.total - a.total);
  }
  return v;
}

/* ---------------- leaderboards ---------------- */
app.get('/api/lb', (req, res) => {
  const board = String(req.query.board || 'score');
  if (!BOARDS.includes(board)) return fail(res, 400, 'Unknown board');
  res.json(db.lb[board].slice(0, LB_SHOW));
});

app.post('/api/lb', (req, res) => {
  if (limited(req)) return fail(res, 429, 'Too many requests, slow down');
  const { id, board } = req.body || {};
  const value = Number(req.body && req.body.value);
  if (!validId(id)) return fail(res, 400, 'Bad pilot id');
  if (!BOARDS.includes(board)) return fail(res, 400, 'Unknown board');
  if (!Number.isFinite(value) || value <= 0 || value > 1e10) return fail(res, 400, 'Bad value');
  const name = clean(req.body.name, 14) || 'Pilot';
  const titan = clean(req.body.titan, 24);
  const lower = LOWER_IS_BETTER.has(board);
  const list = db.lb[board];
  const old = list.find((e) => e.id === id);
  const better = (a, b) => (lower ? a < b : a > b);
  if (old) {
    old.name = name; // keep the latest name even if the score is not a new best
    if (better(value, old.value)) { old.value = value; old.titan = titan; old.at = Date.now(); }
  } else {
    list.push({ id, name, titan, value, at: Date.now() });
  }
  list.sort((a, b) => (lower ? a.value - b.value : b.value - a.value));
  if (list.length > LB_KEEP) list.length = LB_KEEP;
  saveSoon();
  const rank = list.findIndex((e) => e.id === id);
  res.json({ ok: true, rank: rank < 0 ? null : rank + 1 });
});

/* ---------------- clans ---------------- */
app.get('/api/clans', (req, res) => {
  const top = Object.values(db.clans).sort((a, b) => b.war - a.war).slice(0, 30).map((c) => clanView(c));
  res.json(top);
});

app.get('/api/clan/:name', (req, res) => {
  const c = db.clans[key(req.params.name)];
  if (!c) return fail(res, 404, 'Clan not found');
  res.json(clanView(c, String(req.query.id || '')));
});

app.post('/api/clan/create', (req, res) => {
  if (limited(req)) return fail(res, 429, 'Too many requests, slow down');
  const { id } = req.body || {};
  if (!validId(id)) return fail(res, 400, 'Bad pilot id');
  if (db.members[id]) return fail(res, 400, 'Leave your current clan first');
  const name = clean(req.body.name, 20);
  const tag = clean(req.body.tag, 4).toUpperCase();
  if (name.length < 3) return fail(res, 400, 'Clan name needs at least 3 letters');
  if (tag.length < 2) return fail(res, 400, 'Tag needs 2 to 4 letters');
  if (db.clans[key(name)]) return fail(res, 400, 'That clan name is taken');
  if (Object.keys(db.clans).length >= 5000) return fail(res, 400, 'The server has too many clans');
  db.clans[key(name)] = {
    name, tag, bank: 0, war: 0, created: Date.now(),
    members: { [id]: { name: clean(req.body.pname, 14) || 'Pilot', role: 'leader', war: 0 } },
  };
  db.members[id] = key(name);
  saveSoon();
  res.json(clanView(db.clans[key(name)], id));
});

app.post('/api/clan/join', (req, res) => {
  if (limited(req)) return fail(res, 429, 'Too many requests, slow down');
  const { id } = req.body || {};
  if (!validId(id)) return fail(res, 400, 'Bad pilot id');
  const c = db.clans[key(req.body.name)];
  if (!c) return fail(res, 404, 'No clan with that name');
  if (db.members[id] && db.members[id] !== key(c.name)) return fail(res, 400, 'Leave your current clan first');
  if (!c.members[id]) {
    if (Object.keys(c.members).length >= CLAN_MAX) return fail(res, 400, 'That clan is full (30 pilots)');
    c.members[id] = { name: clean(req.body.pname, 14) || 'Pilot', role: 'member', war: 0 };
  }
  db.members[id] = key(c.name);
  saveSoon();
  res.json(clanView(c, id));
});

app.post('/api/clan/leave', (req, res) => {
  const { id } = req.body || {};
  if (!validId(id)) return fail(res, 400, 'Bad pilot id');
  const k = db.members[id];
  const c = k && db.clans[k];
  delete db.members[id];
  if (c && c.members[id]) {
    const wasLeader = c.members[id].role === 'leader';
    delete c.members[id];
    const rest = Object.values(c.members);
    if (!rest.length) delete db.clans[k];               // last pilot out closes the clan
    else if (wasLeader) rest.sort((a, b) => b.war - a.war)[0].role = 'leader';
  }
  saveSoon();
  res.json({ ok: true });
});

app.post('/api/clan/donate', (req, res) => {
  if (limited(req)) return fail(res, 429, 'Too many requests, slow down');
  const { id } = req.body || {};
  const amount = Math.floor(Number(req.body && req.body.amount));
  if (!validId(id)) return fail(res, 400, 'Bad pilot id');
  const c = db.clans[db.members[id]];
  if (!c || !c.members[id]) return fail(res, 400, 'You are not in a clan');
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e9) return fail(res, 400, 'Bad amount');
  c.bank += amount;
  addLog(c, 'donate', c.members[id].name, amount);
  saveSoon();
  res.json(clanView(c, id));
});

// Bank history shown on the clan page (who put in / took out how much).
function addLog(c, kind, who, amount) {
  c.log = c.log || [];
  c.log.push({ kind, who, amount, at: Date.now() });
  if (c.log.length > 300) c.log.splice(0, c.log.length - 300);
}

// Leader appoints or removes a Treasurer (a trustee of the clan bank).
app.post('/api/clan/role', (req, res) => {
  if (limited(req)) return fail(res, 429, 'Too many requests, slow down');
  const { id, target } = req.body || {};
  const role = req.body && req.body.role;
  if (!validId(id) || !validId(target)) return fail(res, 400, 'Bad pilot id');
  const c = db.clans[db.members[id]];
  if (!c || !c.members[id]) return fail(res, 400, 'You are not in a clan');
  if (c.members[id].role !== 'leader') return fail(res, 403, 'Only the clan leader can choose treasurers');
  const t = c.members[target];
  if (!t) return fail(res, 404, 'That pilot is not in your clan');
  if (t.role === 'leader') return fail(res, 400, 'The leader already controls the bank');
  if (role !== 'treasurer' && role !== 'member') return fail(res, 400, 'Bad role');
  if (role === 'treasurer' && t.role !== 'treasurer') {
    const count = Object.values(c.members).filter((m) => m.role === 'treasurer').length;
    if (count >= 5) return fail(res, 400, 'A clan can have at most 5 treasurers');
  }
  t.role = role;
  addLog(c, role === 'treasurer' ? 'appoint' : 'remove', t.name, 0);
  saveSoon();
  res.json(clanView(c, id));
});

// Any member can take scrap out of the clan bank into their own bank.
// Every withdrawal is recorded for the leader and treasurers.
app.post('/api/clan/withdraw', (req, res) => {
  if (limited(req)) return fail(res, 429, 'Too many requests, slow down');
  const { id } = req.body || {};
  const amount = Math.floor(Number(req.body && req.body.amount));
  if (!validId(id)) return fail(res, 400, 'Bad pilot id');
  const c = db.clans[db.members[id]];
  if (!c || !c.members[id]) return fail(res, 400, 'You are not in a clan');
  if (!Number.isFinite(amount) || amount <= 0) return fail(res, 400, 'Enter an amount to withdraw');
  if (amount > c.bank) return fail(res, 400, `The clan bank only has ${c.bank.toLocaleString()} scrap`);
  c.bank -= amount;
  addLog(c, 'withdraw', c.members[id].name, amount);
  c.taken = c.taken || {};
  const t = c.taken[id] || (c.taken[id] = { name: c.members[id].name, total: 0, times: 0, last: 0 });
  t.name = c.members[id].name; t.total += amount; t.times += 1; t.last = Date.now();
  saveSoon();
  res.json({ amount, clan: clanView(c, id) });
});

app.post('/api/clan/war', (req, res) => {
  if (limited(req)) return fail(res, 429, 'Too many requests, slow down');
  const { id } = req.body || {};
  const points = Math.min(5000, Math.floor(Number(req.body && req.body.points)));
  if (!validId(id)) return fail(res, 400, 'Bad pilot id');
  const c = db.clans[db.members[id]];
  if (!c || !c.members[id]) return fail(res, 400, 'You are not in a clan');
  if (!Number.isFinite(points) || points <= 0) return fail(res, 400, 'Bad points');
  c.war += points;
  c.members[id].war += points;
  saveSoon();
  res.json({ ok: true, war: c.war });
});

/* ---------------- health check & game files ---------------- */
app.get('/healthz', (req, res) => res.json({ ok: true, storage: store.kind, players: peerCount() }));

// Tells the game it is running on its own server, so online play,
// leaderboards and clans switch on without any setup.
app.get('/tf-host.js', (req, res) => {
  res.type('application/javascript').set('Cache-Control', 'no-cache')
    .send('window.TF_HOSTED=location.origin;');
});

// The game files sit next to server.js (GitHub's web uploader keeps everything
// in one folder). Only these files are served, so server.js and other
// project files are never sent to players.
const GAME_FILES = {
  js: ['core.js', 'data.js', 'game.js', 'mechs.js', 'military.js', 'world.js'],
  art: ['inferno.jpg', 'reactor.jpg', 'tempest.jpg', 'vanguard.jpg', 'venom.jpg'],
  models: ['titans.json'],
};
function sendGameFile(res, file) {
  const long = /\.(jpg|json)$/.test(file);
  res.sendFile(path.join(__dirname, file), { headers: { 'Cache-Control': long ? 'public, max-age=86400' : 'no-cache' } });
}
app.get(['/', '/index.html'], (req, res) => sendGameFile(res, 'index.html'));
app.get('/:dir(js|art|models)/:file', (req, res, next) => {
  const list = GAME_FILES[req.params.dir];
  if (!list.includes(req.params.file)) return next();
  sendGameFile(res, req.params.file);
});

/* ---------------- PeerJS relay (co-op & PvP) ---------------- */
const peerServer = ExpressPeerServer(server, { path: '/', allow_discovery: false, proxied: true });
let peers = 0;
peerServer.on('connection', () => { peers++; });
peerServer.on('disconnect', () => { peers = Math.max(0, peers - 1); });
const peerCount = () => peers;
app.use('/tforge', peerServer);

/* ---------------- start ---------------- */
(async () => {
  try {
    const saved = await store.load();
    if (saved) {
      db = { lb: saved.lb || {}, clans: saved.clans || {}, members: saved.members || {} };
      for (const b of BOARDS) if (!Array.isArray(db.lb[b])) db.lb[b] = [];
    }
  } catch (e) {
    console.error('Could not load saved data, starting fresh:', e.message);
  }
  server.listen(PORT, () => {
    console.log(`Titan Forge server running on port ${PORT}`);
    console.log(`Saving scores and clans to: ${store.kind}`);
  });
})();

// Save before the server shuts down (Render sends SIGTERM on redeploy).
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, async () => {
    try { await store.save(db); } catch (e) { /* ignore */ }
    process.exit(0);
  });
}
