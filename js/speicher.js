// Sicherer Zugriff auf den Gerätespeicher (funktioniert auch, wenn er blockiert ist).
export function lesen(schluessel, standard) {
  try {
    const v = localStorage.getItem(schluessel);
    return v === null ? standard : JSON.parse(v);
  } catch {
    return standard;
  }
}

export function schreiben(schluessel, wert) {
  try {
    if (wert === null) localStorage.removeItem(schluessel);
    else localStorage.setItem(schluessel, JSON.stringify(wert));
  } catch {
    /* Speicher nicht verfügbar – App läuft trotzdem */
  }
}
