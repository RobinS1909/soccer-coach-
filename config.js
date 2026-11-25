// Soccer Coach – Konfiguration
// Ohne Supabase-Werte: Kinder sehen die Übungen und haken ab, der Fortschritt bleibt nur auf ihrem Gerät.
// Mit Supabase-Werten (Project Settings -> API): Zugangscodes für Kinder + Trainer-Übersicht.
// Der "anon"-Schlüssel ist öffentlich gedacht; geschützt wird alles über supabase/schema.sql.
export const SUPABASE_URL = 'https://ydjzabgkbjodzrkfgvei.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_xbVxIkurypzj0EA2dFX0bw_z-JZGZ4p';
// true = Demo mit Beispiel-Kindern (nur zum Ausprobieren, alles bleibt auf dem Gerät)
export const DEMO = false;
