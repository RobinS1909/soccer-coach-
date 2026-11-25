# Supabase einrichten – Schritt für Schritt (am Handy, ca. 15 Minuten)

Supabase ist die Datenbank für die Codes der Kinder und die Trainer-Übersicht.
Kostenlos, Server in Frankfurt. Das Konto läuft auf deinen Namen.

---

## Weg A (am schnellsten, ca. 3 Minuten): Ich richte alles ein

1. **supabase.com** → **Start your project** → **Continue with GitHub**.
2. Falls gefragt: Organization anlegen, Name `SV Soltau`, Plan **Free**.
3. Öffne **supabase.com/dashboard/account/tokens** → **Generate new token** → Name `soccer-coach` → **Generate token** → Schlüssel (`sbp_…`) kopieren.
4. Schreib Claude „Token ist da“. Es erscheint ein sicheres Formular → Schlüssel dort einfügen (nie in den Chat).
5. Claude legt Projekt, Tabellen, Regeln und deinen Trainer-Zugang an und verbindet die App.
   Du bekommst eine E-Mail und legst dein Trainer-Passwort selbst fest.
6. Danach kannst du den Schlüssel unter derselben Adresse wieder löschen (**Delete**).

---

## Weg B: Du richtest es selbst ein

### Schritt 1 – Konto
**supabase.com** → **Start your project** → **Continue with GitHub** → Organization `SV Soltau`, Plan **Free**.

### Schritt 2 – Projekt anlegen
**New project**:
- **Name:** `soccer-coach`
- **Database Password:** auf **Generate a password** tippen und das Passwort im Passwort-Manager speichern (wird für die App nicht gebraucht)
- **Region:** **Central EU (Frankfurt)** ← wichtig
- **Create new project** → ca. 2 Minuten warten

### Schritt 3 – Datenbank anlegen
1. Neuer Tab: **github.com/RobinS1909/soccer-coach-/blob/main/supabase/schema.sql**
   → oben rechts auf das Symbol **Copy raw file** (zwei Rechtecke) tippen.
2. Zurück in Supabase: links **SQL Editor** (Symbol `>_`) → **+ New query**.
3. Ins leere Feld tippen → **Einfügen** → **Run** (unten rechts).
4. Ergebnis: **„Success. No rows returned“**. ✅

### Schritt 4 – Fremde Anmeldungen sperren
Links **Authentication** → **Sign In / Providers** → Schalter **Allow new users to sign up** **aus** → **Save**.

### Schritt 5 – Dich als Trainer anlegen
1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Deine E-Mail + ein sicheres Passwort, Haken bei **Auto Confirm User** → **Create user**.
3. **SQL Editor** → **+ New query** → einfügen (E-Mail anpassen) → **Run**:
   ```sql
   insert into public.trainer (user_id)
   select id from auth.users where email = 'deine@email.de';
   ```
   Ergebnis: „Success. 1 row affected“ (bei 0 rows: E-Mail-Schreibweise prüfen).

### Schritt 6 – Zugangsdaten für die App
**Project Settings** (Zahnrad unten links) → **API Keys** (bzw. **Data API**):
- **Project URL**, z. B. `https://abcdefgh.supabase.co`
- **publishable key** (`sb_publishable_…`) **oder** **anon public** key (`eyJ…`)

⚠️ **Niemals** den `secret`- bzw. `service_role`-Schlüssel weitergeben.

Diese zwei Werte sind öffentlich gedacht (sie stehen später sowieso in der App).
Du kannst sie Claude einfach in den Chat schreiben – Claude trägt sie ein und veröffentlicht die App.

### Schritt 7 – Testen
1. App öffnen: **https://robins1909.github.io/soccer-coach-/**
2. Unten **Trainer** → mit deiner E-Mail + Passwort anmelden.
3. **Kinder** → **Viele Kinder auf einmal anlegen** → Vornamen einfügen → Codes drucken.
4. Mit einem Code als Kind anmelden und eine Übung abhaken → in **Übersicht** prüfen.

---

## Für den Verein (Datenschutz)
- Supabase bietet einen **Auftragsverarbeitungsvertrag (DPA)** an: im Dashboard unter
  **Organization settings → Legal Documents** (bzw. supabase.com/legal/dpa). Bitte vom Vorstand unterschreiben lassen.
- Kostenlose Projekte werden nach **7 Tagen ohne Nutzung pausiert** → im Dashboard **Restore** tippen.
- Am Saisonende: Kinder in der App löschen oder das ganze Projekt unter
  **Project Settings → General → Delete project** löschen.
