# SV Soltau – Soccer Coach

Heimtrainings-App (PWA) für die U10-2 des SV Soltau von 1912 e.V.

- **Kinder** sehen ihre Einheiten der Woche, führen sie durch, haken ab und sammeln Abzeichen.
- **Trainer** legen Kinder an (nur Vorname + Zugangscode), planen die Woche, tragen die
  Anwesenheit ein und sehen, wer sein Soll erfüllt hat.
- **Regel:** Pflicht-Einheiten für alle + 2 Extra-Einheiten pro verpasstem Mannschaftstraining.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html`, `css/app.css` | Oberfläche (schwarz, weiß, gelbe Highlights) |
| `js/app.js` | Kinder-Ansicht, Quiz, Abzeichen |
| `js/trainer.js` | Trainer-Bereich |
| `js/regeln.js` | Wochen- und Soll-Berechnung |
| `js/kind.js`, `js/api.js` | Datenzugriff (Gerät oder Supabase) |
| `data/uebungen.json` | **alle Übungen – hier ergänzen** |
| `supabase/schema.sql` | Datenbank + Zugriffsregeln |
| `config.js` | Supabase-Zugang (leer = Gerätemodus) |
| `sw.js`, `manifest.webmanifest` | Offline-Funktion, Installierbarkeit |
| `docs/EINRICHTUNG.md` | Schritt-für-Schritt-Anleitung |
| `docs/Datenschutz-Elterninfo.md` | Entwurf Elterninfo + Einwilligung |

## Technik – kurz begründet
- **Reines HTML/CSS/JavaScript ohne Build-Schritt:** Jede Datei lässt sich direkt auf GitHub am
  Handy bearbeiten, nichts muss kompiliert werden, keine Abhängigkeiten, die veralten.
- **Supabase (Region Frankfurt):** kostenlose Datenbank in der EU mit Zugriffsregeln
  (Row Level Security). Kein Supabase-Skript von fremden Servern – die App spricht die
  Schnittstelle direkt an.
- **GitHub Pages oder Netlify:** kostenloses Hosting.

## Lokal testen
```
python3 -m http.server 8080
```
und `http://localhost:8080` öffnen.
