/* ============================================================================
   I18N — dizionario condiviso IT/EN per index.html e scouting_report.js.
   Il cambio lingua ricarica la pagina (window.location.reload) così tutto,
   incluse le liste di attributi generate al caricamento, si ridisegna pulito
   nella lingua scelta: niente logica di "ri-render live" da mantenere altrove.
   Espone: window.I18N = { t(key, vars), getLang(), setLang(lang) }
   ==========================================================================*/
(function () {
  'use strict';

  const LANG_KEY = 'scout_lang';

  const DICT = {
    it: {
      // ---- app principale: topbar / filtri ----
      app_name: 'Scout',
      btn_filters: 'Filtri',
      nav_dashboard: 'Dashboard',
      nav_report: 'Report scouting',
      nav_csv: 'Esporta CSV',
      sub_line: '{n} giocatori · {leghe} · dati del {data}',
      filter_campionato: 'Campionato',
      filter_ruolo: 'Ruolo',
      chip_gk: 'Portieri', chip_df: 'Difensori', chip_mf: 'Centrocamp.', chip_fw: 'Attaccanti',
      chip_dataset: 'Dataset', hint_dataset: 'Giocatori inseriti a mano tramite i report scouting',
      filter_squadra: 'Squadra', ph_squadra: 'es. Inter',
      filter_nome: 'Cerca nome', ph_nome: 'es. Lautaro',
      filter_eta: 'Età', hint_eta: 'Solo Serie A (dati anagrafici da Transfermarkt)',
      filter_valore: 'Valore minimo (€M)', hint_valore: 'Solo Serie A',
      filter_elo: 'Elo minimo',
      btn_reset: 'Reset filtri',
      chk_solo_completi: 'solo con valore di mercato',
      stats_su: 'giocatori su',
      stats_mostrati: 'mostrati i primi {n} di {tot} — restringi i filtri',
      btn_more: 'Mostra altri {n}',
      btn_brand: 'Personalizza',
      brand_logo: 'Logo società', brand_logo_upload: 'Carica logo', brand_logo_change: 'Cambia logo', brand_logo_remove: 'Rimuovi',
      brand_logo_none: 'Nessun logo caricato', brand_logo_err: 'Il file scelto non è un\'immagine valida.',
      brand_logo_big: 'Logo troppo grande per il salvataggio automatico. Verrà mantenuto solo per questa sessione.',
      brand_coach: 'Firma allenatore', brand_coach_ph: 'Nome e cognome', brand_coach_hint: 'Compare in fondo a ogni pagina del PDF',
      brand_color: 'Colore squadra', brand_note: 'Logo, firma e colore restano salvati in questo browser.',
      browser_note: 'Scout è pensata per Google Chrome (o Edge) su computer: solo lì i report possono essere salvati in una cartella del tuo dispositivo. In questo browser restano solo nel browser.',
      browser_note_ok: 'Ho capito',
      fs_title: 'Cartella dati (report)',
      fs_none: 'I report sono salvati solo in questo browser. Collega una cartella del tuo dispositivo per averli anche come file.',
      fs_connected: 'Collegata a «{name}» · {n} report',
      fs_need: 'Cartella «{name}» da ricollegare: il browser chiede di nuovo il permesso.',
      fs_err: 'Cartella «{name}» non raggiungibile (spostata o eliminata?). Sceglila di nuovo.',
      fs_unsupported: 'Questo browser non può collegare una cartella (serve Chrome o Edge su computer). Usa Esporta / Importa backup.',
      fs_choose: 'Scegli cartella', fs_change: 'Cambia cartella', fs_reconnect: 'Ricollega cartella', fs_disconnect: 'Scollega',
      fs_sync_now: 'Aggiorna ora', fs_last: 'ultimo aggiornamento {t}',
      fs_export: 'Esporta backup', fs_import: 'Importa backup',
      fs_import_ok: 'Importati {a} report nuovi, aggiornati {u}.', fs_import_err: 'File non valido: serve un backup di Scout o un report .json.',
      fs_export_none: 'Non ci sono report da esportare.',
      fs_confirm_disc: 'Scollegare la cartella? I file restano sul dispositivo e i report restano anche nell\'app.',

      // ---- tabella ----
      th_nome: 'Nome', th_ruolo: 'Ruolo', th_squadra: 'Squadra', th_camp: 'Camp.',
      th_eta: 'Età', th_valore: 'Valore €M', th_elo: 'Elo', th_gol: 'Gol', th_scadenza: 'Scadenza',
      empty_loading: 'Caricamento dati…',
      empty_no_results: 'Nessun giocatore con questi filtri',
      warn_no_data: 'File <b>giocatori.js</b> non trovato. Esegui <span class="mono">python3 etl.py</span> nella cartella.',

      // ---- ruoli (condivisi ovunque) ----
      role_GK: 'Portiere', role_DF: 'Difensore', role_MF: 'Centrocampista', role_FW: 'Attaccante',

      // ---- dashboard ----
      dash_kpi_players: 'Giocatori nel filtro',
      dash_kpi_value: 'Valore rosa totale',
      dash_kpi_age: 'Età media',
      dash_kpi_elo: 'Elo medio',
      dash_kpi_coverage: 'Con valore di mercato',
      dash_no_data: 'Nessun dato da visualizzare con questi filtri.',
      dash_chart1_title: 'Distribuzione per ruolo', dash_chart1_sub: '{n} giocatori',
      dash_chart2_title: 'Distribuzione età', dash_chart2_sub: '{n} con dato anagrafico',
      dash_chart3_title: 'Valore vs Elo', dash_chart3_sub: 'occasioni: alto Elo, basso valore',
      dash_chart4_title: 'Top squadre per valore rosa', dash_chart4_sub: 'solo Serie A',
      dash_chart4_sub_all: 'Serie A + Dataset',
      scatter_xlabel: 'Valore di mercato (€M)', scatter_ylabel: 'Elo',

      // ---- scheda giocatore ----
      detail_no_stats: 'Nessuna statistica disponibile',
      detail_h3_anagrafica: 'Anagrafica',
      detail_row_nascita: 'Data di nascita', detail_row_nazionalita: 'Nazionalità',
      detail_row_ruolo: 'Ruolo', detail_row_altezza: 'Altezza', detail_row_piede: 'Piede',
      detail_row_scadenza: 'Scadenza contratto', detail_row_fonti: 'Fonti dati',
      detail_kpi_valore: 'Valore', detail_kpi_elo: 'Elo', detail_kpi_rank: 'Rank',
      detail_kpi_partite: 'Partite', detail_kpi_gol: 'Gol', detail_kpi_assist: 'Assist', detail_kpi_minuti: 'Minuti',
      detail_btn_report: 'Nuovo report scouting',
      detail_btn_tm: 'Profilo Transfermarkt',
      detail_btn_view_report: 'Vedi report scouting',
      dataset_note: 'Dataset: giocatore inserito a mano tramite un report scouting. Dati limitati a quanto scritto dallo scout.',
      detail_serieb_note: 'Serie B: dati solo PlayerElo (Elo/ranking). Valore di mercato e statistiche non disponibili gratuitamente.',
      anni: '{n} anni', cm: '{n} cm', piede_di: 'piede {p}',
      alert_no_export: 'Nessun risultato da esportare.',

      // ---- modulo report scouting: form ----
      sr_title_new: 'Nuovo report scouting', sr_title_edit: 'Modifica report',
      sr_gk_badge: 'Modalità portiere attiva — attributi tecnici e fisici dedicati (rilevata dal Ruolo primario)',
      sr_sec_anagrafica: 'Anagrafica', sr_sec_sessione: 'Sessione di osservazione',
      sr_sec_tecnici: 'Attributi tecnici', sr_sec_fm: 'Attributi fisico / mentali', sr_sec_giudizio: 'Giudizio',
      label_nome: 'Nome', label_cognome: 'Cognome', label_data_nascita: 'Data nascita',
      label_nazionalita: 'Nazionalità', label_altezza: 'Altezza (cm)', label_peso: 'Peso (kg)',
      label_piede: 'Piede', label_ruolo_primario: 'Ruolo primario', label_ruolo_secondario: 'Ruolo secondario',
      label_squadra: 'Squadra', label_categoria: 'Categoria', label_agente: 'Agente', label_contratto: 'Contratto',
      label_valore_stimato: 'Valore stimato', ph_valore_stimato: 'es. 5.0M',
      label_data_osservazione: 'Data osservazione', label_stagione: 'Stagione', ph_stagione: 'es. 2025/26',
      label_evento: 'Evento', label_partita: 'Partita', ph_partita: 'es. Inter-Milan',
      label_livello_avversario: 'Livello avversario', label_scout_cognome: 'Scout redattore',
      label_voto: 'Voto scout (1–10)', label_note: 'Note dello scout',
      btn_annulla: 'Annulla', btn_preview: 'Anteprima/PDF', btn_save: 'Salva report',
      alert_nome_required: 'Inserisci almeno nome o cognome.', alert_saved: 'Report salvato.',
      confirm_del_report: 'Eliminare questo report?', confirm_del_session: 'Eliminare questa sessione di valutazione?',

      // ---- modulo report scouting: lista + vista ----
      list_title: 'Report scouting', list_empty: 'Nessun report salvato. Creane uno dalla scheda di un giocatore o col pulsante qui sotto.',
      btn_close: 'Chiudi', btn_new_blank: 'Nuovo report vuoto',
      btn_pdf: 'PDF', btn_edit: 'Modifica', btn_delete: 'Elimina',
      item_media: 'media',
      view_by: '· valutato da {n}',
      kpi_media_tec: 'Media tecnica', kpi_media_fm: 'Media fisico/mentale', kpi_media_globale: 'Media globale',
      kpi_voto: 'Voto scout', kpi_sessione: 'Sessione', kpi_sessioni: 'Sessioni',
      radar_title_fm: 'Fisico / mentale',
      note_avversario: '· avversario: {v}',
      hist_title: 'Storico sessioni', hist_totali: '{n} totali',
      btn_back: 'Torna alla lista', btn_new_eval: 'Nuova valutazione',
      consi_0: 'Non idoneo', consi_1: 'Da monitorare', consi_2: 'Consigliato', consi_3: 'Fortemente consigliato',

      // ---- attributi tecnici ----
      attr_piede_dx: 'Piede dx', attr_piede_sx: 'Piede sx',
      attr_trasm_corta: 'Trasmissione corta', attr_trasm_media: 'Trasmissione media', attr_trasm_lunga: 'Trasmissione lunga',
      attr_tiro: 'Tiro', attr_cross: 'Cross', attr_verticalizzazione: 'Verticalizzazione',
      attr_colpo_testa: 'Colpo di testa', attr_dribbling: 'Dribbling',
      // ---- attributi fisico/mentali ----
      attr_velocita: 'Velocità', attr_resistenza: 'Resistenza', attr_forza: 'Forza', attr_rapidita: 'Rapidità',
      attr_struttura: 'Struttura', attr_attenzione: 'Attenzione', attr_lettura_tattica: 'Lettura tattica',
      attr_posizionamento: 'Posizionamento', attr_smarcamento: 'Smarcamento', attr_marcatura: 'Marcatura',
      attr_agonismo: 'Agonismo', attr_leadership: 'Leadership',
      // ---- attributi portiere ----
      attr_gk_piede_dx: 'Piede destro', attr_gk_piede_sx: 'Piede sinistro',
      attr_gk_trasm_corta: 'Trasmissione corta', attr_gk_trasm_media: 'Trasmissione media', attr_gk_trasm_lunga: 'Trasmissione lunga',
      attr_gk_posizionamento: 'Posizionamento', attr_gk_presa_bassa: 'Presa bassa', attr_gk_presa_alta: 'Presa alta',
      attr_gk_uscite_basse: 'Uscite basse', attr_gk_uscite_alte: 'Uscite alte', attr_gk_reattivita: 'Reattività',
      attr_gk_velocita: 'Velocità', attr_gk_forza: 'Forza', attr_gk_esplosivita: 'Esplosività', attr_gk_rapidita: 'Rapidità',
      attr_gk_struttura: 'Struttura', attr_gk_attenzione: 'Attenzione', attr_gk_lettura_tattica: 'Lettura tattica',
      attr_gk_agonismo: 'Agonismo', attr_gk_guida_difesa: 'Guida della difesa', attr_gk_leadership: 'Leadership',
    },

    en: {
      app_name: 'Scout',
      btn_filters: 'Filters',
      nav_dashboard: 'Dashboard',
      nav_report: 'Scouting reports',
      nav_csv: 'Export CSV',
      sub_line: '{n} players · {leghe} · data as of {data}',
      filter_campionato: 'League',
      filter_ruolo: 'Role',
      chip_gk: 'Goalkeepers', chip_df: 'Defenders', chip_mf: 'Midfielders', chip_fw: 'Forwards',
      chip_dataset: 'Dataset', hint_dataset: 'Players added manually via scouting reports',
      filter_squadra: 'Club', ph_squadra: 'e.g. Inter',
      filter_nome: 'Search name', ph_nome: 'e.g. Lautaro',
      filter_eta: 'Age', hint_eta: 'Serie A only (biographical data from Transfermarkt)',
      filter_valore: 'Minimum value (€M)', hint_valore: 'Serie A only',
      filter_elo: 'Minimum Elo',
      btn_reset: 'Reset filters',
      chk_solo_completi: 'only with market value',
      stats_su: 'players out of',
      stats_mostrati: 'showing first {n} of {tot} — narrow your filters',
      btn_more: 'Show {n} more',
      btn_brand: 'Customize',
      brand_logo: 'Club logo', brand_logo_upload: 'Upload logo', brand_logo_change: 'Change logo', brand_logo_remove: 'Remove',
      brand_logo_none: 'No logo uploaded', brand_logo_err: 'The selected file is not a valid image.',
      brand_logo_big: 'Logo too large to be saved automatically. It will be kept for this session only.',
      brand_coach: 'Coach signature', brand_coach_ph: 'First and last name', brand_coach_hint: 'Shown at the bottom of every PDF page',
      brand_color: 'Team colour', brand_note: 'Logo, signature and colour are saved in this browser.',
      browser_note: 'Scout is designed for Google Chrome (or Edge) on a computer: only there can reports be saved to a folder on your device. In this browser they stay in the browser only.',
      browser_note_ok: 'Got it',
      fs_title: 'Data folder (reports)',
      fs_none: 'Reports are saved in this browser only. Link a folder on your device to keep them as files too.',
      fs_connected: 'Linked to “{name}” · {n} reports',
      fs_need: 'Folder “{name}” needs relinking: the browser asks for permission again.',
      fs_err: 'Folder “{name}” cannot be reached (moved or deleted?). Choose it again.',
      fs_unsupported: 'This browser cannot link a folder (Chrome or Edge on a computer required). Use Export / Import backup.',
      fs_choose: 'Choose folder', fs_change: 'Change folder', fs_reconnect: 'Relink folder', fs_disconnect: 'Unlink',
      fs_sync_now: 'Refresh now', fs_last: 'last refresh {t}',
      fs_export: 'Export backup', fs_import: 'Import backup',
      fs_import_ok: 'Imported {a} new reports, updated {u}.', fs_import_err: 'Invalid file: a Scout backup or a report .json is required.',
      fs_export_none: 'There are no reports to export.',
      fs_confirm_disc: 'Unlink the folder? The files stay on your device and the reports stay in the app.',

      th_nome: 'Name', th_ruolo: 'Role', th_squadra: 'Club', th_camp: 'League',
      th_eta: 'Age', th_valore: 'Value €M', th_elo: 'Elo', th_gol: 'Goals', th_scadenza: 'Expiry',
      empty_loading: 'Loading data…',
      empty_no_results: 'No players match these filters',
      warn_no_data: 'File <b>giocatori.js</b> not found. Run <span class="mono">python3 etl.py</span> in the folder.',

      role_GK: 'Goalkeeper', role_DF: 'Defender', role_MF: 'Midfielder', role_FW: 'Forward',

      dash_kpi_players: 'Players in filter',
      dash_kpi_value: 'Total squad value',
      dash_kpi_age: 'Average age',
      dash_kpi_elo: 'Average Elo',
      dash_kpi_coverage: 'With market value',
      dash_no_data: 'No data to display with these filters.',
      dash_chart1_title: 'Distribution by role', dash_chart1_sub: '{n} players',
      dash_chart2_title: 'Age distribution', dash_chart2_sub: '{n} with birth data',
      dash_chart3_title: 'Value vs Elo', dash_chart3_sub: 'bargains: high Elo, low value',
      dash_chart4_title: 'Top clubs by squad value', dash_chart4_sub: 'Serie A only',
      dash_chart4_sub_all: 'Serie A + Dataset',
      scatter_xlabel: 'Market value (€M)', scatter_ylabel: 'Elo',

      detail_no_stats: 'No statistics available',
      detail_h3_anagrafica: 'Bio',
      detail_row_nascita: 'Date of birth', detail_row_nazionalita: 'Nationality',
      detail_row_ruolo: 'Role', detail_row_altezza: 'Height', detail_row_piede: 'Foot',
      detail_row_scadenza: 'Contract expiry', detail_row_fonti: 'Data sources',
      detail_kpi_valore: 'Value', detail_kpi_elo: 'Elo', detail_kpi_rank: 'Rank',
      detail_kpi_partite: 'Appearances', detail_kpi_gol: 'Goals', detail_kpi_assist: 'Assists', detail_kpi_minuti: 'Minutes',
      detail_btn_report: 'New scouting report',
      detail_btn_tm: 'Transfermarkt profile',
      detail_btn_view_report: 'View scouting report',
      dataset_note: 'Dataset: player added manually via a scouting report. Data limited to what the scout entered.',
      detail_serieb_note: 'Serie B: PlayerElo data only (Elo/ranking). Market value and statistics are not available for free.',
      anni: '{n} years old', cm: '{n} cm', piede_di: '{p} foot',
      alert_no_export: 'No results to export.',

      sr_title_new: 'New scouting report', sr_title_edit: 'Edit report',
      sr_gk_badge: 'Goalkeeper mode active — dedicated technical and physical attributes (detected from Primary role)',
      sr_sec_anagrafica: 'Bio', sr_sec_sessione: 'Observation session',
      sr_sec_tecnici: 'Technical attributes', sr_sec_fm: 'Physical / mental attributes', sr_sec_giudizio: 'Assessment',
      label_nome: 'First name', label_cognome: 'Last name', label_data_nascita: 'Date of birth',
      label_nazionalita: 'Nationality', label_altezza: 'Height (cm)', label_peso: 'Weight (kg)',
      label_piede: 'Foot', label_ruolo_primario: 'Primary role', label_ruolo_secondario: 'Secondary role',
      label_squadra: 'Club', label_categoria: 'Category', label_agente: 'Agent', label_contratto: 'Contract',
      label_valore_stimato: 'Estimated value', ph_valore_stimato: 'e.g. 5.0M',
      label_data_osservazione: 'Observation date', label_stagione: 'Season', ph_stagione: 'e.g. 2025/26',
      label_evento: 'Event', label_partita: 'Match', ph_partita: 'e.g. Inter-Milan',
      label_livello_avversario: 'Opponent level', label_scout_cognome: 'Scout',
      label_voto: 'Scout rating (1–10)', label_note: 'Scout notes',
      btn_annulla: 'Cancel', btn_preview: 'Preview/PDF', btn_save: 'Save report',
      alert_nome_required: 'Enter at least a first or last name.', alert_saved: 'Report saved.',
      confirm_del_report: 'Delete this report?', confirm_del_session: 'Delete this evaluation session?',

      list_title: 'Scouting reports', list_empty: 'No reports saved yet. Create one from a player’s card or with the button below.',
      btn_close: 'Close', btn_new_blank: 'New blank report',
      btn_pdf: 'PDF', btn_edit: 'Edit', btn_delete: 'Delete',
      item_media: 'avg',
      view_by: '· assessed by {n}',
      kpi_media_tec: 'Technical average', kpi_media_fm: 'Physical/mental average', kpi_media_globale: 'Overall average',
      kpi_voto: 'Scout rating', kpi_sessione: 'Session', kpi_sessioni: 'Sessions',
      radar_title_fm: 'Physical / mental',
      note_avversario: '· opponent: {v}',
      hist_title: 'Session history', hist_totali: '{n} total',
      btn_back: 'Back to list', btn_new_eval: 'New evaluation',
      consi_0: 'Not suitable', consi_1: 'To monitor', consi_2: 'Recommended', consi_3: 'Highly recommended',

      attr_piede_dx: 'Right foot', attr_piede_sx: 'Left foot',
      attr_trasm_corta: 'Short passing', attr_trasm_media: 'Medium passing', attr_trasm_lunga: 'Long passing',
      attr_tiro: 'Shooting', attr_cross: 'Crossing', attr_verticalizzazione: 'Through balls',
      attr_colpo_testa: 'Heading', attr_dribbling: 'Dribbling',
      attr_velocita: 'Pace', attr_resistenza: 'Stamina', attr_forza: 'Strength', attr_rapidita: 'Acceleration',
      attr_struttura: 'Physique', attr_attenzione: 'Concentration', attr_lettura_tattica: 'Tactical awareness',
      attr_posizionamento: 'Positioning', attr_smarcamento: 'Off-ball movement', attr_marcatura: 'Marking',
      attr_agonismo: 'Aggression', attr_leadership: 'Leadership',
      attr_gk_piede_dx: 'Right foot', attr_gk_piede_sx: 'Left foot',
      attr_gk_trasm_corta: 'Short passing', attr_gk_trasm_media: 'Medium passing', attr_gk_trasm_lunga: 'Long passing',
      attr_gk_posizionamento: 'Positioning', attr_gk_presa_bassa: 'Low catching', attr_gk_presa_alta: 'High catching',
      attr_gk_uscite_basse: 'Low claims', attr_gk_uscite_alte: 'High claims', attr_gk_reattivita: 'Reflexes',
      attr_gk_velocita: 'Pace', attr_gk_forza: 'Strength', attr_gk_esplosivita: 'Explosiveness', attr_gk_rapidita: 'Acceleration',
      attr_gk_struttura: 'Physique', attr_gk_attenzione: 'Concentration', attr_gk_lettura_tattica: 'Tactical awareness',
      attr_gk_agonismo: 'Aggression', attr_gk_guida_difesa: 'Commanding the defence', attr_gk_leadership: 'Leadership',
    },
  };

  // localStorage può lanciare eccezioni (navigazione privata, file:// con storage bloccato)
  let lang = 'it';
  try { lang = localStorage.getItem(LANG_KEY) || 'it'; } catch (e) {}
  if (lang !== 'it' && lang !== 'en') lang = 'it';

  function t(key, vars) {
    let s = (DICT[lang] && DICT[lang][key]) ?? DICT.it[key] ?? key;
    if (vars) Object.keys(vars).forEach(k => { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  }
  function getLang() { return lang; }
  function setLang(l) {
    lang = (l === 'en') ? 'en' : 'it';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  }

  window.I18N = { t, getLang, setLang };
})();
