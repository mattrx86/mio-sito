"use strict";
/* ============================================================
   Configurazione
   ============================================================ */
const REPO = "mattrx86/mio-sito", BRANCH = "main";
const API = "https://api.github.com/repos/" + REPO;
const SEZIONI = [["dipinti-recenti", "dipinti recenti"], ["archivio", "archivio"], ["piccoli-quadri", "piccoli quadri"]];
const COLLOCAZIONI = ["collezione dell'autore", "collezione privata", "disponibile", "disponibile in studio"];
const VOC_PATH = "data/vocabolario.yml";

/* ============================================================
   Utilità
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v; else if (k === "text") e.textContent = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, ""); else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of kids) if (c != null) e.append(c);
  return e;
};
const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function simile(a, voci) {            // voce già presente e quasi uguale ad a (a esclusa se identica)
  const na = norm(a); if (!na) return null;
  for (const v of voci) {
    if (v === a) continue;
    const nv = norm(v);
    if (nv === na || lev(na, nv) <= (na.length > 6 ? 2 : 1)) return v;
  }
  return null;
}
const slugTag = s => (s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const validaData = s => { if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; const d = new Date(s + "T00:00:00Z"); return !isNaN(d) && d.toISOString().slice(0, 10) === s; };
const dataDaOrdine = (anno, ord) => new Date(Date.UTC(+anno, 0, Math.min(ord, 365))).toISOString().slice(0, 10);
const b64 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, "")), c => c.charCodeAt(0)));

function msg(tipo, testo) { const m = $("#msg"); m.className = tipo; m.textContent = testo; m.scrollIntoView({ block: "nearest" }); }
function nomsg() { $("#msg").className = ""; $("#msg").textContent = ""; }

/* ============================================================
   Token e chiamate a GitHub
   ============================================================ */
let TOKEN = "";
function leggiToken() {
  try { const u = JSON.parse(localStorage.getItem("sveltia-cms.user") || "null"); if (u && u.token) { $("#statoToken").textContent = "accesso del pannello"; return u.token; } } catch (e) {}
  try { const t = sessionStorage.getItem("tabella.token"); if (t) { $("#statoToken").textContent = "token di questa scheda"; return t; } } catch (e) {}
  return "";
}
async function gh(path, opts = {}) {
  const r = await fetch(API + path, {
    method: opts.method || "GET",
    headers: { "Authorization": "Bearer " + TOKEN, "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(opts.body ? { "Content-Type": "application/json" } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store"
  });
  if (!r.ok) {
    let det = ""; try { det = (await r.json()).message || ""; } catch (e) {}
    const e = new Error(r.status + " " + det); e.status = r.status; throw e;
  }
  return r.json();
}
function erroreAmico(e) {
  if (e.status === 401) return "Token non valido o scaduto (401). Rigeneralo su GitHub e rientra.";
  if (e.status === 403 || e.status === 404) return "Il token non può leggere/scrivere il repository (" + e.message + "). Controlla che abbia «Contents: Read and write» su mattrx86/mio-sito.";
  if (e.status === 409 || e.status === 422) return "GitHub ha rifiutato il salvataggio (" + e.message + "). Ricarica la pagina e riprova.";
  return "Errore: " + (e.message || e);
}

/* ============================================================
   Front matter: lettura e modifica riga per riga
   (si cambiano solo le righe dei campi modificati: il resto del file resta identico)
   ============================================================ */
function spezza(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(text);
  if (!m) return null;
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  return { lines: m[1].split(/\r?\n/), resto: text.slice(m[0].length - m[2].length), eol, inizio: "---" + eol, fine: eol + "---" };
}
function unisci(p) { return p.inizio + p.lines.join(p.eol) + p.fine + p.resto; }
function valore(raw) {
  let r = raw.trim();
  if (r.startsWith('"')) { try { return { v: JSON.parse(r.replace(/\s+#.*$/, "")), q: "d" }; } catch (e) { return { v: r.slice(1, r.lastIndexOf('"')), q: "d" }; } }
  if (r.startsWith("'")) { const f = r.lastIndexOf("'"); return { v: r.slice(1, f).replace(/''/g, "'"), q: "s" }; }
  r = r.replace(/\s+#.*$/, "");
  return { v: r, q: "n" };
}
function trova(lines, chiave, rientro = "", da = 0, a = lines.length) {
  const re = new RegExp("^" + rientro + chiave + ":(.*)$");
  for (let i = da; i < a; i++) { const m = re.exec(lines[i]); if (m) return { i, rest: m[1] }; }
  return null;
}
function rangeSchema(lines) {
  const s = trova(lines, "schema"); if (!s) return null;
  let f = s.i + 1; while (f < lines.length && (/^\s+\S/.test(lines[f]) || lines[f] === "")) f++;
  return { da: s.i + 1, a: f };
}
function leggiTag(lines) {
  const t = trova(lines, "tags"); if (!t) return [];
  const r = t.rest.trim();
  if (r.startsWith("[")) { try { return JSON.parse(r); } catch (e) { return r.slice(1, -1).split(",").map(x => valore(x).v).filter(Boolean); } }
  const out = []; for (let i = t.i + 1; i < lines.length; i++) { const m = /^\s*-\s+(.*)$/.exec(lines[i]); if (!m) break; out.push(valore(m[1]).v); }
  return out;
}
function leggi(text) {
  const p = spezza(text); if (!p) return null;
  const L = p.lines, top = k => { const t = trova(L, k); return t ? valore(t.rest) : null; };
  const rs = rangeSchema(L), nested = k => { if (!rs) return null; const t = trova(L, k, "\\s+", rs.da, rs.a); return t ? valore(t.rest) : null; };
  const str = x => x ? String(x.v) : "";
  const o = {
    heading: str(top("heading")), image: str(top("image")),
    medium: str(nested("medium")), width: str(nested("width")), height: str(nested("height")), anno: str(nested("dateCreated")),
    date: str(top("date")), ordine: str(top("ordine")), collocazione: str(top("collocazione")),
    disponibile: str(top("disponibile")) === "true", draft: str(top("draft")) === "true", tags: leggiTag(L)
  };
  return { campi: o, valido: !!(top("heading") && rs) };
}
function fmtStr(v) { return JSON.stringify(v); }
function impostaTop(L, k, testo /* riga già formata o null per togliere */) {
  const t = trova(L, k);
  if (testo == null) { if (t) L.splice(t.i, 1); return; }
  if (t) { L[t.i] = testo; return; }
  const h = trova(L, "hideDate");
  if (h) L.splice(h.i, 0, testo); else L.push(testo);
}
function impostaNested(L, k, testo) {
  const rs = rangeSchema(L); if (!rs) return;
  const t = trova(L, k, "\\s+", rs.da, rs.a);
  if (testo == null) { if (t) L.splice(t.i, 1); return; }
  if (t) { const ind = /^(\s+)/.exec(L[t.i])[1]; L[t.i] = ind + testo; return; }
  let fine = rs.a; while (fine > rs.da && L[fine - 1] === "") fine--;
  L.splice(fine, 0, "  " + testo);
}
function impostaTag(L, tags) {
  const t = trova(L, "tags");
  if (t) {
    let f = t.i + 1;
    if (!t.rest.trim().startsWith("[")) while (f < L.length && /^\s*-\s/.test(L[f])) f++;
    L.splice(t.i, f - t.i);
  }
  if (!tags.length) return;
  const righe = ["tags:", ...tags.map(x => "  - " + fmtStr(x))];
  const h = trova(L, "hideDate"); const pos = t ? Math.min(t.i, L.length) : (h ? h.i : L.length);
  L.splice(pos, 0, ...righe);
}
function costruisci(r) {          // testo nuovo del file, solo con i campi cambiati
  const p = spezza(r.testo), L = p.lines, o = r.orig, c = r.cur;
  const cambia = k => JSON.stringify(o[k]) !== JSON.stringify(c[k]);
  if (cambia("heading")) impostaTop(L, "heading", "heading: " + fmtStr(c.heading));
  if (cambia("medium")) impostaNested(L, "medium", "medium: " + fmtStr(c.medium));
  if (cambia("width")) impostaNested(L, "width", c.width ? "width: " + fmtStr(c.width) : null);
  if (cambia("height")) impostaNested(L, "height", c.height ? "height: " + fmtStr(c.height) : null);
  if (cambia("anno")) impostaNested(L, "dateCreated", "dateCreated: " + fmtStr(c.anno));
  if (cambia("date")) { const t = trova(L, "date"); const nudo = t && valore(t.rest).q === "n"; impostaTop(L, "date", "date: " + (nudo ? c.date : fmtStr(c.date))); }
  if (cambia("ordine")) impostaTop(L, "ordine", c.ordine ? "ordine: " + c.ordine : null);
  if (cambia("collocazione")) impostaTop(L, "collocazione", c.collocazione ? "collocazione: " + fmtStr(c.collocazione) : null);
  if (cambia("disponibile")) impostaTop(L, "disponibile", "disponibile: " + c.disponibile);
  if (cambia("draft")) impostaTop(L, "draft", "draft: " + c.draft);
  if (cambia("tags")) impostaTag(L, c.tags);
  return unisci(p);
}

/* ============================================================
   Vocabolario (data/vocabolario.yml)
   ============================================================ */
function leggiVoc(text) {
  const out = { intest: [], tecniche: [], tag: [] }; let cur = null;
  for (const riga of text.split(/\r?\n/)) {
    if (/^tecniche:\s*$/.test(riga)) { cur = "tecniche"; continue; }
    if (/^tag:\s*$/.test(riga)) { cur = "tag"; continue; }
    const m = /^\s*-\s+(.*)$/.exec(riga);
    if (m && cur) out[cur].push(valore(m[1]).v);
    else if (!cur && riga.trim().startsWith("#")) out.intest.push(riga);
  }
  return out;
}
function scriviVoc(v) {
  const ord = a => [...new Set(a)].sort((x, y) => x.localeCompare(y, "it"));
  return [...v.intest, "tecniche:", ...ord(v.tecniche).map(x => "  - " + fmtStr(x)), "tag:", ...ord(v.tag).map(x => "  - " + fmtStr(x)), ""].join("\n");
}

/* ============================================================
   Stato
   ============================================================ */
let RIGHE = [], VOC = { intest: [], tecniche: [], tag: [] }, VOC_ORIG = "", VOC_SHA = "", VOC_NUOVE = { tecniche: new Set(), tag: new Set() };
let ORD = { col: "data", dir: -1 }, SEL = new Set();

const COLONNE = [
  { k: "chk", t: "", cls: "chk" },
  { k: "img", t: "", cls: "nosort" },
  { k: "heading", t: "titolo", cls: "col-titolo" },
  { k: "medium", t: "tecnica", cls: "col-tec" },
  { k: "anno", t: "anno", cls: "col-anno" },
  { k: "ordine", t: "n° nell'anno", cls: "col-ord" },
  { k: "date", t: "data (ordine sito)", cls: "col-data" },
  { k: "width", t: "largh. cm", cls: "col-mis" },
  { k: "height", t: "alt. cm", cls: "col-mis" },
  { k: "collocazione", t: "dove si trova", cls: "col-coll" },
  { k: "disponibile", t: "disp.", cls: "chk" },
  { k: "tags", t: "tag", cls: "col-tag" },
  { k: "draft", t: "bozza", cls: "chk" },
  { k: "prob", t: "controlli", cls: "nosort" }
];

function modificata(r) { return JSON.stringify(r.orig) !== JSON.stringify(r.cur); }
function problemi(r) {
  const c = r.cur, out = [];
  if (!/^\d{4}$/.test(c.anno)) out.push("anno");
  if (c.date && !validaData(c.date)) out.push("data");
  if (c.ordine && !/^\d{1,3}$/.test(c.ordine)) out.push("n°");
  if (c.width && !/^\d+(\.\d+)?$/.test(c.width)) out.push("largh.");
  if (c.height && !/^\d+(\.\d+)?$/.test(c.height)) out.push("alt.");
  if (!c.medium) out.push("tecnica?");
  if (!c.width || !c.height) out.push("misure?");
  return out;
}
function avvisi(r) {
  const out = {}, c = r.cur;
  if (c.medium && !VOC.tecniche.includes(c.medium)) out.medium = "tecnica fuori elenco";
  const gemelle = RIGHE.filter(x => x !== r && x.sezione === r.sezione && x.cur.date && x.cur.date === c.date);
  if (c.date && gemelle.length) out.date = "stessa data di «" + gemelle[0].cur.heading + "»: l'ordine tra le due non è garantito";
  if (c.ordine && RIGHE.some(x => x !== r && x.sezione === r.sezione && x.cur.anno === c.anno && x.cur.ordine === c.ordine)) out.ordine = "n° ripetuto nello stesso anno";
  const fuori = c.tags.filter(t => !VOC.tag.includes(t)); if (fuori.length) out.tags = "tag fuori elenco: " + fuori.join(", ");
  return out;
}

/* ============================================================
   Caricamento
   ============================================================ */
async function carica() {
  nomsg(); $("#riepilogo").hidden = true;
  msg("info", "Leggo le opere da GitHub…");
  const albero = await gh("/git/trees/" + BRANCH + "?recursive=1");
  const mappa = new Map(albero.tree.filter(x => x.type === "blob").map(x => [x.path, x.sha]));
  const percorsi = [...mappa.keys()].filter(p => SEZIONI.some(([s]) => p.startsWith("content/" + s + "/")) && p.endsWith(".md") && !p.endsWith("/_index.md"));
  const scarica = async (p) => { const b = await gh("/git/blobs/" + mappa.get(p)); return { path: p, sha: mappa.get(p), testo: b64(b.content) }; };
  const file = await Promise.all(percorsi.map(scarica));
  RIGHE = []; const scartate = [];
  for (const f of file) {
    const x = leggi(f.testo);
    if (!x || !x.valido) { scartate.push(f.path); continue; }
    RIGHE.push({ path: f.path, sha: f.sha, testo: f.testo, sezione: f.path.split("/")[1], orig: x.campi, cur: JSON.parse(JSON.stringify(x.campi)) });
  }
  if (mappa.has(VOC_PATH)) { const f = await scarica(VOC_PATH); VOC_ORIG = f.testo; VOC_SHA = f.sha; VOC = leggiVoc(f.testo); }
  else { VOC = { intest: ["# Elenco delle tecniche e dei tag già usati sul sito."], tecniche: [], tag: [] }; VOC_ORIG = ""; VOC_SHA = ""; }
  // voci usate ma non ancora nell'elenco: le propone ma non le aggiunge da sole
  VOC_NUOVE = { tecniche: new Set(), tag: new Set() };
  SEL.clear(); iniziaUI();
  msg(scartate.length ? "info" : "ok", RIGHE.length + " opere caricate." + (scartate.length ? "\nIgnorati perché senza i dati attesi: " + scartate.join(", ") : ""));
}

/* ============================================================
   Interfaccia
   ============================================================ */
function iniziaUI() {
  $("#app").hidden = false;
  const fill = (sel, voci, primo) => { const s = $(sel), v = s.value; s.innerHTML = ""; s.append(el("option", { value: "", text: primo })); for (const [val, t] of voci) s.append(el("option", { value: val, text: t })); s.value = v; };
  fill("#fSez", SEZIONI, "tutte le sezioni");
  aggiornaFiltri();
  const th = $("#tab thead"); th.innerHTML = "";
  th.append(el("tr", {}, ...COLONNE.map(c => {
    const e = el("th", { class: c.cls + (c.k === "img" || c.k === "prob" || c.k === "chk" ? " nosort" : ""), "data-k": c.k });
    if (c.k === "chk") { const cb = el("input", { type: "checkbox", title: "Seleziona/deseleziona tutte le righe mostrate", onchange: ev => { for (const r of righeVisibili()) ev.target.checked ? SEL.add(r.path) : SEL.delete(r.path); disegna(); } }); e.append(cb); }
    else { e.append(c.t, el("span", { class: "freccia", text: ORD.col === c.k ? (ORD.dir > 0 ? " ▲" : " ▼") : "" })); if (!e.classList.contains("nosort")) e.addEventListener("click", () => { ORD = { col: c.k, dir: ORD.col === c.k ? -ORD.dir : 1 }; iniziaUI(); }); }
    return e;
  })));
  disegna();
}
function aggiornaFiltri() {
  const anni = [...new Set(RIGHE.map(r => r.cur.anno).filter(Boolean))].sort(), tec = [...new Set(RIGHE.map(r => r.cur.medium).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  const fill = (sel, voci, primo) => { const s = $(sel), v = s.value; s.innerHTML = ""; s.append(el("option", { value: "", text: primo })); for (const x of voci) s.append(el("option", { value: x, text: x })); s.value = voci.includes(v) ? v : ""; };
  fill("#fAnno", anni, "tutti gli anni"); fill("#fTec", tec, "tutte le tecniche");
  $("#dlTag").innerHTML = ""; for (const t of [...VOC.tag].sort((a, b) => a.localeCompare(b, "it"))) $("#dlTag").append(el("option", { value: t }));
}
function chiaveOrdine(r, k) {
  const c = r.cur;
  if (k === "tags") return c.tags.join(" ");
  if (k === "disponibile" || k === "draft") return c[k] ? 1 : 0;
  if (k === "anno" || k === "ordine" || k === "width" || k === "height") return c[k] === "" ? -1 : parseFloat(c[k]);
  return (c[k] || "").toString().toLowerCase();
}
function righeVisibili() {
  const q = norm($("#cerca").value), fs = $("#fSez").value, fa = $("#fAnno").value, ft = $("#fTec").value, fp = $("#fProb").checked;
  let v = RIGHE.filter(r => {
    if (fs && r.sezione !== fs) return false; if (fa && r.cur.anno !== fa) return false; if (ft && r.cur.medium !== ft) return false;
    if (fp && !problemi(r).length && !Object.keys(avvisi(r)).length) return false;
    if (q && !norm(r.cur.heading + r.cur.medium + r.cur.tags.join("") + r.cur.anno + r.cur.collocazione).includes(q)) return false;
    return true;
  });
  const raggr = $("#fRaggr").checked, ordSez = s => SEZIONI.findIndex(x => x[0] === s);
  v.sort((a, b) => {
    if (raggr && a.sezione !== b.sezione) return ordSez(a.sezione) - ordSez(b.sezione);
    const x = chiaveOrdine(a, ORD.col), y = chiaveOrdine(b, ORD.col);
    const c = typeof x === "number" ? x - y : String(x).localeCompare(String(y), "it");
    return c ? c * ORD.dir : a.cur.heading.localeCompare(b.cur.heading, "it");
  });
  return v;
}
function disegna() {
  const tb = $("#tab tbody"); tb.innerHTML = "";
  const vis = righeVisibili(); let sez = null;
  for (const r of vis) {
    if ($("#fRaggr").checked && r.sezione !== sez) { sez = r.sezione; tb.append(el("tr", { class: "sezione" }, el("td", { colspan: COLONNE.length, text: SEZIONI.find(x => x[0] === sez)[1] + " (" + vis.filter(x => x.sezione === sez).length + ")" }))); }
    tb.append(riga(r));
  }
  aggiornaStato();
}
function riga(r) {
  const tr = el("tr", { "data-p": r.path }), c = r.cur;
  const cella = (k, cls = "") => { const td = el("td", { class: cls, "data-k": k }); tr.append(td); return td; };
  // selezione
  cella("chk", "chk").append(el("input", { type: "checkbox", checked: SEL.has(r.path), onchange: e => { e.target.checked ? SEL.add(r.path) : SEL.delete(r.path); tr.classList.toggle("sel", e.target.checked); aggiornaStato(); } }));
  cella("img", "img").append(el("img", { src: c.image || "", alt: "", loading: "lazy", onerror: e => e.target.style.visibility = "hidden" }));
  const testo = (k, cls, tipo = "text", extra = {}) => { const td = cella(k, cls); const i = el("input", { type: tipo, value: c[k] || "", ...extra }); i.addEventListener("input", () => imposta(r, k, i.value)); i.addEventListener("keydown", enterGiu); td.append(i); return i; };
  testo("heading", "col-titolo");
  // tecnica
  { const td = cella("medium", "col-tec"), s = el("select"); riempiTecnica(s, c.medium);
    s.addEventListener("change", () => {
      if (s.value === "__nuova") { const n = prompt("Nuova tecnica (es. «Olio su tavola»):", ""); if (!n || !n.trim()) { s.value = c.medium; return; }
        const v = n.trim().replace(/^./, x => x.toUpperCase()), sim = simile(v, VOC.tecniche);
        if (sim && confirm("«" + v + "» è molto simile a «" + sim + "», già presente.\nOK = uso «" + sim + "»\nAnnulla = creo comunque la nuova")) { imposta(r, "medium", sim); }
        else { if (!VOC.tecniche.includes(v)) { VOC.tecniche.push(v); VOC_NUOVE.tecniche.add(v); } imposta(r, "medium", v); }
        riempiTecnica(s, r.cur.medium); aggiornaFiltri(); return; }
      imposta(r, "medium", s.value); });
    s.addEventListener("keydown", enterGiu); td.append(s); }
  testo("anno", "col-anno num", "text", { inputmode: "numeric", maxlength: 4 });
  testo("ordine", "col-ord num", "text", { inputmode: "numeric", maxlength: 3 });
  testo("date", "col-data", "text", { placeholder: "AAAA-MM-GG" });
  testo("width", "col-mis num", "text", { inputmode: "decimal" });
  testo("height", "col-mis num", "text", { inputmode: "decimal" });
  { const td = cella("collocazione", "col-coll"), s = el("select", {}, el("option", { value: "", text: "—" }), ...COLLOCAZIONI.map(x => el("option", { value: x, text: x })));
    if (c.collocazione && !COLLOCAZIONI.includes(c.collocazione)) s.append(el("option", { value: c.collocazione, text: c.collocazione }));
    s.value = c.collocazione; s.addEventListener("change", () => imposta(r, "collocazione", s.value)); s.addEventListener("keydown", enterGiu); td.append(s); }
  cella("disponibile", "chk").append(el("input", { type: "checkbox", checked: c.disponibile, onchange: e => imposta(r, "disponibile", e.target.checked) }));
  cella("tags", "col-tag").append(disegnaTag(r));
  cella("draft", "chk").append(el("input", { type: "checkbox", checked: c.draft, onchange: e => imposta(r, "draft", e.target.checked) }));
  cella("prob", "problemi");
  tr.classList.toggle("sel", SEL.has(r.path));
  segna(tr, r); return tr;
}
function riempiTecnica(s, val) {
  s.innerHTML = ""; s.append(el("option", { value: "", text: "—" }));
  const voci = [...VOC.tecniche]; if (val && !voci.includes(val)) voci.push(val);
  for (const v of voci.sort((a, b) => a.localeCompare(b, "it"))) s.append(el("option", { value: v, text: v }));
  s.append(el("option", { value: "__nuova", text: "＋ nuova tecnica…" })); s.value = val || "";
}
function disegnaTag(r) {
  const box = el("div", { class: "tags" });
  for (const t of r.cur.tags) box.append(el("span", { class: "tag" }, t, el("button", { title: "Togli", onclick: () => { imposta(r, "tags", r.cur.tags.filter(x => x !== t)); box.replaceWith(disegnaTag(r)); } , text: "×" })));
  const i = el("input", { type: "text", list: "dlTag", placeholder: "+ tag", "aria-label": "Aggiungi tag" });
  const aggiungi = () => { const v = chiediTag(i.value); i.value = ""; if (v && !r.cur.tags.includes(v)) { imposta(r, "tags", [...r.cur.tags, v]); } box.replaceWith(disegnaTag(r)); };
  i.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); aggiungi(); } });
  i.addEventListener("change", aggiungi);
  box.append(i); return box;
}
function chiediTag(grezzo) {                     // normalizza, cerca un simile, chiede conferma se nuovo
  const v = slugTag(grezzo); if (!v) return "";
  if (VOC.tag.includes(v)) return v;
  const sim = simile(v, VOC.tag);
  if (sim && confirm("«" + v + "» è molto simile al tag «" + sim + "», già presente.\nOK = uso «" + sim + "»\nAnnulla = creo comunque il tag nuovo")) return sim;
  if (!confirm("Il tag «" + v + "» non è ancora nell'elenco. Lo aggiungo al vocabolario?")) return "";
  VOC.tag.push(v); VOC_NUOVE.tag.add(v); aggiornaFiltri(); return v;
}
function enterGiu(e) {
  if (e.key !== "Enter") return;
  const td = e.target.closest("td"), tr = td.parentElement; let n = tr.nextElementSibling;
  while (n && n.classList.contains("sezione")) n = n.nextElementSibling;
  if (n) { const f = n.querySelector('td[data-k="' + td.dataset.k + '"] input, td[data-k="' + td.dataset.k + '"] select'); if (f) { e.preventDefault(); f.focus(); f.select && f.select(); } }
}
function imposta(r, k, v, senzaAggiorna) {
  const c = r.cur;
  if (k === "width" || k === "height") v = v.replace(",", ".");
  c[k] = v;
  if (k === "anno" && /^\d{4}$/.test(v) && validaData(c.date)) c.date = v + c.date.slice(4);
  if (k === "anno" && /^\d{4}$/.test(v) && c.ordine && /^\d{1,3}$/.test(c.ordine)) c.date = dataDaOrdine(v, +c.ordine);
  if (k === "ordine" && /^\d{1,3}$/.test(v) && +v > 0 && /^\d{4}$/.test(c.anno)) c.date = dataDaOrdine(c.anno, +v);
  if (!senzaAggiorna) { const tr = $('tr[data-p="' + CSS.escape(r.path) + '"]'); if (tr) { for (const kk of ["date", "anno", "ordine"]) { const i = tr.querySelector('td[data-k="' + kk + '"] input'); if (i && i !== document.activeElement) i.value = c[kk]; } segna(tr, r); } aggiornaStato(); }
}
function segna(tr, r) {
  const av = avvisi(r), pr = problemi(r);
  const err = { anno: !/^\d{4}$/.test(r.cur.anno), date: !!r.cur.date && !validaData(r.cur.date), ordine: !!r.cur.ordine && !/^\d{1,3}$/.test(r.cur.ordine), width: !!r.cur.width && !/^\d+(\.\d+)?$/.test(r.cur.width), height: !!r.cur.height && !/^\d+(\.\d+)?$/.test(r.cur.height) };
  for (const td of tr.querySelectorAll("td[data-k]")) {
    const k = td.dataset.k; if (k === "chk" || k === "img" || k === "prob") continue;
    td.classList.toggle("mod", JSON.stringify(r.orig[k]) !== JSON.stringify(r.cur[k]));
    td.classList.toggle("errore", !!err[k]); td.classList.toggle("avviso", !!av[k] && !err[k]); td.title = av[k] || "";
  }
  tr.querySelector('td[data-k="prob"]').textContent = pr.join(", ");
}
function aggiornaStato() {
  const nm = RIGHE.filter(modificata).length;
  $("#nMod").textContent = nm; $("#nSel").textContent = SEL.size;
  $("#btnRivedi").disabled = !nm; $("#btnAnnulla").disabled = !nm; $("#bApplica").disabled = !SEL.size || !$("#bAz").value;
  const ch = $('th[data-k="chk"] input'); if (ch) { const vis = righeVisibili(); ch.checked = vis.length > 0 && vis.every(r => SEL.has(r.path)); }
}

/* ============================================================
   Azioni sulle selezionate
   ============================================================ */
function disegnaAzione() {
  const a = $("#bAz").value, box = $("#bVal"); box.innerHTML = "";
  if (a === "tagAdd" || a === "tagDel") box.append(el("input", { type: "text", id: "bIn", list: "dlTag", placeholder: "tag", size: 16 }));
  else if (a === "tec") { const s = el("select", { id: "bIn" }); riempiTecnica(s, ""); box.append(s); }
  else if (a === "coll") box.append(el("select", { id: "bIn" }, ...COLLOCAZIONI.map(x => el("option", { value: x, text: x }))));
  else if (a === "anno") box.append(el("input", { type: "text", id: "bIn", placeholder: "AAAA", size: 5, maxlength: 4 }));
  else if (a === "disp" || a === "bozza") box.append(el("select", { id: "bIn" }, el("option", { value: "1", text: "sì" }), el("option", { value: "0", text: "no" })));
  else if (a === "seq") box.append(el("span", { class: "stato", text: "parte da n° " }), el("input", { type: "number", id: "bIn", value: 1, min: 1, max: 365, style: "width:4.5rem" }), el("span", { class: "stato", text: " — 1 = la prima dipinta: ordina prima la tabella per data crescente (clic su «data»); si numera nell'ordine mostrato e si ricomincia a ogni anno" }));
  aggiornaStato();
}
function applicaAzione() {
  const a = $("#bAz").value, i = $("#bIn"), v = i ? i.value : ""; if (!a || !SEL.size) return;
  const righe = righeVisibili().filter(r => SEL.has(r.path));      // nell'ordine mostrato
  const altre = RIGHE.filter(r => SEL.has(r.path) && !righe.includes(r));  // selezionate ma ora nascoste dai filtri
  const tutte = [...righe, ...altre];
  if (a === "tagAdd") { const t = chiediTag(v); if (!t) return; for (const r of tutte) if (!r.cur.tags.includes(t)) imposta(r, "tags", [...r.cur.tags, t], true); }
  else if (a === "tagDel") { const t = slugTag(v); for (const r of tutte) imposta(r, "tags", r.cur.tags.filter(x => x !== t), true); }
  else if (a === "tec") { if (v === "__nuova") { alert("Per una tecnica nuova usa prima il menu di una riga («＋ nuova tecnica…»), poi applicala qui."); return; } for (const r of tutte) imposta(r, "medium", v, true); }
  else if (a === "coll") for (const r of tutte) imposta(r, "collocazione", v, true);
  else if (a === "anno") { if (!/^\d{4}$/.test(v)) { alert("Scrivi l'anno con quattro cifre, es. 2004."); return; } for (const r of tutte) imposta(r, "anno", v, true); }
  else if (a === "disp") for (const r of tutte) imposta(r, "disponibile", v === "1", true);
  else if (a === "bozza") for (const r of tutte) imposta(r, "draft", v === "1", true);
  else if (a === "seq") {
    const start = Math.max(1, parseInt(v, 10) || 1), conta = {};
    for (const r of righe) { const y = r.cur.anno; if (!/^\d{4}$/.test(y)) continue; conta[y] = (conta[y] || start - 1) + 1; imposta(r, "ordine", String(conta[y]), true); }
    const saltate = righe.filter(r => !/^\d{4}$/.test(r.cur.anno)).length; if (saltate) msg("info", saltate + " righe senza anno valido non sono state numerate.");
  }
  aggiornaFiltri(); disegna();
}

/* ============================================================
   Revisione e salvataggio (un solo commit)
   ============================================================ */
const NOMI = { heading: "titolo", medium: "tecnica", anno: "anno", ordine: "n°", date: "data", width: "largh.", height: "alt.", collocazione: "dove", disponibile: "disponibile", tags: "tag", draft: "bozza" };
const fmt = x => Array.isArray(x) ? (x.join(", ") || "—") : typeof x === "boolean" ? (x ? "sì" : "no") : (x === "" ? "—" : x);
function rivedi() {
  const mod = RIGHE.filter(modificata), box = $("#riepilogo");
  const invalide = mod.filter(r => problemi(r).some(p => !p.endsWith("?")));
  box.innerHTML = ""; box.hidden = false;
  box.append(el("h2", { text: "Riepilogo: " + mod.length + (mod.length === 1 ? " opera modificata" : " opere modificate") }));
  if (invalide.length) { box.append(el("p", { class: "problemi", text: "Prima correggi i valori in rosso: " + invalide.map(r => r.cur.heading).join(", ") })); box.append(el("button", { text: "Chiudi", onclick: () => box.hidden = true })); return; }
  const ul = el("ul");
  for (const r of mod) for (const k of Object.keys(NOMI)) if (JSON.stringify(r.orig[k]) !== JSON.stringify(r.cur[k])) ul.append(el("li", {}, el("b", { text: r.cur.heading + " — " + NOMI[k] + ": " }), el("span", { class: "vecchio", text: fmt(r.orig[k]) }), " → " + fmt(r.cur[k])));
  box.append(ul);
  if (mod.some(r => r.orig.date !== r.cur.date)) box.append(el("p", { class: "stato", text: "Nota: le date cambiate servono solo a ordinare le opere sul sito (si vede solo l'anno). Cambiando n° o anno la data si aggiorna da sola." }));
  const nuove = [...VOC_NUOVE.tecniche].map(x => "tecnica «" + x + "»").concat([...VOC_NUOVE.tag].map(x => "tag «" + x + "»"));
  if (nuove.length) box.append(el("p", { text: "Voci nuove nel vocabolario: " + nuove.join(", ") + "." }));
  box.append(el("p", { class: "stato", text: "Verrà fatto un solo salvataggio su GitHub; il sito si aggiorna in 1–2 minuti. Ogni salvataggio si può annullare dalla cronologia di GitHub." }));
  box.append(el("button", { class: "primario", id: "btnConferma", text: "Conferma e pubblica", onclick: salva }), " ", el("button", { text: "Torna alla tabella", onclick: () => box.hidden = true }));
  box.scrollIntoView({ block: "nearest" });
}
async function salva() {
  const btn = $("#btnConferma"); btn.disabled = true; btn.textContent = "Salvo…";
  try {
    const mod = RIGHE.filter(modificata);
    // 1) controllo che nel frattempo nessuno (es. il pannello) abbia cambiato gli stessi file
    const ref = await gh("/git/ref/heads/" + BRANCH);
    const commitBase = await gh("/git/commits/" + ref.object.sha);
    const albero = await gh("/git/trees/" + commitBase.tree.sha + "?recursive=1");
    const sha = new Map(albero.tree.filter(x => x.type === "blob").map(x => [x.path, x.sha]));
    const cambiati = mod.filter(r => sha.get(r.path) !== r.sha).map(r => r.cur.heading);
    if (cambiati.length) throw Object.assign(new Error("Queste opere sono cambiate su GitHub dopo il caricamento: " + cambiati.join(", ") + ". Premi «Ricarica» (le modifiche non salvate andranno perse) e rifai."), { amico: true });
    // 2) nuovi contenuti
    const voci = [...VOC_NUOVE.tecniche, ...VOC_NUOVE.tag];
    const voc = { intest: VOC.intest, tecniche: [...VOC.tecniche], tag: [...VOC.tag] };
    const files = mod.map(r => ({ path: r.path, mode: "100644", type: "blob", content: costruisci(r) }));
    if (voci.length) {
      if (sha.get(VOC_PATH) !== VOC_SHA && VOC_SHA) throw Object.assign(new Error("Il vocabolario è cambiato su GitHub dopo il caricamento. Premi «Ricarica» e rifai."), { amico: true });
      files.push({ path: VOC_PATH, mode: "100644", type: "blob", content: scriviVoc(voc) });
    }
    // 3) un solo commit
    const tree = await gh("/git/trees", { method: "POST", body: { base_tree: commitBase.tree.sha, tree: files } });
    const messaggio = "Tabella: modificate " + mod.length + (mod.length === 1 ? " opera" : " opere") + " (" + [...new Set(mod.flatMap(r => Object.keys(NOMI).filter(k => JSON.stringify(r.orig[k]) !== JSON.stringify(r.cur[k])).map(k => NOMI[k])))].join(", ") + ")";
    const commit = await gh("/git/commits", { method: "POST", body: { message: messaggio, tree: tree.sha, parents: [ref.object.sha] } });
    await gh("/git/refs/heads/" + BRANCH, { method: "PATCH", body: { sha: commit.sha, force: false } });
    $("#riepilogo").hidden = true;
    msg("ok", "Salvato: " + messaggio + "\nCommit " + commit.sha.slice(0, 7) + ". Il sito si aggiorna in 1–2 minuti.");
    await carica(); msg("ok", "Salvato (commit " + commit.sha.slice(0, 7) + "): " + messaggio + "\nIl sito si aggiorna in 1–2 minuti. La tabella è stata ricaricata.");
  } catch (e) {
    btn.disabled = false; btn.textContent = "Conferma e pubblica";
    msg("err", e.amico ? e.message : erroreAmico(e));
  }
}

/* ============================================================
   CSV (solo lettura)
   ============================================================ */
function scaricaCsv() {
  const righe = [["sezione", "titolo", "tecnica", "anno", "ordine", "data", "larghezza_cm", "altezza_cm", "collocazione", "disponibile", "tag", "bozza", "file"]];
  for (const r of righeVisibili()) { const c = r.cur; righe.push([r.sezione, c.heading, c.medium, c.anno, c.ordine, c.date, c.width, c.height, c.collocazione, c.disponibile ? "sì" : "no", c.tags.join(" "), c.draft ? "sì" : "no", r.path]); }
  const csv = "﻿" + righe.map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(";")).join("\r\n");
  const a = el("a", { href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })), download: "opere.csv" }); document.body.append(a); a.click(); a.remove();
}

/* ============================================================
   Avvio
   ============================================================ */
function avvia() {
  TOKEN = leggiToken();
  if (!TOKEN) { $("#loginBox").hidden = false; return; }
  $("#loginBox").hidden = true;
  carica().catch(e => { msg("err", erroreAmico(e)); if (e.status === 401) { try { sessionStorage.removeItem("tabella.token"); } catch (x) {} $("#loginBox").hidden = false; } });
}
$("#tokenBtn").addEventListener("click", () => { const t = $("#tokenIn").value.trim(); if (!t) return; try { sessionStorage.setItem("tabella.token", t); } catch (e) {} $("#tokenIn").value = ""; avvia(); });
$("#tokenIn").addEventListener("keydown", e => { if (e.key === "Enter") $("#tokenBtn").click(); });
for (const id of ["#cerca", "#fSez", "#fAnno", "#fTec", "#fProb", "#fRaggr"]) $(id).addEventListener("input", disegna);
$("#bAz").addEventListener("change", disegnaAzione);
$("#bApplica").addEventListener("click", applicaAzione);
$("#btnRivedi").addEventListener("click", rivedi);
$("#btnAnnulla").addEventListener("click", () => { if (confirm("Annullo tutte le modifiche non salvate?")) { for (const r of RIGHE) r.cur = JSON.parse(JSON.stringify(r.orig)); VOC_NUOVE = { tecniche: new Set(), tag: new Set() }; $("#riepilogo").hidden = true; carica(); } });
$("#btnRicarica").addEventListener("click", () => { if (!RIGHE.some(modificata) || confirm("Ci sono modifiche non salvate: le perdi. Ricarico?")) carica().catch(e => msg("err", erroreAmico(e))); });
$("#btnCsv").addEventListener("click", scaricaCsv);
window.addEventListener("beforeunload", e => { if (RIGHE.some(modificata)) { e.preventDefault(); e.returnValue = ""; } });
avvia();
