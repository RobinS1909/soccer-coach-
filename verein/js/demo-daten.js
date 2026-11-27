// Beispieldaten nur für die Struktur-Vorschau. Später kommen die Daten aus der Datenbank (Supabase).
export const VEREIN = { name: 'SV Soltau', voll: 'SV Soltau von 1912 e.V.' };

export const MANNSCHAFTEN = [
  { id: 'u10', name: 'U10', liga: 'Kreisliga Heidekreis' },
  { id: 'u12', name: 'U12', liga: 'Kreisliga Heidekreis' },
  { id: 'herren', name: 'Herren', liga: 'Bezirksliga' },
];

export const SPIELER = [
  { nr: 1, name: 'Ben', pos: 'TW' },
  { nr: 2, name: 'Luca', pos: 'IV' },
  { nr: 3, name: 'Noah', pos: 'IV' },
  { nr: 4, name: 'Finn', pos: 'LV' },
  { nr: 5, name: 'Paul', pos: 'RV' },
  { nr: 6, name: 'Elias', pos: 'ZM' },
  { nr: 7, name: 'Emil', pos: 'ZM', abwesend: 'Krank' },
  { nr: 8, name: 'Leon', pos: 'ZM' },
  { nr: 9, name: 'Jonas', pos: 'ST' },
  { nr: 10, name: 'Mats', pos: 'ST', abwesend: 'Urlaub' },
  { nr: 11, name: 'Theo', pos: 'LA' },
  { nr: 12, name: 'Anton', pos: 'RA' },
];

// Termine relativ zu heute, damit die Vorschau immer aktuell wirkt.
const tag = (plus, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + plus); d.setHours(h, m, 0, 0); return d; };
const naechster = (wochentag) => { const d = new Date(); return (wochentag - d.getDay() + 7) % 7 || 7; };

export const TERMINE = [
  { art: 'training', titel: 'Passspiel & Ballkontrolle', start: tag(naechster(2), 17), ende: tag(naechster(2), 18, 30), ort: 'Sportplatz Soltau, Kunstrasen' },
  { art: 'training', titel: 'Torschuss', start: tag(naechster(4), 17), ende: tag(naechster(4), 18, 30), ort: 'Sportplatz Soltau, Kunstrasen' },
  { art: 'spiel', titel: 'SV Soltau – TuS Gegner', heim: true, start: tag(naechster(6), 10, 30), treffpunkt: tag(naechster(6), 9, 45), ort: 'Sportplatz Soltau' },
];
