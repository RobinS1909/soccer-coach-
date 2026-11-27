// SV Soltau – Teamzentrale: Aufbau der App an EINER Stelle.
// Jeder Bereich hat Unterseiten. "geplant" listet, was in späteren Abschnitten gebaut wird.
// Rollen: chef = Cheftrainer, co = Co-Trainer/Betreuer, leitung = Sportliche Leitung,
//         kasse = Kassenwart, spieler = Spieler/Eltern.

export const ROLLEN = {
  chef: 'Cheftrainer',
  co: 'Co-Trainer / Betreuer',
  leitung: 'Sportliche Leitung',
  kasse: 'Kassenwart',
  spieler: 'Spieler / Eltern',
};

const TRAINERTEAM = ['chef', 'co', 'leitung'];
const ALLE = ['chef', 'co', 'leitung', 'kasse', 'spieler'];

export const BEREICHE = [
  {
    id: 'uebersicht', titel: 'Übersicht', icon: 'haus', rollen: ALLE, unten: true,
    text: 'Startseite: nächstes Training, nächstes Spiel, Kalender und offene Aufgaben auf einen Blick.',
    seiten: [
      { id: 'start', titel: 'Start', geplant: ['Nächstes Training mit Ort und Uhrzeit', 'Nächstes Spiel mit Treffpunkt', 'Monatskalender mit Anwesenheitszahl je Termin', 'Hinweise: offene Absagen, fehlende Bewertungen, Kassenstand'] },
    ],
  },
  {
    id: 'training', titel: 'Training', icon: 'pfeife', rollen: ALLE, unten: true,
    text: 'Trainingswoche planen, Einheiten aus Übungen zusammenstellen, Anwesenheit nebenbei erfassen.',
    seiten: [
      { id: 'kalender', titel: 'Trainingskalender', geplant: ['Wiederkehrende Trainingstage (Tag, Uhrzeit, Platz) einmal anlegen', 'Einzeltermine, Vorbereitung Sommer/Winter', 'Wochen- und Monatsansicht'] },
      { id: 'einheit', titel: 'Einheit', geplant: ['Ablauf aus Übungen zusammenstellen (Dauer, Material)', 'Spieler-Liste nach Positionen: anwesend / abwesend / Gastspieler', 'Notizen zur Einheit', 'PDF-Export für den Platz und Co-Trainer'] },
      { id: 'uebungen', titel: 'Übungen', geplant: ['Übungsdatenbank mit Grundstock', 'Eigene Übungen mit Beschreibung, Dauer, Material, Skizze, Video-Link', 'Filter nach Schwerpunkt und Altersklasse', 'Anbindung an die vorhandenen Heimtrainings-Übungen'] },
      { id: 'analyse', titel: 'Analyse', rollen: TRAINERTEAM, geplant: ['Beteiligung je Spieler: Teamtraining / individuell / gefehlt', 'Zeitraum wählbar (Saison, Vorbereitung, Monat)', 'Diagramme je Spieler und Mannschaft'] },
      { id: 'plaetze', titel: 'Plätze & Belegung', rollen: TRAINERTEAM, geplant: ['Sportplätze und Hallen des Vereins anlegen', 'Belegungsplan: welches Team trainiert wann wo', 'Überschneidungen erkennen'] },
    ],
  },
  {
    id: 'spiele', titel: 'Spiele', icon: 'ball', rollen: ALLE, unten: true,
    text: 'Spielplan, Spielvorbereitung mit Aufstellung, Treffpunkt und Spielbericht.',
    seiten: [
      { id: 'spielplan', titel: 'Spielplan', geplant: ['Alle Spiele der Saison (Heim/Auswärts, Liga, Pokal, Test)', 'Ergebnisse eintragen', 'Später: Übernahme aus fussball.de/DFBnet prüfen'] },
      { id: 'vorbereitung', titel: 'Spielvorbereitung', rollen: TRAINERTEAM, geplant: ['Treffpunkt, Ort, Uhrzeit', 'Gegnerinfos und Scouting', 'Freigabe an Spieler: nur Treffpunkt / Kader / Kader + Startelf'] },
      { id: 'aufstellung', titel: 'Aufstellung', rollen: TRAINERTEAM, geplant: ['Spielfeld mit Formation (z. B. 4-2-3-1, 7er-Feld für Jugend)', 'Startelf, Bank, nicht im Kader', 'Wechsel planen', 'PDF-Export'] },
      { id: 'bericht', titel: 'Spielbericht', rollen: TRAINERTEAM, geplant: ['Ergebnis, Torschützen, Einsatzminuten', 'Notizen und Spielerbewertung nach dem Spiel'] },
    ],
  },
  {
    id: 'spieler', titel: 'Spieler', icon: 'personen', rollen: TRAINERTEAM, unten: true,
    text: 'Kader mit Spielerprofilen, Bewertungen, Entwicklung und Gesprächen.',
    seiten: [
      { id: 'kader', titel: 'Kader', geplant: ['Spielerprofil: Positionen, Rückennummer, Kontakt (Eltern), Dokumente (Spielerpass)', 'Spieler ohne eigenen App-Zugang vollständig führen', 'Einladen per Link oder Code', 'Zu- und Abgänge je Saison'] },
      { id: 'bewertung', titel: 'Bewertungen', geplant: ['Eigene Kriterien (offensiv/defensiv, je Position)', 'Bewerten nach Spiel und Training (1–10)', 'Entwicklung über die Saison, Spieler vergleichen'] },
      { id: 'gespraeche', titel: 'Spielergespräche', geplant: ['Gespräche mit Datum, Inhalt und Zielen dokumentieren', 'Wiedervorlage'] },
    ],
  },
  {
    id: 'team', titel: 'Teammanagement', icon: 'klemmbrett', rollen: ALLE,
    text: 'Alles rund um die Mannschaft: Abwesenheiten, Formationen, Standards, Materialdienst, Kasse.',
    seiten: [
      { id: 'abwesenheiten', titel: 'Abwesenheiten', geplant: ['Zeitraum + Art: Krankheit, Verletzung, Urlaub, Sperre, Schule/Arbeit, Unentschuldigt, Sonstiges', 'Grundannahme: wer nichts einträgt, ist dabei', 'Trainerteam legt fest, ob Spieler/Eltern selbst absagen dürfen'] },
      { id: 'formationen', titel: 'Formationen', rollen: TRAINERTEAM, geplant: ['Formationen speichern und laden', 'Vorlagen für 5er-, 7er-, 9er- und 11er-Feld'] },
      { id: 'standards', titel: 'Standards', rollen: TRAINERTEAM, geplant: ['Ecken, Freistöße, Einwürfe als Skizze mit Laufwegen', 'Für Spieler freigeben'] },
      { id: 'material', titel: 'Materialdienst', geplant: ['Wer wäscht Trikots, wer bringt Bälle/Leibchen', 'Reihum-Plan automatisch erstellen', 'Material-Inventar'] },
      { id: 'kasse', titel: 'Mannschaftskasse', geplant: ['Beiträge, Strafen, Ausgaben', 'Kassenstand je Spieler', 'Kassenwart-Rolle'] },
    ],
  },
  {
    id: 'scouting', titel: 'Scouting', icon: 'lupe', rollen: TRAINERTEAM,
    text: 'Beobachtungsliste für Spieler außerhalb des Kaders und Berichte über Gegner.',
    seiten: [
      { id: 'watchlist', titel: 'Beobachtungsliste', geplant: ['Kandidaten getrennt vom Kader', 'Schlagworte (Tags)', 'Status: beobachtet / angesprochen / Probetraining'] },
      { id: 'berichte', titel: 'Berichte', geplant: ['Spielerberichte', 'Gegnerberichte (Teamberichte)', 'Kandidat mit eigenem Spieler vergleichen'] },
      { id: 'schattenkader', titel: 'Schattenkader', rollen: ['leitung'], geplant: ['Kaderplanung für die nächste Saison'] },
    ],
  },
  {
    id: 'verein', titel: 'Verein', icon: 'wappen', rollen: ['leitung', 'chef'],
    text: 'Vereinsebene über allen Mannschaften: Teams, Trainerteam, Benutzer und Rollen.',
    seiten: [
      { id: 'mannschaften', titel: 'Mannschaften', geplant: ['Alle Teams des SV Soltau (Jugend bis Herren)', 'Spielgemeinschaften über Vereinsgrenzen'] },
      { id: 'trainerteam', titel: 'Trainerteam', geplant: ['Trainer und Betreuer je Mannschaft', 'Einladen per Link', 'Gespräche mit Trainern dokumentieren'] },
      { id: 'benutzer', titel: 'Benutzer & Rollen', geplant: ['Rollen: Cheftrainer, Co-Trainer, Sportliche Leitung, Kassenwart, Spieler/Eltern', 'Wer darf was sehen (Rechte je Rolle)'] },
      { id: 'einstellungen', titel: 'Einstellungen', geplant: ['Vereinsdaten, Logo, Farben', 'Saison wechseln'] },
    ],
  },
  {
    id: 'profil', titel: 'Profil', icon: 'person', rollen: ALLE,
    text: 'Eigene Daten, eigene Abwesenheiten, Dateien und Abmelden.',
    seiten: [
      { id: 'konto', titel: 'Mein Konto', geplant: ['Name, E-Mail, Passwort', 'Benachrichtigungen'] },
      { id: 'meine-abwesenheiten', titel: 'Meine Abwesenheiten', geplant: ['Eigene/des Kindes Abwesenheiten eintragen und sehen'] },
      { id: 'dateien', titel: 'Meine Dateien', geplant: ['Dokumente, Elternbriefe, Einwilligungen'] },
    ],
  },
];

export const sichtbar = (eintrag, rolle) => !eintrag.rollen || eintrag.rollen.includes(rolle);
export const bereich = (id) => BEREICHE.find((b) => b.id === id);
