# Come aggiornare il sito — guida rapida

## Aggiungere un nuovo dipinto/acquerello

### Da browser (da remoto, senza installare niente)

1. Vai su https://github.com/mattrx86/mio-sito
2. Naviga nella cartella giusta:
   - `content/archivio/` → per i vecchi dipinti (2002–2007)
   - `content/studio/` → per acquerelli e bozzetti recenti
   - `content/illustrazione/` → per illustrazioni
   - `content/blog/` → per post e note
3. Clicca **"Add file" → "Create new file"**
4. Dai un nome tipo `titolo-opera-anno.md`
5. Incolla questo template e compilalo:

```
---
title: "titolo del dipinto"
date: 2025-07-24
tags: ["acquerello", "paesaggio"]
---

![Descrizione immagine](/img/studio/nome-file-immagine.jpg)

**Tecnica:** acquerello su carta  
**Dimensioni:** 30 × 40 cm  
**Anno:** 2025  

---

Scrivi qui la tua descrizione, storia, note sul processo...

---

**Cosa succedeva:** (facoltativo — solo per le opere d'archivio)
```

6. Clicca **"Commit changes"** — Netlify pubblica automaticamente in 1-2 minuti.

### Caricare un'immagine da browser

1. Vai su `static/img/studio/` (o `archivio/`)
2. Clicca **"Add file" → "Upload files"**
3. Trascina il file JPG
4. Commit — fatto!

**Consiglio:** usa JPG, larghezza massima 1400px, peso sotto 500kb. 
Puoi ridimensionare gratis su https://squoosh.app

---

## Struttura cartelle

```
mio-sito/
├── hugo.toml              ← configurazione principale
├── netlify.toml           ← configurazione deploy
├── data/
│   └── menu.toml          ← menu del sito (modificabile)
├── content/
│   ├── _index.md          ← home page
│   ├── contatti.md        ← pagina contatti
│   ├── archivio/          ← dipinti 2002-2007
│   ├── studio/            ← lavori recenti
│   ├── illustrazione/     ← illustrazioni
│   └── blog/              ← note e articoli
├── static/
│   └── img/               ← tutte le immagini
│       ├── archivio/
│       └── studio/
└── assets/css/
    └── extended.css       ← font e stile personalizzato
```

---

## Font utilizzati

- **Space Mono** — titoli, menu, metadati (tono archivistico/nerd)
- **Instrument Serif** — testi lunghi (leggibilità)

---

## Aggiornare il menu

Modifica `data/menu.toml` — è leggibile come un elenco, 
ogni `[[entries]]` è una voce, `[[entries.entries]]` è una sottovoce.
