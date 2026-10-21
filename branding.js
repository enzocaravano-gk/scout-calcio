/* ============================================================================
   BRAND — personalizzazione della società: logo, firma allenatore, colore squadra.
   Ispirato al menu di POSIZIONAMENTI. Tutto resta salvato nel browser (localStorage),
   come i report: niente viene caricato online.
   - Il logo usa la stessa chiave di POSIZIONAMENTI / Report gara ('clubLogoData'):
     se le app sono pubblicate sullo stesso sito, il logo caricato in una vale anche qui.
   - I colori sono varianti scure (contrasto ≥ 4.5:1 sul fondo chiaro dell'app),
     così scritte e numeri colorati restano leggibili qualunque colore si scelga.
   Espone: window.Brand = { COLORS, get(), setLogo(file), removeLogo(), setCoach(name),
                            setAccent(hex), applyAccent() }
   ==========================================================================*/
(function () {
  'use strict';

  const K_LOGO = 'clubLogoData', K_COACH = 'scoutCoachName', K_ACCENT = 'scoutAccent';
  const DEFAULT_ACCENT = '#7a4c00';
  const COLORS = [
    { hex: '#7a4c00', it: 'Ocra',    en: 'Ochre'  },
    { hex: '#7a0000', it: 'Granata', en: 'Maroon' },
    { hex: '#a31d1d', it: 'Rosso',   en: 'Red'    },
    { hex: '#134a91', it: 'Blu',     en: 'Blue'   },
    { hex: '#015a8c', it: 'Azzurro', en: 'Sky blue' },
    { hex: '#17663a', it: 'Verde',   en: 'Green'  },
    { hex: '#5a2d91', it: 'Viola',   en: 'Purple' },
    { hex: '#1a1a1a', it: 'Nero',    en: 'Black'  },
  ];

  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  let sessionLogo = null;   // logo tenuto solo in memoria se non entra nel localStorage

  function changed() { try { window.dispatchEvent(new CustomEvent('brandChanged')); } catch (e) {} }

  function get() {
    const logo = sessionLogo || ls.get(K_LOGO);
    const accent = ls.get(K_ACCENT);
    return {
      logo: logo && logo.startsWith('data:image') ? logo : null,
      coach: (ls.get(K_COACH) || '').trim(),
      accent: COLORS.some(c => c.hex === accent) ? accent : DEFAULT_ACCENT,
      customAccent: !!accent && accent !== DEFAULT_ACCENT && COLORS.some(c => c.hex === accent),
    };
  }

  // Il logo viene ridimensionato (lato lungo max 400px) prima di salvarlo: un'immagine
  // di qualche MB riempirebbe da sola lo spazio del browser, togliendolo ai report.
  function setLogo(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) return reject(new Error('not-image'));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read'));
      reader.onload = () => {
        const src = reader.result;
        if (file.type === 'image/svg+xml') return resolve(store(src));
        const img = new Image();
        img.onerror = () => reject(new Error('decode'));
        img.onload = () => {
          const MAX = 400, k = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.naturalWidth * k));
          c.height = Math.max(1, Math.round(img.naturalHeight * k));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(store(c.toDataURL('image/png')));   // PNG: mantiene lo sfondo trasparente
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
    function store(dataUrl) {
      const ok = ls.set(K_LOGO, dataUrl);
      sessionLogo = ok ? null : dataUrl;
      changed();
      return ok;   // false = troppo grande, tenuto solo per questa sessione
    }
  }
  function removeLogo() { sessionLogo = null; ls.del(K_LOGO); changed(); }
  function setCoach(name) { const n = (name || '').trim(); n ? ls.set(K_COACH, n) : ls.del(K_COACH); changed(); }
  function setAccent(hex) {
    if (!COLORS.some(c => c.hex === hex)) return;
    hex === DEFAULT_ACCENT ? ls.del(K_ACCENT) : ls.set(K_ACCENT, hex);
    applyAccent(); changed();
  }
  // l'accento dell'app è la variabile --gold: cambiandola si ricolorano pulsanti attivi,
  // chip selezionati, KPI, grafici e barre dei valori, senza ridisegnare nulla
  function applyAccent() {
    const { accent } = get();
    const st = document.documentElement.style;
    if (accent === DEFAULT_ACCENT) { st.removeProperty('--gold'); st.removeProperty('--gold2'); }
    else { st.setProperty('--gold', accent); st.setProperty('--gold2', accent); }
  }

  applyAccent();   // subito, prima che la pagina venga disegnata
  window.Brand = { COLORS, get, setLogo, removeLogo, setCoach, setAccent, applyAccent };
})();
