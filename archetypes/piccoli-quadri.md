---
# ===== MODELLO PER UN NUOVO PICCOLO QUADRO IN VENDITA =====
# Compila i campi tra virgolette. Le righe che iniziano con # sono note.
title: "Titolo del quadro — Olio su tavola, {{ now.Format "2006" }}"
heading: "titolo del quadro"
date: {{ now.Format "2006-01-02" }}
hideDate: true
description: "Olio su tavola, 15x15 cm, {{ now.Format "2006" }}. Breve descrizione del soggetto (dove, cosa, che luce). Pezzo unico firmato da Mattia Riccadonna."
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

![Titolo del quadro, olio su tavola 15x15 cm, Mattia Riccadonna, {{ now.Format "2006" }}](/img/piccoli-quadri/nome-file.jpg)

**tecnica:** olio su tavola  
**anno produzione:** {{ now.Format "2006" }}  
**dimensioni:** 15x15 cm  

{{"{{"}}< navquadro >{{"}}"}}

---

**annotazioni:** due o tre frasi sul soggetto, sul luogo e su come è nato il quadro.
