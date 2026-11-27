// Demo-Modus: simuliert die Datenbank komplett auf diesem Gerät.
// Aktiv, solange in config.js kein Supabase eingetragen ist. Nur Beispiel-Namen, keine echten Kinder.
import { lesen, schreiben } from './speicher.js';
import { isoDatum, wocheVon, plusTage, inWoche, ausIso } from './regeln.js';

const SCHLUESSEL = 'sc_demo_db';
const id = () => Math.random().toString(36).slice(2, 10);

function startdaten() {
  const heute = isoDatum();
  const montag = wocheVon();
  const k = [
    { id: 'k1', name: 'Max', code: 'MAX123' },
    { id: 'k2', name: 'Lena', code: 'LENA12' },
    { id: 'k3', name: 'Tom', code: 'TOM123' },
    { id: 'k4', name: 'Mia', code: 'MIA123' },
  ];
  return {
    kinder: k,
    erledigung: [
      { kind_id: 'k2', uebung_id: 'ballverlust-sprint', datum: heute },
      { kind_id: 'k2', uebung_id: 'wandpass-challenge', datum: heute },
      { kind_id: 'k2', uebung_id: 'kopf-freier-raum', datum: heute },
      { kind_id: 'k1', uebung_id: 'wandpass-challenge', datum: heute },
      { kind_id: 'k3', uebung_id: 'kopf-freier-raum', datum: heute },
      { kind_id: 'k2', uebung_id: 'spiegel-duell', datum: plusTage(montag, -5) },
      { kind_id: 'k2', uebung_id: 'annahme-tor', datum: plusTage(montag, -4) },
    ],
    training: [{ id: 't1', datum: montag }],
    anwesenheit: k.map((x) => ({ training_id: 't1', kind_id: x.id, anwesend: x.id !== 'k3' })),
    wochenplan: [],
  };
}

const laden = () => lesen(SCHLUESSEL, null) || startdaten();
const sichern = (db) => schreiben(SCHLUESSEL, db);

export function demoZuruecksetzen() {
  schreiben(SCHLUESSEL, null);
}

export const DEMO_CODES = ['MAX123', 'LENA12', 'TOM123', 'MIA123'];

function fehler(msg, status = 400) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

function kindPerCode(db, code) {
  const k = db.kinder.find((x) => x.code === String(code).toUpperCase().replace(/[^A-Z0-9]/g, ''));
  if (!k) throw fehler('Code unbekannt');
  return k;
}

const verpasst = (db, kindId, woche) =>
  db.training.filter((t) => inWoche(t.datum, woche) && db.anwesenheit.some((a) => a.training_id === t.id && a.kind_id === kindId && !a.anwesend)).length;

// gleiche Funktionen wie in supabase/schema.sql
export async function demoRpc(name, a) {
  const db = laden();
  if (name === 'kind_daten') {
    const k = kindPerCode(db, a.p_code);
    return {
      name: k.name,
      plan: db.wochenplan.filter((p) => p.woche === a.p_woche).map(({ uebung_id, art }) => ({ uebung_id, art })),
      verpasst: verpasst(db, k.id, a.p_woche),
      historie: db.erledigung.filter((e) => e.kind_id === k.id).map(({ uebung_id, datum }) => ({ uebung_id, datum })),
    };
  }
  if (name === 'kind_abhaken') {
    const k = kindPerCode(db, a.p_code);
    const w = wocheVon(ausIso(a.p_datum));
    if (db.erledigung.some((e) => e.kind_id === k.id && e.uebung_id === a.p_uebung && inWoche(e.datum, w))) return false;
    db.erledigung.push({ kind_id: k.id, uebung_id: a.p_uebung, datum: a.p_datum });
    sichern(db);
    return true;
  }
  if (name === 'kind_zuruecknehmen') {
    const k = kindPerCode(db, a.p_code);
    db.erledigung = db.erledigung.filter((e) => !(e.kind_id === k.id && e.uebung_id === a.p_uebung && inWoche(e.datum, a.p_woche)));
    sichern(db);
    return true;
  }
  if (name === 'team_fortschritt') {
    kindPerCode(db, a.p_code);
    const eigen = db.wochenplan.filter((p) => p.woche === a.p_woche && p.art === 'basis').map((p) => p.uebung_id);
    const basis = eigen.length ? eigen : a.p_basis;
    let ist = 0, soll = 0, fertig = 0;
    for (const k of db.kinder) {
      const erl = new Set(db.erledigung.filter((e) => e.kind_id === k.id && inWoche(e.datum, a.p_woche)).map((e) => e.uebung_id));
      const extraSoll = 2 * verpasst(db, k.id, a.p_woche);
      const i = basis.filter((id) => erl.has(id)).length + Math.min([...erl].filter((id) => !basis.includes(id)).length, extraSoll);
      const so = basis.length + extraSoll;
      ist += i; soll += so; if (so && i >= so) fertig++;
    }
    return { kinder: db.kinder.length, fertig, ist, soll };
  }
  throw fehler('Unbekannte Funktion');
}

function neuerCode(db) {
  const z = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let c;
  do c = Array.from({ length: 6 }, () => z[Math.floor(Math.random() * z.length)]).join('');
  while (db.kinder.some((k) => k.code === c));
  return c;
}

const mitDb = (fn) => async (...args) => {
  const db = laden();
  const r = fn(db, ...args);
  sichern(db);
  return r;
};

export const demoTrainer = {
  kinder: mitDb((db) => db.kinder.map(({ id, name }) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'de'))),
  erledigungen: mitDb((db, von, bis) => db.erledigung.filter((e) => e.datum >= von && e.datum < bis)),
  trainings: mitDb((db, von, bis) =>
    db.training.filter((t) => t.datum >= von && t.datum < bis).map((t) => ({ ...t, anwesenheit: db.anwesenheit.filter((a) => a.training_id === t.id) }))),
  plan: mitDb((db, woche) => db.wochenplan.filter((p) => p.woche === woche)),
  trainingAnlegen: mitDb((db, datum) => { if (!db.training.some((t) => t.datum === datum)) db.training.push({ id: id(), datum }); }),
  anwesenheitSetzen: mitDb((db, zeilen) => {
    for (const z of zeilen) {
      db.anwesenheit = db.anwesenheit.filter((a) => !(a.training_id === z.training_id && a.kind_id === z.kind_id));
      db.anwesenheit.push(z);
    }
  }),
  trainingLoeschen: mitDb((db, tid) => {
    db.training = db.training.filter((t) => t.id !== tid);
    db.anwesenheit = db.anwesenheit.filter((a) => a.training_id !== tid);
  }),
  planSetzen: mitDb((db, zeilen) => {
    for (const z of zeilen) {
      db.wochenplan = db.wochenplan.filter((p) => !(p.woche === z.woche && p.uebung_id === z.uebung_id));
      db.wochenplan.push(z);
    }
  }),
  planEntfernen: mitDb((db, woche, uid) => { db.wochenplan = db.wochenplan.filter((p) => !(p.woche === woche && p.uebung_id === uid)); }),
  kindAnlegen: mitDb((db, name) => {
    const k = { id: id(), name: name.trim().slice(0, 30), code: neuerCode(db) };
    db.kinder.push(k);
    return { id: k.id, code: k.code };
  }),
  codeNeu: mitDb((db, kid) => {
    const k = db.kinder.find((x) => x.id === kid);
    k.code = neuerCode(db);
    return k.code;
  }),
  trainerListe: mitDb((db) => (db.trainer || [{ email: 'demo@svsoltau.de', ich: true }]).map((t) => ({ aktiv: t.ich, zuletzt: t.ich ? new Date().toISOString() : null, ...t }))),
  trainerFreischalten: mitDb((db, email) => {
    db.trainer = db.trainer || [{ email: 'demo@svsoltau.de', ich: true }];
    if (db.trainer.some((t) => t.email === email.toLowerCase())) return 'schon';
    db.trainer.push({ email: email.toLowerCase(), ich: false });
    return 'ok';
  }),
  trainerEntfernen: mitDb((db, email) => {
    db.trainer = db.trainer || [{ email: 'demo@svsoltau.de', ich: true }];
    if (db.trainer.length <= 1) return 'letzter';
    db.trainer = db.trainer.filter((t) => t.email !== email);
    return 'ok';
  }),
  kindLoeschen: mitDb((db, kid) => {
    db.kinder = db.kinder.filter((k) => k.id !== kid);
    db.erledigung = db.erledigung.filter((e) => e.kind_id !== kid);
    db.anwesenheit = db.anwesenheit.filter((a) => a.kind_id !== kid);
  }),
};
