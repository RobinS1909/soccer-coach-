// Trainingsregeln und Datumshilfen – an einer Stelle, für Kinder- und Trainer-Ansicht.

const pad = (n) => String(n).padStart(2, '0');

export function isoDatum(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ausIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function plusTage(iso, n) {
  const d = ausIso(iso);
  d.setDate(d.getDate() + n);
  return isoDatum(d);
}

// Montag der Woche als ISO-Datum
export function wocheVon(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return isoDatum(x);
}

export function inWoche(datumIso, wocheIso) {
  return datumIso >= wocheIso && datumIso < plusTage(wocheIso, 7);
}

export function kw(wocheIso) {
  const d = ausIso(wocheIso);
  d.setDate(d.getDate() + 3); // Donnerstag bestimmt die KW
  const jan4 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
}

export function wochenText(wocheIso) {
  const f = (iso) => ausIso(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  return `KW ${kw(wocheIso)} · ${f(wocheIso)}–${f(plusTage(wocheIso, 6))}`;
}

// Pro verpasstem Mannschaftstraining: 2 zusätzliche Heimeinheiten.
export const EXTRA_PRO_FEHLTRAINING = 2;

/**
 * Berechnet Soll und Ist einer Woche.
 * basis: Pflicht-Übungen (IDs), verpasst: Anzahl verpasster Trainings,
 * erledigt: Liste der in dieser Woche erledigten Übungs-IDs (Duplikate egal).
 * Extra-Einheiten: jede erledigte Übung, die keine Pflicht-Übung ist.
 */
export function berechneWoche({ basis, verpasst, erledigt }) {
  const set = new Set(erledigt);
  const basisIst = basis.filter((id) => set.has(id)).length;
  const extraSoll = verpasst * EXTRA_PRO_FEHLTRAINING;
  const extraErledigt = [...set].filter((id) => !basis.includes(id)).length;
  const extraIst = Math.min(extraErledigt, extraSoll);
  const soll = basis.length + extraSoll;
  const ist = basisIst + extraIst;
  return { basisSoll: basis.length, basisIst, extraSoll, extraIst, soll, ist, fertig: soll > 0 && ist >= soll };
}

// Automatischer Wochenplan: wechselt nach Kalenderwoche durch die Pläne in uebungen.json
export function standardPlan(daten, wocheIso) {
  const liste = daten.standardWochen && daten.standardWochen.length ? daten.standardWochen : [daten.standardWoche];
  const i = kw(wocheIso) % liste.length;
  return { ...liste[i], nummer: i + 1, anzahl: liste.length };
}
