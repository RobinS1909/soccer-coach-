# Kosten und Grenzen – bis wann ist Soccer Coach kostenlos?

Stand: November 2026, Werte laut Tarifseiten der Anbieter. Bitte gelegentlich auf
supabase.com/pricing und docs.github.com/pages prüfen, Anbieter ändern Tarife.

## Kurzfassung
Für die U10 (ca. 30 Kinder, wenige Trainer) – und sogar für die gesamte Jugendabteilung
mit mehreren hundert Kindern – bleibt die App kostenlos. Echte Grenzen spürt man
erst bei mehreren tausend aktiven Kindern.

## Supabase (Datenbank, Gratis-Tarif)
| Grenze | Gratis | Unser Verbrauch (30 Kinder) |
|---|---|---|
| Datenbank-Größe | 500 MB | ca. 1–2 MB pro Saison |
| Datenverkehr (Egress) | 5 GB / Monat | ca. 20–40 MB / Monat |
| Angemeldete Nutzer (Auth) | 50.000 / Monat | nur die Trainer – Kinder nutzen Codes und zählen nicht |
| E-Mails (Einladung, Passwort vergessen) | stark begrenzt (wenige pro Stunde) | deshalb Trainer über den Reiter „Team“ freischalten |
| Pause bei Nichtnutzung | nach 7 Tagen | in der Saison kein Problem, nach Ferien „Restore“ |
| Automatische Backups | nicht im Gratis-Tarif | siehe Empfehlung unten |

Rechnung: Jede erledigte Einheit ist eine Zeile mit ca. 100–150 Byte.
30 Kinder × 5 Einheiten × 40 Wochen = 6.000 Zeilen ≈ 1 MB.
Selbst 500 Kinder ergeben nur ca. 15–20 MB pro Saison.

## GitHub Pages (App-Seite)
| Grenze | Gratis | Unser Verbrauch |
|---|---|---|
| Datenverkehr | 100 GB / Monat (weiche Grenze) | App ca. 1 MB beim ersten Öffnen, danach aus dem Handy-Speicher |
| Größe der Seite | 1 GB | ca. 1 MB |

## Ab wann würde es etwas kosten?
- **Supabase Pro** (ca. 25 US-$ / Monat) erst nötig bei: > 500 MB Daten, > 5 GB Verkehr,
  Wunsch nach automatischen Backups oder ohne Pausieren.
- Für mehr E-Mails reicht kostenlos ein eigenes Postfach (z. B. bei IONOS) als
  Mail-Server in Supabase (Authentication → Emails → SMTP Settings).

## Empfehlungen
- Am Saisonende: Kinder löschen (Datenschutz) – dann ist die Datenbank wieder fast leer.
- Wer Sicherheit will: einmal im Monat in Supabase unter Table Editor die Tabellen als
  CSV exportieren (optional).
