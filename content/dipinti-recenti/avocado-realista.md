---
title: "Avocado realista! — Olio su masonite, 2025 | Mattia Riccadonna"
heading: "avocado realista!"
date: 2025-07-14
hideDate: true
description: "Olio su pannello in masonite, 12x12cm. Avocado con tecnica realista su pannello in legno e foglio di giornale dipinto nel 2025"
tags: ["olio", "natura-morta", "2025"]
---

<div class="gallery">
  <img src="/img/dipinti-recenti/avocado-1.jpg" alt="Avocado realista, vista frontale">
  <img src="/img/dipinti-recenti/avocado-2.jpg" alt="Avocado realista, cornice">
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  var g = document.querySelector('.gallery');
  if (!g) return;
  var imgs = Array.from(g.querySelectorAll('img'));
  if (imgs.length < 2) return;
  var main = document.createElement('img');
  main.src = imgs[0].src;
  main.alt = imgs[0].alt;
  main.style.cssText = 'max-height:500px;width:auto;max-width:100%;display:block;margin:0 0 1rem 0;';
  var thumbs = document.createElement('div');
  thumbs.style.cssText = 'display:flex;gap:0.5rem;justify-content:flex-start;margin-bottom:1.5rem;';
  imgs.forEach(function(img, i) {
    var t = document.createElement('img');
    t.src = img.src;
    t.alt = img.alt;
    t.style.cssText = 'width:60px;height:60px;object-fit:cover;cursor:pointer;opacity:' + (i === 0 ? '1' : '0.4') + ';transition:opacity 0.2s;';
    t.addEventListener('click', function() {
      main.src = t.src;
      main.alt = t.alt;
      thumbs.querySelectorAll('img').forEach(function(x) { x.style.opacity = '0.4'; });
      t.style.opacity = '1';
    });
    thumbs.appendChild(t);
  });
  g.innerHTML = '';
  g.appendChild(main);
  g.appendChild(thumbs);
});
</script>

**tecnica:** olio su masonite  
**anno produzione:** 2025  
**dimensioni:** 12x12 cm  
**ubicazione:** disponibile

---

**annotazioni:** opera realizzata su supporto creato incollando foglio di giornale su pannello in legno di masonite e utilizzandolo come base per la pittura ad olio