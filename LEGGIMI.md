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
- **Esporta CSV**: il file si apre in Excel (italiano) già diviso in colonne e con
  le lettere accentate corrette.

## File nella cartella

- `index.html`   → l'app (aprila con doppio click)
- `giocatori.js` → il database che l'app legge (generato da etl.py)
- `giocatori.json` → stessi dati in formato standard (per altri usi)
- `etl.py`       → lo script che unisce le fonti e crea il database
- `scouting_report.js` → il modulo di valutazione + generatore PDF (stile SportHub)
- `charts.js` → la libreria di grafici SVG usata dalla Dashboard
- `i18n.js` → il dizionario Italiano/English
- `branding.js` → logo, firma allenatore e colore squadra (menu "Personalizza")

## E la Serie C?

Nessuno dei due dataset gratuiti la contiene. Per averla servirebbe uno
scraping mirato di Transfermarkt (dove la Serie C c'è, divisa nei tre gironi):
è un lavoro a parte, più lento e da fare con cautela. Quando vuoi, si aggiunge
scrivendo un secondo script che produce righe con lo stesso schema di `etl.py`.
