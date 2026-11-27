// SV Soltau – Teamzentrale: Gerüst (Navigation, Rollen, Mannschaftswahl, Seiten).
import { BEREICHE, ROLLEN, sichtbar, bereich } from './struktur.js';
import { VEREIN, MANNSCHAFTEN, SPIELER, TERMINE } from './demo-daten.js';
import { icon } from './icons.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel) => document.querySelector(sel);
const merke = (k, v) => { try { v === undefined ? null : localStorage.setItem('tz-' + k, v); return localStorage.getItem('tz-' + k); } catch { return null; } };

const zustand = {
  rolle: merke('rolle') || 'chef',
  team: merke('team') || MANNSCHAFTEN[0].id,
};

const datum = (d) => d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const uhr = (d) => d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

// ---------- Navigation ----------
function bereicheFuerRolle() { return BEREICHE.filter((b) => sichtbar(b, zustand.rolle)); }

function navLink(b, aktiv) {
  return `<a href="#/${b.id}" class="${aktiv ? 'aktiv' : ''}" ${aktiv ? 'aria-current="page"' : ''}>${icon(b.icon)}<span>${esc(b.titel)}</span></a>`;
}

function zeichneNavigation(aktivId) {
  const liste = bereicheFuerRolle();
  $('#seitenleiste-links').innerHTML = liste.map((b) => navLink(b, b.id === aktivId)).join('');
  const unten = liste.filter((b) => b.unten).slice(0, 4);
  const mehrAktiv = !unten.some((b) => b.id === aktivId);
  $('#unten-nav').innerHTML = unten.map((b) => navLink(b, b.id === aktivId)).join('')
    + `<button type="button" id="mehr-knopf" class="${mehrAktiv ? 'aktiv' : ''}">${icon('mehr')}<span>Mehr</span></button>`;
  $('#mehr-knopf').addEventListener('click', oeffneMehr);
}

function oeffneMehr() {
  const rest = bereicheFuerRolle().filter((b) => !b.unten);
  const box = document.createElement('div');
  box.className = 'blatt-huelle';
  box.innerHTML = `<div class="blatt" role="dialog" aria-modal="true" aria-label="Weitere Bereiche">
    <div class="blatt-griff"></div>
    <nav class="blatt-liste">${rest.map((b) => `<a href="#/${b.id}">${icon(b.icon)}<span><strong>${esc(b.titel)}</strong><small>${esc(b.text)}</small></span></a>`).join('')}</nav>
  </div>`;
  const zu = () => box.remove();
  box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('a')) zu(); });
  document.body.appendChild(box);
}

function zeichneKopf() {
  const team = MANNSCHAFTEN.find((m) => m.id === zustand.team);
  $('#team-wahl').innerHTML = MANNSCHAFTEN.map((m) => `<option value="${m.id}" ${m.id === zustand.team ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
  $('#rollen-wahl').innerHTML = Object.entries(ROLLEN).map(([id, t]) => `<option value="${id}" ${id === zustand.rolle ? 'selected' : ''}>${esc(t)}</option>`).join('');
  document.title = `${team.name} · ${VEREIN.name} Teamzentrale`;
}

// ---------- Seiten ----------
function seitenkopf(b, seite, sichtbareSeiten) {
  return `<header class="seitenkopf">
      <p class="ueberzeile">${esc(VEREIN.name)} · ${esc(MANNSCHAFTEN.find((m) => m.id === zustand.team).name)}</p>
      <h1>${esc(b.titel)}</h1>
      <p class="grau">${esc(b.text)}</p>
    </header>
    ${sichtbareSeiten.length > 1 ? `<nav class="reiter" aria-label="${esc(b.titel)}">${sichtbareSeiten.map((s) => `<a href="#/${b.id}/${s.id}" class="${s.id === seite.id ? 'aktiv' : ''}">${esc(s.titel)}</a>`).join('')}</nav>` : ''}`;
}

function geplantKarte(seite) {
  return `<section class="karte geplant">
    <div class="karte-kopf"><h2>${esc(seite.titel)}</h2><span class="marke">Geplant</span></div>
    <ul class="haken">${seite.geplant.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
  </section>`;
}

function terminKarte(t, ueberschrift) {
  if (!t) return '';
  return `<section class="karte termin">
    <p class="ueberzeile">${esc(ueberschrift)}${t.art === 'spiel' ? ` · ${t.heim ? 'Heim' : 'Auswärts'}` : ''}</p>
    <h3>${esc(t.titel)}</h3>
    <p>${esc(datum(t.start))} · ${uhr(t.start)}${t.ende ? ` – ${uhr(t.ende)}` : ''} Uhr</p>
    ${t.treffpunkt ? `<p class="grau">Treffpunkt ${uhr(t.treffpunkt)} Uhr</p>` : ''}
    <p class="grau">${icon('ort')} ${esc(t.ort)}</p>
  </section>`;
}

function kalender() {
  const heute = new Date();
  const erster = new Date(heute.getFullYear(), heute.getMonth(), 1);
  const tage = new Date(heute.getFullYear(), heute.getMonth() + 1, 0).getDate();
  const versatz = (erster.getDay() + 6) % 7;
  const termineAm = (n) => TERMINE.filter((t) => t.start.getMonth() === heute.getMonth() && t.start.getDate() === n);
  let zellen = '<span></span>'.repeat(versatz);
  for (let n = 1; n <= tage; n++) {
    const ts = termineAm(n);
    zellen += `<span class="${n === heute.getDate() ? 'heute' : ''} ${ts.length ? 'hat' : ''}" title="${esc(ts.map((t) => t.titel).join(', '))}">${n}${ts.map((t) => `<i class="${t.art}"></i>`).join('')}</span>`;
  }
  return `<section class="karte">
    <div class="karte-kopf"><h2>${heute.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</h2>
    <span class="legende"><i class="training"></i>Training <i class="spiel"></i>Spiel</span></div>
    <div class="kalender">${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((w) => `<b>${w}</b>`).join('')}${zellen}</div>
  </section>`;
}

function anwesenheit() {
  const da = SPIELER.filter((s) => !s.abwesend);
  const weg = SPIELER.filter((s) => s.abwesend);
  return `<section class="karte">
    <div class="karte-kopf"><h2>Nächstes Training</h2><span class="marke voll">${da.length} dabei</span></div>
    <p class="grau">Wer nichts einträgt, ist dabei.</p>
    <ul class="spieler-liste">${da.map((s) => `<li><span class="nr">${s.nr}</span>${esc(s.name)}<em>${s.pos}</em></li>`).join('')}</ul>
    <h3 class="zwischen">Abgemeldet (${weg.length})</h3>
    <ul class="spieler-liste weg">${weg.map((s) => `<li><span class="nr">${s.nr}</span>${esc(s.name)}<em>${esc(s.abwesend)}</em></li>`).join('')}</ul>
  </section>`;
}

function kaderTabelle() {
  return `<section class="karte">
    <div class="karte-kopf"><h2>Kader (${SPIELER.length})</h2><span class="marke">Beispieldaten</span></div>
    <ul class="spieler-liste">${SPIELER.map((s) => `<li><span class="nr">${s.nr}</span>${esc(s.name)}<em>${s.pos}</em></li>`).join('')}</ul>
  </section>`;
}

// Seiten mit einer ersten echten Vorschau; alle anderen zeigen den Plan.
const VORSCHAU = {
  'uebersicht/start': () => `<div class="raster">
      ${terminKarte(TERMINE.find((t) => t.art === 'training'), 'Nächstes Training')}
      ${terminKarte(TERMINE.find((t) => t.art === 'spiel'), 'Nächstes Spiel')}
    </div>
    <div class="raster">${kalender()}${zustand.rolle === 'spieler' ? '' : anwesenheit()}</div>`,
  'spieler/kader': kaderTabelle,
};

function zeigeSeite() {
  document.querySelectorAll('.blatt-huelle').forEach((x) => x.remove());
  const [bId, sId] = location.hash.replace(/^#\/?/, '').split('/');
  let b = bereich(bId);
  if (!b || !sichtbar(b, zustand.rolle)) b = bereich('uebersicht');
  const sichtbareSeiten = b.seiten.filter((s) => sichtbar(s, zustand.rolle));
  const seite = sichtbareSeiten.find((s) => s.id === sId) || sichtbareSeiten[0];

  zeichneNavigation(b.id);
  const vorschau = VORSCHAU[`${b.id}/${seite.id}`];
  $('#inhalt').innerHTML = seitenkopf(b, seite, sichtbareSeiten)
    + (vorschau ? vorschau() : '')
    + geplantKarte(seite)
    + (b.id === 'profil' && seite.id === 'konto' ? rollenHinweis() : '');
  $('#inhalt').focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function rollenHinweis() {
  return `<section class="karte"><h2>Vorschau: Rollen</h2>
    <p class="grau">Oben rechts kannst du die Rolle wechseln. Die Navigation zeigt dann nur, was diese Rolle sehen darf.</p>
    <ul class="haken">${BEREICHE.map((b) => `<li><strong>${esc(b.titel)}</strong>: ${b.rollen.map((r) => esc(ROLLEN[r])).join(', ')}</li>`).join('')}</ul></section>`;
}

// ---------- Start ----------
$('#team-wahl').addEventListener('change', (e) => { zustand.team = merke('team', e.target.value) || e.target.value; zeichneKopf(); zeigeSeite(); });
$('#rollen-wahl').addEventListener('change', (e) => { zustand.rolle = merke('rolle', e.target.value) || e.target.value; zeichneKopf(); zeigeSeite(); });
window.addEventListener('hashchange', zeigeSeite);
zeichneKopf();
zeigeSeite();
