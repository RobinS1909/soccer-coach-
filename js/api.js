// Kleiner Supabase-Client (ohne externe Bibliothek, keine Drittanbieter-Skripte).
import { SUPABASE_URL, SUPABASE_ANON_KEY, DEMO } from '../config.js';
import { lesen, schreiben } from './speicher.js';
import { demoRpc } from './demo.js';

const mitDatenbank = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
// Demo-Modus nur, wenn ausdrücklich eingeschaltet und keine Datenbank eingetragen ist.
export const demo = Boolean(DEMO) && !mitDatenbank;
// online = Kinder melden sich mit Code an, Trainer-Bereich ist sichtbar
export const online = mitDatenbank || demo;
const BASIS = SUPABASE_URL.replace(/\/$/, '');
const SITZUNG = 'sc_trainer_sitzung';

export class ApiFehler extends Error {}

async function anfrage(pfad, { method = 'GET', body, token, headers = {} } = {}) {
  let res;
  try {
    res = await fetch(BASIS + pfad, {
      method,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        // Nur angemeldete Trainer senden einen Token; Kinder nur den öffentlichen Schlüssel
        // (funktioniert mit dem alten "anon"- und dem neuen "publishable"-Schlüssel).
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiFehler('Keine Verbindung zum Internet.');
  }
  const text = await res.text();
  const daten = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = (daten && (daten.message || daten.msg || daten.error_description || daten.error)) || `Fehler ${res.status}`;
    const f = new ApiFehler(msg);
    f.status = res.status;
    throw f;
  }
  return daten;
}

// ---------- Kinder: alles über geschützte Funktionen mit Zugangscode ----------
export const rpc = (name, args, token) => (demo ? demoRpc(name, args) : anfrage(`/rest/v1/rpc/${name}`, { method: 'POST', body: args, token }));

// ---------- Trainer: Login mit E-Mail + Passwort (nur Erwachsene) ----------
export function trainerSitzung() {
  return lesen(SITZUNG, null);
}

export async function trainerLogin(email, passwort) {
  if (demo) return speichereSitzung({ access_token: 'demo', refresh_token: 'demo', expires_at: 4102444800 });
  const s = await anfrage('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password: passwort } });
  speichereSitzung(s);
}

export function trainerLogout() {
  const s = trainerSitzung();
  schreiben(SITZUNG, null);
  if (s && !demo) anfrage('/auth/v1/logout', { method: 'POST', token: s.access_token }).catch(() => {});
}

function speichereSitzung(s) {
  schreiben(SITZUNG, {
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_at: s.expires_at || Math.floor(Date.now() / 1000) + (s.expires_in || 3600),
  });
}

async function token() {
  const s = trainerSitzung();
  if (!s) throw new ApiFehler('Bitte als Trainer anmelden.');
  if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
  try {
    const neu = await anfrage('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } });
    speichereSitzung(neu);
    return neu.access_token;
  } catch (e) {
    if (e.status) schreiben(SITZUNG, null);
    throw e;
  }
}

// Tabellen-Zugriff für Trainer (geschützt durch Row Level Security)
export const db = {
  async lesen(pfad) {
    return anfrage(`/rest/v1/${pfad}`, { token: await token() });
  },
  async einfuegen(tabelle, zeilen, upsert = false) {
    return anfrage(`/rest/v1/${tabelle}`, {
      method: 'POST',
      body: zeilen,
      token: await token(),
      headers: { Prefer: upsert ? 'resolution=merge-duplicates,return=representation' : 'return=representation' },
    });
  },
  async loeschen(pfad) {
    return anfrage(`/rest/v1/${pfad}`, { method: 'DELETE', token: await token() });
  },
  async rpc(name, args) {
    return rpc(name, args, await token());
  },
};
