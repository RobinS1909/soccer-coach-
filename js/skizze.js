// Zeichnet einfache Spielfeld-Skizzen für das Kopf-Training (Daten aus uebungen.json).
// Koordinaten: Feld 100 × 64, unser Tor links. Gelb = wir, Rot = Gegner.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function skizzeSvg(s) {
  const teile = [];
  // Feld
  teile.push(`<rect x="0" y="0" width="100" height="64" rx="2" fill="#0f3a1e"/>`);
  teile.push(`<g fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".5">
    <rect x="2" y="2" width="96" height="60"/>
    <line x1="50" y1="2" x2="50" y2="62"/>
    <circle cx="50" cy="32" r="8"/>
    <rect x="2" y="18" width="12" height="28"/><rect x="86" y="18" width="12" height="28"/>
  </g>`);
  teile.push(`<rect x="0" y="27" width="2" height="10" fill="#FFD500"/><rect x="98" y="27" width="2" height="10" fill="#fff"/>`);
  for (const z of s.zonen || []) {
    teile.push(`<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="1.5" fill="rgba(255,213,0,.18)" stroke="#FFD500" stroke-width=".6" stroke-dasharray="2 1.2"/>`);
    if (z.label) teile.push(`<text x="${z.x + z.w / 2}" y="${z.y + z.h / 2 + 2.6}" font-size="8" font-weight="800" fill="#FFD500" text-anchor="middle">${esc(z.label)}</text>`);
  }
  for (const p of s.pfeile || []) {
    const [x1, y1] = p.von;
    const [x2, y2] = p.nach;
    const lauf = p.typ === 'lauf';
    teile.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width=".8" ${lauf ? 'stroke-dasharray="2 1.5"' : ''} marker-end="url(#spitze)"/>`);
    if (p.label) {
      teile.push(`<circle cx="${x2}" cy="${y2 - 5}" r="3.4" fill="#000" stroke="#FFD500" stroke-width=".5"/>`);
      teile.push(`<text x="${x2}" y="${y2 - 3.6}" font-size="4.2" font-weight="800" fill="#FFD500" text-anchor="middle">${esc(p.label)}</text>`);
    }
  }
  for (const sp of s.spieler || []) {
    const wir = sp.team === 'wir';
    if (sp.ich) teile.push(`<circle cx="${sp.x}" cy="${sp.y}" r="5" fill="none" stroke="#fff" stroke-width=".7"/>`);
    teile.push(`<circle cx="${sp.x}" cy="${sp.y}" r="3.4" fill="${wir ? '#FFD500' : '#e5484d'}" stroke="#000" stroke-width=".5"/>`);
    const label = sp.ich ? 'Ich' : sp.label;
    if (label) teile.push(`<text x="${sp.x}" y="${sp.y + 1.4}" font-size="${label.length > 1 ? 2.8 : 3.8}" font-weight="800" fill="${wir ? '#000' : '#fff'}" text-anchor="middle">${esc(label)}</text>`);
  }
  if (s.ball) teile.push(`<circle cx="${s.ball.x}" cy="${s.ball.y}" r="1.6" fill="#fff" stroke="#000" stroke-width=".4"/>`);

  return `<svg class="skizze" viewBox="0 0 100 64" role="img" aria-label="Spielfeld-Skizze" font-family="system-ui, sans-serif">
    <defs><marker id="spitze" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#fff"/></marker></defs>
    ${teile.join('')}
  </svg>`;
}
