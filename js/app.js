// SV Soltau – Soccer Coach: Kinder-Ansicht und Navigation
import { online, demo, sitzungAusLink } from './api.js';
import { demoZuruecksetzen, DEMO_CODES } from './demo.js';
import * as kind from './kind.js';
import { ABZEICHEN, werteAus } from './abzeichen.js';
import { skizzeSvg } from './skizze.js';
import { wocheVon, inWoche, berechneWoche, wochenText } from './regeln.js';
import { zeigeTrainer } from './trainer.js';
import { esc, $, frage as nachfrage, meldung } from './util.js';

const app = document.getElementById('app');

let daten; // Inhalt von uebungen.json
let nachId = {};
let woche = null; // geladene Wochendaten des Kindes

// ---------------- Start ----------------
async function start() {
  try {
    const res = await fetch('data/uebungen.json', { cache: 'no-cache' });
    daten = await res.json();
  } catch {
    app.innerHTML = `<div class="karte"><h2>Ups!</h2><p>Die Übungen konnten nicht geladen werden. Bitte einmal mit Internet öffnen.</p></div>`;
    return;
  }
  nachId = Object.fromEntries(daten.uebungen.map((u) => [u.id, u]));
  if (demo) document.querySelector('.kopf')?.insertAdjacentHTML('beforeend', '<a class="demo-chip" href="#/info">DEMO</a>');
  // Rückkehr aus einer E-Mail (Einladung, Passwort vergessen)
  if (/access_token=/.test(location.hash) && sitzungAusLink(location.hash)) {
    history.replaceState(null, '', location.pathname + '#/trainer/passwort');
  } else if (/error_description=/.test(location.hash)) {
    const p = new URLSearchParams(location.hash.slice(1));
    history.replaceState(null, '', location.pathname + '#/trainer');
    meldung(`Der Link aus der E-Mail funktioniert nicht (mehr): ${p.get('error_description')}. Bitte unter „Passwort vergessen?“ einen neuen anfordern.`);
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('[data-zurueck]')) return;
    if (history.length > 1) history.back();
    else location.hash = '#/';
  });
  route();
  if ('serviceWorker' in navigator) {
    // Kommt eine neue App-Version, einmal neu laden, damit alle Dateien zusammenpassen
    const hatteVersion = Boolean(navigator.serviceWorker.controller);
    let neuGeladen = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hatteVersion && !neuGeladen) {
        neuGeladen = true;
        location.reload();
      }
    });
    navigator.serviceWorker.register('sw.js').then((r) => r.update()).catch(() => {});
  }
}

function setzeNav(aktiv) {
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('aktiv', a.dataset.nav === aktiv));
  const t = document.querySelector('.nav [data-nav="trainer"]');
  if (t) t.hidden = !online;
}

async function route() {
  const [, teil, id] = (location.hash || '#/').split('/');
  window.scrollTo(0, 0);
  try {
    if (teil === 'uebung' && nachId[id]) return zeigeUebung(nachId[id]);
    if (teil === 'quiz' && nachId[id]?.quiz) return zeigeQuiz(nachId[id]);
    if (teil === 'alle') return zeigeAlle(id);
    if (teil === 'abzeichen') return zeigeAbzeichen();
    if (teil === 'info') return zeigeInfo();
    if (teil === 'trainer' && online) {
      setzeNav('trainer');
      return zeigeTrainer(app, daten, id);
    }
    return zeigeWoche();
  } catch (e) {
    app.innerHTML = `<div class="karte"><h2>Ups!</h2><p>${esc(e.message)}</p><a class="knopf" href="#/">Zur Startseite</a></div>`;
  }
}

async function ladeWoche() {
  woche = await kind.ladeWoche(wocheVon(), daten.standardWoche);
  return woche;
}

function erledigtDieseWoche() {
  const w = wocheVon();
  return woche.historie.filter((h) => inWoche(h.datum, w)).map((h) => h.uebung_id);
}

// ---------------- Wochen-Ansicht ----------------
async function zeigeWoche() {
  setzeNav('woche');
  if (online && !kind.kindCode()) return zeigeCodeEingabe();
  app.innerHTML = `<div class="laden">⚽</div>`;
  try {
    await ladeWoche();
  } catch (e) {
    if (e.status) return zeigeCodeEingabe('Dein Code passt nicht mehr. Frag deinen Trainer nach einem neuen.');
    throw e;
  }
  const erledigt = erledigtDieseWoche();
  const r = berechneWoche({ basis: woche.basis, verpasst: woche.verpasst, erledigt });
  const prozent = r.soll ? Math.round((r.ist / r.soll) * 100) : 0;
  const set = new Set(erledigt);
  const extraListe = woche.zusatz.filter((id) => !woche.basis.includes(id) && nachId[id]);

  let spruch = 'Los geht’s – du schaffst das!';
  if (r.fertig) spruch = 'Wochen-Soll geschafft! Du bist ein Held! 🏆';
  else if (prozent >= 50) spruch = 'Mehr als die Hälfte – stark! Weiter so!';
  else if (r.ist > 0) spruch = 'Guter Anfang! Bleib dran!';

  app.innerHTML = `
    ${woche.offline ? `<div class="hinweis">📴 Offline – deine Häkchen werden gesendet, sobald du wieder Internet hast.</div>` : ''}
    <section class="karte held">
      <p class="klein">${esc(wochenText(wocheVon()))}</p>
      <h1>${woche.name ? `Hallo ${esc(woche.name)}!` : 'Deine Trainings-Woche'}</h1>
      <div class="balken" role="progressbar" aria-valuemin="0" aria-valuemax="${r.soll}" aria-valuenow="${r.ist}"><span style="width:${prozent}%"></span></div>
      <p class="zahl"><strong>${r.ist}</strong> von ${r.soll} Einheiten geschafft</p>
      <p>${spruch}</p>
    </section>
    ${woche.verpasst > 0 ? `<div class="hinweis gelb">Du hast ${woche.verpasst === 1 ? 'ein Training' : `${woche.verpasst} Trainings`} verpasst. Dafür machst du <strong>${r.extraSoll} Extra-Einheiten</strong> (${r.extraIst} von ${r.extraSoll} geschafft).</div>` : ''}
    <h2>Deine Pflicht-Einheiten</h2>
    <div class="liste">${woche.basis.filter((id) => nachId[id]).map((id) => uebungsKarte(nachId[id], set.has(id))).join('') || '<p class="klein">Diese Woche ist nichts geplant.</p>'}</div>
    ${extraListe.length ? `<h2>${woche.verpasst > 0 ? 'Extra-Einheiten (Pflicht für dich)' : 'Extra-Einheiten für Profis'}</h2>
    ${woche.verpasst > 0 ? '' : '<p class="klein">Freiwillig – wer mehr macht, wird besser!</p>'}
    <div class="liste">${extraListe.map((id) => uebungsKarte(nachId[id], set.has(id))).join('')}</div>` : ''}
    <a class="knopf zweit" href="#/alle">Alle Übungen ansehen</a>
    ${!online ? `<p class="klein mitte">Dein Fortschritt wird nur auf diesem Gerät gespeichert.</p>` : ''}
  `;
}

function uebungsKarte(u, fertig) {
  const sp = daten.schwerpunkte[u.schwerpunkt];
  const art = daten.arten[u.art];
  return `<a class="uebung ${fertig ? 'fertig' : ''}" href="#/uebung/${esc(u.id)}">
    <span class="art" aria-hidden="true">${art.icon}</span>
    <span class="text"><strong>${esc(u.titel)}</strong><span class="klein">${sp.icon} ${esc(sp.name)} · ${u.dauer} Min</span></span>
    <span class="haken" aria-label="${fertig ? 'erledigt' : 'offen'}">${fertig ? '✓' : ''}</span>
  </a>`;
}

// ---------------- Code-Eingabe (Kinder) ----------------
function zeigeCodeEingabe(meldung = '') {
  setzeNav('woche');
  app.innerHTML = `
    <section class="karte held mitte">
      <img class="willkommen-logo" src="icons/logo.png" alt="Maskottchen des SV Soltau" width="180" height="180">
      <h1>Willkommen!</h1>
      <p>Gib deinen Code ein. Den bekommst du von deinem Trainer.</p>
      <form id="code-form">
        <input id="code" class="code-eingabe" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="12" placeholder="z. B. K7M2QX" aria-label="Zugangscode" required>
        <p class="fehler" id="fehler">${esc(meldung)}</p>
        <button class="knopf" type="submit">Los geht’s!</button>
      </form>
    </section>
    ${demo ? `<div class="hinweis gelb"><strong>Demo zum Ausprobieren:</strong> Tippe auf einen Beispiel-Code.<div class="demo-codes">${DEMO_CODES.map((c) => `<button class="chip" data-demo-code="${c}">${c}</button>`).join('')}</div></div>` : ''}
    <a class="knopf zweit" href="#/alle">Erst mal Übungen ansehen</a>`;
  document.querySelectorAll('[data-demo-code]').forEach((b) => b.addEventListener('click', () => {
    $('#code').value = b.dataset.demoCode;
    $('#code-form').requestSubmit();
  }));
  $('#code-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const knopf = $('button', ev.target);
    knopf.disabled = true;
    $('#fehler').textContent = '';
    try {
      await kind.anmelden($('#code').value);
      zeigeWoche();
    } catch (e) {
      $('#fehler').textContent = e.status ? 'Dieser Code passt nicht. Schau nochmal genau hin!' : e.message;
      knopf.disabled = false;
    }
  });
}

// ---------------- Übung ----------------
async function zeigeUebung(u) {
  setzeNav('');
  if (!woche) {
    try {
      if (!online || kind.kindCode()) await ladeWoche();
    } catch {
      /* Anleitung trotzdem zeigen */
    }
  }
  const fertig = woche ? erledigtDieseWoche().includes(u.id) : false;
  const sp = daten.schwerpunkte[u.schwerpunkt];
  const art = daten.arten[u.art];
  const darfAbhaken = !online || kind.kindCode();
  app.innerHTML = `
    <button class="zurueck" data-zurueck>‹ Zurück</button>
    <section class="karte">
      <div class="chips"><span class="chip gelb">${sp.icon} ${esc(sp.name)}</span><span class="chip">${art.icon} ${esc(art.name)}</span><span class="chip">⏱ ${u.dauer} Min</span></div>
      <h1>${esc(u.titel)}</h1>
      <p class="ziel">${esc(u.ziel)}</p>
    </section>
    <section class="karte">
      <h2>Das brauchst du</h2>
      <ul class="material">${u.material.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
      ${u.ort ? `<p class="klein">📍 ${esc(u.ort)}</p>` : ''}
    </section>
    <section class="karte">
      <h2>So geht’s</h2>
      <ol class="schritte">${u.schritte.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    </section>
    ${u.tipp ? `<div class="tipp"><strong>💡 Profi-Tipp:</strong> ${esc(u.tipp)}</div>` : ''}
    ${u.bild ? `<img class="bild" src="${esc(u.bild)}" alt="Skizze zur Übung" loading="lazy">` : ''}
    ${videoListe(u)}
    <div class="aktion">
      ${u.quiz ? `<a class="knopf" href="#/quiz/${esc(u.id)}">${fertig ? 'Quiz nochmal spielen' : 'Quiz starten 🧠'}</a>` : `<button class="knopf zweit" id="timer">⏱ Timer starten (${u.dauer} Min)</button>`}
      ${!darfAbhaken ? `<p class="klein mitte">Zum Abhaken erst <a href="#/">deinen Code eingeben</a>.</p>`
        : fertig ? `<p class="erledigt">✓ Diese Woche erledigt!</p><button class="link" id="rueck">Doch nicht erledigt? Rückgängig</button>`
        : !u.quiz ? `<button class="knopf" id="fertig">Geschafft! ✓</button>` : ''}
    </div>`;

  $('#fertig')?.addEventListener('click', () => abschliessen(u));
  $('#rueck')?.addEventListener('click', async () => {
    await kind.zuruecknehmen(u.id);
    woche = null;
    zeigeUebung(u);
  });
  $('#timer')?.addEventListener('click', (ev) => starteTimer(ev.currentTarget, u.dauer));
}

// Videos: Liste "videos" [{titel, url}] oder einzelner Link "video"
function videoListe(u) {
  const videos = [...(u.videos || []), ...(u.video ? [{ titel: 'Video ansehen', url: u.video }] : [])].filter((v) => /^https:\/\//.test(v.url));
  if (!videos.length) return '';
  return `<section class="karte videos">
      <h2>Video zum Nachmachen</h2>
      ${videos.map((v) => `<a class="video-link" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">▶</span><span>${esc(v.titel)}</span></a>`).join('')}
      <p class="klein">Öffnet YouTube. Am besten zusammen mit Mama oder Papa ansehen.</p>
    </section>`;
}

let timerId;
function starteTimer(knopf, minuten) {
  clearInterval(timerId);
  if (knopf.dataset.laeuft) {
    delete knopf.dataset.laeuft;
    knopf.textContent = `⏱ Timer starten (${minuten} Min)`;
    return;
  }
  knopf.dataset.laeuft = '1';
  const ende = Date.now() + minuten * 60000;
  const tick = () => {
    if (!document.body.contains(knopf)) return clearInterval(timerId);
    const rest = Math.max(0, Math.round((ende - Date.now()) / 1000));
    knopf.textContent = `⏱ ${Math.floor(rest / 60)}:${String(rest % 60).padStart(2, '0')} – tippen zum Stoppen`;
    if (rest === 0) {
      clearInterval(timerId);
      delete knopf.dataset.laeuft;
      knopf.textContent = '⏰ Zeit um! Super!';
      navigator.vibrate?.([300, 150, 300]);
    }
  };
  tick();
  timerId = setInterval(tick, 1000);
}

async function abschliessen(u, quizPerfekt = false) {
  const vorher = aktuelleAbzeichen();
  try {
    await kind.abhaken(u.id);
  } catch (e) {
    meldung(`Das hat nicht geklappt: ${e.message}`);
    return;
  }
  const er = kind.erfolge();
  if (quizPerfekt) er.quizPerfekt = true;
  await ladeWoche().catch(() => {});
  if (woche) {
    const r = berechneWoche({ basis: woche.basis, verpasst: woche.verpasst, erledigt: erledigtDieseWoche() });
    if (r.fertig) er.wocheFertig = true;
  }
  kind.erfolgeSpeichern(er);
  const neu = aktuelleAbzeichen().filter((id) => !vorher.includes(id));
  feiern(neu);
}

function aktuelleAbzeichen() {
  if (!woche) return [];
  const er = kind.erfolge();
  return werteAus(woche.historie, nachId, { wocheFertig: er.wocheFertig, quizPerfekt: er.quizPerfekt });
}

function feiern(neueAbzeichen) {
  const sprueche = ['Super gemacht!', 'Stark!', 'Weltklasse!', 'Klasse Einsatz!', 'Bärenstark!'];
  const r = woche ? berechneWoche({ basis: woche.basis, verpasst: woche.verpasst, erledigt: erledigtDieseWoche() }) : null;
  const abz = neueAbzeichen.map((id) => ABZEICHEN.find((a) => a.id === id));
  const div = document.createElement('div');
  div.className = 'feier';
  div.innerHTML = `<div class="feier-box">
      <div class="gross-icon hupf">🎉</div>
      <h1>${sprueche[Math.floor(Math.random() * sprueche.length)]}</h1>
      ${r ? `<p>${r.fertig ? 'Dein Wochen-Soll ist komplett! 🏆' : `Noch ${r.soll - r.ist} ${r.soll - r.ist === 1 ? 'Einheit' : 'Einheiten'} diese Woche.`}</p>` : ''}
      ${abz.map((a) => `<div class="neues-abzeichen"><span>${a.icon}</span><div><strong>Neues Abzeichen!</strong><br>${esc(a.name)}</div></div>`).join('')}
      <button class="knopf">Weiter</button>
    </div>`;
  document.body.appendChild(div);
  navigator.vibrate?.(80);
  $('button', div).addEventListener('click', () => {
    div.remove();
    location.hash = '#/';
  });
}

// ---------------- Quiz ----------------
function zeigeQuiz(u) {
  setzeNav('');
  let nr = 0;
  let richtig = 0;
  const frage = () => {
    const q = u.quiz[nr];
    window.scrollTo(0, 0);
    app.innerHTML = `
      <a class="zurueck" href="#/uebung/${esc(u.id)}">‹ Abbrechen</a>
      <p class="klein">Frage ${nr + 1} von ${u.quiz.length}</p>
      <div class="balken klein-balken"><span style="width:${(nr / u.quiz.length) * 100}%"></span></div>
      <section class="karte">
        <h2 class="frage">${esc(q.frage)}</h2>
        ${q.skizze ? skizzeSvg(q.skizze) : ''}
        ${q.bild ? `<img class="bild" src="${esc(q.bild)}" alt="">` : ''}
        <div class="antworten">${q.antworten.map((a, i) => `<button class="antwort" data-i="${i}">${esc(a)}</button>`).join('')}</div>
        <div id="erklaerung"></div>
      </section>`;
    app.querySelectorAll('.antwort').forEach((b) =>
      b.addEventListener('click', () => {
        const i = Number(b.dataset.i);
        const ok = i === q.richtig;
        if (ok) richtig++;
        app.querySelectorAll('.antwort').forEach((x) => {
          x.disabled = true;
          if (Number(x.dataset.i) === q.richtig) x.classList.add('richtig');
        });
        if (!ok) b.classList.add('falsch');
        navigator.vibrate?.(ok ? 40 : [60, 60, 60]);
        $('#erklaerung').innerHTML = `<div class="erklaerung ${ok ? 'ok' : 'nein'}">
            <strong>${ok ? '✅ Richtig!' : '❌ Nicht ganz.'}</strong>
            <p>${esc(q.erklaerung)}</p>
            <button class="knopf" id="weiter">${nr + 1 < u.quiz.length ? 'Nächste Frage' : 'Ergebnis'}</button></div>`;
        $('#weiter').addEventListener('click', () => {
          nr++;
          if (nr < u.quiz.length) frage();
          else ergebnis();
        });
        $('#erklaerung').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }),
    );
  };
  const ergebnis = () => {
    const perfekt = richtig === u.quiz.length;
    const darfAbhaken = !online || kind.kindCode();
    app.innerHTML = `<section class="karte held mitte">
        <div class="gross-icon">${perfekt ? '🧠' : '👍'}</div>
        <h1>${richtig} von ${u.quiz.length} richtig!</h1>
        <p>${perfekt ? 'Perfekt! Du denkst wie ein Profi.' : 'Gut gemacht! Spiel es nochmal, dann schaffst du alle.'}</p>
        ${darfAbhaken ? `<button class="knopf" id="fertig">Einheit abschließen ✓</button>` : ''}
        <a class="knopf zweit" href="#/quiz/${esc(u.id)}" id="nochmal">Nochmal spielen</a>
      </section>`;
    $('#fertig')?.addEventListener('click', () => abschliessen(u, perfekt));
    $('#nochmal').addEventListener('click', (ev) => {
      ev.preventDefault();
      nr = 0;
      richtig = 0;
      frage();
    });
  };
  frage();
}

// ---------------- Alle Übungen ----------------
function zeigeAlle(filter) {
  setzeNav('alle');
  const set = new Set(woche ? erledigtDieseWoche() : []);
  // Filter: "#/alle/<schwerpunkt>" oder "#/alle/<schwerpunkt>~<art>"; "alle" = kein Schwerpunkt
  const [spRoh = '', artRoh = ''] = (filter || '').split('~');
  const sp = daten.schwerpunkte[spRoh] ? spRoh : '';
  const art = daten.arten[artRoh] ? artRoh : '';
  const link = (s, a) => `#/alle/${s || 'alle'}${a ? `~${a}` : ''}`;
  const reihenfolge = Object.keys(daten.schwerpunkte);
  const liste = daten.uebungen
    .filter((u) => (!sp || u.schwerpunkt === sp) && (!art || u.art === art))
    .sort((x, y) => reihenfolge.indexOf(x.schwerpunkt) - reihenfolge.indexOf(y.schwerpunkt));
  app.innerHTML = `
    <h1>Alle Übungen</h1>
    <div class="filter">
      <a href="${link('', art)}" class="chip ${!sp ? 'gelb' : ''}">Alle</a>
      ${Object.entries(daten.schwerpunkte).map(([k, x]) => `<a href="${link(k, art)}" class="chip ${sp === k ? 'gelb' : ''}">${x.icon} ${esc(x.name)}</a>`).join('')}
    </div>
    <div class="filter art-filter">
      <a href="${link(sp, '')}" class="chip ${!art ? 'gelb' : ''}">Jede Art</a>
      ${Object.entries(daten.arten).map(([k, x]) => `<a href="${link(sp, k)}" class="chip ${art === k ? 'gelb' : ''}">${x.icon} ${esc(x.name)}</a>`).join('')}
    </div>
    ${sp ? `<p class="klein">${esc(daten.schwerpunkte[sp].lang)}</p>` : ''}
    <p class="klein">${liste.length} ${liste.length === 1 ? 'Übung' : 'Übungen'}</p>
    <div class="liste">${liste.map((u) => uebungsKarte(u, set.has(u.id))).join('') || '<p>Keine Übung mit dieser Auswahl.</p>'}</div>`;
}

// ---------------- Abzeichen ----------------
async function zeigeAbzeichen() {
  setzeNav('abzeichen');
  if (!woche && (!online || kind.kindCode())) await ladeWoche().catch(() => {});
  const hat = new Set(aktuelleAbzeichen());
  const anzahl = woche ? woche.historie.length : 0;
  app.innerHTML = `
    <h1>Deine Abzeichen</h1>
    <p>${hat.size} von ${ABZEICHEN.length} gesammelt · ${anzahl} Einheiten insgesamt</p>
    <div class="abzeichen">${ABZEICHEN.map((a) => `<div class="abz ${hat.has(a.id) ? 'hat' : ''}">
        <span class="abz-icon">${hat.has(a.id) ? a.icon : '🔒'}</span><strong>${esc(a.name)}</strong><span class="klein">${esc(a.text)}</span></div>`).join('')}</div>
    <a class="link mitte block" href="#/info">Infos & Datenschutz</a>`;
}

// ---------------- Info ----------------
function zeigeInfo() {
  setzeNav('');
  app.innerHTML = `
    <button class="zurueck" data-zurueck>‹ Zurück</button>
    <section class="karte">
      <h1>Über die App</h1>
      <p>Soccer Coach ist die Heimtrainings-App der U10 des SV Soltau von 1912 e.V.</p>
      <p><strong>Ansprechpartner:</strong> Robin Sedha (Trainer U10) · rs@svsoltau.de</p>
      <h2>Datenschutz in Kürze</h2>
      <ul>
        <li>Wir speichern nur: Vorname/Spitzname, erledigte Einheiten mit Datum und die Anwesenheit beim Training.</li>
        <li>Keine E-Mail, kein Geburtsdatum, keine Fotos.</li>
        <li>Kein Tracking, keine Werbung, keine Analyse-Tools.</li>
        <li>Server in der EU. Kinder sehen nur ihre eigenen Daten.</li>
      </ul>
      ${online && kind.kindCode() ? `<button class="knopf zweit" id="abmelden">Abmelden (Code vergessen auf diesem Gerät)</button>` : ''}
      ${!online ? `<button class="knopf zweit" id="loeschen">Meinen Fortschritt auf diesem Gerät löschen</button>` : ''}
      ${demo ? `<h2>Demo-Modus</h2><p class="klein">Alle Namen und Daten sind Beispiele und bleiben nur auf diesem Gerät.</p><button class="knopf zweit" id="demo-reset">Demo auf Anfang zurücksetzen</button>` : ''}
    </section>`;
  $('#abmelden')?.addEventListener('click', async () => {
    if (!(await nachfrage('Wirklich abmelden? Du brauchst danach wieder deinen Code.', 'Abmelden'))) return;
    kind.abmelden();
    woche = null;
    location.hash = '#/';
  });
  $('#demo-reset')?.addEventListener('click', async () => {
    if (!(await nachfrage('Alle Demo-Daten auf den Anfang zurücksetzen?', 'Zurücksetzen'))) return;
    demoZuruecksetzen();
    kind.abmelden();
    woche = null;
    location.hash = '#/';
  });
  $('#loeschen')?.addEventListener('click', async () => {
    if (!(await nachfrage('Wirklich alles löschen?', 'Löschen', true))) return;
    kind.lokaleDatenLoeschen();
    woche = null;
    location.hash = '#/';
  });
}

start();
