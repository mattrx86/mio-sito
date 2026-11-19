# Come aggiornare il sito — guida rapida

Il sito è fatto con **Hugo** e viene pubblicato da **Netlify** in automatico
a ogni modifica sul branch `main` di GitHub (1-2 minuti). Se la build fallisce,
online resta la versione precedente: niente va perso.

Tutto si può fare **da browser** su https://github.com/mattrx86/mio-sito

---

## Il modo più comodo: il pannello delle opere

Apri **https://mattiariccadonna.com/admin/** (meglio da computer, funziona
anche da telefono). Vedi tutte le opere di archivio, dipinti recenti e
piccoli quadri con le miniature: cerchi, filtri (olio, acrilico, acquerello,
copie d'autore, disponibili), ordini per data, titolo o anno e raggruppi
per anno. Apri un'opera, cambi quello che serve, **Salva**: il sito si
aggiorna da solo in 1-2 minuti. Con **Nuovo** crei un'opera da zero
caricando la foto dal pannello: viene convertita in WebP, ridotta a 2560 px
e ripulita dai dati EXIF/GPS.

Accesso: **Accedi con token** e incolla il tuo token GitHub (vedi sotto).
Il token resta salvato solo in quel browser: usalo solo su dispositivi tuoi.

### Creare il token GitHub (una volta sola)
1. github.com → foto profilo → **Settings** → **Developer settings** →
   **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Nome: `pannello sito`. Scadenza: 1 anno (poi lo rigeneri).
3. **Repository access → Only select repositories → mattrx86/mio-sito**.
4. **Permissions → Repository permissions → Contents: Read and write**
   (Metadata: Read-only si attiva da solo).
5. **Generate token**, copialo subito (non viene più mostrato) e incollalo
   nel pannello. Se lo perdi o temi che qualcuno l'abbia visto: GitHub →
   stessa pagina → **Revoke**, poi ne crei un altro.

Le note sono in Markdown "grezzo": le parti speciali restano come sono
(es. `{.riquadro}` su una riga sotto un paragrafo = riquadro marrone).

### Tecniche e tag: si sceglie dall'elenco (Vocabolario)
I campi **Tecnica** e **Tag** delle opere non si scrivono a mano: si sceglie
da un elenco (così non nascono varianti come «Olio su tela» / «olio su tela»
o «Rango» / «rango»). L'elenco è nella voce **Vocabolario (tecniche e tag)**
del pannello. Per una tecnica o un tag nuovo: apri il Vocabolario, aggiungi
la voce (tecniche con la maiuscola iniziale, tag minuscoli con il trattino,
es. `natura-morta`), **Salva**, poi usala nell'opera. L'elenco è il file
`data/vocabolario.yml`.

### La tabella: modifiche in blocco
**https://mattiariccadonna.com/admin/tabella/** (salvala tra i preferiti; usa
lo stesso accesso del pannello, se sei già entrato in quel browser, altrimenti
chiede il token). Mostra tutte le opere in una griglia modificabile:
titolo, tecnica, anno, n° nell'anno, data, misure, dove si trova, disponibile,
tag, bozza.
- Cambi una cella e diventa **gialla**. **Rosso** = valore non valido,
  **arancio** = da controllare (due opere con la stessa data, tecnica o tag
  fuori elenco).
- **Cerca**, filtra per sezione, anno, tecnica o «solo con problemi»; clic
  sull'intestazione di una colonna per ordinare. Invio scende alla riga sotto.
- **Selezioni più righe** (casella a sinistra) e usi «Azione sulle selezionate»:
  aggiungi/togli un tag, imposta tecnica, collocazione, anno, disponibile,
  bozza, oppure **numera in sequenza** (n° 1, 2, 3… nell'ordine mostrato,
  ricominciando a ogni anno; 1 = la prima dipinta: ordina prima per data
  crescente).
- L'ordine sul sito dipende dalla **data**: cambiando «n°» o «anno» la data si
  aggiorna da sola (1 gennaio + n° − 1 giorni). Sul sito si vede solo l'anno.
- **Rivedi e salva…** mostra l'elenco di tutto ciò che cambia (prima → dopo)
  e fa **un solo salvataggio** su GitHub. Se nel frattempo un'opera è
  cambiata altrove (es. dal pannello), non salva e ti chiede di ricaricare.
- I tag nuovi li crea la tabella stessa, ma solo dopo la tua conferma, e se
  sono quasi uguali a uno esistente ti propone quello.
- **Scarica CSV** esporta una copia per Excel (non cambia nulla).
- Sicurezza: la pagina può parlare solo con api.github.com (blocco nel
  codice della pagina), il token resta nel browser, ed è esclusa da Google.

---

## 0. Caricamento massivo con il CSV

Per aggiungere tante opere insieme: compila `importa/opere.csv` (una riga
per opera) e carica CSV e foto nella cartella `importa/`. Il sito crea da
solo pagine, testi per Google, mosaico e foto ottimizzate.
Istruzioni complete e significato delle colonne: **`importa/LEGGIMI.md`**.

I punti seguenti servono per fare le cose a mano, una per una.

---

## 1. Caricare un'immagine

1. Vai nella cartella giusta dentro `static/img/`:
   - `static/img/archivio/` → opere 1999–2007
   - `static/img/dipinti-recenti/` → opere dal 2024
   - `static/img/piccoli-quadri/` → quadretti in vendita
   - `static/img/taccuino/` → schizzi e disegni
2. **Add file → Upload files**, trascina il JPG, **Commit changes**.

Consigli:
- JPG, lato lungo 1200–2000 px. Il sito crea da solo le versioni WebP leggere
  (800 e 1600 px), quindi non serve comprimerle a mano.
- Nome file in minuscolo, senza spazi né accenti: `malga-bleggio-2026.jpg`.
- Le foto dal telefono possono contenere la **posizione GPS**: prima di
  caricarle toglila (su Windows: tasto destro sul file → Proprietà →
  Dettagli → "Rimuovi proprietà e informazioni personali").

---

## 2. Aggiungere un'opera (archivio o dipinti recenti)

1. Vai in `content/archivio/` oppure `content/dipinti-recenti/`.
2. Apri un'opera esistente simile, copia tutto il testo.
3. Torna nella cartella: **Add file → Create new file**, nome tipo
   `titolo-opera.md` (minuscolo, trattini), incolla e modifica.
4. Campi importanti nel frontmatter (la parte tra le due righe `---`):
   - `title`: "Titolo — Tecnica, anno" (compare su Google)
   - `heading`: il titolo corto mostrato nella pagina
   - `description`: 120–160 caratteri, con tecnica, misure, anno e soggetto
   - `image`: percorso dell'immagine principale
   - `tags`: usa quelli già esistenti (olio, paesaggio, trentino, anno...)
   - `schema`: misure in **cm** (una miniatura di 30 mm → `"3"`)
   - `disponibile: true` → compare "disponibile, scrivimi"
5. **Commit changes**.

### Il mosaico delle opere

In cima ad **archivio** e **dipinti recenti** c'è il mosaico con tutte le
opere, come quadri appesi a una parete: **tutte alte uguali** (non in
scala), foto intera con la cornice, righe centrate, **nello stesso ordine
dell'elenco** sotto (dalla più recente). Si aggiorna da solo a ogni
pubblicazione: basta che `image` punti a una foto esistente. Se manca, l'opera
viene esclusa dal mosaico (resta nell'elenco) e nel log della build Netlify
compare un avviso `[mosaico]`.
Conviene fotografare il quadro dritto, con poco sfondo intorno (lo sfondo
entra nel mosaico). Le misure in cm (`schema.width` / `schema.height`)
servono per l'etichetta e per Google, non per la grandezza della miniatura.
L'altezza delle miniature si regola in `layouts/partials/mosaico.html`
(`$altezza`, `$altezzaMobile`) e in `assets/css/override.css` (`.mosaico-tessera`).
Se la foto principale ha molto sfondo intorno (es. una miniatura su un
foglio bianco), si può dare al mosaico una foto ritagliata a parte:
`miniatura_mosaico: "/img/dipinti-recenti/nome-mosaico.jpg"`.
La voce `cornice:` nel frontmatter non è più usata dal mosaico (si può
lasciare, non dà fastidio).

Per attivare il mosaico in un'altra sezione: aggiungi `mosaico: true` nel
suo `_index.md`.

---

## 3. Mettere in vendita un piccolo quadro

### a) Creare il link di pagamento su Stripe (una volta per quadro)

1. Accedi a https://dashboard.stripe.com → **Link di pagamento** → **+ Nuovo**.
2. **Aggiungi un prodotto**: nome del quadro, foto, prezzo (es. 100 €),
   **pagamento una tantum**.
3. Nelle opzioni:
   - **Limita il numero di pagamenti** → `1` (è un pezzo unico: dopo la
     vendita il link si disattiva da solo). Con "Cambia messaggio di
     disattivazione" scrivi per esempio "Questo quadro è già stato venduto".
   - **Raccogli l'indirizzo del cliente** → indirizzo di spedizione, Italia
     (o i paesi in cui spedisci).
   - **Dopo il pagamento** → "Reindirizza i clienti al tuo sito" →
     `https://mattiariccadonna.com/piccoli-quadri/`.
4. **Crea link** e copia l'indirizzo, che inizia con `https://buy.stripe.com/`.

### b) Creare la scheda sul sito

1. Carica la foto in `static/img/piccoli-quadri/`.
2. Vai in `content/piccoli-quadri/` → **Add file → Create new file**,
   nome tipo `malga-al-tramonto.md`.
3. Copia il modello da `archetypes/piccoli-quadri.md` (oppure dal file
   `esempio-da-copiare.md`) e compila tutto. Le parti tipo
   `{{ now.Format "2006" }}` vanno sostituite con l'anno, per esempio `2026`.
   Nel blocco `vendita` incolla il link Stripe in `link_pagamento`.
4. **Togli la riga `draft: true`** se l'hai copiata dall'esempio.
5. **Commit changes**.

Il pulsante "acquista ora" compare solo se il link inizia con
`https://buy.stripe.com/`: è una protezione contro link sbagliati.

### c) Quando un quadro viene venduto

1. Stripe ti manda una email con nome e indirizzo di spedizione.
2. Nel file del quadro cambia `stato: "disponibile"` in `stato: "venduto"`.
   La scheda resta online con la scritta "venduto" (utile come vetrina).

### d) Prima apertura della sezione

La sezione `content/piccoli-quadri/_index.md` e la pagina
`content/come-acquistare.md` sono in **bozza** (`draft: true`): non sono
pubblicate e la voce del menu resta nascosta. Quando hai almeno un quadro:
1. completa tutte le parti `[DA COMPLETARE]` (spedizione, resi, autenticità);
2. togli `draft: true` da entrambi i file;
3. commit: la voce "piccoli quadri in vendita" compare da sola nel menu.

---

## 4. Mostre e concorsi

Modifica `content/mostre-e-concorsi/_index.md`. Ogni evento è un titolo
`## anno — nome {#codice}`: il `{#codice}` permette di linkarlo dalle opere,
per esempio `[Premio di Rango](/mostre-e-concorsi/#premio-rango-2025)`.

---

## 5. Menu

`data/menu.toml`: ogni `[[entries]]` è una voce. Se una voce punta a una
pagina non pubblicata (bozza), viene nascosta in automatico.

---

## Struttura cartelle

```
mio-sito/
├── hugo.toml                 ← configurazione (titolo, descrizione, profili social)
├── netlify.toml              ← build, redirect 301, header di sicurezza
├── archetypes/
│   └── piccoli-quadri.md     ← modello per un nuovo quadro in vendita
├── assets/css/override.css   ← stile aggiuntivo (galleria, vendita, griglia)
├── data/menu.toml            ← menu della home
├── content/
│   ├── _index.md             ← home
│   ├── chi-sono/
│   ├── archivio/             ← opere 1999–2007
│   ├── dipinti-recenti/      ← opere dal 2024
│   ├── piccoli-quadri/       ← quadretti in vendita (sezione in bozza)
│   ├── taccuino/             ← schizzi
│   ├── mostre-e-concorsi/
│   ├── rassegna-stampa/
│   ├── blog/
│   ├── contatti.md
│   └── come-acquistare.md    ← (bozza) pagamento, spedizione, resi
├── layouts/                  ← template (modificare con cautela)
│   ├── partials/head.html    ← titoli, description, dati strutturati
│   ├── partials/vendita.html ← blocco prezzo / acquista / disponibile
│   ├── partials/correlate.html ← "potrebbe interessarti"
│   └── shortcodes/galleria.html ← galleria con miniature
└── static/
    ├── robots.txt
    └── img/                  ← tutte le immagini originali
```

## Galleria con più foto

Nel testo di un'opera, al posto di una singola immagine:

```
{{< galleria >}}
/img/dipinti-recenti/nome-1.jpg | Titolo, vista frontale
/img/dipinti-recenti/nome-2.jpg | Titolo, dettaglio
{{< /galleria >}}
```

## Trittico: 2-3 foto verticali affiancate

Per mostrare foto verticali una accanto all'altra (stessa altezza, nessun
ritaglio, didascalia piccola sotto). Una riga per foto:
`percorso | testo alternativo (per Google) | didascalia breve`

```
{{< trittico >}}
/img/taccuino/studio/a.jpg | Studio da Salvo in lavorazione, forme stese in grigio | studio da Salvo in lavorazione
/img/taccuino/studio/b.jpg | Chiaro di luna sul cavalletto con il disegno a vista | chiaro di luna sul cavalletto
{{< /trittico >}}
```
