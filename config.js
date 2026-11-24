// Soccer Coach – Konfiguration
// Etappe 1: beide Werte leer lassen -> die App läuft ohne Login, Fortschritt bleibt nur auf dem Gerät.
// Etappe 2: Werte aus Supabase eintragen (Project Settings -> API). Siehe docs/EINRICHTUNG.md.
// Der "anon"-Schlüssel ist öffentlich gedacht; geschützt wird alles über die Regeln in supabase/schema.sql.
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';
