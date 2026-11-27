# SV Soltau – Teamzentrale: Analyse und Struktur

Stand: 27.11.2026 · Abschnitt 1 (Struktur)

Die Teamzentrale ist die Trainer- und Vereins-App des SV Soltau. Vorbild ist **Teamodo**
(teamodo.de). Die Gestaltung ist schwarz-weiß. Sie liegt im Ordner `verein/` und läuft neben
der Heimtrainings-App der Kinder, ohne sie zu verändern: **training.svsoltau.de/verein/**

---

## 1. Was Teamodo ist (Analyse)

**Produkt:** All-in-One-App für Fußballtrainer und Vereine im Amateurfußball. Sie ersetzt
Excel-Listen, WhatsApp-Gruppen und mehrere Einzel-Apps. Es gibt sie im Browser und als App
für iOS und Android.

**Kernprinzipien**
- *Anwesenheit ist die Grundannahme:* Wer nichts angibt, gilt als dabei. Eingetragen werden nur Absagen.
- *Drei Zahlen statt einer:* Die Analyse trennt Teamtraining, individuell trainiert und gefehlt.
- *Kader zuerst:* Training, Aufstellung, Kasse und Bewertung bauen auf dem Kader auf.
- *Vereinsebene:* Alle Mannschaften liegen unter einem Verein, mit Rollen.
- *Spieler ohne App* werden trotzdem vollständig geführt, auch in Kasse und Anwesenheit.
- *Freigabe-Stufen* für die Spielvorbereitung: nur Treffpunkt, Kader oder Kader und Startelf.

**Interne App-Struktur** (aus dem Programmcode von teamodo.de gelesen)

| Bereich | Unterseiten |
|---|---|
| Übersicht | Kalender, nächstes Training, nächstes Spiel |
| Training | Trainingsplan, Einheit (Spieler / Ablauf / Notizen), Übungen, Analyse, Plätze, Belegung |
| Spiele | Spielliste, Aufstellung je Spiel, Spielvorbereitung (teilbarer Link) |
| Spieler | Kader, Spielerprofil, Spielergespräche, Bewertungen |
| Teammanagement | Kader-Übersicht, Abwesenheiten, Formationen, Standards, Materialdienst, Mannschaftskasse |
| Scouting | Beobachtungsliste, Spieler- und Teamberichte, Vergleich, Tags, Schattenkader |
| Staff | Trainerteam, Trainer-Gespräche |
| Finanzen (Vereinstarif) | Sponsoring, Gehälter, Vereinbarungen, Boni (Einsatz-, Saison-, Spielerboni), Auszahlungen |
| Profil | Konto, meine Abwesenheiten, meine Dateien, Trainer werben, Support |
| Admin | Benutzer, Vereine, Abos, Versionen |

**Rollen:** Cheftrainer, Co-Trainer/Betreuer, Jugendtrainer, Sportlicher Leiter, Kassenwart, Spieler.

**Bewusst nicht enthalten:** Mitgliederverwaltung mit Beitragseinzug, Videoanalyse, andere Sportarten.

**Preise (zum Vergleich):** 19,90 €/Monat für 1 Team, 34,90 € für 2 Teams, 44,90 € für 3 Teams.
Der Vereinstarif kostet 50–100 €/Monat. Spieler nutzen die App kostenlos.

**Design:** Desktop mit Seitenleiste links, Handy mit Leiste unten und „Mehr“-Menü.
Oben gibt es eine Mannschafts- und Vereinswahl. Unterseiten erscheinen als Reiter, Inhalte als Karten.

---

## 2. Unsere Struktur

Die Struktur steht vollständig in **`verein/js/struktur.js`**: Bereiche, Unterseiten, Rollen und
der Plan je Seite. Navigation, Reiter und Rollen-Filter werden daraus automatisch erzeugt.

| Bereich | Unterseiten | Wer sieht es |
|---|---|---|
| Übersicht | Start | alle |
| Training | Kalender, Einheit, Übungen, Analyse*, Plätze & Belegung* | alle (*nur Trainerteam) |
| Spiele | Spielplan, Spielvorbereitung*, Aufstellung*, Spielbericht* | alle (*nur Trainerteam) |
| Spieler | Kader, Bewertungen, Spielergespräche | Trainerteam |
| Teammanagement | Abwesenheiten, Formationen*, Standards*, Materialdienst, Mannschaftskasse | alle (*nur Trainerteam) |
| Scouting | Beobachtungsliste, Berichte, Schattenkader (nur Sportliche Leitung) | Trainerteam |
| Verein | Mannschaften, Trainerteam, Benutzer & Rollen, Einstellungen | Sportliche Leitung, Cheftrainer |
| Profil | Mein Konto, Meine Abwesenheiten, Meine Dateien | alle |

Trainerteam = Cheftrainer, Co-Trainer/Betreuer, Sportliche Leitung.

**Weggelassen:** Den Bereich Finanzen (Gehälter, Boni, Sponsoring) habe ich vorerst weggelassen,
weil er im Amateur- und Jugendbereich selten gebraucht wird. Er lässt sich jederzeit ergänzen.

### Dateien

| Pfad | Inhalt |
|---|---|
| `verein/index.html` | Gerüst: Seitenleiste, Kopf mit Mannschafts- und Rollenwahl, Leiste unten |
| `verein/css/verein.css` | Schwarz-weißes Design |
| `verein/js/struktur.js` | **Bauplan: alle Bereiche, Unterseiten und Rollen** |
| `verein/js/app.js` | Navigation, „Mehr“-Menü, Seiten, Vorschau-Ansichten |
| `verein/js/demo-daten.js` | Beispieldaten (fiktive Spieler und Termine) |
| `verein/js/icons.js` | Linien-Icons |

Mit Inhalt gefüllt sind bisher die Übersicht (nächstes Training, nächstes Spiel, Kalender,
Anwesenheit) und der Kader. Alle anderen Seiten zeigen eine Karte „Geplant“ mit ihrem Funktionsumfang.

---

## 3. Vorschlag für die nächsten Abschnitte

1. **Struktur** ✔ (dieser Stand)
2. **Daten-Grundlage:** Tabellen in Supabase für Mannschaften, Spieler, Termine, Abwesenheiten und Rollen, dazu Login für Trainer
3. **Kader:** Spielerprofile anlegen und bearbeiten, Spieler einladen
4. **Training:** wiederkehrende Termine, Einheit mit Übungen, Anwesenheit, PDF
5. **Abwesenheiten:** Absagen durch Eltern oder Spieler, Trainer-Einstellung
6. **Spiele:** Spielplan, Aufstellung auf dem Spielfeld, Freigabe
7. **Analyse und Bewertungen**
8. **Teammanagement:** Kasse, Materialdienst, Standards
9. **Scouting und Vereinsebene**

Die Reihenfolge stimmen wir nach jedem Abschnitt ab.
