/* ============================================================================
   CHARTS — mini libreria di grafici SVG, zero dipendenze esterne.
   Ogni funzione ritorna una stringa SVG pronta da inserire con innerHTML.
   I tooltip nativi (<title>) mostrano i dettagli al passaggio del mouse.
   Espone: window.Charts = { bar, hbar, histogram, scatter, ROLE_COLOR }
   ==========================================================================*/
(function () {
  'use strict';

  // I colori sono variabili CSS (definite in index.html per tema scuro e chiaro):
  // cambiando tema i grafici già disegnati si ricolorano da soli, senza ridisegnarli.
  // Per questo si usano sempre come style="fill:…" (le var() negli attributi SVG non sono affidabili).
  const ROLE_COLOR = { GK: 'var(--role-gk)', DF: 'var(--role-df)', MF: 'var(--role-mf)', FW: 'var(--role-fw)' };
  const MUTED = 'var(--nm-text3)', GRID = 'var(--chart-grid)', AXIS = 'var(--chart-axis)', TXT = 'var(--nm-text)', TXT_DIM = 'var(--nm-text2)';
  const ACCENT = 'var(--gold)', ACCENT2 = 'var(--blue)';

  function esc(s) { return (s ?? '').toString().replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function trunc(s, n) { s = (s ?? '').toString(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function wrap(w, h, inner) {
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="xMidYMid meet" style="display:block;font-family:inherit">${inner}</svg>`;
  }
  function emptyMsg(w, h, msg) {
    return wrap(w, h, `<text x="${w/2}" y="${h/2}" text-anchor="middle" font-size="11" style="fill:${MUTED}">${esc(msg || 'Dati insufficienti')}</text>`);
  }

  // ---- bar chart verticale (poche categorie: ruoli, fasce età) -------------
  function bar({ labels, values, colors, height = 170, unit = '' }) {
    const W = 320, H = height, padT = 20, padB = 26;
    const innerW = W - 16, innerH = H - padT - padB;
    const maxV = Math.max(1, ...values);
    const bw = innerW / values.length;
    let out = '';
    values.forEach((v, i) => {
      const h = maxV ? (v / maxV) * innerH : 0;
      const x = 8 + i * bw + bw * 0.18;
      const bwv = bw * 0.64;
      const y = padT + (innerH - h);
      const color = colors ? colors[i] : ACCENT;
      out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bwv.toFixed(1)}" height="${Math.max(h,1).toFixed(1)}" rx="4" style="fill:${color}" fill-opacity="0.9"><title>${esc(labels[i])}: ${v}${unit}</title></rect>`;
      if (v > 0) out += `<text x="${(x+bwv/2).toFixed(1)}" y="${(y-6).toFixed(1)}" text-anchor="middle" font-size="10.5" style="fill:${TXT}" font-family="JetBrains Mono,monospace">${v}</text>`;
      out += `<text x="${(x+bwv/2).toFixed(1)}" y="${H-8}" text-anchor="middle" font-size="9.5" style="fill:${TXT_DIM}">${esc(labels[i])}</text>`;
    });
    return wrap(W, H, out);
  }

  // ---- bar chart orizzontale (etichette lunghe: squadre) --------------------
  function hbar({ labels, values, color = ACCENT, unit = '' }) {
    if (!labels.length) return emptyMsg(340, 60);
    const W = 340, rowH = 25, H = labels.length * rowH + 8;
    const maxV = Math.max(1, ...values);
    const labelW = 96, barAreaW = W - labelW - 44;
    let out = '';
    values.forEach((v, i) => {
      const y = 4 + i * rowH;
      const w = maxV ? (v / maxV) * barAreaW : 0;
      out += `<text x="${labelW-8}" y="${y+15}" text-anchor="end" font-size="10.5" style="fill:${TXT}"><title>${esc(labels[i])}</title>${esc(trunc(labels[i],15))}</text>`;
      out += `<rect x="${labelW}" y="${y+3}" width="${Math.max(w,2).toFixed(1)}" height="15" rx="3" style="fill:${color}" fill-opacity="0.9"><title>${esc(labels[i])}: ${v}${unit}</title></rect>`;
      out += `<text x="${(labelW+w+7).toFixed(1)}" y="${y+15}" font-size="10" style="fill:${TXT_DIM}" font-family="JetBrains Mono,monospace">${v}${unit}</text>`;
    });
    return wrap(W, H, out);
  }

  // ---- istogramma (distribuzione numerica: età) -----------------------------
  function histogram({ values, bucketSize = 3, min, max, color = ACCENT2, height = 170, unit = '' }) {
    const clean = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    if (!clean.length) return emptyMsg(320, height, 'Nessun dato età disponibile');
    const lo = min ?? Math.floor(Math.min(...clean) / bucketSize) * bucketSize;
    const hi = max ?? Math.ceil(Math.max(...clean) / bucketSize) * bucketSize;
    const nBuckets = Math.max(1, Math.round((hi - lo) / bucketSize));
    const counts = new Array(nBuckets).fill(0);
    clean.forEach(v => {
      let idx = Math.floor((v - lo) / bucketSize);
      if (idx < 0) idx = 0; if (idx >= nBuckets) idx = nBuckets - 1;
      counts[idx]++;
    });
    const labels = counts.map((_, i) => `${Math.round(lo + i*bucketSize)}`);
    return bar({ labels, values: counts, colors: counts.map(()=>color), height, unit });
  }

  // ---- scatter plot (valore vs elo, colorato per ruolo) ---------------------
  function scatter({ points, height = 230, xLabel = '', yLabel = '' }) {
    if (!points.length) return emptyMsg(340, height, 'Servono giocatori con Valore + Elo');
    const W = 340, H = height, padL = 34, padR = 12, padT = 12, padB = 30;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const xMax = Math.max(...xs) * 1.08 || 1;
    const yMin = Math.min(...ys) * 0.97, yMax = Math.max(...ys) * 1.02;
    const sx = v => padL + (v / xMax) * innerW;
    const sy = v => padT + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;

    let grid = '';
    for (let i = 0; i <= 3; i++) {
      const gy = padT + innerH * i / 3;
      grid += `<line x1="${padL}" y1="${gy.toFixed(1)}" x2="${padL+innerW}" y2="${gy.toFixed(1)}" style="stroke:${GRID}" stroke-width="1"/>`;
    }
    let dots = '';
    points.forEach(p => {
      dots += `<circle cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="3.6" style="fill:${p.color || ACCENT};stroke:var(--nm-bg)" fill-opacity="0.88" stroke-width="0.8"><title>${esc(p.label)}\n${xLabel}: ${p.x}\n${yLabel}: ${Math.round(p.y)}</title></circle>`;
    });
    const axisX = `<line x1="${padL}" y1="${padT+innerH}" x2="${padL+innerW}" y2="${padT+innerH}" style="stroke:${AXIS}" stroke-width="1"/>`;
    const axisY = `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT+innerH}" style="stroke:${AXIS}" stroke-width="1"/>`;
    const xLab = `<text x="${padL+innerW/2}" y="${H-4}" text-anchor="middle" font-size="9.5" style="fill:${TXT_DIM}">${esc(xLabel)}</text>`;
    const yLab = `<text x="10" y="${padT+innerH/2}" text-anchor="middle" font-size="9.5" style="fill:${TXT_DIM}" transform="rotate(-90 10 ${padT+innerH/2})">${esc(yLabel)}</text>`;
    const xTick0 = `<text x="${padL}" y="${padT+innerH+14}" text-anchor="start" font-size="9" style="fill:${MUTED}" font-family="JetBrains Mono,monospace">0</text>`;
    const xTickMax = `<text x="${padL+innerW}" y="${padT+innerH+14}" text-anchor="end" font-size="9" style="fill:${MUTED}" font-family="JetBrains Mono,monospace">${Math.round(xMax)}</text>`;
    return wrap(W, H, grid + axisX + axisY + dots + xLab + yLab + xTick0 + xTickMax);
  }

  window.Charts = { bar, hbar, histogram, scatter, ROLE_COLOR };
})();
