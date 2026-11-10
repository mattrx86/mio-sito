---
# ===== MODELLO PER UN NUOVO PICCOLO QUADRO IN VENDITA =====
# Compila i campi tra virgolette. Le righe che iniziano con # sono note.
# Titolo per Google: SOGGETTO + LUOGO — quadro originale a olio + MISURE
# (le persone cercano "quadro", il luogo e le misure, non il titolo poetico)
title: "Malga del Bleggio — quadro originale a olio 15x15 cm"
# Titolo mostrato nella pagina: può restare poetico
heading: "titolo del quadro"
date: {{ now.Format "2006-01-02" }}
hideDate: true
# 120-160 caratteri: tecnica, misure, anno, soggetto e luogo, + solo cose vere
# tra: pezzo unico, firmato, certificato di autenticità, pronto da appendere
description: "Quadro originale a olio su tavola, 15x15 cm, {{ now.Format "2006" }}: malga del Bleggio nella luce del mattino. Pezzo unico firmato da Mattia Riccadonna."
image: "/img/piccoli-quadri/nome-file.jpg"
tags: ["olio", "paesaggio", "trentino", "{{ now.Format "2006" }}"]
schema:
  type: "VisualArtwork"
  artist: "Mattia Riccadonna"
  medium: "Olio su tavola"
  width: "15"
  height: "15"
  dateCreated: "{{ now.Format "2006" }}"
vendita:
  # disponibile | riservato | venduto
  stato: "disponibile"
  prezzo: 100
  # Link creato in Stripe con "Limita il numero di pagamenti" = 1
  link_pagamento: "https://buy.stripe.com/INCOLLA-QUI-IL-LINK"
  spedizione: "Spedizione tracciata in Italia inclusa"
---

![Malga del Bleggio, quadro originale a olio su tavola 15x15 cm, Mattia Riccadonna, {{ now.Format "2006" }}](/img/piccoli-quadri/nome-file.jpg)

**tecnica:** olio su tavola  
**anno produzione:** {{ now.Format "2006" }}  
**dimensioni:** 15x15 cm  

{{"{{"}}< navquadro >{{"}}"}}

---

**annotazioni:** due o tre frasi sul soggetto, sul luogo e su come è nato il quadro. Nomina il luogo (paese, valle, montagna): è quello che le persone cercano.
