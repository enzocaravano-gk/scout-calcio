# Scout Calcio — guida rapida

App per cercare e analizzare giocatori di **Serie A** e **Serie B** italiane,
unendo due fonti gratuite in un unico database pulito.

## Come si usa (ogni giorno)

1. Apri **`index.html`** con doppio click. Si apre nel browser e mostra i giocatori.
2. Usa i filtri in alto (campionato, ruolo, squadra, età, valore, Elo).
3. Clicca su una riga per vedere la scheda completa del giocatore.
4. "Esporta CSV" salva i risultati filtrati.

Non serve internet né installare niente per usarla: legge il file `giocatori.js`
che è già pronto nella cartella.

## Come aggiornare i dati (ogni tanto)

I dati vivono nei CSV scaricati (cartella `giocatori/`). Quando li aggiorni,
rigenera il database con un comando solo, dentro questa cartella:

```bash
python3 etl.py
```

Questo riscrive `giocatori.js` (e `giocatori.json`). Poi riapri `index.html`.

## Cosa contiene il database

| Campionato | Fonte | Dati disponibili |
|---|---|---|
| Serie A | Transfermarkt + PlayerElo | anagrafica, valore €, contratto, Elo, statistiche stagione |
| Serie B | PlayerElo | Elo, ranking, squadra, ruolo (niente valore/età: non gratis) |
| Serie C | — | **non disponibile** nei dataset gratuiti attuali |

Il valore aggiunto rispetto alla vecchia app: le due fonti sono **unite in una
sola riga per giocatore** (prima comparivano doppie), le statistiche gol/assist
sono reali (prima erano sempre 0), e l'ordinamento funziona su tutte le colonne.

## Dashboard con grafici

Il pulsante **"📊 Dashboard"** in alto mostra/nasconde un pannello con:
- 4 numeri chiave (giocatori nel filtro, valore rosa totale, età media, Elo medio),
- distribuzione per ruolo, distribuzione età, un grafico **Valore vs Elo** per scovare
  occasioni (giocatori con Elo alto e valore basso), e le top squadre per valore rosa.

I grafici si aggiornano **in automatico** in base ai filtri attivi (campionato, ruolo,
squadra, età...): è come guardare i dati filtrati da un'altra angolazione.

## Report scouting (valutazione sul campo)

Oltre alla ricerca nel database, l'app ha il **modulo di valutazione**, gemello
di quello del Direttore di SportHub:

- Da una scheda giocatore → **"📝 Nuovo report scouting"**: si apre un form già
  precompilato (nome, età, squadra, ruolo, valore) dove assegni i **22 attributi
  1–10** (10 tecnici + 12 fisico/mentali; per i portieri set dedicato), la
  **considerazione** (Non idoneo → Fortemente consigliato), un **voto** e le note.
  Scrivendo "Portiere" (o sinonimi) nel campo **Ruolo primario** ed uscendo dal campo,
  gli attributi passano da soli al set dedicato ai portieri — nessun interruttore da girare.
- Il pulsante **"📝 Report scouting"** in alto mostra tutti i report salvati.
  **Clicca su una scheda** per aprirla: vedi tutti i dati, il giudizio, il voto e
  **due grafici radar** (uno per gli attributi tecnici in blu, uno per fisico/mentale
  in verde) con il dettaglio numerico colorato sotto ciascuno. Se un giocatore ha più
  sessioni di valutazione nel tempo, in fondo trovi lo **storico** cliccabile per
  passare da una sessione all'altra senza uscire dalla scheda.
  Da qui puoi anche modificare, eliminare o generare il **PDF** (stesso stile SportHub).
- **"🆕 Nuova valutazione"**: dalla scheda di un giocatore già valutato, apre il form
  precompilato con la sua anagrafica (nome, squadra, ruolo...) ma con una sessione
  **nuova e vuota** (data di oggi, attributi da rivalutare da capo) — utile per
  aggiornare la valutazione di un giocatore già seguito senza perdere lo storico.
- **Le date** (nascita e data di osservazione) si scrivono in tre caselle
  **GG / MM / AAAA**: scrivendo 2 cifre il cursore passa da solo al campo successivo
  (digiti "12" e passa al mese, digiti "03" e passa all'anno).
- I report sono salvati nel browser (localStorage): restano sul tuo computer.
- Il **PDF** si genera con "Anteprima/PDF" → nella finestra di stampa scegli
  "Salva come PDF".

## Chip "Dataset" — i giocatori inseriti a mano

Dentro **Filtri → Campionato**, accanto a "Serie A" e "Serie B", c'è il chip
**"Dataset"**: sono i giocatori che esistono **solo perché hai scritto un
report scouting per loro** (es. un U15, uno straniero non presente nel database),
uno per giocatore (l'ultima sessione di valutazione).

- Funziona **esattamente come Serie A/Serie B**: solo "Dataset" selezionato →
  vedi solo quelli; "Dataset" + "Serie A" → l'unione dei due; nessun chip →
  tutti insieme.
- Ruolo, età e valore sono dedotti da quanto hai scritto nel report; i campi
  mancanti mostrano "—", come già succede per la Serie B.
- Dalla scheda di uno di questi giocatori, **"Vedi report scouting"** apre la
  valutazione completa (radar inclusi).
- Se aggiungi o modifichi un report, tabella e dashboard si aggiornano da sole.

## Tema chiaro ad alto contrasto

L'app usa un unico tema chiaro con testo quasi nero e colori scuriti apposta per
essere leggibile anche in pieno sole o su schermi poco luminosi (contrasto conforme
alle linee guida di accessibilità WCAG AA).

## Personalizza: logo, firma allenatore, colore squadra

In alto a destra il pulsante **"Personalizza"** apre un piccolo pannello con:

- **Logo società**: "Carica logo" per scegliere un'immagine dal computer. Compare in
  alto accanto al titolo e nell'intestazione di ogni pagina del PDF. "Rimuovi" lo toglie.
  L'immagine viene rimpicciolita automaticamente, così non occupa lo spazio dei report.
- **Firma allenatore**: scrivi nome e cognome. Compare in fondo a ogni pagina del PDF.
- **Colore squadra**: scegli tra 8 colori. Diventa il colore di accento di tutta l'app
  (pulsanti attivi, numeri, grafici, barre dei valori) e del PDF. Sono tutti colori
  scuri, quindi le scritte restano sempre ben leggibili.

Come i report, anche logo, firma e colore restano salvati **solo nel browser** di chi
li imposta: ogni collaboratore può avere i suoi.

## Browser consigliato e installazione come app

Scout è pensata per **Google Chrome** (va bene anche Edge) **su computer**: solo lì i
report possono essere salvati in una cartella del dispositivo. Negli altri browser
compare un avviso e i report restano nel browser (con Esporta/Importa backup).

**Installarla come app (consigliato):** apri il link in Chrome → nella barra degli
indirizzi clicca l'icona **"Installa"** (o menu ⋮ → "Trasmetti, salva e condividi" →
"Installa pagina come app"). Scout avrà la sua icona e la sua finestra, si apre anche
senza internet e Chrome ricorda più facilmente il permesso sulla cartella dati.

## Privacy

- I report non lasciano mai il dispositivo: niente server, niente database online.
- L'app non usa statistiche, pubblicità, tracciamento o cookie.
- I caratteri tipografici sono inclusi nell'app: l'app non contatta Google Fonts né
  altri servizi esterni, quindi l'indirizzo IP di chi la usa non viene inviato a terzi.
- Il sito è ospitato su GitHub Pages, che come ogni hosting registra gli indirizzi IP
  delle visite.
- Chi compila i report (la società / lo scout) è titolare dei dati inseriti: per i
  minorenni servono base legale e informazione ai genitori, e il dispositivo va protetto
  (password, cifratura del disco).

## Cartella dati: i report salvati sul tuo dispositivo

Normalmente i report restano salvati solo nel browser. Puoi invece collegare una
**cartella del tuo computer** (es. `Documenti/Scout dati`): da quel momento ogni report
viene salvato lì come file, e l'app attinge da lì automaticamente.

**Come si fa:** Personalizza → Cartella dati → **"Scegli cartella"** → scegli o crea
la cartella → consenti l'accesso. Solo la prima volta.

- Ogni valutazione è un file `.json` con un nome leggibile, es.
  `Rossi-Mario_2026-10-01_r1abc.json`.
- All'apertura dell'app, e ogni volta che torni sulla sua scheda del browser, la
  cartella viene riletta da sola:
  - un file **copiato dentro** (anche ricevuto da un collega) compare nell'app;
  - un file **cancellato** dalla cartella sparisce anche dall'app.
- I report scritti prima di collegare la cartella vengono copiati dentro, nessuno si perde.
- Se a una nuova apertura il browser chiede di nuovo il permesso, in alto compare il
  pulsante **"Ricollega cartella"**: basta un click. Chrome propone anche
  "Consenti a ogni visita", che evita di chiederlo ogni volta.
- Quello che fai nel frattempo (nuovi report, eliminazioni) viene riportato nella
  cartella al momento in cui la ricolleghi.
- Nulla viene caricato online: i file restano solo sul tuo dispositivo. Per averli al
  sicuro anche altrove, puoi scegliere una cartella sincronizzata (iCloud Drive,
  Google Drive, Dropbox).

**Browser:** il collegamento alla cartella funziona su **Chrome, Edge, Brave e Opera da
computer**. Safari, Firefox, iPhone e iPad non lo permettono. Lì (e ovunque) restano:

- **Esporta backup**: scarica un unico file con tutti i report;
- **Importa backup o CSV**: lo ricarica, unendo senza cancellare nulla. Accetta anche un
  singolo report `.json` ricevuto da un collega o un CSV esportato da Scout.

## Cambio lingua (Italiano / English)

In alto a destra c'è il pulsante **"EN"** (o **"IT"** se sei già in inglese).
Cliccandolo, la pagina si ricarica nell'altra lingua: filtri, tabella, dashboard,
scheda giocatore e tutto il modulo report scouting passano a quella lingua.
I filtri che avevi impostato restano. La scelta resta salvata.

Il **PDF generato** resta con l'intestazione e le etichette di sezione in italiano
(es. "Anagrafica"), ma i nomi degli attributi seguono comunque la lingua scelta.

## Comodità

- **I filtri restano salvati**: chiudendo e riaprendo l'app ritrovi la stessa ricerca
  (il pulsante "Reset filtri" li azzera). Accanto a "Filtri" un numero indica quanti
  filtri sono attivi, utile quando il pannello è chiuso.
- **Tabella**: l'intestazione resta visibile mentre scorri; vengono mostrati 600
  giocatori per volta, con il pulsante **"Mostra altri"** per caricarne altri.
- **Da tastiera**: Tab per spostarsi su chip, intestazioni e righe; Invio per
  attivare/aprire; frecce su/giù per scorrere le righe; Esc per chiudere la scheda.
- **Esporta CSV**: esporta i giocatori filtrati, uno per riga, con **tutti i dati**:
  - anagrafica (nascita, età, nazionalità, altezza, peso, piede, ruoli, squadra,
    categoria, agente, contratto, valori);
  - statistiche del database (Elo, presenze, gol, assist, minuti, link Transfermarkt);
  - se il giocatore ha report scouting, l'**ultima valutazione**: data, scout, giudizio,
    voto, medie e **tutti i voti tecnici e fisico/mentali** (ci sono colonne separate
    per i portieri), più il numero di sessioni e le note.

  Il file si apre in Excel (italiano) già diviso in colonne, con accenti corretti e
  decimali con la virgola.

  **Il CSV serve anche da salvataggio**: se i report vengono cancellati per sbaglio,
  Personalizza → Cartella dati → **"Importa backup o CSV"** → scegli il CSV. I report
  vengono ricostruiti (anagrafica, giudizio, voto, tutti i voti, note). Va bene anche
  un CSV aperto e risalvato con Excel. Ricaricarlo più volte non crea doppioni.
  Attenzione: dal CSV si recupera l'**ultima** valutazione di ogni giocatore; per avere
  anche lo **storico di tutte le sessioni** usa "Esporta backup" (.json) o la cartella dati.

## File nella cartella

- `index.html`   → l'app (aprila con doppio click)
- `giocatori.js` → il database che l'app legge (generato da etl.py)
- `giocatori.json` → stessi dati in formato standard (per altri usi)
- `etl.py`       → lo script che unisce le fonti e crea il database
- `scouting_report.js` → il modulo di valutazione + generatore PDF (stile SportHub)
- `charts.js` → la libreria di grafici SVG usata dalla Dashboard
- `i18n.js` → il dizionario Italiano/English
- `branding.js` → logo, firma allenatore e colore squadra (menu "Personalizza")
- `folder_sync.js` → cartella dati sul dispositivo e backup dei report
- `fonts/` → caratteri tipografici inclusi (nessuna richiesta a Google)
- `manifest.webmanifest`, `sw.js`, `icons/` → installazione come app da Chrome e uso offline

## E la Serie C?

Nessuno dei due dataset gratuiti la contiene. Per averla servirebbe uno
scraping mirato di Transfermarkt (dove la Serie C c'è, divisa nei tre gironi):
è un lavoro a parte, più lento e da fare con cautela. Quando vuoi, si aggiunge
scrivendo un secondo script che produce righe con lo stesso schema di `etl.py`.
