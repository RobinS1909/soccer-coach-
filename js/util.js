export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, el = document) => el.querySelector(sel);

// Eigene Dialoge statt confirm()/alert() – funktionieren überall, auch eingebettet.
export function dialog(text, { ja = 'OK', nein = null, gefahr = false } = {}) {
  return new Promise((fertig) => {
    const div = document.createElement('div');
    div.className = 'feier';
    div.innerHTML = `<div class="feier-box" role="dialog" aria-modal="true">
      <p class="dialog-text">${esc(text)}</p>
      <button class="knopf ${gefahr ? 'gefahr' : ''}" data-a="1">${esc(ja)}</button>
      ${nein ? `<button class="knopf zweit" data-a="0">${esc(nein)}</button>` : ''}</div>`;
    document.body.appendChild(div);
    div.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { div.remove(); fertig(b.dataset.a === '1'); }));
    div.querySelector('button').focus();
  });
}
export const frage = (text, ja = 'Ja', gefahr = false) => dialog(text, { ja, nein: 'Abbrechen', gefahr });
export const meldung = (text) => dialog(text);
