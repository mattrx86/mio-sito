# Caricamento massivo delle opere

In questa cartella metti **le foto** e il file **`opere.csv`** (una riga per
opera). Appena li carichi su GitHub, in 1-2 minuti il sito crea da solo le
pagine e le pubblica. L'esito lo trovi in **`ESITO.md`** (in questa cartella).

## Come si fa (da browser)

1. Apri `opere.csv` con Excel (o LibreOffice) e compila una riga per opera.
   Salva come **CSV UTF-8** (va bene anche il CSV normale di Excel).
2. Su GitHub apri la cartella `importa/` → **Add file → Upload files**.
3. Trascina **le foto** e **`opere.csv`** (sovrascrive quello vecchio).
4. **Commit changes**.
5. Dopo 1-2 minuti apri `importa/ESITO.md`: trovi i link alle pagine create
   e, se qualcosa non va, le righe da correggere.

Le righe importate vengono tolte dal CSV e le loro foto cancellate da
questa cartella (le foto sistemate vanno in `static/img/<sezione>/`).
Le righe con errori restano nel CSV insieme alle loro foto: correggi e
ricarica solo `opere.csv`.

## Le colonne

**Obbligatorie**

| colonna | cosa scrivere | esempio |
|---|---|---|
| `file_immagine` | nome esatto del file della foto | `alpi-rosse.jpg` |
| `sezione` | `dipinti-recenti`, `archivio`, `piccoli-quadri` o `taccuino` | `dipinti-recenti` |
| `titolo` | titolo dell'opera, maiuscole solo per i nomi propri | `Tramonto su Rango` |
| `tecnica` | tecnica e supporto | `olio su tela` |
| `larghezza_cm` | larghezza della tela in cm (decimali con la virgola) | `40` |
| `altezza_cm` | altezza della tela in cm | `60` |
| `anno` | anno, 4 cifre | `2026` |

**Facoltative (ma consigliate)**

| colonna | cosa scrivere | esempio |
|---|---|---|
| `soggetto` | cosa rappresenta, in poche parole: va nel titolo per Google | `campanile e montagna rossa tra le nuvole` |
| `luogo` | dove, se è un luogo reale | `Giudicarie` |
| `collocazione` | `collezione dell'autore`, `collezione privata`, `disponibile`, `in vendita` | `collezione privata` |
| `annotazioni` | una o due frasi per la pagina | `Dipinto nell'estate 2026.` |
| `descrizione` | descrizione per Google (max 160 caratteri); se vuota la scrive lo script | |
| `tags` | parole separate da spazio | `paesaggio montagna` |
| `data` | data precisa (gg/mm/aaaa), serve solo per l'ordine | `02/08/2026` |

**Per i quadri in vendita** (`sezione` = `piccoli-quadri` oppure `collocazione` = `in vendita`)

| colonna | cosa scrivere | esempio |
|---|---|---|
| `prezzo` | in euro, solo il numero | `100` |
| `link_pagamento` | link Stripe, deve iniziare con `https://buy.stripe.com/` | |
| `spedizione` | frase sulla spedizione | `Spedizione tracciata in Italia inclusa` |

**Casi particolari**

| colonna | quando serve |
|---|---|
| `cornice_larghezza_cm`, `cornice_altezza_cm` | misure esterne di una cornice grande, per il mosaico in scala |
| `coautori` | altri autori, separati da virgola |
| `indirizzo` | se due opere hanno lo stesso titolo (es. "Senza titolo"): scrivi un indirizzo diverso, es. `senza-titolo-2026` |
| `sovrascrivi` | scrivi `si` per aggiornare una pagina che esiste già (stesso titolo o indirizzo) |

## Le foto

- JPG (o PNG) con il lato lungo almeno 1600 px, idealmente 2000-2500 px.
  Non serve comprimerle: le versioni leggere le crea il sito.
- Lo script toglie da solo **posizione GPS e dati della fotocamera**,
  raddrizza le foto scattate col telefono girato e converte i colori del
  telefono (es. Display P3) nello standard del web.
- Fotografa il quadro dritto, con luce uniforme e poco sfondo intorno.
