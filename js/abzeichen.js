// Abzeichen – werden nur aus den erledigten Einheiten berechnet.
export const ABZEICHEN = [
  { id: 'erste', icon: '🌱', name: 'Erster Schritt', text: 'Deine erste Einheit geschafft', pruef: (h) => h.anzahl >= 1 },
  { id: 'fuenf', icon: '🔥', name: 'Dranbleiber', text: '5 Einheiten geschafft', pruef: (h) => h.anzahl >= 5 },
  { id: 'zehn', icon: '💪', name: 'Fleißig', text: '10 Einheiten geschafft', pruef: (h) => h.anzahl >= 10 },
  { id: 'fuenfundzwanzig', icon: '🚀', name: 'Trainings-Maschine', text: '25 Einheiten geschafft', pruef: (h) => h.anzahl >= 25 },
  { id: 'woche', icon: '🏆', name: 'Wochen-Held', text: 'Ein komplettes Wochen-Soll geschafft', pruef: (h) => h.wocheFertig },
  { id: 'umschalten', icon: '⚡', name: 'Umschalt-Blitz', text: '3× Umschalten trainiert', pruef: (h) => (h.proSchwerpunkt.umschalten || 0) >= 3 },
  { id: 'passen', icon: '🎯', name: 'Pass-Profi', text: '3× Passen trainiert', pruef: (h) => (h.proSchwerpunkt.passen || 0) >= 3 },
  { id: 'dritter', icon: '🔺', name: 'Dreiecks-Meister', text: '3× Spiel über den Dritten trainiert', pruef: (h) => (h.proSchwerpunkt.dritter || 0) >= 3 },
  { id: 'raum', icon: '👀', name: 'Raum-Entdecker', text: '3× Freie Räume trainiert', pruef: (h) => (h.proSchwerpunkt.raum || 0) >= 3 },
  { id: 'abwehr', icon: '🛡️', name: 'Abwehr-Mauer', text: '3× Abwehr trainiert', pruef: (h) => (h.proSchwerpunkt.abwehr || 0) >= 3 },
  { id: 'technik', icon: '✨', name: 'Ballzauberer', text: '3× Ballgefühl trainiert', pruef: (h) => (h.proSchwerpunkt.technik || 0) >= 3 },
  { id: 'kopf', icon: '🧠', name: 'Kopf-Genie', text: 'Ein Quiz ohne Fehler gelöst', pruef: (h) => h.quizPerfekt },
  { id: 'allrounder', icon: '⭐', name: 'Allrounder', text: 'Mindestens 5 verschiedene Schwerpunkte trainiert', pruef: (h) => Object.keys(h.proSchwerpunkt).length >= 5 },
];

export function werteAus(historie, uebungenNachId, extra) {
  const proSchwerpunkt = {};
  for (const e of historie) {
    const u = uebungenNachId[e.uebung_id];
    if (u) proSchwerpunkt[u.schwerpunkt] = (proSchwerpunkt[u.schwerpunkt] || 0) + 1;
  }
  const h = { anzahl: historie.length, proSchwerpunkt, ...extra };
  return ABZEICHEN.filter((a) => a.pruef(h)).map((a) => a.id);
}
