# Einrichtung – Schritt für Schritt (alles am Handy machbar)

## Teil A: App online stellen (Etappe 1, ohne Login)

Wir nutzen **GitHub Pages** (kostenlos, direkt bei GitHub).

1. Öffne im Browser `github.com` und dein Repository **soccer-coach-**.
2. Den Entwicklungs-Zweig in `main` übernehmen:
   - Tippe auf **Pull requests** → **New pull request**.
   - Oben: `base: main` ← `compare: claude/determined-dirac-gzytaq`.
   - **Create pull request** → danach **Merge pull request** → **Confirm merge**.
3. **Settings** (Zahnrad, evtl. über „…“) → links **Pages**.
4. Bei **Source**: „Deploy from a branch“. Branch: **main**, Ordner: **/ (root)** → **Save**.
5. Nach 1–2 Minuten erscheint oben die Adresse, z. B.
   `https://training.svsoltau.de`

> Hinweis: GitHub Pages ist bei einem kostenlosen Konto nur für **öffentliche** Repositories verfügbar.
> Der Code enthält keine Kinderdaten – die liegen später nur in Supabase. Willst du das Repository
> privat lassen, nimm stattdessen **Netlify** (netlify.com → „Add new site“ → „Import from GitHub“ →
> Repository wählen → Build-Befehl leer lassen, Publish directory `/` → Deploy).

### Auf dem Handy installieren
- **iPhone (Safari):** Adresse öffnen → Teilen-Symbol (□↑) → **Zum Home-Bildschirm**.
- **Android (Chrome):** Adresse öffnen → Menü ⋮ → **App installieren** / **Zum Startbildschirm hinzufügen**.

Ohne Supabase läuft die App im **Gerätemodus**: Kinder sehen den Standard-Wochenplan und haken ab,
der Fortschritt bleibt nur auf ihrem Gerät.

---

## Teil B: Supabase einrichten (Etappe 2: Codes für Kinder + Trainer-Übersicht)

> **Aktuelle, ausführliche Anleitung: [SUPABASE_Schritt_fuer_Schritt.md](SUPABASE_Schritt_fuer_Schritt.md)**

### 1. Konto und Projekt
1. Gehe auf `supabase.com` → **Start your project** → mit GitHub anmelden.
2. **New project**:
   - Name: `soccer-coach`
   - Database Password: ein sicheres Passwort erzeugen lassen und im Passwort-Manager speichern
   - **Region: Central EU (Frankfurt)** ← wichtig für den Datenschutz
   - Plan: Free
3. Warten, bis das Projekt bereit ist (ca. 2 Minuten).

### 2. Datenbank anlegen
1. Links **SQL Editor** → **New query**.
2. Den kompletten Inhalt der Datei `supabase/schema.sql` aus dem Repository hineinkopieren
   (auf GitHub die Datei öffnen → Symbol „Copy raw file“).
3. **Run** tippen. Es sollte „Success. No rows returned“ erscheinen.

### 3. Öffentliche Registrierung abschalten
- **Authentication** → **Sign In / Providers** (bzw. „Settings“) → **Allow new users to sign up** ausschalten.
  So kann sich niemand Fremdes ein Konto anlegen.

### 4. Trainer-Konten anlegen
1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. E-Mail + Passwort eingeben, Haken bei **Auto Confirm User** setzen → **Create user**.
3. Für jeden Trainer wiederholen.
4. Zurück in den **SQL Editor** und für jeden Trainer ausführen (E-Mail anpassen):
   ```sql
   insert into public.trainer (user_id)
   select id from auth.users where email = 'trainer@beispiel.de';
   ```

### 5. App mit Supabase verbinden
1. In Supabase: **Project Settings** → **API** (bzw. „Data API“ / „API Keys“).
2. Kopiere die **Project URL** und den **anon public** Key (nicht den „service_role“-Key!).
3. Auf GitHub die Datei `config.js` öffnen → Stift-Symbol (Bearbeiten) → Werte eintragen:
   ```js
   export const SUPABASE_URL = 'https://xxxx.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJ...';
   ```
4. **Commit changes** tippen. Nach 1–2 Minuten ist die neue Version online.
5. Damit die Handys die neue Version sicher laden: in `sw.js` die Zeile
   `const VERSION = 'sc-v1';` auf `'sc-v2'` ändern (bei jeder späteren Änderung weiter hochzählen).

Der anon-Key darf öffentlich sein – die Datenbank-Regeln (Row Level Security) sorgen dafür,
dass Kinder nur über ihren Code an ihre eigenen Daten kommen.

### 6. Loslegen
1. App öffnen → unten **Trainer** → mit Trainer-E-Mail anmelden.
2. **Kinder** → Vorname eingeben → **Anlegen** → Code notieren (wird nur einmal angezeigt!).
3. **Wochenplan** → Übungen als **Pflicht** oder **Extra** markieren.
4. **Anwesenheit** → nach jedem Training eintragen, wer da war und wer gefehlt hat.
5. **Übersicht** → sehen, wer sein Soll erfüllt hat.

### Gut zu wissen
- Kostenlose Supabase-Projekte werden nach **7 Tagen ohne Nutzung pausiert**. In der Saison
  passiert das nicht; nach den Ferien im Supabase-Dashboard einfach auf **Restore** tippen.
- Kind löschen: Trainer → Kinder → **Löschen**. Damit werden auch alle erledigten Einheiten
  und Anwesenheiten dieses Kindes endgültig gelöscht.

---

## Übungen ergänzen

Alle Übungen stehen in `data/uebungen.json`. Neue Übung = einen Block kopieren und anpassen:

| Feld | Bedeutung |
|---|---|
| `id` | eindeutiger Name, nur kleine Buchstaben, Zahlen, Bindestrich (z. B. `dribbel-slalom`) |
| `titel` | Anzeigename |
| `schwerpunkt` | `umschalten`, `passen`, `dritter`, `raum`, `abwehr` oder `technik` (Ballgefühl) |
| `art` | `mitBall`, `ohneBall` oder `kopf` |
| `dauer` | Minuten |
| `material` | Liste, z. B. `["1 Ball", "1 Wand"]` |
| `schritte` | Liste der Schritte |
| `tipp`, `ziel`, `ort` | kurze Texte |
| `video` | Link (z. B. YouTube) oder `null` |
| `bild` | optional: Pfad zu einem Bild, z. B. `bilder/wandpass.png` |
| `quiz` | nur bei `kopf`: Liste von Fragen (siehe Beispiele) |

**Quiz-Skizzen:** Spielfeld ist 100 breit × 64 hoch, unser Tor links. Spieler:
`{ "x": 40, "y": 30, "team": "wir" | "gegner", "label": "B", "ich": true }`, Ball `{ "x": .., "y": .. }`,
Pfeile `{ "von": [x, y], "nach": [x, y], "typ": "pass" | "lauf", "label": "A" }`,
Zonen `{ "x", "y", "w", "h", "label" }`.

Tipp: Schick mir einfach dein Material (Text, Fotos von Übungsblättern), dann trage ich es ein.
