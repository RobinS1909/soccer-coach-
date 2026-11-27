// Daten für die Kinder-Ansicht.
// Ohne Supabase: alles bleibt auf dem Gerät. Mit Supabase: Anmeldung per Zugangscode.
import { online, rpc, ApiFehler } from './api.js';
import { lesen, schreiben } from './speicher.js';
import { isoDatum, wocheVon, inWoche } from './regeln.js';

const LOKAL = 'sc_lokal_historie'; // [{uebung_id, datum}]
const CODE = 'sc_kind_code';
const CACHE = 'sc_kind_cache';
const WARTESCHLANGE = 'sc_kind_offen'; // offline abgehakt, noch nicht gesendet
const ERFOLGE = 'sc_erfolge';

export const kindCode = () => lesen(CODE, null);

export function erfolge() {
  return lesen(ERFOLGE, { wocheFertig: false, quizPerfekt: false, bekannt: [] });
}
export function erfolgeSpeichern(e) {
  schreiben(ERFOLGE, e);
}

export async function anmelden(code) {
  const sauber = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (sauber.length < 4) throw new ApiFehler('Der Code ist zu kurz.');
  const daten = await rpc('kind_daten', { p_code: sauber, p_woche: wocheVon() });
  schreiben(CODE, sauber);
  schreiben(CACHE, daten);
  return daten;
}

export function abmelden() {
  [CODE, CACHE, WARTESCHLANGE, ERFOLGE].forEach((k) => schreiben(k, null));
}

async function sendeWarteschlange() {
  const offen = lesen(WARTESCHLANGE, []);
  if (!offen.length) return;
  const rest = [];
  for (const a of offen) {
    try {
      await rpc(a.typ === 'weg' ? 'kind_zuruecknehmen' : 'kind_abhaken', a.args);
    } catch (e) {
      if (!e.status) rest.push(a); // nur bei fehlender Verbindung erneut versuchen
    }
  }
  schreiben(WARTESCHLANGE, rest);
}

/**
 * Liefert {name, basis, zusatz, verpasst, historie, offline, planVomTrainer}
 * standardWoche: Fallback-Plan aus uebungen.json
 */
export async function ladeWoche(woche, standardWoche) {
  if (!online || !kindCode()) {
    return { name: null, basis: standardWoche.basis, zusatz: standardWoche.zusatz, verpasst: 0, historie: lesen(LOKAL, []), offline: false, planVomTrainer: false };
  }
  let daten;
  let offline = false;
  try {
    await sendeWarteschlange();
    daten = await rpc('kind_daten', { p_code: kindCode(), p_woche: woche });
    schreiben(CACHE, daten);
  } catch (e) {
    if (e.status) {
      // Code ungültig (z. B. Kind gelöscht oder neuer Code)
      abmelden();
      throw e;
    }
    daten = lesen(CACHE, null);
    offline = true;
    if (!daten) throw e;
  }
  // offline abgehakte Einheiten schon anzeigen
  let historie = daten.historie || [];
  for (const a of lesen(WARTESCHLANGE, [])) {
    if (a.typ === 'weg') historie = historie.filter((h) => !(h.uebung_id === a.args.p_uebung && inWoche(h.datum, a.args.p_woche)));
    else historie = [...historie, { uebung_id: a.args.p_uebung, datum: a.args.p_datum }];
  }
  const plan = daten.plan || [];
  const planVomTrainer = plan.length > 0;
  return {
    name: daten.name,
    basis: planVomTrainer ? plan.filter((p) => p.art === 'basis').map((p) => p.uebung_id) : standardWoche.basis,
    zusatz: planVomTrainer ? plan.filter((p) => p.art === 'zusatz').map((p) => p.uebung_id) : standardWoche.zusatz,
    verpasst: daten.verpasst || 0,
    historie,
    offline,
    planVomTrainer,
  };
}

export async function abhaken(uebungId) {
  const datum = isoDatum();
  if (!online || !kindCode()) {
    const h = lesen(LOKAL, []);
    if (!h.some((e) => e.uebung_id === uebungId && inWoche(e.datum, wocheVon()))) h.push({ uebung_id: uebungId, datum });
    schreiben(LOKAL, h);
    return;
  }
  const args = { p_code: kindCode(), p_uebung: uebungId, p_datum: datum };
  try {
    await rpc('kind_abhaken', args);
  } catch (e) {
    if (e.status) throw e;
    schreiben(WARTESCHLANGE, [...lesen(WARTESCHLANGE, []), { typ: 'neu', args }]);
  }
}

export async function zuruecknehmen(uebungId) {
  const woche = wocheVon();
  if (!online || !kindCode()) {
    schreiben(LOKAL, lesen(LOKAL, []).filter((e) => !(e.uebung_id === uebungId && inWoche(e.datum, woche))));
    return;
  }
  const args = { p_code: kindCode(), p_uebung: uebungId, p_woche: woche };
  try {
    await rpc('kind_zuruecknehmen', args);
  } catch (e) {
    if (e.status) throw e;
    schreiben(WARTESCHLANGE, [...lesen(WARTESCHLANGE, []), { typ: 'weg', args }]);
  }
}

export function lokaleDatenLoeschen() {
  [LOKAL, ERFOLGE].forEach((k) => schreiben(k, null));
}

// Team-Fortschritt der Woche (nur Summen aller Kinder, keine Namen). null = nicht verfügbar.
export async function teamFortschritt(woche, basis) {
  if (!online || !kindCode() || !basis.length) return null;
  try {
    return await rpc('team_fortschritt', { p_code: kindCode(), p_woche: woche, p_basis: basis });
  } catch {
    return null;
  }
}
