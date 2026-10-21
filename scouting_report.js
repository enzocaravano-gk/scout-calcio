/* ============================================================================
   SCOUTING REPORT — gemello del modulo "Direttore" di SportHub, standalone.
   Contiene: attributi ufficiali SportHub, form di valutazione, salvataggio
   locale (localStorage) e generazione PDF identica (stampa via iframe).
   Espone: window.ScoutReport = { openForm(prefill), openList(), openView(id) }
   ==========================================================================*/
(function () {
  'use strict';

  // ---- costanti ufficiali SportHub -----------------------------------------
  // le label seguono la lingua già impostata al momento del caricamento pagina
  // (il cambio lingua ricarica la pagina, quindi qui basta leggerla una volta)
  const T = (k) => window.I18N ? window.I18N.t(k) : k;
  const CONSI_LABELS = [T('consi_0'), T('consi_1'), T('consi_2'), T('consi_3')];
  const CONSI_CLASS  = ['bad', 'warn', 'acc', 'ok'];

  const ATTRS_TEC = [
    { id: 'piede_dx', lab: T('attr_piede_dx') }, { id: 'piede_sx', lab: T('attr_piede_sx') },
    { id: 'trasm_corta', lab: T('attr_trasm_corta') }, { id: 'trasm_media', lab: T('attr_trasm_media') },
    { id: 'trasm_lunga', lab: T('attr_trasm_lunga') }, { id: 'tiro', lab: T('attr_tiro') },
    { id: 'cross', lab: T('attr_cross') }, { id: 'verticalizzazione', lab: T('attr_verticalizzazione') },
    { id: 'colpo_testa', lab: T('attr_colpo_testa') }, { id: 'dribbling', lab: T('attr_dribbling') },
  ];
  const ATTRS_FM = [
    { id: 'velocita', lab: T('attr_velocita') }, { id: 'resistenza', lab: T('attr_resistenza') },
    { id: 'forza', lab: T('attr_forza') }, { id: 'rapidita', lab: T('attr_rapidita') },
    { id: 'struttura', lab: T('attr_struttura') }, { id: 'attenzione', lab: T('attr_attenzione') },
    { id: 'lettura_tattica', lab: T('attr_lettura_tattica') }, { id: 'posizionamento', lab: T('attr_posizionamento') },
    { id: 'smarcamento', lab: T('attr_smarcamento') }, { id: 'marcatura', lab: T('attr_marcatura') },
    { id: 'agonismo', lab: T('attr_agonismo') }, { id: 'leadership', lab: T('attr_leadership') },
  ];
  const ATTRS_TEC_GK = [
    { id: 'gk_piede_dx', lab: T('attr_gk_piede_dx') }, { id: 'gk_piede_sx', lab: T('attr_gk_piede_sx') },
    { id: 'gk_trasm_corta', lab: T('attr_gk_trasm_corta') }, { id: 'gk_trasm_media', lab: T('attr_gk_trasm_media') },
    { id: 'gk_trasm_lunga', lab: T('attr_gk_trasm_lunga') }, { id: 'gk_posizionamento', lab: T('attr_gk_posizionamento') },
    { id: 'gk_presa_bassa', lab: T('attr_gk_presa_bassa') }, { id: 'gk_presa_alta', lab: T('attr_gk_presa_alta') },
    { id: 'gk_uscite_basse', lab: T('attr_gk_uscite_basse') }, { id: 'gk_uscite_alte', lab: T('attr_gk_uscite_alte') },
    { id: 'gk_reattivita', lab: T('attr_gk_reattivita') },
  ];
  const ATTRS_FM_GK = [
    { id: 'gk_velocita', lab: T('attr_gk_velocita') }, { id: 'gk_forza', lab: T('attr_gk_forza') },
    { id: 'gk_esplosivita', lab: T('attr_gk_esplosivita') }, { id: 'gk_rapidita', lab: T('attr_gk_rapidita') },
    { id: 'gk_struttura', lab: T('attr_gk_struttura') }, { id: 'gk_attenzione', lab: T('attr_gk_attenzione') },
    { id: 'gk_lettura_tattica', lab: T('attr_gk_lettura_tattica') }, { id: 'gk_agonismo', lab: T('attr_gk_agonismo') },
    { id: 'gk_guida_difesa', lab: T('attr_gk_guida_difesa') }, { id: 'gk_leadership', lab: T('attr_gk_leadership') },
  ];
  function attrsForScheda(bagT, bagF) {
    const isGk = (bagT && Object.keys(bagT).some(k => k.startsWith('gk_')))
              || (bagF && Object.keys(bagF).some(k => k.startsWith('gk_')));
    return isGk ? { tec: ATTRS_TEC_GK, fm: ATTRS_FM_GK } : { tec: ATTRS_TEC, fm: ATTRS_FM };
  }
  function mediaGruppo(bag, attrs) {
    if (!bag || !attrs.length) return 0;
    return attrs.reduce((s, a) => s + (Number(bag[a.id]) || 0), 0) / attrs.length;
  }
  // riconosce "portiere" (e sinonimi) scritto nel ruolo, per adattare da sola gli attributi
  function isGoalkeeperRole(v) {
    return /\b(portier\w*|goalkeeper|goal-keeper|estremo difensore|keeper|gk|por)\b/i.test(v || '');
  }

  // ---- helpers --------------------------------------------------------------
  const HTML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { if (s == null) return ''; return String(s).replace(/[&<>"']/g, c => HTML_ESC[c]); }
  function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  function attrColor(v) { return v >= 8 ? '#16a34a' : v >= 6 ? '#d97706' : '#dc2626'; }   // PDF (sfondo bianco)
  function attrColorApp(v) { return v >= 8 ? 'var(--green)' : v >= 6 ? 'var(--warn)' : 'var(--red)'; } // app, segue il tema
  function hexToRgba(hex, a) {
    const h = hex.replace('#', '');
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
  }

  // ---- store (localStorage) -------------------------------------------------
  const KEY = 'scout_reports';
  // avvisa l'app principale (tabella/dashboard) che i report sono cambiati,
  // così il chip "Dataset" può aggiornarsi da solo senza bisogno di ricaricare
  function notifyChange() { try { window.dispatchEvent(new CustomEvent('scoutReportsChanged')); } catch (e) {} }

  const Store = {
    all() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } },
    save(rep) {
      const list = Store.all();
      if (rep.id) { const i = list.findIndex(r => r.id === rep.id); if (i >= 0) list[i] = rep; else list.push(rep); }
      else { rep.id = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); list.push(rep); }
      localStorage.setItem(KEY, JSON.stringify(list));
      notifyChange();
      return rep;
    },
    remove(id) { localStorage.setItem(KEY, JSON.stringify(Store.all().filter(r => r.id !== id))); notifyChange(); },
    sessionsOf(rep) {
      const k = `${rep.nome} ${rep.cognome}`.trim().toLowerCase();
      return Store.all().filter(r => `${r.nome} ${r.cognome}`.trim().toLowerCase() === k);
    },
  };

  // ==========================================================================
  //  RENDERER PDF  (portato 1:1 da SportHub scoutingReportRenderer.ts)
  // ==========================================================================
  function radarSVG(vals, labels, color) {
    color = color || '#2f6fed';
    const cx = 130, cy = 130, r = 88, N = vals.length;
    if (!N) return '';
    const pts = sc => vals.map((v, i) => {
      const ang = (Math.PI * 2 * i) / N - Math.PI / 2, p = (v / 10) * r * sc;
      return [cx + p * Math.cos(ang), cy + p * Math.sin(ang)];
    });
    // anelli di griglia ed etichette su raggi fissi (indipendenti dai valori), solo il poligono dati segue i voti
    const ring = sc => vals.map((_, i) => {
      const ang = (Math.PI * 2 * i) / N - Math.PI / 2;
      return [cx + r * sc * Math.cos(ang), cy + r * sc * Math.sin(ang)];
    });
    const grid = [0.25, 0.5, 0.75, 1].map(sc =>
      `<polygon points="${ring(sc).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" fill="none" stroke="#e5e9f0" stroke-width="1"/>`).join('');
    const spokes = ring(1).map(([x, y]) => `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e5e9f0" stroke-width="1"/>`).join('');
    const vp = pts(1);
    const poly = `<polygon points="${vp.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" fill="${hexToRgba(color, .15)}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
    const dots = vp.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${color}"/>`).join('');
    const off = N > 10 ? 1.22 : 1.28, fs = N > 10 ? 7 : 8;
    const labs = ring(off).map(([x, y], i) => {
      const parts = (labels[i] || '').split(' ');
      if (parts.length > 1)
        return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="${fs}" fill="#6b7280"><tspan x="${x.toFixed(1)}" dy="-5">${esc(parts[0])}</tspan><tspan x="${x.toFixed(1)}" dy="10">${esc(parts.slice(1).join(' '))}</tspan></text>`;
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-family="JetBrains Mono,monospace" font-size="${fs}" fill="#6b7280">${esc(labels[i] || '')}</text>`;
    }).join('');
    return `<svg viewBox="0 0 260 260" width="220" height="220" style="display:block;margin:0 auto">${grid}${spokes}${poly}${dots}${labs}</svg>`;
  }
  // radar per la vista in-app: colori presi dalle variabili CSS del tema (scuro o chiaro),
  // così si adatta da solo al cambio tema. radarSVG (sopra) resta per il PDF bianco.
  // color: nome di una variabile CSS, es. 'var(--blue)'
  function radarSVGApp(vals, labels, color) {
    color = color || 'var(--blue)';
    const cx = 105, cy = 105, r = 74, N = vals.length;
    if (!N) return '';
    const pts = sc => vals.map((v, i) => {
      const ang = (Math.PI * 2 * i) / N - Math.PI / 2, p = (v / 10) * r * sc;
      return [cx + p * Math.cos(ang), cy + p * Math.sin(ang)];
    });
    // anelli di griglia ed etichette su raggi fissi (indipendenti dai valori), solo il poligono dati segue i voti
    const ring = sc => vals.map((_, i) => {
      const ang = (Math.PI * 2 * i) / N - Math.PI / 2;
      return [cx + r * sc * Math.cos(ang), cy + r * sc * Math.sin(ang)];
    });
    const grid = [0.25, 0.5, 0.75, 1].map(sc =>
      `<polygon points="${ring(sc).map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" fill="none" style="stroke:var(--chart-grid)" stroke-width="1"/>`).join('');
    const spokes = ring(1).map(([x, y]) => `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" style="stroke:var(--chart-grid)" stroke-width="1"/>`).join('');
    const vp = pts(1);
    const poly = `<polygon points="${vp.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" style="fill:${color};stroke:${color}" fill-opacity="0.22" stroke-width="2" stroke-linejoin="round"/>`;
    const dots = vp.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" style="fill:${color}"/>`).join('');
    const off = N > 10 ? 1.26 : 1.34, fs = N > 10 ? 8.5 : 9.5;
    const labs = ring(off).map(([x, y], i) => {
      const parts = (labels[i] || '').split(' ');
      if (parts.length > 1)
        return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-size="${fs}" style="fill:var(--nm-text2)"><tspan x="${x.toFixed(1)}" dy="-4">${esc(parts[0])}</tspan><tspan x="${x.toFixed(1)}" dy="11">${esc(parts.slice(1).join(' '))}</tspan></text>`;
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="${fs}" style="fill:var(--nm-text2)">${esc(labels[i] || '')}</text>`;
    }).join('');
    return `<svg viewBox="-12 -6 234 222" width="100%" height="240" style="display:block;margin:0 auto;overflow:visible">${grid}${spokes}${poly}${dots}${labs}</svg>`;
  }

  function pageHead(sub) { return `<div class="pg-head"><div class="brand"><span class="dot"></span><span>SPORTHUB · Scouting</span></div><div>${esc(sub)}</div></div>`; }
  function pageFoot(sub, n, t) { return `<div class="pg-foot"><span>${esc(sub)}</span><span>pag <b>${String(n).padStart(2,'0')}</b> / ${String(t).padStart(2,'0')}</span></div>`; }

  function renderSessionCard(s, idx, recent) {
    const cl = CONSI_LABELS[s.considerazione] ?? '—', cc = CONSI_CLASS[s.considerazione] ?? '';
    const a = attrsForScheda(s.attr_tecnici, s.attr_fisico_mentale), TEC = a.tec, FM = a.fm;
    const mT = mediaGruppo(s.attr_tecnici, TEC), mF = mediaGruppo(s.attr_fisico_mentale, FM), mG = ((mT + mF) / 2).toFixed(1);
    const row = (bag) => (a2) => { const v = Number(bag?.[a2.id]) || 0, c = attrColor(v);
      return `<div class="skill-row"><div class="lab">${esc(a2.lab)}</div><div class="track"><i style="width:${v*10}%;background:${c}"></i></div><div class="val" style="color:${c}">${v}/10</div></div>`; };
    const rT = row(s.attr_tecnici), rF = row(s.attr_fisico_mentale);
    return `<div class="panel" style="margin-bottom:14px${idx>0?';opacity:.9':''}">
      <div class="ptitle"><span>Sessione ${recent?'· più recente':`· ${idx+1}ª`}${s.scout_cognome?' · '+esc(s.scout_cognome):''}</span>
        <span class="acc">${esc(fmtDate(s.data_osservazione))}${s.stagione?' · '+esc(s.stagione):''}${s.evento?' · '+esc(s.evento):''}</span></div>
      <div style="display:flex;gap:12px;margin-bottom:10px;padding:8px 10px;background:var(--tint);border-radius:8px">
        <div style="flex:1"><div style="font:600 9px/1 'JetBrains Mono',monospace;color:var(--muted);letter-spacing:.1em">MEDIA TECNICA</div><div style="font:700 22px/1.1 'Space Grotesk',sans-serif;color:${attrColor(mT)}">${mT.toFixed(1)}<span style="font-size:11px;color:#6b7280">/10</span></div></div>
        <div style="flex:1"><div style="font:600 9px/1 'JetBrains Mono',monospace;color:var(--muted);letter-spacing:.1em">MEDIA FISICO/MENTALE</div><div style="font:700 22px/1.1 'Space Grotesk',sans-serif;color:${attrColor(mF)}">${mF.toFixed(1)}<span style="font-size:11px;color:#6b7280">/10</span></div></div>
        <div style="flex:1"><div style="font:600 9px/1 'JetBrains Mono',monospace;color:var(--muted);letter-spacing:.1em">MEDIA GLOBALE</div><div style="font:700 22px/1.1 'Space Grotesk',sans-serif;color:#0f1320">${mG}<span style="font-size:11px;color:#6b7280">/10</span></div></div>
        <div style="flex:2"><div class="banner ${cc}" style="margin:0"><b>${esc(cl)}</b></div></div>
      </div>
      <div style="font:600 10px/1 'JetBrains Mono',monospace;color:#2f6fed;letter-spacing:.14em;text-transform:uppercase;margin:8px 0 6px">Attributi tecnici</div>
      <div class="grid-2" style="margin-bottom:10px"><div>${TEC.slice(0,Math.ceil(TEC.length/2)).map(rT).join('')}</div><div>${TEC.slice(Math.ceil(TEC.length/2)).map(rT).join('')}</div></div>
      <div style="font:600 10px/1 'JetBrains Mono',monospace;color:#16a34a;letter-spacing:.14em;text-transform:uppercase;margin:8px 0 6px">Fisico / Mentale</div>
      <div class="grid-2" style="margin-bottom:8px"><div>${FM.slice(0,Math.ceil(FM.length/2)).map(rF).join('')}</div><div>${FM.slice(Math.ceil(FM.length/2)).map(rF).join('')}</div></div>
      ${s.partita?`<div style="padding:6px 10px;background:var(--tint);border-radius:6px;font-size:11px;color:var(--ink-2);margin-top:8px"><span style="font:600 9px/1 'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Partita · </span>${esc(s.partita)}${s.livello_avversario?`<span style="margin-left:8px;opacity:.7">· Avversario: ${esc(s.livello_avversario)}</span>`:''}</div>`:''}
      ${(s.voto_numerico!=null||s.note_scout)?`<div style="margin-top:8px;padding:8px 10px;background:var(--tint);border-radius:6px;display:flex;gap:12px;align-items:flex-start">
        ${s.voto_numerico!=null?`<div style="flex-shrink:0;text-align:center;padding-right:10px;border-right:1px solid var(--border)"><div style="font:600 9px/1 'JetBrains Mono',monospace;color:var(--muted);letter-spacing:.14em">VOTO</div><div style="font:700 22px/1.2 'Space Grotesk',sans-serif;color:${attrColor(Number(s.voto_numerico)||0)}">${s.voto_numerico}<span style="font-size:10px;color:#6b7280">/10</span></div></div>`:''}
        ${s.note_scout?`<div style="flex:1;font-size:11px;color:var(--ink-2);line-height:1.55;font-style:italic;white-space:pre-wrap">${esc(s.note_scout)}</div>`:''}
      </div>`:''}
    </div>`;
  }

  function buildScoutingReportHTML(current, allSessions) {
    const sessions = [...allSessions].sort((a, b) =>
      new Date(b.data_osservazione || b.created_at || '').getTime() - new Date(a.data_osservazione || a.created_at || '').getTime());
    const latest = sessions[0] ?? current;
    const fullName = `${esc(latest.nome || '')} ${esc(latest.cognome || '')}`.trim() || '—';
    const sub = fullName, today = new Date().toLocaleDateString('it-IT');
    const cl = CONSI_LABELS[latest.considerazione] ?? '—', cc = CONSI_CLASS[latest.considerazione] ?? '';
    const a2 = attrsForScheda(latest.attr_tecnici, latest.attr_fisico_mentale), A_TEC = a2.tec, A_FM = a2.fm;
    const mT = mediaGruppo(latest.attr_tecnici, A_TEC), mF = mediaGruppo(latest.attr_fisico_mentale, A_FM), mG = ((mT + mF) / 2).toFixed(1);
    const historyPages = Math.max(0, Math.ceil(Math.max(0, sessions.length - 1) / 2));
    const totalPages = 2 + historyPages;
    const bR = (bag) => (a) => { const v = Number(bag?.[a.id]) || 0, c = attrColor(v);
      return `<div class="skill-row"><div class="lab">${esc(a.lab)}</div><div class="track"><i style="width:${v*10}%;background:${c}"></i></div><div class="val" style="color:${c}">${v}/10</div></div>`; };
    const barRowT = bR(latest.attr_tecnici), barRowF = bR(latest.attr_fisico_mentale);
    const pages = [];

    pages.push(`<section class="page">${pageHead(sub)}
      <div class="ath-head"><div class="ath-avatar" style="font-size:20px">${(latest.nome||'?')[0]}${(latest.cognome||'?')[0]}</div>
        <div><div class="ath-name">${fullName}</div><div class="ath-role">${esc(latest.ruolo_primario||'—')}${latest.ruolo_secondario?` · ${esc(latest.ruolo_secondario)}`:''}</div></div>
        <div class="ath-side"><div class="stat"><div class="k">Media globale</div><div class="v" style="font-size:24px">${mG}/10</div></div><div class="stat"><div class="k">Sessioni</div><div class="v">${sessions.length}</div></div></div></div>
      <div class="grid-2" style="margin-top:14px">
        <div class="panel"><div class="ptitle"><span>Anagrafica</span><span class="acc">profilo</span></div><div class="note-list single">
          <div class="ln"><span>Data di nascita</span><b>${fmtDate(latest.data_nascita)}</b></div>
          <div class="ln"><span>Nazionalità</span><b>${esc(latest.nazionalita||'—')}</b></div>
          <div class="ln"><span>Altezza</span><b>${latest.altezza?latest.altezza+' cm':'—'}</b></div>
          <div class="ln"><span>Peso</span><b>${latest.peso?latest.peso+' kg':'—'}</b></div>
          <div class="ln"><span>Piede</span><b>${esc(latest.piede||'—')}</b></div>
          <div class="ln"><span>Squadra</span><b>${esc(latest.squadra||'—')}</b></div>
          <div class="ln"><span>Categoria</span><b>${esc(latest.categoria||'—')}</b></div>
          <div class="ln"><span>Agente</span><b>${esc(latest.agente||'—')}</b></div>
          <div class="ln"><span>Contratto</span><b>${esc(latest.contratto||'—')}</b></div>
          <div class="ln" style="border-bottom:none"><span>Valore stimato</span><b>${latest.valore_stimato?'€ '+esc(latest.valore_stimato):'—'}</b></div></div></div>
        <div class="panel"><div class="ptitle"><span>Ultima sessione</span><span class="acc">${fmtDate(latest.data_osservazione)}</span></div><div class="note-list single">
          <div class="ln"><span>Scout redattore</span><b style="color:#0a2540">${latest.scout_cognome?esc(latest.scout_cognome):'—'}</b></div>
          <div class="ln"><span>Stagione</span><b>${esc(latest.stagione||'—')}</b></div>
          <div class="ln"><span>Evento</span><b>${esc(latest.evento||'—')}</b></div>
          <div class="ln"><span>Partita</span><b>${esc(latest.partita||'—')}</b></div>
          <div class="ln" style="border-bottom:none"><span>Livello avversario</span><b>${esc(latest.livello_avversario||'—')}</b></div></div>
          <div style="margin-top:10px"><div class="banner ${cc}"><b>Giudizio · ${esc(cl)}</b></div></div>
          <div style="margin-top:12px;display:flex;gap:12px;padding:10px;background:var(--tint);border-radius:8px">
            <div style="flex:1;text-align:center"><div style="font:600 9px/1 'JetBrains Mono',monospace;color:var(--muted);letter-spacing:.1em">MEDIA TEC.</div><div style="font:700 22px/1.2 'Space Grotesk',sans-serif;color:${attrColor(mT)}">${mT.toFixed(1)}</div></div>
            <div style="flex:1;text-align:center"><div style="font:600 9px/1 'JetBrains Mono',monospace;color:var(--muted);letter-spacing:.1em">MEDIA F/M</div><div style="font:700 22px/1.2 'Space Grotesk',sans-serif;color:${attrColor(mF)}">${mF.toFixed(1)}</div></div>
            <div style="flex:1;text-align:center"><div style="font:600 9px/1 'JetBrains Mono',monospace;color:var(--muted);letter-spacing:.1em">GLOBALE</div><div style="font:700 22px/1.2 'Space Grotesk',sans-serif;color:#0f1320">${mG}</div></div></div></div></div>
      <div class="section-title" style="margin-top:14px"><span class="num">01</span>Attributi tecnici<span class="rule"></span><span class="chip muted">media ${mT.toFixed(1)}/10</span></div>
      <div class="grid-2" style="margin-top:6px">
        <div class="panel"><div class="ptitle"><span>Radar tecnico</span><span class="acc">${A_TEC.length} voci</span></div>${radarSVG(A_TEC.map(a=>Number(latest.attr_tecnici?.[a.id])||0),A_TEC.map(a=>a.lab),'#2f6fed')}</div>
        <div class="panel"><div class="ptitle"><span>Dettaglio tecnico</span><span class="acc">1–10</span></div>${A_TEC.map(barRowT).join('')}</div></div>
      <div style="margin-top:8px;padding:6px 10px;background:var(--tint);border-radius:6px;font-size:10.5px;color:var(--muted)">Report generato il ${esc(today)} · ${sessions.length} sessione${sessions.length>1?'i':''} di valutazione</div>
      ${pageFoot(sub, 1, totalPages)}</section>`);

    pages.push(`<section class="page">${pageHead(sub + ' · fisico/mentale')}
      <div class="section-title"><span class="num">02</span>Attributi fisico/mentali<span class="rule"></span><span class="chip muted">media ${mF.toFixed(1)}/10 · ${A_FM.length} voci</span></div>
      <div class="grid-2" style="margin-top:6px">
        <div class="panel"><div class="ptitle"><span>Radar fisico/mentale</span><span class="acc">${A_FM.length} voci</span></div>${radarSVG(A_FM.map(a=>Number(latest.attr_fisico_mentale?.[a.id])||0),A_FM.map(a=>a.lab),'#16a34a')}</div>
        <div class="panel"><div class="ptitle"><span>Dettaglio fisico/mentale (1)</span><span class="acc">1–10</span></div>${A_FM.slice(0,Math.ceil(A_FM.length/2)).map(barRowF).join('')}</div></div>
      <div class="panel" style="margin-top:12px"><div class="ptitle"><span>Dettaglio fisico/mentale (2)</span><span class="acc">1–10</span></div>
        <div class="grid-2"><div>${A_FM.slice(Math.ceil(A_FM.length/2),Math.ceil(A_FM.length*0.75)).map(barRowF).join('')}</div><div>${A_FM.slice(Math.ceil(A_FM.length*0.75)).map(barRowF).join('')}</div></div></div>
      <div class="grid-2" style="margin-top:12px">
        <div class="panel" style="display:flex;flex-direction:column;justify-content:center"><div class="ptitle" style="border:none;padding-bottom:0"><span>Voto scout</span><span class="acc">valutazione complessiva</span></div>
          <div style="text-align:center;padding:8px 0"><div style="font:700 48px/1 'Space Grotesk',sans-serif;color:${attrColor(Number(latest.voto_numerico)||0)}">${latest.voto_numerico??'—'}<span style="font-size:18px;color:#6b7280">/10</span></div><div style="font:600 10px/1 'JetBrains Mono',monospace;color:var(--muted);letter-spacing:.14em;margin-top:6px">GIUDIZIO DELLO SCOUT</div></div></div>
        <div class="panel"><div class="ptitle"><span>Note dello scout</span><span class="acc">considerazioni</span></div>
          ${latest.note_scout?`<div style="padding:8px 12px;background:var(--tint);border-radius:6px;font-size:11px;color:var(--ink-2);line-height:1.65;border-left:3px solid var(--azzurro);white-space:pre-wrap">${esc(latest.note_scout)}</div>`:`<div style="padding:14px;text-align:center;font-size:11px;color:var(--muted);font-style:italic">Nessuna nota inserita</div>`}</div></div>
      ${pageFoot(sub + ' · fisico/mentale', 2, totalPages)}</section>`);

    const hist = sessions.slice(1);
    for (let i = 0; i < hist.length; i += 2) {
      const pageN = 3 + Math.floor(i / 2), chunk = hist.slice(i, i + 2), label = `${sub} · storico sessioni`;
      pages.push(`<section class="page">${pageHead(label)}
        <div class="section-title"><span class="num">${String(pageN).padStart(2,'0')}</span>Storico sessioni di valutazione<span class="rule"></span><span class="chip muted">${sessions.length} totali</span></div>
        ${chunk.map((s, ci) => renderSessionCard(s, i + ci + 1, false)).join('')}${pageFoot(label, pageN, totalPages)}</section>`);
    }
    return `<!doctype html><html lang="it"><head>${buildReportHead('SPORTHUB · Scouting ' + fullName)}</head><body><div class="deck">${pages.join('\n')}</div></body></html>`;
  }

  // stampa senza uscire dall'app: iframe nascosto + print nativo
  function printHTML(html) {
    const ifr = document.createElement('iframe');
    ifr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(ifr);
    const d = ifr.contentWindow.document;
    d.open(); d.write(html); d.close();
    const go = () => { try { ifr.contentWindow.focus(); ifr.contentWindow.print(); } catch (e) {} setTimeout(() => ifr.remove(), 1500); };
    setTimeout(go, 600); // lascia caricare i font
  }

  // ==========================================================================
  //  UI  — form di valutazione + lista report
  // ==========================================================================
  function ensureOverlay() {
    let ov = document.getElementById('srOverlay');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'srOverlay';
    ov.className = 'sr-overlay';
    ov.innerHTML = `<div class="sr-box"><button class="sr-x" id="srX">${T('btn_close')}</button><div id="srBody"></div></div>`;
    document.body.appendChild(ov);
    injectCSS();
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    document.getElementById('srX').addEventListener('click', close);
    return ov;
  }
  function open() { ensureOverlay().classList.add('open'); document.body.style.overflow = 'hidden'; }
  function close() { const o = document.getElementById('srOverlay'); if (o) o.classList.remove('open'); document.body.style.overflow = ''; }

  const RUOLI_MAP = { GK: T('role_GK'), DF: T('role_DF'), MF: T('role_MF'), FW: T('role_FW') };

  // prefill da un giocatore del database (schema giocatori.json)
  function fromPlayer(g) {
    const parts = (g.nome || '').trim().split(/\s+/);
    const cognome = parts.length > 1 ? parts.slice(1).join(' ') : (parts[0] || '');
    const nome = parts.length > 1 ? parts[0] : '';
    return {
      nome, cognome,
      data_nascita: g.data_nascita || '',
      nazionalita: g.nazionalita || '',
      altezza: g.altezza || '', peso: '', piede: g.piede || '',
      ruolo_primario: g.ruolo_dettaglio || RUOLI_MAP[g.ruolo] || '',
      ruolo_secondario: '',
      squadra: g.squadra || '', categoria: g.campionato || '', agente: '', contratto: g.scadenza || '',
      valore_stimato: g.valore_eur ? (g.valore_eur / 1e6).toFixed(1) + 'M' : '',
      data_osservazione: new Date().toISOString().slice(0, 10),
      stagione: '', evento: '', partita: '', livello_avversario: '',
      attr_tecnici: {}, attr_fisico_mentale: {},
      considerazione: 1, voto_numerico: null, note_scout: '', scout_cognome: '',
      _isGk: g.ruolo === 'GK',
    };
  }

  // report "gemello" di uno esistente: stessa anagrafica, sessione nuova e vuota
  function fromReport(s) {
    return {
      nome: s.nome || '', cognome: s.cognome || '', data_nascita: s.data_nascita || '', nazionalita: s.nazionalita || '',
      altezza: s.altezza || '', peso: s.peso || '', piede: s.piede || '',
      ruolo_primario: s.ruolo_primario || '', ruolo_secondario: s.ruolo_secondario || '',
      squadra: s.squadra || '', categoria: s.categoria || '', agente: s.agente || '', contratto: s.contratto || '',
      valore_stimato: s.valore_stimato || '',
      data_osservazione: new Date().toISOString().slice(0, 10),
      stagione: s.stagione || '', evento: '', partita: '', livello_avversario: '',
      attr_tecnici: {}, attr_fisico_mentale: {},
      considerazione: 1, voto_numerico: null, note_scout: '', scout_cognome: s.scout_cognome || '',
      _isGk: Object.keys(s.attr_tecnici || {}).some(k => k.startsWith('gk_')),
    };
  }

  function openForm(prefill) {
    open();
    const rep = prefill && prefill.attr_tecnici ? prefill : (prefill ? fromPlayer(prefill) : blank());
    renderForm(rep);
  }
  function blank() {
    return { nome: '', cognome: '', data_nascita: '', nazionalita: '', altezza: '', peso: '', piede: '',
      ruolo_primario: '', ruolo_secondario: '', squadra: '', categoria: '', agente: '', contratto: '', valore_stimato: '',
      data_osservazione: new Date().toISOString().slice(0, 10), stagione: '', evento: '', partita: '', livello_avversario: '',
      attr_tecnici: {}, attr_fisico_mentale: {}, considerazione: 1, voto_numerico: null, note_scout: '', scout_cognome: '', _isGk: false };
  }

  function renderForm(rep) {
    const isGk = rep._isGk ?? Object.keys(rep.attr_tecnici || {}).some(k => k.startsWith('gk_'));
    const TEC = isGk ? ATTRS_TEC_GK : ATTRS_TEC, FM = isGk ? ATTRS_FM_GK : ATTRS_FM;
    const txt = (id, lab, val, ph) => `<label class="sr-f"><span>${lab}</span><input id="sr_${id}" value="${esc(val ?? '')}" placeholder="${ph || ''}"></label>`;
    const dateField = (id, lab, iso) => {
      const parts = (iso || '').split('-'); // AAAA-MM-GG
      const y = parts[0] || '', m = parts[1] || '', d = parts[2] || '';
      return `<label class="sr-f"><span>${lab}</span>
        <div class="sr-date">
          <input id="sr_${id}_d" class="sr-date-d" inputmode="numeric" maxlength="2" placeholder="GG" value="${esc(d)}">
          <span>/</span>
          <input id="sr_${id}_m" class="sr-date-m" inputmode="numeric" maxlength="2" placeholder="MM" value="${esc(m)}">
          <span>/</span>
          <input id="sr_${id}_y" class="sr-date-y" inputmode="numeric" maxlength="4" placeholder="AAAA" value="${esc(y)}">
        </div>
      </label>`;
    };
    const slider = (bag, a) => { const v = Number(rep[bag]?.[a.id]) || 6;
      return `<label class="sr-sl"><span>${esc(a.lab)}</span><input type="range" min="1" max="10" value="${v}" data-bag="${bag}" data-id="${a.id}"><b data-out="${bag}_${a.id}">${v}</b></label>`; };
    const consiBtns = CONSI_LABELS.map((l, i) =>
      `<button type="button" class="sr-consi ${rep.considerazione===i?'on':''}" data-consi="${i}">${l}</button>`).join('');

    document.getElementById('srBody').innerHTML = `
      <h2 class="sr-h">${rep.id ? T('sr_title_edit') : T('sr_title_new')}</h2>
      ${isGk ? `<div class="sr-gk-badge">${T('sr_gk_badge')}</div>` : ''}

      <div class="sr-sec">${T('sr_sec_anagrafica')}</div>
      <div class="sr-grid">
        ${txt('nome',T('label_nome'),rep.nome)} ${txt('cognome',T('label_cognome'),rep.cognome)}
        ${dateField('data_nascita',T('label_data_nascita'),rep.data_nascita)} ${txt('nazionalita',T('label_nazionalita'),rep.nazionalita)}
        ${txt('altezza',T('label_altezza'),rep.altezza)} ${txt('peso',T('label_peso'),rep.peso)}
        ${txt('piede',T('label_piede'),rep.piede)} ${txt('ruolo_primario',T('label_ruolo_primario'),rep.ruolo_primario)}
        ${txt('ruolo_secondario',T('label_ruolo_secondario'),rep.ruolo_secondario)} ${txt('squadra',T('label_squadra'),rep.squadra)}
        ${txt('categoria',T('label_categoria'),rep.categoria)} ${txt('agente',T('label_agente'),rep.agente)}
        ${txt('contratto',T('label_contratto'),rep.contratto)} ${txt('valore_stimato',T('label_valore_stimato'),rep.valore_stimato,T('ph_valore_stimato'))}
      </div>

      <div class="sr-sec">${T('sr_sec_sessione')}</div>
      <div class="sr-grid">
        ${dateField('data_osservazione',T('label_data_osservazione'),rep.data_osservazione)} ${txt('stagione',T('label_stagione'),rep.stagione,T('ph_stagione'))}
        ${txt('evento',T('label_evento'),rep.evento)} ${txt('partita',T('label_partita'),rep.partita,T('ph_partita'))}
        ${txt('livello_avversario',T('label_livello_avversario'),rep.livello_avversario)} ${txt('scout_cognome',T('label_scout_cognome'),rep.scout_cognome)}
      </div>

      <div class="sr-sec">${T('sr_sec_tecnici')} <small>1–10</small></div>
      <div class="sr-grid2">${TEC.map(a => slider('attr_tecnici', a)).join('')}</div>

      <div class="sr-sec">${T('sr_sec_fm')} <small>1–10</small></div>
      <div class="sr-grid2">${FM.map(a => slider('attr_fisico_mentale', a)).join('')}</div>

      <div class="sr-sec">${T('sr_sec_giudizio')}</div>
      <div class="sr-consi-row">${consiBtns}</div>
      <div class="sr-grid">
        <label class="sr-f"><span>${T('label_voto')}</span><input id="sr_voto" type="number" min="1" max="10" value="${rep.voto_numerico ?? ''}"></label>
      </div>
      <label class="sr-f full"><span>${T('label_note')}</span><textarea id="sr_note" rows="3">${esc(rep.note_scout || '')}</textarea></label>

      <div class="sr-actions">
        <button id="srCancel">${T('btn_annulla')}</button>
        <span style="flex:1"></span>
        <button id="srPreview">${T('btn_preview')}</button>
        <button class="sr-primary" id="srSave">${T('btn_save')}</button>
      </div>`;

    const body = document.getElementById('srBody');
    // slider live + prime i valori nel modello
    body.querySelectorAll('input[type=range]').forEach(inp => {
      const bag = inp.dataset.bag, id = inp.dataset.id;
      rep[bag] = rep[bag] || {};
      if (rep[bag][id] == null) rep[bag][id] = Number(inp.value);
      // --p = percentuale riempita della barra (1 → 0%, 10 → 100%), usata dal CSS per colorare la parte "piena"
      const fill = () => inp.style.setProperty('--p', ((inp.value - 1) / 9 * 100) + '%');
      fill();
      inp.addEventListener('input', () => {
        rep[bag][id] = Number(inp.value);
        body.querySelector(`[data-out="${bag}_${id}"]`).textContent = inp.value;
        fill();
      });
    });
    // campi data GG/MM/AAAA con avanzamento automatico
    wireDateInputs('data_nascita');
    wireDateInputs('data_osservazione');
    // considerazione
    body.querySelectorAll('.sr-consi').forEach(btn => btn.addEventListener('click', () => {
      rep.considerazione = Number(btn.dataset.consi);
      body.querySelectorAll('.sr-consi').forEach(b => b.classList.toggle('on', b === btn));
    }));
    // rileva "portiere" nel ruolo primario e adatta da sola gli attributi
    body.querySelector('#sr_ruolo_primario').addEventListener('blur', e => {
      const wantsGk = isGoalkeeperRole(e.target.value);
      if (wantsGk === isGk) return; // nessun cambio, non serve ridisegnare
      collect(rep); rep._isGk = wantsGk;
      rep.attr_tecnici = {}; rep.attr_fisico_mentale = {}; // set attributi diverso
      renderForm(rep);
    });
    body.querySelector('#srCancel').addEventListener('click', close);
    body.querySelector('#srSave').addEventListener('click', () => {
      collect(rep);
      if (!rep.nome && !rep.cognome) { alert(T('alert_nome_required')); return; }
      if (!rep.created_at) rep.created_at = new Date().toISOString();
      Store.save(rep);
      alert(T('alert_saved'));
      openList();
    });
    body.querySelector('#srPreview').addEventListener('click', () => {
      collect(rep);
      printHTML(buildScoutingReportHTML(rep, rep.id ? Store.sessionsOf(rep) : [rep]));
    });
  }

  // campi data a 3 caselle GG/MM/AAAA: digitando 2 cifre (o 4 per l'anno) passa al campo successivo
  function wireDateInputs(id) {
    const d = document.getElementById('sr_' + id + '_d');
    const m = document.getElementById('sr_' + id + '_m');
    const y = document.getElementById('sr_' + id + '_y');
    if (!d || !m || !y) return;
    const onlyDigits = inp => { inp.value = inp.value.replace(/\D/g, ''); };
    d.addEventListener('input', () => { onlyDigits(d); if (d.value.length >= 2) m.focus(); });
    m.addEventListener('input', () => { onlyDigits(m); if (m.value.length >= 2) y.focus(); });
    y.addEventListener('input', () => onlyDigits(y));
    // backspace su campo vuoto -> torna al campo precedente
    m.addEventListener('keydown', e => { if (e.key === 'Backspace' && !m.value) d.focus(); });
    y.addEventListener('keydown', e => { if (e.key === 'Backspace' && !y.value) m.focus(); });
  }
  function dateFromParts(id) {
    const d = (document.getElementById('sr_' + id + '_d')?.value || '').trim();
    const m = (document.getElementById('sr_' + id + '_m')?.value || '').trim();
    const y = (document.getElementById('sr_' + id + '_y')?.value || '').trim();
    if (!d || !m || !y) return '';
    return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  function collect(rep) {
    const g = id => { const el = document.getElementById('sr_' + id); return el ? el.value.trim() : rep[id]; };
    ['nome','cognome','nazionalita','altezza','peso','piede','ruolo_primario','ruolo_secondario',
     'squadra','categoria','agente','contratto','valore_stimato','stagione','evento',
     'partita','livello_avversario','scout_cognome'].forEach(k => rep[k] = g(k));
    rep.data_nascita = dateFromParts('data_nascita');
    rep.data_osservazione = dateFromParts('data_osservazione');
    const voto = document.getElementById('sr_voto');
    rep.voto_numerico = voto && voto.value !== '' ? Number(voto.value) : null;
    const note = document.getElementById('sr_note');
    rep.note_scout = note ? note.value : rep.note_scout;
  }

  function openList() {
    open();
    const list = Store.all().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    const rows = list.length ? list.map(r => {
      const a = attrsForScheda(r.attr_tecnici, r.attr_fisico_mentale);
      const mG = ((mediaGruppo(r.attr_tecnici, a.tec) + mediaGruppo(r.attr_fisico_mentale, a.fm)) / 2).toFixed(1);
      const cc = CONSI_CLASS[r.considerazione] || '';
      return `<div class="sr-item" data-open="${r.id}">
        <div class="sr-item-main">
          <div class="sr-item-name">${esc(r.nome)} ${esc(r.cognome)} <span class="sr-tag ${cc}">${CONSI_LABELS[r.considerazione]||'—'}</span></div>
          <div class="sr-item-sub">${esc(r.ruolo_primario||'—')} · ${esc(r.squadra||'—')} · ${fmtDate(r.data_osservazione)} · ${T('item_media')} ${mG}/10${r.scout_cognome?' · '+esc(r.scout_cognome):''}</div>
        </div>
        <div class="sr-item-btns">
          <button data-pdf="${r.id}">${T('btn_pdf')}</button>
          <button data-edit="${r.id}">${T('btn_edit')}</button>
          <button class="sr-del" data-del="${r.id}">${T('btn_delete')}</button>
        </div></div>`;
    }).join('') : `<div class="sr-empty">${T('list_empty')}</div>`;

    document.getElementById('srBody').innerHTML = `
      <h2 class="sr-h">${T('list_title')} <small>(${list.length})</small></h2>
      <div class="sr-list">${rows}</div>
      <div class="sr-actions"><button id="srCancel2">${T('btn_close')}</button><span style="flex:1"></span><button class="sr-primary" id="srNew">${T('btn_new_blank')}</button></div>`;

    const body = document.getElementById('srBody');
    body.querySelector('#srCancel2').addEventListener('click', close);
    body.querySelector('#srNew').addEventListener('click', () => openForm(null));
    body.querySelectorAll('[data-pdf]').forEach(b => b.addEventListener('click', () => {
      const r = Store.all().find(x => x.id === b.dataset.pdf);
      if (r) printHTML(buildScoutingReportHTML(r, Store.sessionsOf(r)));
    }));
    body.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
      const r = Store.all().find(x => x.id === b.dataset.edit);
      if (r) renderForm(JSON.parse(JSON.stringify(r)));
    }));
    body.querySelectorAll('.sr-item').forEach(item => item.addEventListener('click', e => {
      if (e.target.closest('.sr-item-btns')) return; // i pulsanti gestiscono da sé il proprio click
      openView(item.dataset.open);
    }));
    body.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      if (confirm(T('confirm_del_report'))) { Store.remove(b.dataset.del); openList(); }
    }));
  }

  // ---- vista di sola lettura di una scheda: dati + valutazioni + radar ------
  function openView(id) {
    const rep = Store.all().find(r => r.id === id);
    if (!rep) return;
    open();
    const sessions = Store.sessionsOf(rep).sort((a, b) =>
      new Date(b.data_osservazione || b.created_at || '').getTime() - new Date(a.data_osservazione || a.created_at || '').getTime());
    const idx = Math.max(0, sessions.findIndex(s => s.id === rep.id));
    renderView(sessions, idx);
  }

  function renderView(sessions, activeIdx) {
    const s = sessions[activeIdx];
    const a = attrsForScheda(s.attr_tecnici, s.attr_fisico_mentale), TEC = a.tec, FM = a.fm;
    const mT = mediaGruppo(s.attr_tecnici, TEC), mF = mediaGruppo(s.attr_fisico_mentale, FM), mG = ((mT + mF) / 2).toFixed(1);
    const cc = CONSI_CLASS[s.considerazione] || '', cl = CONSI_LABELS[s.considerazione] || '—';

    const meta = [s.ruolo_primario, s.ruolo_secondario, s.squadra, s.categoria, s.nazionalita,
        s.piede ? T('piede_di').replace('{p}', s.piede) : null, s.altezza ? s.altezza + ' cm' : null, s.peso ? s.peso + ' kg' : null]
      .filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('<span class="sr-sep">•</span>');

    const kpi = (v, l) => `<div class="sr-kpi"><div class="v">${v}</div><div class="l">${l}</div></div>`;
    const kpis = [
      kpi(mT.toFixed(1), T('kpi_media_tec')),
      kpi(mF.toFixed(1), T('kpi_media_fm')),
      kpi(mG, T('kpi_media_globale')),
      s.voto_numerico != null ? kpi(s.voto_numerico, T('kpi_voto')) : '',
      kpi(sessions.length, sessions.length === 1 ? T('kpi_sessione') : T('kpi_sessioni')),
    ].filter(Boolean).join('');

    const attrMini = bag => a2 => { const v = Number(bag?.[a2.id]) || 0, c = attrColorApp(v);
      return `<div class="sr-attr-mini"><span>${esc(a2.lab)}</span><b style="color:${c}">${v}</b></div>`; };

    const radarTec = radarSVGApp(TEC.map(a2 => Number(s.attr_tecnici?.[a2.id]) || 0), TEC.map(a2 => a2.lab), 'var(--blue)');
    const radarFm  = radarSVGApp(FM.map(a2 => Number(s.attr_fisico_mentale?.[a2.id]) || 0), FM.map(a2 => a2.lab), 'var(--green)');

    const hist = sessions.length > 1 ? `
      <div class="sr-hist">
        <h5>${T('hist_title')} <span class="sub">${T('hist_totali').replace('{n}', sessions.length)}</span></h5>
        <div class="sr-hist-list">
          ${sessions.map((sx, i) => `
            <div class="sr-hist-item ${i===activeIdx?'active':''}" data-idx="${i}">
              <span>${fmtDate(sx.data_osservazione)}${sx.evento?' · '+esc(sx.evento):''}</span>
              <span class="sr-tag ${CONSI_CLASS[sx.considerazione]||''}">${CONSI_LABELS[sx.considerazione]||'—'}</span>
            </div>`).join('')}
        </div>
      </div>` : '';

    document.getElementById('srBody').innerHTML = `
      <div class="sr-view">
        <div class="sr-view-top">
          <div class="sr-view-name">${esc(s.nome)} ${esc(s.cognome)}</div>
          <div class="sr-view-meta">${meta}</div>
        </div>
        <div class="sr-banner ${cc}"><b>${esc(cl)}</b>${s.scout_cognome?`<span class="sr-by">${T('view_by').replace('{n}', esc(s.scout_cognome))}</span>`:''}<span class="sr-by" style="margin-left:auto">${fmtDate(s.data_osservazione)}</span></div>
        <div class="sr-kpis">${kpis}</div>
        <div class="sr-radars">
          <div class="sr-radar-card">
            <h5>${T('sr_sec_tecnici')} <span class="sub" style="color:var(--blue)">${mT.toFixed(1)}/10</span></h5>
            ${radarTec}
            <div class="sr-attr-grid">${TEC.map(attrMini(s.attr_tecnici)).join('')}</div>
          </div>
          <div class="sr-radar-card">
            <h5>${T('radar_title_fm')} <span class="sub" style="color:var(--green)">${mF.toFixed(1)}/10</span></h5>
            ${radarFm}
            <div class="sr-attr-grid">${FM.map(attrMini(s.attr_fisico_mentale)).join('')}</div>
          </div>
        </div>
        ${s.partita?`<div class="sr-note-box"><b>${T('label_partita')}</b> · ${esc(s.partita)}${s.livello_avversario?` <span class="dim">${T('note_avversario').replace('{v}', esc(s.livello_avversario))}</span>`:''}</div>`:''}
        ${s.note_scout?`<div class="sr-note-box sr-note-italic">${esc(s.note_scout)}</div>`:''}
        ${hist}
      </div>
      <div class="sr-actions">
        <button id="srBack">${T('btn_back')}</button>
        <span style="flex:1"></span>
        <button id="srViewPdf">${T('btn_pdf')}</button>
        <button id="srViewEdit">${T('btn_edit')}</button>
        <button class="sr-primary" id="srViewNewEval">${T('btn_new_eval')}</button>
        <button class="sr-del" id="srViewDel">${T('btn_delete')}</button>
      </div>`;

    const body = document.getElementById('srBody');
    body.querySelectorAll('.sr-hist-item').forEach(el => el.addEventListener('click', () => renderView(sessions, Number(el.dataset.idx))));
    body.querySelector('#srBack').addEventListener('click', openList);
    body.querySelector('#srViewPdf').addEventListener('click', () => printHTML(buildScoutingReportHTML(s, sessions)));
    body.querySelector('#srViewEdit').addEventListener('click', () => renderForm(JSON.parse(JSON.stringify(s))));
    body.querySelector('#srViewNewEval').addEventListener('click', () => renderForm(fromReport(s)));
    body.querySelector('#srViewDel').addEventListener('click', () => {
      if (!confirm(T('confirm_del_session'))) return;
      Store.remove(s.id);
      const remaining = sessions.filter(x => x.id !== s.id);
      if (remaining.length) renderView(remaining, 0); else openList();
    });
  }

  // ---- CSS del form/lista (tema scuro, coerente con l'app) -------------------
  function injectCSS() {
    if (document.getElementById('srCSS')) return;
    const s = document.createElement('style');
    s.id = 'srCSS';
    s.textContent = `
      .sr-overlay{position:fixed;inset:0;background:var(--overlay,rgba(0,0,0,.6));z-index:300;display:none;justify-content:center;align-items:flex-start;padding:24px;overflow:auto}
      .sr-overlay.open{display:flex}
      .sr-box{background:var(--nm-bg,#242830);border-radius:22px;max-width:900px;width:100%;padding:26px 28px;position:relative;margin:auto;
        box-shadow:var(--elev,0 30px 70px -24px rgba(0,0,0,.7));border:1px solid var(--nm-border,transparent)}
      .sr-x{position:absolute;top:16px;right:18px;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;font-weight:700;
        background:none;border:none;box-shadow:none;color:var(--nm-text2,#9aa1ab);cursor:pointer;padding:4px 6px}
      .sr-x:hover{color:var(--nm-text,#eef1f5)}
      .sr-h{font-size:1.3rem;font-weight:700;margin-bottom:14px}.sr-h small{color:var(--nm-text2,#9aa1ab);font-weight:400}
      .sr-gk-badge{display:inline-flex;align-items:center;gap:8px;font-size:.8rem;color:var(--purple,#a78bfa);background:var(--nm-bg,#242830);
        padding:8px 14px;border-radius:9px;margin-bottom:12px;
        box-shadow:inset -3px -3px 6px var(--nm-light,#363c46), inset 3px 3px 6px var(--nm-dark,#121419)}
      .sr-sec{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--nm-text2,#9aa1ab);font-weight:600;margin:18px 0 8px;border-top:1px solid var(--nm-line,rgba(255,255,255,.06));padding-top:12px}
      .sr-sec small{color:var(--nm-text3,#6b7079);text-transform:none;letter-spacing:0}
      .sr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px 14px}
      .sr-grid2{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px 28px}
      .sr-f{display:flex;flex-direction:column;gap:3px}.sr-f.full{margin-top:10px}
      .sr-f span{font-size:.7rem;text-transform:uppercase;letter-spacing:.03em;color:var(--nm-text2,#9aa1ab)}
      .sr-f input,.sr-f textarea{background:var(--nm-bg,#242830);border:1px solid var(--nm-border,rgba(255,255,255,.04));color:var(--nm-text,#eef1f5);
        padding:7px 10px;border-radius:8px;font-size:.85rem;font-family:inherit;width:100%;
        box-shadow:inset -3px -3px 6px var(--nm-light,#363c46), inset 3px 3px 6px var(--nm-dark,#121419)}
      .sr-f input:focus,.sr-f textarea:focus{outline:none;box-shadow:inset -3px -3px 6px var(--nm-light,#363c46), inset 3px 3px 6px var(--nm-dark,#121419), 0 0 0 2px var(--gold,#e8b84b)}
      .sr-date{display:flex;align-items:center;gap:5px}
      .sr-date span{color:var(--nm-text3,#6b7079)}
      .sr-date input{text-align:center;font-variant-numeric:tabular-nums;padding:7px 4px}
      .sr-date-d,.sr-date-m{width:42px;flex:0 0 42px}
      .sr-date-y{width:64px;flex:0 0 64px}
      .sr-sl{display:flex;align-items:center;gap:14px;font-size:.88rem;color:var(--nm-text2,#262c36);padding:6px 0;cursor:pointer}
      .sr-sl span{flex:0 0 140px;font-weight:500}
      .sr-sl b{flex:0 0 30px;text-align:right;color:var(--gold,#7a4c00);font-size:1.15rem;font-weight:700;font-variant-numeric:tabular-nums}
      /* barra valore grande: binario incassato con parte piena colorata, cursore in rilievo */
      .sr-sl input[type=range]{flex:1;min-width:0;padding:0;margin:0;-webkit-appearance:none;appearance:none;height:14px;border-radius:7px;cursor:pointer;
        border:1px solid var(--nm-border,rgba(10,14,22,.26));
        background:linear-gradient(90deg,var(--gold,#7a4c00) 0 var(--p,50%),transparent var(--p,50%)) var(--nm-bg,#e8ebf0);
        box-shadow:inset -2px -2px 4px var(--nm-light,#fff), inset 2px 2px 4px var(--nm-dark,#b3bbc7)}
      .sr-sl input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:26px;height:26px;border-radius:50%;
        background:var(--nm-bg,#e8ebf0);border:2px solid var(--gold,#7a4c00);
        box-shadow:-3px -3px 6px var(--nm-light,#fff), 3px 3px 6px var(--nm-dark,#b3bbc7)}
      .sr-sl input[type=range]::-moz-range-thumb{width:26px;height:26px;border-radius:50%;
        background:var(--nm-bg,#e8ebf0);border:2px solid var(--gold,#7a4c00);
        box-shadow:-3px -3px 6px var(--nm-light,#fff), 3px 3px 6px var(--nm-dark,#b3bbc7)}
      .sr-sl input[type=range]:focus-visible{outline:2px solid var(--gold,#7a4c00);outline-offset:4px}
      .sr-consi-row{display:flex;flex-wrap:wrap;gap:8px}
      .sr-consi{font-size:.82rem}
      .sr-consi.on{color:var(--gold,#e8b84b);font-weight:700;border-color:var(--gold,#e8b84b);
        box-shadow:inset -4px -4px 8px var(--nm-light,#363c46), inset 4px 4px 8px var(--nm-dark,#121419)}
      .sr-actions{display:flex;gap:10px;align-items:center;margin-top:20px;padding-top:14px;border-top:1px solid var(--nm-line,rgba(255,255,255,.06))}
      .sr-primary{color:var(--gold,#e8b84b);font-weight:700;border-color:var(--gold,#e8b84b)}
      .sr-list{display:flex;flex-direction:column;gap:8px;max-height:60vh;overflow:auto}
      .sr-item{display:flex;align-items:center;gap:12px;background:var(--nm-bg,#242830);border-radius:12px;padding:11px 13px;cursor:pointer;
        box-shadow:-4px -4px 8px var(--nm-light,#363c46), 4px 4px 8px var(--nm-dark,#121419);border:1px solid var(--nm-border,transparent);transition:box-shadow .15s}
      .sr-item:hover{box-shadow:-5px -5px 10px var(--nm-light,#363c46), 5px 5px 10px var(--nm-dark,#121419)}
      .sr-item-main{flex:1;min-width:0}.sr-item-name{font-weight:600}.sr-item-sub{font-size:.76rem;color:var(--nm-text2,#9aa1ab);margin-top:2px}
      .sr-item-btns{display:flex;gap:6px;flex-shrink:0}.sr-item-btns button{font-size:.78rem}
      .sr-del{color:var(--red,#e08585)}
      .sr-tag{font-size:.66rem;padding:2px 8px;border-radius:10px;margin-left:6px}
      .sr-tag.ok{color:var(--green,#6bc46b)}.sr-tag.acc{color:var(--blue,#4bc0e8)}
      .sr-tag.warn{color:var(--warn,#e0b656)}.sr-tag.bad{color:var(--red,#e08585)}
      .sr-empty{padding:30px;text-align:center;color:var(--nm-text2,#9aa1ab)}

      /* ---- vista dettaglio scheda (radar + kpi) ---- */
      .sr-view-top{margin-bottom:12px}
      .sr-view-name{font-family:inherit;font-size:1.5rem;font-weight:700;color:var(--nm-text,#eef1f5);letter-spacing:-.01em}
      .sr-view-meta{color:var(--nm-text2,#9aa1ab);font-size:.85rem;margin-top:5px;display:flex;flex-wrap:wrap;gap:5px;text-transform:capitalize}
      .sr-sep{color:var(--nm-text3,#6b7079);text-transform:none}
      .sr-banner{display:flex;align-items:center;gap:10px;padding:11px 15px;border-radius:12px;font-size:.88rem;margin-bottom:16px;
        background:var(--nm-bg,#242830);box-shadow:inset -3px -3px 6px var(--nm-light,#363c46), inset 3px 3px 6px var(--nm-dark,#121419)}
      .sr-banner b{font-size:.95rem;letter-spacing:.01em}
      .sr-banner.ok b{color:var(--green,#6bc46b)}
      .sr-banner.acc b{color:var(--blue,#4bc0e8)}
      .sr-banner.warn b{color:var(--warn,#e0b656)}
      .sr-banner.bad b{color:var(--red,#e08585)}
      .sr-by{color:var(--nm-text2,#9aa1ab);opacity:.9;font-size:.78rem;font-weight:400}
      .sr-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:10px;margin-bottom:18px}
      .sr-kpi{background:var(--nm-bg,#242830);border-radius:12px;padding:10px 12px;text-align:center;
        box-shadow:-4px -4px 8px var(--nm-light,#363c46), 4px 4px 8px var(--nm-dark,#121419)}
      .sr-kpi .v{font-size:1.35rem;font-weight:700;color:var(--gold,#e8b84b);line-height:1.2}
      .sr-kpi .l{font-size:.63rem;text-transform:uppercase;letter-spacing:.05em;color:var(--nm-text2,#9aa1ab);margin-top:3px}
      .sr-radars{display:grid;grid-template-columns:1fr 1fr;gap:14px}
      .sr-radar-card{background:var(--nm-bg,#242830);border-radius:14px;padding:15px 17px;
        box-shadow:-5px -5px 10px var(--nm-light,#363c46), 5px 5px 10px var(--nm-dark,#121419)}
      .sr-radar-card h5{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--nm-text2,#9aa1ab);font-weight:600;
        margin-bottom:6px;display:flex;justify-content:space-between;align-items:baseline}
      .sr-radar-card h5 .sub{font-size:.78rem;font-weight:700;letter-spacing:0;text-transform:none}
      .sr-attr-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 16px;margin-top:8px}
      .sr-attr-mini{display:flex;justify-content:space-between;gap:6px;font-size:.76rem;padding:3px 0;border-bottom:1px dashed var(--nm-line,rgba(255,255,255,.06));color:var(--nm-text2,#9aa1ab)}
      .sr-attr-mini b{font-variant-numeric:tabular-nums}
      .sr-note-box{background:var(--nm-bg,#242830);border-radius:12px;padding:12px 15px;margin-top:14px;font-size:.85rem;color:var(--nm-text2,#9aa1ab);white-space:pre-wrap;line-height:1.5;
        box-shadow:inset -3px -3px 6px var(--nm-light,#363c46), inset 3px 3px 6px var(--nm-dark,#121419)}
      .sr-note-box b{color:var(--nm-text,#eef1f5)}
      .sr-note-italic{font-style:italic}
      .sr-hist{margin-top:18px;border-top:1px solid var(--nm-line,rgba(255,255,255,.06));padding-top:14px}
      .sr-hist h5{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--nm-text2,#9aa1ab);font-weight:600;margin-bottom:8px;display:flex;justify-content:space-between}
      .sr-hist h5 .sub{color:var(--nm-text3,#6b7079);text-transform:none;font-weight:400;letter-spacing:0}
      .sr-hist-list{display:flex;flex-direction:column;gap:6px}
      .sr-hist-item{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:10px;
        background:var(--nm-bg,#242830);cursor:pointer;font-size:.8rem;color:var(--nm-text2,#9aa1ab);
        box-shadow:-3px -3px 6px var(--nm-light,#363c46), 3px 3px 6px var(--nm-dark,#121419);transition:box-shadow .15s}
      .sr-hist-item:hover{box-shadow:-4px -4px 8px var(--nm-light,#363c46), 4px 4px 8px var(--nm-dark,#121419)}
      .sr-hist-item.active{color:var(--gold,#e8b84b);font-weight:600;
        box-shadow:inset -3px -3px 6px var(--nm-light,#363c46), inset 3px 3px 6px var(--nm-dark,#121419)}
      @media(max-width:640px){.sr-box{padding:16px}.sr-sl span{flex-basis:100px}.sr-radars{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  // buildReportHead (identico a SportHub) — CSS PDF sfondo bianco A4
  function buildReportHead(title) {
    return `<meta charset="utf-8"/><title>${title.replace(/[<>&"]/g,'')}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
      <style>${REPORT_CSS}</style>`;
  }

  const REPORT_CSS = `
:root{--bg:#eef1f5;--paper:#fff;--ink:#0f1320;--ink-2:#1f2533;--muted:#6b7280;--muted-2:#9aa1ad;--line:#e6e9ef;--line-2:#edf0f4;--tint:#f6f8fb;--azzurro:#2f6fed;--azzurro-2:#4d86f5;--azzurro-3:#dbe6fb;--azzurro-4:#eef3fc;--azzurro-ink:#163b94;--good:#1d8a5a;--bad:#c0432f;--warn:#b9882a;--border:#e6e9ef;--r-md:10px;--r-lg:14px;--w:210mm;--h:297mm}
*{box-sizing:border-box}html,body{margin:0;padding:0;background:var(--bg);color:var(--ink);font-family:"Geist","Space Grotesk",system-ui,sans-serif;-webkit-font-smoothing:antialiased}body{padding:32px 0 64px}
.deck{display:flex;flex-direction:column;align-items:center;gap:24px}
.page{width:var(--w);height:var(--h);background:var(--paper);box-shadow:0 24px 60px -24px rgba(15,19,32,.18);position:relative;overflow:hidden;padding:22mm 18mm 18mm;display:flex;flex-direction:column}
.pg-head{position:absolute;left:18mm;right:18mm;top:9mm;display:flex;align-items:center;justify-content:space-between;font:500 9.5px/1 "JetBrains Mono",monospace;letter-spacing:.08em;color:var(--muted);text-transform:uppercase}
.pg-head .brand{display:flex;align-items:center;gap:8px;color:var(--ink-2)}.pg-head .brand .dot{width:8px;height:8px;border-radius:2px;background:var(--azzurro);box-shadow:0 0 0 3px var(--azzurro-3)}
.pg-foot{position:absolute;left:18mm;right:18mm;bottom:9mm;display:flex;align-items:center;justify-content:space-between;font:500 9px/1 "JetBrains Mono",monospace;letter-spacing:.08em;color:var(--muted-2);text-transform:uppercase;border-top:1px solid var(--line);padding-top:6px}.pg-foot b{color:var(--ink-2)}
h1,h2,h3,h4{font-family:"Space Grotesk",sans-serif;font-weight:600;margin:0}
.section-title{font-family:"Space Grotesk";font-weight:600;font-size:18px;color:var(--ink);display:flex;align-items:baseline;gap:10px;margin-bottom:10px}
.section-title .num{font:600 11px/1 "JetBrains Mono",monospace;color:var(--azzurro);background:var(--azzurro-4);padding:5px 7px;border-radius:4px;letter-spacing:.1em}
.section-title .rule{flex:1;height:1px;background:var(--line);align-self:center;margin-left:6px}
.chip{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:5px;background:var(--azzurro-4);color:var(--azzurro-ink);font:600 10px/1 "JetBrains Mono",monospace}.chip.muted{background:var(--tint);color:var(--muted)}
.ath-head{display:flex;align-items:flex-end;gap:16px;padding-bottom:12px;border-bottom:1px solid var(--line)}
.ath-avatar{width:74px;height:74px;border-radius:14px;background:linear-gradient(160deg,var(--azzurro-4),var(--azzurro-3));display:grid;place-items:center;font-family:"Space Grotesk";font-weight:600;font-size:26px;color:var(--azzurro-ink);flex-shrink:0}
.ath-name{font-family:"Space Grotesk";font-weight:600;font-size:30px;line-height:1}
.ath-role{display:inline-flex;align-items:center;gap:6px;margin-top:8px;font:600 10px/1 "JetBrains Mono",monospace;letter-spacing:.14em;color:var(--azzurro);text-transform:uppercase;background:var(--azzurro-4);padding:5px 8px;border-radius:5px}
.ath-side{margin-left:auto;display:flex;gap:10px}.ath-side .stat{text-align:right}.ath-side .stat .k{font:600 9px/1 "JetBrains Mono",monospace;letter-spacing:.12em;color:var(--muted);text-transform:uppercase}.ath-side .stat .v{font-family:"Space Grotesk";font-weight:600;font-size:18px;margin-top:4px}
.panel{border:1px solid var(--line);border-radius:var(--r-lg);padding:12px 14px;background:var(--paper)}
.panel .ptitle{font:600 10px/1 "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}.panel .ptitle .acc{color:var(--azzurro)}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.skill-row{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:11px}.skill-row .lab{width:130px;color:var(--ink-2)}.skill-row .track{flex:1;height:6px;background:var(--tint);border-radius:99px;overflow:hidden}.skill-row .track>i{display:block;height:100%;border-radius:99px}.skill-row .val{width:38px;text-align:right;font-family:"JetBrains Mono";font-weight:600;color:var(--ink)}
.note-list{display:grid;grid-template-columns:1fr;gap:4px 14px;font-size:11px;color:var(--ink-2)}.note-list .ln{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed var(--line-2);gap:8px}.note-list .ln span:first-child{color:var(--muted)}.note-list .ln b{font-family:"JetBrains Mono";font-weight:600;color:var(--ink)}
.banner{border:1px solid var(--line);border-radius:var(--r-md);padding:10px 12px;display:flex;align-items:center;gap:10px;font-size:11px}
.banner.bad{background:#fff7f5;color:#7a2316;border-color:#f3c4bc}.banner.warn{background:#fffbef;color:#7a541b;border-color:#f1dca3}.banner.ok{background:#f1faf4;color:#1a5b3c;border-color:#cae8d6}.banner.acc{background:var(--azzurro-4);color:var(--azzurro-ink);border-color:#cfdcf5}
.banner b{font-family:"Space Grotesk";font-weight:600;font-size:13px}
@page{size:A4;margin:0}@media print{html,body{background:#fff;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.deck{gap:0}.page{box-shadow:none;page-break-after:always;margin:0}.page:last-child{page-break-after:auto}}
`;

  // ---- API pubblica ---------------------------------------------------------
  window.ScoutReport = { openForm, openList, openView, _store: Store, _buildHTML: buildScoutingReportHTML };
})();
