// Trainer-Bereich: Übersicht, Anwesenheit, Wochenplan, Kinder verwalten.
import { db, trainerSitzung, trainerLogin, trainerLogout } from './api.js';
import { wocheVon, plusTage, isoDatum, ausIso, wochenText, berechneWoche } from './regeln.js';
import { esc, $ } from './util.js';

let el;
let daten;
let tab = 'uebersicht';
let woche = wocheVon();
let tag = isoDatum();

export function zeigeTrainer(container, inhalt) {
  el = container;
  daten = inhalt;
  if (!trainerSitzung()) return zeigeLogin();
  render();
}

function zeigeLogin(meldung = '') {
  el.innerHTML = `
    <section class="karte">
      <h1>Trainer-Bereich</h1>
      <p class="klein">Nur für das Trainerteam.</p>
      <form id="login">
        <label>E-Mail<input type="email" id="email" autocomplete="username" required></label>
        <label>Passwort<input type="password" id="pw" autocomplete="current-password" required></label>
        <p class="fehler" id="fehler">${esc(meldung)}</p>
        <button class="knopf" type="submit">Anmelden</button>
      </form>
    </section>`;
  $('#login').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    try {
      await trainerLogin($('#email').value.trim(), $('#pw').value);
      render();
    } catch (e) {
      $('#fehler').textContent = e.status ? 'E-Mail oder Passwort falsch.' : e.message;
    }
  });
}

async function render() {
  const tabs = { uebersicht: 'Übersicht', anwesenheit: 'Anwesenheit', plan: 'Wochenplan', kinder: 'Kinder' };
  el.innerHTML = `
    <div class="kopfzeile"><h1>Trainer</h1><button class="link" id="logout">Abmelden</button></div>
    <div class="tabs">${Object.entries(tabs).map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? 'aktiv' : ''}">${n}</button>`).join('')}</div>
    <div id="inhalt"><div class="laden">⚽</div></div>`;
  el.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
  $('#logout').addEventListener('click', () => { trainerLogout(); zeigeLogin(); });
  const inhalt = $('#inhalt');
  try {
    if (tab === 'uebersicht') await uebersicht(inhalt);
    if (tab === 'anwesenheit') await anwesenheit(inhalt);
    if (tab === 'plan') await plan(inhalt);
    if (tab === 'kinder') await kinder(inhalt);
  } catch (e) {
    if (e.status === 401 || !trainerSitzung()) return zeigeLogin('Bitte neu anmelden.');
    inhalt.innerHTML = `<div class="hinweis">Fehler: ${esc(e.message)}</div>`;
  }
}

function wochenWahl() {
  return `<div class="wochenwahl"><button class="rund" id="vor" aria-label="Vorige Woche">‹</button><strong>${esc(wochenText(woche))}</strong><button class="rund" id="nach" aria-label="Nächste Woche">›</button></div>`;
}
function wochenWahlAktiv() {
  $('#vor').addEventListener('click', () => { woche = plusTage(woche, -7); render(); });
  $('#nach').addEventListener('click', () => { woche = plusTage(woche, 7); render(); });
}

const titel = (id) => daten.uebungen.find((u) => u.id === id)?.titel || id;

async function ladePlan(w) {
  const p = await db.lesen(`wochenplan?select=uebung_id,art&woche=eq.${w}`);
  return { rows: p, basis: p.length ? p.filter((x) => x.art === 'basis').map((x) => x.uebung_id) : daten.standardWoche.basis, eigener: p.length > 0 };
}

// ---------- Übersicht ----------
async function uebersicht(inhalt) {
  const bis = plusTage(woche, 7);
  const [kids, erl, trainings, p] = await Promise.all([
    db.lesen('kind?select=id,name&order=name'),
    db.lesen(`erledigung?select=kind_id,uebung_id,datum&datum=gte.${woche}&datum=lt.${bis}`),
    db.lesen(`training?select=id,datum,anwesenheit(kind_id,anwesend)&datum=gte.${woche}&datum=lt.${bis}`),
    ladePlan(woche),
  ]);
  const zeilen = kids.map((k) => {
    const erledigt = erl.filter((e) => e.kind_id === k.id).map((e) => e.uebung_id);
    const verpasst = trainings.filter((t) => t.anwesenheit.some((a) => a.kind_id === k.id && !a.anwesend)).length;
    return { k, erledigt: [...new Set(erledigt)], verpasst, r: berechneWoche({ basis: p.basis, verpasst, erledigt }) };
  });
  const fertig = zeilen.filter((z) => z.r.fertig).length;
  inhalt.innerHTML = `
    ${wochenWahl()}
    ${!p.eigener ? `<div class="hinweis">Für diese Woche gibt es keinen eigenen Plan – es gilt der Standard-Plan.</div>` : ''}
    <section class="karte"><p class="zahl"><strong>${fertig}</strong> von ${kids.length} Kindern haben ihr Soll erfüllt</p>
    <p class="klein">${trainings.length} Training(s) in dieser Woche eingetragen · Pflicht: ${p.basis.length} Einheiten · +2 je verpasstes Training</p></section>
    <div class="liste">${zeilen.map(({ k, erledigt, verpasst, r }) => `
      <details class="kind-zeile ${r.fertig ? 'fertig' : ''}">
        <summary><span class="name">${esc(k.name)}</span><span class="mini-balken"><span style="width:${r.soll ? (r.ist / r.soll) * 100 : 0}%"></span></span><span class="wert">${r.ist}/${r.soll}${r.fertig ? ' ✓' : ''}</span></summary>
        <p class="klein">${verpasst ? `Training verpasst: ${verpasst}× → ${r.extraSoll} Extra-Einheiten (${r.extraIst} erledigt)` : 'Kein Training verpasst'}</p>
        <p class="klein">Erledigt: ${erledigt.length ? erledigt.map((id) => esc(titel(id))).join(', ') : '–'}</p>
      </details>`).join('') || '<p>Noch keine Kinder angelegt.</p>'}</div>`;
  wochenWahlAktiv();
}

// ---------- Anwesenheit ----------
async function anwesenheit(inhalt) {
  const [kids, tr] = await Promise.all([
    db.lesen('kind?select=id,name&order=name'),
    db.lesen(`training?select=id,datum,anwesenheit(kind_id,anwesend)&datum=eq.${tag}`),
  ]);
  const t = tr[0];
  const status = (kid) => t?.anwesenheit.find((a) => a.kind_id === kid)?.anwesend;
  inhalt.innerHTML = `
    <section class="karte">
      <label>Trainingstag<input type="date" id="tag" value="${tag}"></label>
      <p class="klein">${ausIso(tag).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    </section>
    ${!t ? `<button class="knopf" id="anlegen">Training an diesem Tag eintragen</button>` : `
      <div class="zeile-knoepfe"><button class="knopf zweit" id="alleda">Alle waren da</button></div>
      <div class="liste">${kids.map((k) => { const s = status(k.id); return `
        <div class="anw-zeile"><span class="name">${esc(k.name)}</span>
          <button class="anw ${s === true ? 'da' : ''}" data-kid="${k.id}" data-wert="true">✓ Da</button>
          <button class="anw ${s === false ? 'weg' : ''}" data-kid="${k.id}" data-wert="false">✗ Fehlt</button></div>`; }).join('')}</div>
      <p class="klein">Wer als „fehlt“ markiert ist, bekommt 2 Extra-Einheiten in dieser Woche.</p>
      <button class="link" id="tr-loeschen">Dieses Training löschen</button>`}`;
  $('#tag').addEventListener('change', (ev) => { tag = ev.target.value || isoDatum(); render(); });
  $('#anlegen')?.addEventListener('click', async () => { await db.einfuegen('training', { datum: tag }); render(); });
  $('#alleda')?.addEventListener('click', async () => {
    await db.einfuegen('anwesenheit', kids.map((k) => ({ training_id: t.id, kind_id: k.id, anwesend: true })), true);
    render();
  });
  inhalt.querySelectorAll('.anw').forEach((b) => b.addEventListener('click', async () => {
    const zeile = b.parentElement;
    zeile.querySelectorAll('.anw').forEach((x) => x.classList.remove('da', 'weg'));
    b.classList.add(b.dataset.wert === 'true' ? 'da' : 'weg');
    try {
      await db.einfuegen('anwesenheit', { training_id: t.id, kind_id: b.dataset.kid, anwesend: b.dataset.wert === 'true' }, true);
    } catch (e) { alert(e.message); render(); }
  }));
  $('#tr-loeschen')?.addEventListener('click', async () => {
    if (!confirm('Training samt Anwesenheit löschen?')) return;
    await db.loeschen(`training?id=eq.${t.id}`);
    render();
  });
}

// ---------- Wochenplan ----------
async function plan(inhalt) {
  const p = await ladePlan(woche);
  const art = Object.fromEntries(p.rows.map((r) => [r.uebung_id, r.art]));
  inhalt.innerHTML = `
    ${wochenWahl()}
    ${!p.eigener ? `<div class="hinweis">Noch kein eigener Plan – die Kinder sehen den Standard-Plan.<br><button class="knopf zweit" id="standard">Standard-Plan übernehmen und anpassen</button></div>` : ''}
    <p class="klein"><strong>Pflicht</strong> = für alle Kinder. <strong>Extra</strong> = Vorschläge für Kinder, die beim Training gefehlt haben (je Fehltraining 2 Einheiten).</p>
    <div class="liste">${daten.uebungen.map((u) => { const a = art[u.id] || ''; const sp = daten.schwerpunkte[u.schwerpunkt]; return `
      <div class="plan-zeile"><div><strong>${esc(u.titel)}</strong><span class="klein">${sp.icon} ${esc(sp.name)} · ${daten.arten[u.art].icon} · ${u.dauer} Min</span></div>
        <div class="segment" data-id="${esc(u.id)}">
          <button data-art="" class="${a === '' ? 'aktiv' : ''}">–</button>
          <button data-art="basis" class="${a === 'basis' ? 'aktiv' : ''}">Pflicht</button>
          <button data-art="zusatz" class="${a === 'zusatz' ? 'aktiv' : ''}">Extra</button>
        </div></div>`; }).join('')}</div>`;
  wochenWahlAktiv();
  $('#standard')?.addEventListener('click', async () => {
    const s = daten.standardWoche;
    await db.einfuegen('wochenplan', [...s.basis.map((id) => ({ woche, uebung_id: id, art: 'basis' })), ...s.zusatz.filter((id) => !s.basis.includes(id)).map((id) => ({ woche, uebung_id: id, art: 'zusatz' }))], true);
    render();
  });
  inhalt.querySelectorAll('.segment button').forEach((b) => b.addEventListener('click', async () => {
    const id = b.parentElement.dataset.id;
    const neu = b.dataset.art;
    try {
      if (neu) await db.einfuegen('wochenplan', { woche, uebung_id: id, art: neu }, true);
      else await db.loeschen(`wochenplan?woche=eq.${woche}&uebung_id=eq.${encodeURIComponent(id)}`);
      b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('aktiv', x === b));
      if (!p.eigener) render();
    } catch (e) { alert(e.message); }
  }));
}

// ---------- Kinder ----------
async function kinder(inhalt) {
  const kids = await db.lesen('kind?select=id,name&order=name');
  inhalt.innerHTML = `
    <section class="karte">
      <h2>Kind hinzufügen</h2>
      <p class="klein">Nur Vorname oder Spitzname – keine Nachnamen, keine weiteren Daten.</p>
      <form id="neu" class="inline-form"><input id="name" maxlength="30" placeholder="Vorname / Spitzname" required><button class="knopf">Anlegen</button></form>
    </section>
    <div class="liste">${kids.map((k) => `
      <div class="kind-verw"><span class="name">${esc(k.name)}</span>
        <button class="link" data-code="${k.id}">Neuer Code</button>
        <button class="link rot" data-del="${k.id}" data-name="${esc(k.name)}">Löschen</button></div>`).join('') || '<p>Noch keine Kinder angelegt.</p>'}</div>
    <p class="klein">Codes werden nur verschlüsselt gespeichert und können nicht erneut angezeigt werden. Hat ein Kind seinen Code verloren, erzeuge einfach einen neuen – der alte wird dann ungültig.</p>`;
  $('#neu').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const name = $('#name').value.trim();
    if (!name) return;
    const r = await db.rpc('trainer_kind_anlegen', { p_name: name });
    zeigeCode(name, r.code);
  });
  inhalt.querySelectorAll('[data-code]').forEach((b) => b.addEventListener('click', async () => {
    const name = b.parentElement.querySelector('.name').textContent;
    if (!confirm(`Neuen Code für ${name} erzeugen? Der alte Code funktioniert dann nicht mehr.`)) return;
    const code = await db.rpc('trainer_code_neu', { p_kind: b.dataset.code });
    zeigeCode(name, code);
  }));
  inhalt.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm(`${b.dataset.name} und ALLE Daten (erledigte Einheiten, Anwesenheit) endgültig löschen?`)) return;
    await db.loeschen(`kind?id=eq.${b.dataset.del}`);
    render();
  }));
}

function zeigeCode(name, code) {
  const div = document.createElement('div');
  div.className = 'feier';
  div.innerHTML = `<div class="feier-box">
    <h2>Code für ${esc(name)}</h2>
    <p class="code-anzeige">${esc(code)}</p>
    <p class="klein">Jetzt notieren oder als Screenshot sichern und dem Kind bzw. den Eltern geben. Der Code wird nicht noch einmal angezeigt.</p>
    <button class="knopf">Notiert – fertig</button></div>`;
  document.body.appendChild(div);
  $('button', div).addEventListener('click', () => { div.remove(); render(); });
}

