// Prüft data/uebungen.json auf Fehler. Aufruf: node scripts/pruefe-uebungen.mjs
import { readFileSync } from 'node:fs';

const d = JSON.parse(readFileSync(new URL('../data/uebungen.json', import.meta.url), 'utf8'));
const fehler = [];
const ids = new Set();
const sp = Object.keys(d.schwerpunkte);
const arten = Object.keys(d.arten);

for (const u of d.uebungen) {
  const w = (m) => fehler.push(`${u.id || '(ohne id)'}: ${m}`);
  if (!/^[a-z0-9-]{1,60}$/.test(u.id || '')) w('id ungültig (nur a-z, 0-9, Bindestrich)');
  if (ids.has(u.id)) w('id doppelt');
  ids.add(u.id);
  for (const f of ['titel', 'ziel', 'ort', 'tipp']) if (typeof u[f] !== 'string' || !u[f].trim()) w(`Feld „${f}“ fehlt`);
  if (!sp.includes(u.schwerpunkt)) w(`Schwerpunkt „${u.schwerpunkt}“ unbekannt`);
  if (!arten.includes(u.art)) w(`Art „${u.art}“ unbekannt`);
  if (!Number.isInteger(u.dauer) || u.dauer < 3 || u.dauer > 20) w('dauer muss 3–20 Minuten sein');
  if (!Array.isArray(u.material) || !u.material.length) w('material fehlt');
  if (!Array.isArray(u.schritte) || u.schritte.length < 3) w('mindestens 3 Schritte');
  for (const v of u.videos || []) if (!/^https:\/\//.test(v.url || '') || !v.titel) w('Video braucht titel und https-Link');
  if (u.art === 'kopf') {
    if (!Array.isArray(u.quiz) || u.quiz.length < 2) w('Kopf-Training braucht mindestens 2 Quizfragen');
    for (const [i, q] of (u.quiz || []).entries()) {
      if (!q.frage || !q.erklaerung) w(`Frage ${i + 1}: frage/erklaerung fehlt`);
      if (!Array.isArray(q.antworten) || q.antworten.length < 2) w(`Frage ${i + 1}: mindestens 2 Antworten`);
      if (!Number.isInteger(q.richtig) || q.richtig < 0 || q.richtig >= (q.antworten || []).length) w(`Frage ${i + 1}: „richtig“ zeigt auf keine Antwort`);
      const s = q.skizze;
      if (s) {
        const inFeld = (x, y) => x >= 0 && x <= 100 && y >= 0 && y <= 64;
        for (const p of s.spieler || []) if (!inFeld(p.x, p.y) || !['wir', 'gegner'].includes(p.team)) w(`Frage ${i + 1}: Spieler außerhalb oder Team falsch`);
        for (const p of s.pfeile || []) if (!inFeld(...p.von) || !inFeld(...p.nach)) w(`Frage ${i + 1}: Pfeil außerhalb des Feldes`);
        for (const z of s.zonen || []) if (!inFeld(z.x, z.y) || !inFeld(z.x + z.w, z.y + z.h)) w(`Frage ${i + 1}: Zone außerhalb des Feldes`);
      }
    }
  } else if (u.quiz) w('nur Kopf-Trainings haben ein Quiz');
}
for (const [n, w] of (d.standardWochen || [d.standardWoche]).entries())
  for (const id of [...w.basis, ...w.zusatz]) if (!ids.has(id)) fehler.push(`Wochenplan ${n + 1}: Übung „${id}“ gibt es nicht`);

const zaehl = {};
for (const u of d.uebungen) zaehl[u.schwerpunkt] = (zaehl[u.schwerpunkt] || 0) + 1;
console.log(`${d.uebungen.length} Übungen:`, zaehl);
if (fehler.length) {
  console.error(`\n${fehler.length} Fehler:\n- ` + fehler.join('\n- '));
  process.exit(1);
}
console.log('Alles in Ordnung ✅');
