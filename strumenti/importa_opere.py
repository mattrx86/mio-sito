#!/usr/bin/env python3
"""
IMPORTAZIONE MASSIVA DELLE OPERE  —  mattiariccadonna.com
=========================================================

Legge  importa/opere.csv  e le foto caricate in  importa/ , e per ogni riga:
  1. controlla i dati (campi obbligatori, misure, sezione, link di pagamento);
  2. sistema la foto: raddrizza (orientamento del telefono), toglie TUTTI i
     metadati (EXIF, GPS, modello di fotocamera), converte in JPG e riduce a
     max 2560 px sul lato lungo;
  3. crea la pagina  content/<sezione>/<indirizzo>.md  con titolo per Google,
     descrizione, testo alternativo, tag, dati strutturati e (se serve) prezzo;
  4. a fine lavoro toglie dal CSV le righe importate e cancella le loro foto
     da importa/, e scrive l'esito in  importa/ESITO.md .
Le righe con errori restano nel CSV (con le loro foto) da correggere.

Uso:
    python3 strumenti/importa_opere.py            # importa davvero
    python3 strumenti/importa_opere.py --prova    # mostra cosa farebbe, non tocca nulla

Il CSV può essere salvato da Excel (separatore ";" o ",", codifica UTF-8 o
Windows): lo script riconosce entrambi. Requisiti: Python 3.9+ e Pillow.
"""

import argparse
import csv
import io
import json
import os
import re
import sys
import unicodedata
from datetime import date, datetime
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Manca Pillow: installalo con  pip install pillow")

AUTORE = "Mattia Riccadonna"
LATO_MAX = 2560          # px, lato lungo massimo della foto salvata
QUALITA_JPG = 90
SEO_TITLE_MAX = 65
DESCRIZIONE_MAX = 160

SEZIONI = {
    "dipinti-recenti": "dipinti-recenti", "dipinti recenti": "dipinti-recenti",
    "recenti": "dipinti-recenti", "moderni": "dipinti-recenti", "quadri moderni": "dipinti-recenti",
    "archivio": "archivio", "vecchi": "archivio",
    "piccoli-quadri": "piccoli-quadri", "piccoli quadri": "piccoli-quadri", "vendita": "piccoli-quadri",
    "taccuino": "taccuino",
}
OBBLIGATORI = ["file_immagine", "sezione", "titolo", "tecnica", "larghezza_cm", "altezza_cm", "anno"]
COLONNE = OBBLIGATORI + [
    "soggetto", "luogo", "descrizione", "annotazioni", "collocazione", "prezzo",
    "link_pagamento", "spedizione", "tags", "data", "cornice_larghezza_cm",
    "cornice_altezza_cm", "coautori", "indirizzo", "sovrascrivi",
]
SINONIMI = {  # intestazioni alternative accettate
    "immagine": "file_immagine", "foto": "file_immagine", "file": "file_immagine",
    "larghezza": "larghezza_cm", "altezza": "altezza_cm",
    "cornice_larghezza": "cornice_larghezza_cm", "cornice_altezza": "cornice_altezza_cm",
    "tag": "tags", "slug": "indirizzo", "ubicazione": "collocazione",
}
TECNICHE_TAG = ["olio", "acrilico", "acquerello", "tempera", "pastello", "matita", "china", "carboncino", "tecnica-mista"]


# ----------------------------------------------------------------- utilità

def slug(testo: str) -> str:
    t = unicodedata.normalize("NFKD", testo).encode("ascii", "ignore").decode()
    t = re.sub(r"[^a-zA-Z0-9]+", "-", t).strip("-").lower()
    return re.sub(r"-{2,}", "-", t)


def numero(valore: str):
    """'30', '2,6', '2.6', '30 cm' -> float; None se non è un numero."""
    s = re.sub(r"[^0-9.,]", "", valore or "").replace(",", ".")
    return float(s) if re.fullmatch(r"\d+(\.\d+)?", s) else None


def fmt(n: float) -> str:
    """30.0 -> '30', 2.6 -> '2.6' (per YAML) """
    return str(int(n)) if float(n).is_integer() else f"{n:g}"


def fmt_it(n: float) -> str:
    return fmt(n).replace(".", ",")


def q(testo: str) -> str:
    """stringa YAML sicura (le stringhe JSON sono YAML valido)"""
    return json.dumps(testo, ensure_ascii=False)


def prima_minuscola(t: str) -> str:
    return t[:1].lower() + t[1:] if t else t


def maiuscola(t: str) -> str:
    return t[:1].upper() + t[1:] if t else t


def taglia(testo: str, limite: int) -> str:
    if len(testo) <= limite:
        return testo
    t = testo[: limite - 1].rsplit(" ", 1)[0].rstrip(",;:—- ")
    return t + "…"


def leggi_csv(percorso: Path):
    dati = percorso.read_bytes()
    for codifica in ("utf-8-sig", "cp1252"):
        try:
            testo = dati.decode(codifica)
            break
        except UnicodeDecodeError:
            continue
    prima = testo.splitlines()[0] if testo.strip() else ""
    sep = max([";", ",", "\t"], key=prima.count) if prima else ";"
    lettore = csv.reader(io.StringIO(testo), delimiter=sep)
    righe = list(lettore)
    if not righe:
        return [], [], sep
    intest = []
    for h in righe[0]:
        k = re.sub(r"\s+", "_", h.strip().lower())
        intest.append(SINONIMI.get(k, k))
    record = []
    for numero_riga, r in enumerate(righe[1:], start=2):
        if not any(c.strip() for c in r):
            continue
        d = {intest[i]: (r[i].strip() if i < len(r) else "") for i in range(len(intest))}
        record.append((numero_riga, d, r))
    return intest, record, sep


def data_iso(valore: str, anno: int) -> str:
    v = (valore or "").strip()
    for f in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y"):
        try:
            return datetime.strptime(v, f).date().isoformat()
        except ValueError:
            pass
    return f"{anno}-01-01"


# ----------------------------------------------------------------- foto

def trova_file(cartella: Path, nome: str):
    if not nome:
        return None
    esatto = cartella / nome
    if esatto.is_file():
        return esatto
    for f in cartella.iterdir():  # stesso nome con maiuscole/minuscole diverse
        if f.is_file() and f.name.lower() == nome.lower():
            return f
    return None


def prepara_foto(sorgente: Path, destinazione: Path, prova: bool) -> str:
    im = Image.open(sorgente)
    exif = im.getexif()
    orientata = exif.get(0x0112, 1) not in (1, None)
    gps = bool(exif.get_ifd(0x8825)) if exif else False
    grande = max(im.size) > LATO_MAX
    jpg = (im.format or "").upper() == "JPEG"
    note = []
    if gps:
        note.append("tolti i dati GPS")
    if exif:
        note.append(f"tolti {len(exif)} metadati EXIF")
    if not jpg:
        note.append(f"convertita da {im.format} a JPG")
    if grande:
        note.append(f"ridotta da {im.size[0]}×{im.size[1]} px")
    icc = im.info.get("icc_profile")
    non_srgb = False
    if icc:
        try:
            from PIL import ImageCms
            descr_icc = ImageCms.getProfileDescription(ImageCms.ImageCmsProfile(io.BytesIO(icc))).lower()
            non_srgb = "srgb" not in descr_icc and "iec61966" not in descr_icc
        except Exception:
            non_srgb = b"sRGB" not in icc
    if prova:
        if non_srgb:
            note.append("colori da convertire in sRGB")
        return ", ".join(note) or "copiata senza modifiche"
    destinazione.parent.mkdir(parents=True, exist_ok=True)
    if jpg and not exif and not grande and not non_srgb:
        destinazione.write_bytes(sorgente.read_bytes())   # già pulita: nessuna ricompressione
        return "copiata senza modifiche"
    if orientata:
        im = ImageOps.exif_transpose(im)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        sfondo = Image.new("RGB", im.size, "white")
        sfondo.paste(im, mask=im.split()[-1])
        im = sfondo
    elif im.mode != "RGB":
        im = im.convert("RGB")
    # profilo colore del telefono (es. Display P3) -> sRGB, lo standard del web:
    # Hugo e i browser mostrano così i colori giusti anche nelle versioni WebP
    if non_srgb:
        try:
            from PIL import ImageCms
            im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(io.BytesIO(icc)),
                                           ImageCms.createProfile("sRGB"), outputMode="RGB")
            note.append("colori convertiti in sRGB")
        except Exception as e:
            note.append(f"ATTENZIONE: conversione dei colori non riuscita ({e}), controlla la foto")
    if grande:
        im.thumbnail((LATO_MAX, LATO_MAX), Image.LANCZOS)
    im.save(destinazione, "JPEG", quality=QUALITA_JPG, optimize=True, progressive=True)  # senza exif
    return ", ".join(note) or "ricompressa"


# ----------------------------------------------------------------- pagina

def genera_pagina(d: dict, sez: str, nome_img: str, w: float, h: float, anno: int):
    titolo = d["titolo"].strip()
    tecnica = maiuscola(d["tecnica"].strip())
    tec_low = tecnica.lower()
    soggetto = d.get("soggetto", "").strip()
    luogo = d.get("luogo", "").strip()
    misure = f"{fmt_it(w)}x{fmt_it(h)}"   # per i testi, con la virgola: 2,6x3,5
    colloc = d.get("collocazione", "").strip().lower()
    prezzo = numero(d.get("prezzo", ""))
    link = d.get("link_pagamento", "").strip()
    in_vendita = sez == "piccoli-quadri" or bool(prezzo) or colloc == "in vendita"

    # --- titolo per Google
    sogg_luogo = ", ".join(x for x in (soggetto, luogo) if x)
    seo = ""
    if sogg_luogo:
        for cand in (f"{titolo}: {sogg_luogo}, {tec_low} {misure}",
                     f"{titolo}: {sogg_luogo}",
                     f"{titolo}: {soggetto}"):
            if len(cand) <= SEO_TITLE_MAX:
                seo = cand
                break
    if in_vendita and not seo:
        seo = taglia(f"{titolo} — quadro originale, {tec_low} {misure} cm", SEO_TITLE_MAX)

    # --- descrizione
    descr = d.get("descrizione", "").strip()
    if not descr:
        parti = [f"{tecnica}, {misure} cm, {anno}."]
        if soggetto:
            parti.append(maiuscola(soggetto) + (f" — {luogo}." if luogo else "."))
        elif luogo:
            parti.append(f"{maiuscola(luogo)}.")
        if in_vendita:
            parti.append("Quadro originale, pezzo unico firmato da Mattia Riccadonna.")
        else:
            parti.append("Opera di Mattia Riccadonna.")
            if colloc in ("collezione privata", "collezione dell'autore", "disponibile"):
                parti.append(maiuscola(colloc) + ".")
        descr = " ".join(parti)
    descr = taglia(descr, DESCRIZIONE_MAX)

    # --- tag
    tags = []
    for t in re.split(r"[,\s]+", d.get("tags", "")):
        if t.strip():
            tags.append(slug(t))
    for k in TECNICHE_TAG:
        if k.replace("-", " ") in tec_low and k not in tags:
            tags.insert(0, k)
    if str(anno) not in tags:
        tags.append(str(anno))

    # --- testo alternativo dell'immagine
    alt = f"{titolo}, {tec_low} {misure} cm, {AUTORE}, {anno}"
    if soggetto:
        alt = f"{titolo}: {soggetto}, {tec_low} {misure} cm, {AUTORE}, {anno}"

    # --- frontmatter
    fm = ["---",
          f"title: {q(f'{titolo} — {tecnica}, {anno}')}"]
    if seo:
        fm.append(f"seo_title: {q(seo)}")
    fm += [f"heading: {q(prima_minuscola(titolo))}",
           f"date: {data_iso(d.get('data', ''), anno)}",
           "hideDate: true",
           f"description: {q(descr)}",
           f"image: {q(f'/img/{sez}/{nome_img}')}",
           f"tags: [{', '.join(q(t) for t in tags)}]"]
    if colloc == "disponibile" and not in_vendita:
        fm.append("disponibile: true")
    cw, ch = numero(d.get("cornice_larghezza_cm", "")), numero(d.get("cornice_altezza_cm", ""))
    if cw and ch:
        fm += ["cornice:", f"  larghezza: {fmt(cw)}", f"  altezza: {fmt(ch)}"]
    fm += ["schema:",
           '  type: "VisualArtwork"',
           f"  artist: {q(AUTORE)}"]
    coautori = [c.strip() for c in re.split(r"[,;]", d.get("coautori", "")) if c.strip()]
    if coautori:
        fm.append(f"  coautori: [{', '.join(q(c) for c in coautori)}]")
    fm += [f"  medium: {q(tecnica)}",
           f'  width: "{fmt(w)}"',
           f'  height: "{fmt(h)}"',
           f'  dateCreated: "{anno}"']
    if in_vendita:
        fm += ["vendita:", '  stato: "disponibile"']
        if prezzo:
            fm.append(f"  prezzo: {fmt(prezzo)}")
        if link:
            fm.append(f"  link_pagamento: {q(link)}")
        sped = d.get("spedizione", "").strip()
        if sped:
            fm.append(f"  spedizione: {q(sped)}")
    fm.append("---")

    # --- corpo
    corpo = ["", f"![{alt}](/img/{sez}/{nome_img})", "",
             f"**tecnica:** {tec_low}  ",
             f"**anno produzione:** {anno}  ",
             f"**dimensioni:** {fmt_it(w)}x{fmt_it(h)} cm  "]
    if colloc and colloc != "in vendita":
        corpo.append(f"**ubicazione:** {colloc}  ")
    if coautori:
        corpo.append(f"**con:** {', '.join(coautori)}  ")
    corpo += ["", "{{< navquadro >}}"]
    note = d.get("annotazioni", "").strip()
    if note:
        corpo += ["", "---", "", f"**annotazioni:** {note}"]
    return "\n".join(fm + corpo) + "\n", seo, descr


# ----------------------------------------------------------------- principale

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--sito", default=".", help="cartella del sito (default: quella corrente)")
    ap.add_argument("--cartella", default="importa", help="cartella con CSV e foto (default: importa)")
    ap.add_argument("--csv", default="opere.csv", help="nome del file CSV (default: opere.csv)")
    ap.add_argument("--prova", action="store_true", help="non scrive nulla, mostra solo cosa farebbe")
    a = ap.parse_args()

    sito = Path(a.sito).resolve()
    cart = sito / a.cartella
    percorso_csv = cart / a.csv
    if not percorso_csv.is_file():
        print(f"Nessun file {percorso_csv.relative_to(sito)}: niente da importare.")
        return 0
    intest, record, sep = leggi_csv(percorso_csv)
    if not record:
        print("Il CSV non contiene righe da importare.")
        return 0
    mancanti = [c for c in OBBLIGATORI if c not in intest]
    if mancanti:
        msg = f"Nel CSV mancano le colonne obbligatorie: {', '.join(mancanti)}"
        scrivi_esito(cart, [], [(1, "intestazione", [msg])], a.prova)
        print(msg)
        return 1

    ok, errori, rimaste, foto_usate = [], [], [], []
    indirizzi_usati = set()
    for n, d, grezza in record:
        err = []
        for c in OBBLIGATORI:
            if not d.get(c):
                err.append(f"manca «{c}»")
        sez = SEZIONI.get(d.get("sezione", "").strip().lower())
        if d.get("sezione") and not sez:
            err.append(f"sezione «{d['sezione']}» non valida (usa: dipinti-recenti, archivio, piccoli-quadri, taccuino)")
        w, h = numero(d.get("larghezza_cm", "")), numero(d.get("altezza_cm", ""))
        if d.get("larghezza_cm") and not w:
            err.append(f"larghezza_cm «{d['larghezza_cm']}» non è un numero")
        if d.get("altezza_cm") and not h:
            err.append(f"altezza_cm «{d['altezza_cm']}» non è un numero")
        anno = None
        if d.get("anno"):
            m = re.fullmatch(r"(\d{4})", d["anno"].strip())
            if m and 1950 <= int(m.group(1)) <= date.today().year + 1:
                anno = int(m.group(1))
            else:
                err.append(f"anno «{d['anno']}» non valido (scrivi 4 cifre, es. 2026)")
        if d.get("prezzo") and not numero(d["prezzo"]):
            err.append(f"prezzo «{d['prezzo']}» non è un numero")
        link = d.get("link_pagamento", "").strip()
        if link and not link.startswith("https://buy.stripe.com/"):
            err.append("link_pagamento deve iniziare con https://buy.stripe.com/")
        sorgente = trova_file(cart, d.get("file_immagine", ""))
        if d.get("file_immagine") and not sorgente:
            err.append(f"foto «{d['file_immagine']}» non trovata nella cartella {a.cartella}/")
        elif sorgente:
            try:
                Image.open(sorgente).verify()
            except Exception:
                err.append(f"«{sorgente.name}» non è un'immagine leggibile")
        indirizzo = slug(d.get("indirizzo") or d.get("titolo", ""))
        sovrascrivi = d.get("sovrascrivi", "").strip().lower() in ("si", "sì", "s", "x", "1", "true", "yes")
        if sez and indirizzo:
            pagina = sito / "content" / sez / f"{indirizzo}.md"
            if pagina.exists() and not sovrascrivi:
                err.append(f"esiste già la pagina {sez}/{indirizzo}: cambia titolo, compila «indirizzo» "
                           f"oppure scrivi «si» in «sovrascrivi» per aggiornarla")
            if (sez, indirizzo) in indirizzi_usati:
                err.append(f"due righe con lo stesso indirizzo «{indirizzo}» nel CSV")
        if err:
            errori.append((n, d.get("titolo") or d.get("file_immagine") or "?", err))
            rimaste.append(grezza)
            continue

        indirizzi_usati.add((sez, indirizzo))
        nome_img = f"{indirizzo}.jpg"
        img_dest = sito / "static" / "img" / sez / nome_img
        try:
            nota_foto = prepara_foto(sorgente, img_dest, a.prova)
        except Exception as e:  # foto corrotta o formato non gestito
            errori.append((n, d["titolo"], [f"errore nella foto: {e}"]))
            rimaste.append(grezza)
            continue
        testo, seo, descr = genera_pagina(d, sez, nome_img, w, h, anno)
        dest_md = sito / "content" / sez / f"{indirizzo}.md"
        if not a.prova:
            dest_md.parent.mkdir(parents=True, exist_ok=True)
            dest_md.write_text(testo, encoding="utf-8")
            foto_usate.append(sorgente)
        ok.append((n, d["titolo"], f"/{sez}/{indirizzo}/", nota_foto, seo, descr))

    # pulizia della cartella importa/
    if not a.prova:
        for f in foto_usate:
            if f.exists() and all(f != trova_file(cart, r[intest.index("file_immagine")]) for r in rimaste
                                  if len(r) > intest.index("file_immagine")):
                f.unlink()
        buf = io.StringIO()
        wr = csv.writer(buf, delimiter=sep, lineterminator="\r\n")
        wr.writerow(record_intestazione(percorso_csv, sep))
        for r in rimaste:
            wr.writerow(r)
        percorso_csv.write_text(buf.getvalue(), encoding="utf-8-sig")
    scrivi_esito(cart, ok, errori, a.prova)

    print(f"Importate: {len(ok)}   Con errori: {len(errori)}")
    for n, t, url, nota, seo, descr in ok:
        print(f"  ✓ riga {n}: {t} -> {url}  ({nota})")
    for n, t, errs in errori:
        print(f"  ✗ riga {n}: {t}: " + "; ".join(errs))
    return 0


def record_intestazione(percorso: Path, sep: str):
    testo = percorso.read_bytes()
    for cod in ("utf-8-sig", "cp1252"):
        try:
            return next(csv.reader(io.StringIO(testo.decode(cod)), delimiter=sep))
        except UnicodeDecodeError:
            continue
    return COLONNE


def scrivi_esito(cart: Path, ok, errori, prova):
    righe = [f"# Esito importazione — {datetime.now().strftime('%d/%m/%Y %H:%M')}", ""]
    if ok:
        righe += [f"## ✓ Importate ({len(ok)})", ""]
        for n, t, url, nota, seo, descr in ok:
            righe += [f"- **{t}** → https://mattiariccadonna.com{url}",
                      f"  - foto: {nota}",
                      f"  - titolo per Google: {seo or '(standard)'}",
                      f"  - descrizione: {descr}"]
        righe.append("")
    if errori:
        righe += [f"## ✗ Da correggere ({len(errori)})", "",
                  "Queste righe sono rimaste in `opere.csv` con le loro foto: correggile e ricarica il CSV.", ""]
        for n, t, errs in errori:
            righe.append(f"- riga {n} — **{t}**: " + "; ".join(errs))
        righe.append("")
    if not ok and not errori:
        righe.append("Niente da importare.")
    testo = "\n".join(righe) + "\n"
    if prova:
        print(testo)
    else:
        (cart / "ESITO.md").write_text(testo, encoding="utf-8")
    riepilogo = os.environ.get("GITHUB_STEP_SUMMARY")
    if riepilogo and not prova:
        with open(riepilogo, "a", encoding="utf-8") as f:
            f.write(testo)


if __name__ == "__main__":
    sys.exit(main())
