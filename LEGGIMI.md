# Come aggiornare il sito — guida rapida

Il sito è fatto con **Hugo** e viene pubblicato da **Netlify** in automatico
a ogni modifica sul branch `main` di GitHub (1-2 minuti). Se la build fallisce,
online resta la versione precedente: niente va perso.

Tutto si può fare **da browser** su https://github.com/mattrx86/mio-sito

---

## 0. Il modo più veloce: caricamento massivo

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

### Il mosaico in scala

In cima ad **archivio** e **dipinti recenti** c'è il mosaico con tutte le
opere **in scala reale tra loro**. Si aggiorna da solo a ogni pubblicazione,
a due condizioni per ogni opera:
- `image` deve puntare a una foto esistente;
- `schema.width` e `schema.height` devono contenere larghezza e altezza
  **in cm** (numeri, anche decimali: `"2.6"`).

Se manca uno dei due, l'opera viene esclusa dal mosaico (resta nell'elenco)
e nel log della build Netlify compare un avviso `[mosaico]`.
La foto viene mostrata intera, cornice compresa (nessun ritaglio): la
tessera ha la proporzione della foto e la stessa superficie in scala della
tela. Conviene fotografare il quadro dritto, con poco sfondo intorno
(lo sfondo entra nel mosaico).
Se la foto comprende una **cornice grande** (oro, passe-partout...), la
tessera sembra più piccola del vero rispetto ai quadri con cornici sottili.
Per avere la scala esatta aggiungi le misure ESTERNE della cornice in cm:

```
cornice:
  larghezza: 90
  altezza: 70
```

L'ordine delle tessere lo decide il sito: sceglie in automatico la
disposizione che lascia meno spazi bianchi (non quella cronologica, che
resta nell'elenco sotto il mosaico).

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
