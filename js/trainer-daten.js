// Datenzugriff für den Trainer-Bereich: Supabase oder Demo (gleiche Funktionen).
import { demo, db } from './api.js';
import { demoTrainer } from './demo.js';

const supabase = {
  kinder: () => db.lesen('kind?select=id,name&order=name'),
  erledigungen: (von, bis) => db.lesen(`erledigung?select=kind_id,uebung_id,datum&datum=gte.${von}&datum=lt.${bis}`),
  trainings: (von, bis) => db.lesen(`training?select=id,datum,anwesenheit(kind_id,anwesend)&datum=gte.${von}&datum=lt.${bis}&order=datum`),
  plan: (woche) => db.lesen(`wochenplan?select=uebung_id,art&woche=eq.${woche}`),
  trainingAnlegen: (datum) => db.einfuegen('training', { datum }),
  anwesenheitSetzen: (zeilen) => db.einfuegen('anwesenheit', zeilen, true),
  trainingLoeschen: (id) => db.loeschen(`training?id=eq.${id}`),
  planSetzen: (zeilen) => db.einfuegen('wochenplan', zeilen, true),
  planEntfernen: (woche, id) => db.loeschen(`wochenplan?woche=eq.${woche}&uebung_id=eq.${encodeURIComponent(id)}`),
  kindAnlegen: (name) => db.rpc('trainer_kind_anlegen', { p_name: name }),
  codeNeu: (id) => db.rpc('trainer_code_neu', { p_kind: id }),
  kindLoeschen: (id) => db.loeschen(`kind?id=eq.${id}`),
};

export const daten = demo ? demoTrainer : supabase;
