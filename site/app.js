"use strict";
// Prereq — static client. State (watched videos, language) lives only in localStorage.
const KEY = "prereq.watched.v1";
const LANG_KEY = "prereq.lang";
const SUGGEST = "https://github.com/deivithi/prereq/issues/new?title=Suggest%20a%20video";
const $main = document.getElementById("main");
let D = null; // data.json
const byVid = new Map(), byNode = new Map(), nodeById = new Map(), depth = new Map();
let order = [];
const feedState = { level: 0, stage: "", q: "", dated: false, sort: "trail" };

// ---------- i18n ----------
const T = {
  en: {
    tabTrail: "Home", tabMap: "Map", tabFeed: "Browse", tabAbout: "Method", langLabel: "Language", searchBtn: "Search",
    watchNow: "Watch now", openMap: "Open the map", ofTrail: "of the trail", seeAll: "See all",
    railPrev: "Previous videos", railNext: "More videos", skip: "Skip to content",
    foot: 'Open source (MIT): <a href="https://github.com/deivithi/prereq" target="_blank" rel="noopener">code, data and eval on GitHub</a>. Data: <a href="https://hackertube.org" target="_blank" rel="noopener">HackerTube</a> (ODC-By) from the <a href="https://huggingface.co/datasets/open-index/hacker-news" target="_blank" rel="noopener">open-index/hacker-news</a> archive, plus public course syllabi. Not affiliated with YouTube, HN or any course.',
    codeLabel: "Code", codeAria: "Open source code on GitHub",
    railPath: "Continue the trail", railTop: "Most recommended by experts", railDone: "Watched",
    mapLede: "18 topics wired by prerequisite. Point at one to light up what it needs and what it unlocks; your progress fills the map.",
    heroTitle: 'Learn AI in the order it <em>actually</em> makes sense.',
    heroLede: (n) => `${n} videos that experts keep recommending, mined from 20 years of Hacker News and real course syllabi, then wired into a map of prerequisites. Watch one, mark it, and the map tells you what comes next.`,
    sVideos: "videos", sTopics: "topics", sRecs: "HN recommendations", sSources: "course & guide sources",
    startHere: "Start here", upNext: "Up next for you", progress: (p) => `${p}% of the trail`,
    mapTitle: "The map", mapHint: "Point at a topic: orange is what it needs, teal is what it unlocks.",
    lgDone: "done", lgReady: "ready", lgLocked: "needs prereqs", lgNext: "your next step",
    listTitle: "Every topic, stage by stage", after: "after", videos: (n) => `${n} videos`, watched: (n) => `${n} watched`,
    back: "Trail", helps: "Helps to know first:", unlocks: "Unlocks:", ordered: (s, t) => `${s} of ${t} watched · easiest first, then strongest expert signal`,
    thin: 'Few videos here clear the bar of repeated expert recommendation yet. Know one that should? <a href="SUGGEST" target="_blank" rel="noopener">Suggest it</a> with where experts recommend it.',
    feedTitle: "The feed", feedLede: "Every video in the trail. Filter by how much background you have.",
    searchPh: "Search titles, channels, topics", allLevels: "All levels", allStages: "All stages", trailOrder: "Trail order",
    mostRec: "Most recommended", inclDated: "Include dated", count: (n) => `${n} videos`, empty: "Nothing matches. Clear the search or pick another level.",
    levels: { 1: "No background", 2: "Some code / math", 3: "Practitioner", 4: "Research" },
    recs: (n) => `${n} HN rec${n === 1 ? "" : "s"}`, recsTitle: "Distinct Hacker News users who recommended it",
    curr: (n) => `in ${n} curricul${n === 1 ? "um" : "a"}`, dated: "dated", datedTitle: "Still useful, but the field has moved on",
    afterThis: "After this:", hnSince: (y) => `on HN since ${y}`, mark: "Mark as watched", unmark: "Watched ✓ (undo)", next: "Next:",
    openYt: "Open on YouTube", hnComment: (y) => `Hacker News comment, ${y}`, quoteNote: "", linkedFrom: "Linked from",
    keys: "Keys: m mark · n next · / search", seen: "watched",
    missing: "That page does not exist.", backTrail: "Back to the trail", loadErr: "Could not load the trail. Check your connection and reload.",
    palPh: "Search videos and topics…", palHint: "↑↓ move · Enter open · Esc close", palTopics: "Topics", palVideos: "Videos", palEmpty: "No match.",
    reset: "Reset my progress", resetAsk: "Erase every video you marked as watched in this browser?",
    title: "Prereq — learn AI in the right order",
  },
  pt: {
    tabTrail: "Início", tabMap: "Mapa", tabFeed: "Explorar", tabAbout: "Método", langLabel: "Idioma", searchBtn: "Buscar",
    watchNow: "Assistir agora", openMap: "Abrir o mapa", ofTrail: "da trilha", seeAll: "Ver todos",
    railPrev: "Vídeos anteriores", railNext: "Mais vídeos", skip: "Pular para o conteúdo",
    foot: 'Código aberto (MIT): <a href="https://github.com/deivithi/prereq" target="_blank" rel="noopener">código, dados e eval no GitHub</a>. Dados: <a href="https://hackertube.org" target="_blank" rel="noopener">HackerTube</a> (ODC-By), do arquivo <a href="https://huggingface.co/datasets/open-index/hacker-news" target="_blank" rel="noopener">open-index/hacker-news</a>, mais syllabi públicos de cursos. Sem vínculo com YouTube, HN ou qualquer curso.',
    codeLabel: "Código", codeAria: "Código aberto no GitHub",
    railPath: "Continue a trilha", railTop: "Mais recomendados por especialistas", railDone: "Assistidos",
    mapLede: "18 tópicos ligados por pré-requisito. Aponte para um e veja o que ele pede e o que ele libera; o seu progresso preenche o mapa.",
    heroTitle: 'Aprenda IA na ordem que <em>faz sentido</em>.',
    heroLede: (n) => `${n} vídeos que especialistas recomendam de novo e de novo, tirados de 20 anos de Hacker News e de syllabi de cursos reais, ligados num mapa de pré-requisitos. Assista, marque, e o mapa mostra o próximo.`,
    sVideos: "vídeos", sTopics: "tópicos", sRecs: "recomendações no HN", sSources: "fontes de cursos e guias",
    startHere: "Comece aqui", upNext: "Seu próximo vídeo", progress: (p) => `${p}% da trilha`,
    mapTitle: "O mapa", mapHint: "Aponte para um tópico: laranja é o que ele pede, verde-água é o que ele libera.",
    lgDone: "feito", lgReady: "liberado", lgLocked: "pede pré-requisito", lgNext: "seu próximo passo",
    listTitle: "Todos os tópicos, por estágio", after: "depois de", videos: (n) => `${n} vídeos`, watched: (n) => `${n} assistidos`,
    back: "Trilha", helps: "Ajuda saber antes:", unlocks: "Libera:", ordered: (s, t) => `${s} de ${t} assistidos · do mais fácil ao mais difícil, depois pelo sinal de especialista`,
    thin: 'Poucos vídeos aqui passam na régua de recomendação repetida de especialista. Conhece um que deveria entrar? <a href="SUGGEST" target="_blank" rel="noopener">Sugira</a> e diga onde especialistas o recomendam.',
    feedTitle: "O feed", feedLede: "Todos os vídeos da trilha. Filtre pela base que você já tem.",
    searchPh: "Buscar títulos, canais, temas", allLevels: "Todos os níveis", allStages: "Todos os estágios", trailOrder: "Ordem da trilha",
    mostRec: "Mais recomendados", inclDated: "Incluir datados", count: (n) => `${n} vídeos`, empty: "Nada encontrado. Limpe a busca ou escolha outro nível.",
    levels: { 1: "Sem base", 2: "Um pouco de código ou matemática", 3: "Praticante", 4: "Pesquisa" },
    recs: (n) => `${n} rec${n === 1 ? "" : "s"} no HN`, recsTitle: "Usuários distintos do Hacker News que recomendaram",
    curr: (n) => `em ${n} currículo${n === 1 ? "" : "s"}`, dated: "datado", datedTitle: "Ainda útil, mas o campo já avançou",
    afterThis: "Depois disso:", hnSince: (y) => `no HN desde ${y}`, mark: "Marcar como assistido", unmark: "Assistido ✓ (desfazer)", next: "Próximo:",
    openYt: "Abrir no YouTube", hnComment: (y) => `Comentário no Hacker News, ${y}`, quoteNote: " (citação original, em inglês)", linkedFrom: "Linkado por",
    keys: "Atalhos: m marca · n próximo · / busca", seen: "assistido",
    missing: "Essa página não existe.", backTrail: "Voltar para a trilha", loadErr: "Não deu para carregar a trilha. Confira a conexão e recarregue.",
    palPh: "Buscar vídeos e tópicos…", palHint: "↑↓ navega · Enter abre · Esc fecha", palTopics: "Tópicos", palVideos: "Vídeos", palEmpty: "Nada encontrado.",
    reset: "Apagar meu progresso", resetAsk: "Apagar todos os vídeos que você marcou como assistidos neste navegador?",
    title: "Prereq — aprenda IA na ordem certa",
  },
};
function loadLang() { try { return localStorage.getItem(LANG_KEY) === "pt" ? "pt" : "en"; } catch { return "en"; } }
let lang = loadLang();
const t = (k, ...a) => { const v = T[lang][k]; return typeof v === "function" ? v(...a) : v; };
// Localized fields: nodes/stages carry a "pt" object; videos carry op/wp.
const nm = (x) => (lang === "pt" && x.pt?.name) || x.name;
const ds = (x) => (lang === "pt" && x.pt?.desc) || x.desc;
const bl = (x) => (lang === "pt" && x.pt?.blurb) || x.blurb;
const vo = (v) => (lang === "pt" && v.op) || v.o;
const vw = (v) => (lang === "pt" && v.wp) || v.w;
const lv = (l) => T[lang].levels[l] || "";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const thumb = (v) => `https://i.ytimg.com/vi/${encodeURIComponent(v)}/mqdefault.jpg`;
function loadWatched() { try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { return new Set(); } }
let watched = loadWatched();
function saveWatched() { try { localStorage.setItem(KEY, JSON.stringify([...watched])); } catch { /* private mode: progress is session-only */ } }

// ---------- graph ----------
function index() {
  D.nodes.forEach((n) => nodeById.set(n.id, n));
  order = D.stages.flatMap((s) => D.nodes.filter((n) => n.stage === s.id).map((n) => n.id));
  for (const v of D.videos) {
    byVid.set(v.v, v);
    if (!byNode.has(v.n)) byNode.set(v.n, []);
    byNode.get(v.n).push(v);
  }
  for (const list of byNode.values()) list.sort((a, b) => a.l - b.l || b.s - a.s); // easiest first, then strongest signal
  const d = (id) => { if (!depth.has(id)) depth.set(id, Math.max(-1, ...nodeById.get(id).prereqs.map(d)) + 1); return depth.get(id); };
  D.nodes.forEach((n) => d(n.id));
}
const children = (id) => D.nodes.filter((n) => n.prereqs.includes(id)).map((n) => n.id);
function closure(id, step) { const out = new Set(), stack = [...step(id)]; while (stack.length) { const x = stack.pop(); if (!out.has(x)) { out.add(x); stack.push(...step(x)); } } return out; }

const nodeVideos = (id) => (byNode.get(id) || []).filter((v) => v.f !== "dated");
function nodeProgress(id) {
  const list = nodeVideos(id);
  const seen = list.filter((v) => watched.has(v.v)).length;
  return { seen, total: list.length, done: list.length > 0 && seen >= Math.min(2, list.length) };
}
const prereqsMet = (id) => nodeById.get(id).prereqs.every((p) => nodeProgress(p).done || !nodeVideos(p).length);
function nodeState(id) { return nodeProgress(id).done ? "done" : prereqsMet(id) ? "ready" : "locked"; }
function upNext(skip) {
  const fresh = (x) => !watched.has(x.v) && x.v !== skip;
  for (const id of order) {
    if (nodeProgress(id).done || !nodeVideos(id).length || !prereqsMet(id)) continue;
    const v = nodeVideos(id).find(fresh);
    if (v) return v;
  }
  return D.videos.find(fresh) || null;
}
function nextInTrail(vid) {
  const v = byVid.get(vid);
  const list = nodeVideos(v.n);
  const after = list.slice(list.findIndex((x) => x.v === vid) + 1).find((x) => !watched.has(x.v));
  if (after) return after;
  const nx = upNext(vid);
  return nx && nx.v !== vid ? nx : null;
}
function trailPct() {
  const all = D.nodes.map((n) => nodeProgress(n.id)).filter((p) => p.total);
  const need = all.reduce((a, p) => a + Math.min(2, p.total), 0);
  const got = all.reduce((a, p) => a + Math.min(p.seen, 2), 0);
  return need ? Math.round((100 * got) / need) : 0;
}

// ---------- pieces ----------
function signalChips(v) {
  const out = [];
  if (v.r) out.push(`<span class="chip${v.r >= 5 ? " hot" : ""}" title="${esc(t("recsTitle"))}">${esc(t("recs", v.r))}</span>`);
  if (v.cu?.length) out.push(`<span class="chip hot" title="${esc(v.cu.join(", "))}">${esc(t("curr", v.cu.length))}</span>`);
  if (v.f === "dated") out.push(`<span class="chip" title="${esc(t("datedTitle"))}">${esc(t("dated"))}</span>`);
  return out.join("");
}
function card(v) {
  return `<a class="card" href="#/watch/${esc(v.v)}">
    <div class="thumb"><img loading="lazy" width="320" height="180" src="${thumb(v.v)}" alt="">${watched.has(v.v) ? `<span class="seen">${esc(t("seen"))}</span>` : ""}<span class="lvl l${v.l}">${esc(lv(v.l))}</span></div>
    <h3>${esc(v.t)}</h3>
    <p class="ol">${esc(vo(v))}</p>
    <div class="by">${esc(v.c)}</div>
    <div class="sig">${signalChips(v)}</div>
  </a>`;
}
function ring(pct) {
  const r = 18, c = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="${r}" class="ring__bg"/><circle cx="22" cy="22" r="${r}" class="ring__fg" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - pct / 100)).toFixed(1)}"/></svg>`;
}

// ---------- map (skill tree) ----------
function mapHtml() {
  const nx = upNext();
  const cols = Math.max(...depth.values()) + 1;
  const byCol = Array.from({ length: cols }, (_, i) => D.nodes.filter((n) => depth.get(n.id) === i && (byNode.get(n.id) || []).length));
  const nodes = byCol.flatMap((col, ci) => col.map((n, ri) => {
    const p = nodeProgress(n.id), st = nodeState(n.id);
    return `<a class="mnode ${st}${nx && nx.n === n.id ? " is-next" : ""}" href="#/node/${esc(n.id)}" data-id="${esc(n.id)}" data-col="${ci}" data-row="${ri}" data-rows="${col.length}">
      <span class="mnode__dot" aria-hidden="true"></span><b>${esc(nm(n))}</b><small>${p.seen}/${p.total}</small>
      <i class="mnode__bar" aria-hidden="true"><i style="width:${p.total ? Math.round((100 * p.seen) / p.total) : 0}%"></i></i></a>`;
  })).join("");
  return `<section class="map" aria-labelledby="map-t">
    <div class="map__head"><h2 id="map-t">${esc(t("mapTitle"))}</h2><p class="muted">${esc(t("mapHint"))}</p>
      <div class="legend"><span><i class="lg done"></i>${esc(t("lgDone"))}</span><span><i class="lg ready"></i>${esc(t("lgReady"))}</span><span><i class="lg locked"></i>${esc(t("lgLocked"))}</span><span><i class="lg lg--next"></i>${esc(t("lgNext"))}</span></div></div>
    <div class="map__scroll" id="mapscroll"><div class="map__stage" id="mapstage" data-cols="${cols}"><svg class="map__edges" id="mapedges" aria-hidden="true"></svg>${nodes}</div></div>
  </section>`;
}
// Positions are computed from the live box so the same graph works from a phone to a wall screen:
// columns = longest prerequisite chain; on narrow screens the columns become rows.
function layoutMap() {
  const stage = document.getElementById("mapstage");
  if (!stage) return;
  const els = [...stage.querySelectorAll(".mnode")];
  const cols = Number(stage.dataset.cols);
  const box = document.getElementById("mapscroll").clientWidth - 12; // minus the 6 px side padding
  const vertical = box < 760;
  stage.classList.toggle("is-vertical", vertical);
  const maxRows = Math.max(...els.map((e) => Number(e.dataset.rows)));
  // On a phone the widest row (4 topics) keeps readable 132 px nodes and scrolls inside the map box.
  const W = vertical ? Math.max(box, maxRows * (Math.max(132, Math.min(176, (box - 16) / maxRows - 12)) + 12) + 8) : box;
  stage.style.width = `${W}px`;
  const nodeW = vertical ? Math.max(132, Math.min(176, (box - 16) / maxRows - 12)) : Math.min(176, (W - 40) / cols - 14);
  const nodeH = vertical ? 92 : 78; // name (3 lines on a phone, 2 on desktop) + count + progress bar
  const gapMain = vertical ? 40 : (W - nodeW * cols) / Math.max(1, cols - 1);
  const crossSpan = vertical ? W : maxRows * (nodeH + 18);
  const H = vertical ? cols * nodeH + (cols - 1) * gapMain : crossSpan;
  stage.style.height = `${H}px`;
  const pos = new Map();
  for (const e of els) {
    const c = Number(e.dataset.col), r = Number(e.dataset.row), rows = Number(e.dataset.rows);
    let x, y;
    if (vertical) {
      const slot = Math.max(box, rows * (nodeW + 12) + 8) / rows; // rows that fit stay inside the visible part
      x = slot * r + (slot - nodeW) / 2; y = c * (nodeH + gapMain);
    } else {
      const slot = crossSpan / rows;
      x = c * (nodeW + gapMain); y = slot * r + (slot - nodeH) / 2;
    }
    Object.assign(e.style, { left: `${x}px`, top: `${y}px`, width: `${nodeW}px`, height: `${nodeH}px` });
    pos.set(e.dataset.id, { x, y });
  }
  const svg = document.getElementById("mapedges");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = D.nodes.flatMap((n) => n.prereqs.filter((p) => pos.has(p) && pos.has(n.id)).map((p) => {
    const a = pos.get(p), b = pos.get(n.id);
    let d;
    if (vertical) { const x1 = a.x + nodeW / 2, y1 = a.y + nodeH, x2 = b.x + nodeW / 2, y2 = b.y; const m = (y1 + y2) / 2; d = `M${x1} ${y1} C${x1} ${m} ${x2} ${m} ${x2} ${y2}`; }
    else { const x1 = a.x + nodeW, y1 = a.y + nodeH / 2, x2 = b.x, y2 = b.y + nodeH / 2; const m = (x1 + x2) / 2; d = `M${x1} ${y1} C${m} ${y1} ${m} ${y2} ${x2} ${y2}`; }
    const lit = nodeProgress(p).done ? " lit" : "";
    return `<path class="edge${lit}" data-from="${esc(p)}" data-to="${esc(n.id)}" d="${d}"/>`;
  })).join("");
}
function bindMap() {
  const stage = document.getElementById("mapstage");
  if (!stage) return;
  const focusOn = (id) => {
    const up = closure(id, (x) => nodeById.get(x).prereqs), down = closure(id, children);
    stage.classList.add("is-focus");
    stage.querySelectorAll(".mnode").forEach((e) => { const i = e.dataset.id; e.classList.toggle("hl-self", i === id); e.classList.toggle("hl-up", up.has(i)); e.classList.toggle("hl-down", down.has(i)); });
    stage.querySelectorAll(".edge").forEach((e) => {
      const f = e.dataset.from, to = e.dataset.to;
      e.classList.toggle("hl-up", (to === id || up.has(to)) && (up.has(f)));
      e.classList.toggle("hl-down", (f === id || down.has(f)) && down.has(to));
    });
  };
  const clear = () => { stage.classList.remove("is-focus"); stage.querySelectorAll(".hl-self,.hl-up,.hl-down").forEach((e) => e.classList.remove("hl-self", "hl-up", "hl-down")); };
  stage.querySelectorAll(".mnode").forEach((e) => {
    e.addEventListener("pointerenter", () => focusOn(e.dataset.id));
    e.addEventListener("focus", () => focusOn(e.dataset.id));
    e.addEventListener("pointerleave", clear);
    e.addEventListener("blur", clear);
  });
  layoutMap();
}
let resizeT = 0;
addEventListener("resize", () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => { layoutMap(); $main.querySelectorAll(".rail__wrap").forEach(syncRail); }, 120);
});

// ---------- views ----------
const big = (v) => `https://i.ytimg.com/vi/${encodeURIComponent(v)}/maxresdefault.jpg`;
// Old uploads have no maxres frame (YouTube serves a 120 px placeholder): fall back to hq.
function fixBackdrops() {
  $main.querySelectorAll("img[data-fallback]").forEach((img) => {
    const swap = () => {
      if (!img.dataset.fallback) return;
      img.src = img.dataset.fallback; img.removeAttribute("data-fallback");
      img.classList.add("is-lowres"); // the 480 px frame is blurred so it reads as mood, not as pixels
    };
    const check = () => { if (img.naturalWidth < 200) swap(); };
    if (img.complete) check(); // already loaded (or failed) before we got here
    else { img.addEventListener("error", swap, { once: true }); img.addEventListener("load", check, { once: true }); }
  });
}
// title is plain text (escaped here); extra is HTML the caller already built with esc().
function rail(id, title, list, extra = "") {
  if (!list.length) return "";
  return `<section class="rail" aria-labelledby="rl-${esc(id)}">
    <div class="rail__head"><h2 id="rl-${esc(id)}">${esc(title)}</h2>${extra}</div>
    <div class="rail__wrap"><button type="button" class="rail__btn prev" aria-label="${esc(t("railPrev"))}" data-dir="-1"><span aria-hidden="true">‹</span></button>
    <div class="rail__track">${list.map(card).join("")}</div>
    <button type="button" class="rail__btn next" aria-label="${esc(t("railNext"))}" data-dir="1"><span aria-hidden="true">›</span></button></div></section>`;
}
function syncRail(w) {
  const tr = w.querySelector(".rail__track");
  w.classList.toggle("at-start", tr.scrollLeft < 8);
  w.classList.toggle("at-end", tr.scrollLeft + tr.clientWidth > tr.scrollWidth - 8);
}
function bindRails() {
  $main.querySelectorAll(".rail__wrap").forEach((w) => {
    const tr = w.querySelector(".rail__track");
    w.querySelectorAll(".rail__btn").forEach((b) => b.addEventListener("click", () => tr.scrollBy({ left: Number(b.dataset.dir) * tr.clientWidth * 0.85, behavior: "smooth" })));
    tr.addEventListener("scroll", () => syncRail(w), { passive: true }); syncRail(w);
  });
}
function viewHome() {
  const nx = upNext();
  const st = D.stats;
  const pct = trailPct();
  const path = order.flatMap((id) => nodeVideos(id)).filter((v) => !watched.has(v.v) && (!nx || v.v !== nx.v)).slice(0, 14);
  const top = [...D.videos].sort((a, b) => b.s - a.s).slice(0, 14);
  const done = D.videos.filter((v) => watched.has(v.v)).slice(0, 14);
  const bill = nx ? `<section class="bill" aria-label="${esc(nx.t)}">
      <img class="bill__bg" src="${big(nx.v)}" data-fallback="${thumb(nx.v).replace("mqdefault", "hqdefault")}" alt="" width="1280" height="720">
      <div class="bill__in">
        <p class="eyebrow">${esc(watched.size ? t("upNext") : t("startHere"))} · ${esc(nm(nodeById.get(nx.n)))}</p>
        <h1 class="bill__t">${esc(nx.t)}</h1>
        <p class="bill__o">${esc(vo(nx))}</p>
        <div class="bill__meta"><span class="lvl l${nx.l}">${esc(lv(nx.l))}</span>${signalChips(nx)}<span class="mono">${esc(nx.c)}</span></div>
        <div class="btns"><a class="btn play" href="#/watch/${esc(nx.v)}"><span aria-hidden="true">▶</span> ${esc(t("watchNow"))}</a><a class="btn ghost" href="#/map">${esc(t("openMap"))}</a></div>
      </div>
      <div class="bill__side">${ring(pct)}<div><b>${pct}%</b><span>${esc(t("ofTrail"))}</span></div></div>
    </section>` : "";
  const topics = order.filter((id) => (byNode.get(id) || []).length).map((id) => {
    const n = nodeById.get(id), s = nodeState(id), p = nodeProgress(id);
    const extra = `<span class="state ${s}">${esc(t(s === "done" ? "lgDone" : s === "ready" ? "lgReady" : "lgLocked"))}</span><span class="mono muted">${p.seen}/${p.total}</span><a class="see" href="#/node/${esc(id)}">${esc(t("seeAll"))} →</a>`;
    return rail(id, nm(n), byNode.get(id), extra);
  }).join("");
  $main.innerHTML = `${bill}
    <div class="pitch"><p>${t("heroTitle")}</p><span>${esc(t("heroLede", st.videos))}</span>
      <div class="stats"><span><b>${st.videos}</b> ${esc(t("sVideos"))}</span><span><b>${st.nodes}</b> ${esc(t("sTopics"))}</span><span><b>${st.recommenders.toLocaleString(lang)}</b> ${esc(t("sRecs"))}</span><span><b>${st.curricula}</b> ${esc(t("sSources"))}</span></div></div>
    ${rail("path", t("railPath"), path, `<a class="see" href="#/map">${esc(t("openMap"))} →</a>`)}
    ${rail("top", t("railTop"), top)}
    ${rail("done", t("railDone"), done)}
    ${topics}`;
  fixBackdrops(); bindRails();
}

function viewMap() {
  const nx = upNext();
  const st = D.stats;
  const pct = trailPct();
  const nextHtml = nx ? `<a class="next" href="#/watch/${esc(nx.v)}">
      <img width="320" height="180" src="${thumb(nx.v)}" alt="">
      <div><div class="label">${esc(watched.size ? t("upNext") : t("startHere"))}</div>
      <h2>${esc(nx.t)}</h2><p class="muted" style="margin:4px 0 0">${esc(vo(nx))}</p>
      <div class="mono muted" style="margin-top:8px">${esc(nm(nodeById.get(nx.n)))} · ${esc(nx.c)} · ${esc(lv(nx.l))}</div></div></a>` : "";
  const stages = D.stages.map((s, i) => {
    const nodes = D.nodes.filter((n) => n.stage === s.id && (byNode.get(n.id) || []).length);
    if (!nodes.length) return "";
    return `<section class="stage" aria-labelledby="st-${esc(s.id)}">
      <div class="stage-head"><span class="stage-num">${String(i).padStart(2, "0")}</span><div><h3 id="st-${esc(s.id)}">${esc(nm(s))}</h3><span class="muted">${esc(bl(s))}</span></div></div>
      <div class="nodes">${nodes.map((n) => {
        const p = nodeProgress(n.id);
        const pre = n.prereqs.length ? `<div class="pre">${n.prereqs.map((x) => `<span class="chip">${esc(t("after"))} ${esc(nm(nodeById.get(x)))}</span>`).join("")}</div>` : "";
        return `<a class="node ${nodeState(n.id)}" href="#/node/${esc(n.id)}">
          <h4>${esc(nm(n))}</h4><p>${esc(ds(n))}</p>${pre}
          <div class="bar" aria-hidden="true"><i style="width:${p.total ? Math.round((100 * p.seen) / p.total) : 0}%"></i></div>
          <div class="meta"><span>${esc(t("videos", p.total))}</span><span>${esc(t("watched", p.seen))}</span></div></a>`;
      }).join("")}</div></section>`;
  }).join("");
  $main.innerHTML = `<div class="hero">
      <div><h1>${esc(t("mapTitle"))}</h1>
      <p class="lede">${esc(t("mapLede"))}</p>
      <div class="stats"><span><b>${st.nodes}</b> ${esc(t("sTopics"))}</span><span><b>${st.videos}</b> ${esc(t("sVideos"))}</span></div></div>
      <div class="progress-card">${ring(pct)}<div><b>${pct}%</b><span>${esc(t("ofTrail"))}</span></div></div>
    </div>${mapHtml()}${nextHtml}<h2 class="list-title">${esc(t("listTitle"))}</h2>${stages}`;
  bindMap();
}

function viewNode(id) {
  const n = nodeById.get(id);
  if (!n) return viewMissing();
  const all = byNode.get(id) || [];
  const p = nodeProgress(id);
  const chip = (x) => `<a class="chip" href="#/node/${esc(x)}">${esc(nm(nodeById.get(x)))}</a>`;
  const kids = children(id).filter((x) => (byNode.get(x) || []).length);
  $main.innerHTML = `<a class="back" href="#/map">← ${esc(t("tabMap"))}</a>
    <div class="node-hero ${nodeState(id)}">${ring(p.total ? Math.round((100 * p.seen) / p.total) : 0)}<div><h1>${esc(nm(n))}</h1><p class="lede">${esc(ds(n))}</p></div></div>
    ${n.prereqs.length ? `<p class="muted rel">${esc(t("helps"))} ${n.prereqs.map(chip).join(" ")}</p>` : ""}
    ${kids.length ? `<p class="muted rel">${esc(t("unlocks"))} ${kids.map(chip).join(" ")}</p>` : ""}
    <p class="mono muted">${esc(t("ordered", p.seen, p.total))}</p>
    <div class="grid">${all.map(card).join("")}</div>
    ${all.length < 5 ? `<p class="empty" style="margin-top:20px">${t("thin").replace("SUGGEST", SUGGEST)}</p>` : ""}`;
}

function feedList() {
  const s = feedState;
  const q = s.q.trim().toLowerCase();
  const list = D.videos.filter((v) => (!s.level || v.l === s.level) && (!s.stage || nodeById.get(v.n).stage === s.stage) && (s.dated || v.f !== "dated")
    && (!q || `${v.t} ${v.c} ${v.o} ${v.op || ""}`.toLowerCase().includes(q)));
  return s.sort === "signal" ? [...list].sort((a, b) => b.s - a.s) : order.flatMap((id) => list.filter((v) => v.n === id));
}
// Re-render only the results so the search box keeps focus, IME state and caret.
function renderFeedResults() {
  const list = feedList();
  document.getElementById("count").textContent = t("count", list.length);
  document.getElementById("results").innerHTML = list.length ? `<div class="grid">${list.map(card).join("")}</div>` : `<div class="empty">${esc(t("empty"))}</div>`;
  $main.querySelectorAll("[data-set]").forEach((b) => b.setAttribute("aria-pressed", String(String(feedState[b.dataset.set]) === b.dataset.val)));
}
function viewFeed() {
  const s = feedState;
  const seg = (name, val, label, cur) => `<button type="button" data-set="${name}" data-val="${val}" aria-pressed="${cur === val}">${esc(label)}</button>`;
  $main.innerHTML = `<h1>${esc(t("feedTitle"))}</h1>
    <p class="lede">${esc(t("feedLede"))}</p>
    <div class="controls">
      <input type="search" id="q" placeholder="${esc(t("searchPh"))}" value="${esc(s.q)}" aria-label="${esc(t("searchPh"))}">
      <div class="row seg" role="group">${seg("level", 0, t("allLevels"), s.level)}${[1, 2, 3, 4].map((l) => seg("level", l, lv(l), s.level)).join("")}</div>
      <div class="row">
        <select id="stage" aria-label="${esc(t("allStages"))}"><option value="">${esc(t("allStages"))}</option>${D.stages.map((x) => `<option value="${esc(x.id)}"${s.stage === x.id ? " selected" : ""}>${esc(nm(x))}</option>`).join("")}</select>
        <span class="row seg" role="group">${seg("sort", "trail", t("trailOrder"), s.sort)}${seg("sort", "signal", t("mostRec"), s.sort)}</span>
        <label class="toggle"><input type="checkbox" id="dated"${s.dated ? " checked" : ""}> ${esc(t("inclDated"))}</label>
      </div>
      <div class="mono muted" id="count" role="status"></div>
    </div>
    <div id="results"></div>`;
  let tm = 0;
  document.getElementById("q").addEventListener("input", (e) => { s.q = e.target.value; clearTimeout(tm); tm = setTimeout(renderFeedResults, 150); });
  document.getElementById("stage").addEventListener("change", (e) => { s.stage = e.target.value; renderFeedResults(); });
  document.getElementById("dated").addEventListener("change", (e) => { s.dated = e.target.checked; renderFeedResults(); });
  $main.querySelectorAll("[data-set]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.set; s[k] = k === "level" ? Number(b.dataset.val) : b.dataset.val; renderFeedResults();
  }));
  renderFeedResults();
}

let currentVid = null;
function toggleWatched(vid) {
  if (watched.has(vid)) watched.delete(vid); else watched.add(vid);
  saveWatched();
  const btn = document.getElementById("mark");
  if (!btn) return;
  const seen = watched.has(vid);
  btn.textContent = seen ? t("unmark") : t("mark");
  btn.classList.toggle("ghost", seen);
  btn.setAttribute("aria-pressed", String(seen));
  if (seen) btn.classList.add("pop"), setTimeout(() => btn.classList.remove("pop"), 500);
  document.getElementById("nextslot").innerHTML = nextLink(nextInTrail(vid));
}
function watchPanel(v) {
  const isSeen = watched.has(v.v);
  const quote = v.q ? `<blockquote>“${esc(v.q.text)}”</blockquote><div class="mono muted">— <a href="https://news.ycombinator.com/item?id=${encodeURIComponent(v.q.id)}" target="_blank" rel="noopener">${esc(t("hnComment", v.q.year))}</a>${esc(t("quoteNote"))}</div>` : "";
  const cur = v.cu?.length ? `<div><div class="mono muted">${esc(t("linkedFrom"))}</div><div class="pre" style="margin-top:4px">${v.cu.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div></div>` : "";
  return `<span class="lvl l${v.l}">${esc(lv(v.l))}</span>
        <h1 class="panel__t">${esc(v.t)}</h1>
        <div class="mono muted">${esc(v.c)}${v.y ? ` · ${esc(t("hnSince", v.y))}` : ""}</div>
        <p class="outcome"><b>${esc(t("afterThis"))}</b> ${esc(vo(v))}</p>
        <div class="sig">${signalChips(v)}</div>
        ${vw(v) ? `<p class="muted" style="margin:0">${esc(vw(v))}</p>` : ""}
        ${quote}${cur}
        <div class="btns">
          <button class="btn${isSeen ? " ghost" : ""}" id="mark" type="button" aria-pressed="${isSeen}">${esc(isSeen ? t("unmark") : t("mark"))}</button>
          <span id="nextslot">${nextLink(nextInTrail(v.v))}</span>
        </div>
        <div class="foot-row"><a class="mono muted link" href="https://www.youtube.com/watch?v=${encodeURIComponent(v.v)}" target="_blank" rel="noopener">${esc(t("openYt"))}</a><span class="mono muted kbd-hint">${esc(t("keys"))}</span></div>`;
}
// The iframe is never re-rendered after the first paint: marking as watched or switching language
// only rewrites the side panel, so the video keeps playing where it was.
function renderWatchChrome(vid) {
  const v = byVid.get(vid), n = nodeById.get(v.n);
  document.getElementById("wpanel").innerHTML = watchPanel(v);
  document.getElementById("wback").textContent = `← ${nm(n)}`;
  const more = document.getElementById("wmore");
  if (more) {
    more.textContent = nm(n);
    document.getElementById("wsib").innerHTML = nodeVideos(v.n).filter((x) => x.v !== vid).slice(0, 3).map(card).join("");
  }
  document.getElementById("mark").addEventListener("click", () => toggleWatched(vid));
}
function viewWatch(vid) {
  const v = byVid.get(vid);
  if (!v) return viewMissing();
  currentVid = vid;
  const n = nodeById.get(v.n);
  const siblings = nodeVideos(v.n).filter((x) => x.v !== vid).slice(0, 3);
  $main.innerHTML = `<a class="back" id="wback" href="#/node/${esc(n.id)}"></a>
    <div class="watch">
      <div><iframe class="player" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(vid)}?rel=0" title="${esc(v.t)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
      ${siblings.length ? `<h2 class="more-t" id="wmore"></h2><div class="grid grid--tight" id="wsib">${siblings.map(card).join("")}</div>` : ""}</div>
      <aside class="panel" id="wpanel"></aside>
    </div>`;
  renderWatchChrome(vid);
}
function nextLink(nx) {
  return nx ? `<a class="btn ghost" id="nextbtn" href="#/watch/${esc(nx.v)}">${esc(t("next"))} ${esc(nx.t.slice(0, 40))}${nx.t.length > 40 ? "…" : ""}</a>` : "";
}

const ABOUT = {
  en: (st, ev) => `
    <h1>How the trail is built</h1>
    <p class="lede">Popularity is easy to fake. Repeated recommendation from people who know the subject is not. Prereq only uses that second signal, then puts it in order.</p>
    <h2>1. Expert signal, not views</h2>
    <ul>
      <li><b>Hacker News, 2007–2026.</b> HackerTube scanned every HN comment for YouTube links and kept videos recommended by at least 3 people in 3 different months. We took the ${st.from_hn} AI and ML-math candidates from its open dataset.</li>
      <li><b>Course syllabi and study guides.</b> ${st.curricula} public sources (MIT 6.S191, Stanford CS231n, Karpathy's Zero to Hero, fast.ai, curated study lists). A video linked by people who teach the subject counts as a recommendation.</li>
    </ul>
    <h2>2. Does it actually teach?</h2>
    <p>Every candidate was read by an LLM against a strict rubric: a viewer must come away understanding an AI concept. Demos without explanation, general programming talks and entertainment were dropped. ${st.candidates} candidates became ${st.videos} videos.</p>
    <h2>3. A map with prerequisites</h2>
    <p>${st.nodes} topics form a dependency graph (checked for cycles). Each video gets one topic, a level from "no background" to "research", and a one-line "after this you will understand…". Inside a topic: easiest first, then strongest signal. "Up next" walks the graph from what you marked as watched.</p>
    <h2>4. Checked, with the numbers published</h2>${ev}
    <h2>Limits</h2>
    <ul>
      <li>HN skews to fundamentals; very recent LLM material is thinner. Videos marked "dated" are still shown.</li>
      <li>Labels are written by a model and checked by two blind judges; expect a few percent of noise.</li>
      <li>No accounts, no analytics. Progress lives in your browser. Thumbnails and players load from YouTube.</li>
    </ul>
    <h2>Open source</h2>
    <p>Everything is on <a href="https://github.com/deivithi/prereq" target="_blank" rel="noopener">GitHub</a> under MIT: the scripts that build the pool, every label the model wrote, the two blind judges' answers and the eval script. Rerun it, audit a label, or fork it for another subject. Know a video that belongs here? <a href="${SUGGEST}" target="_blank" rel="noopener">Suggest it</a>.</p>
    <h2>Credits</h2>
    <p>Data from <a href="https://hackertube.org" target="_blank" rel="noopener">HackerTube</a> by Andrej Karpathy (ODC-By) and the <a href="https://huggingface.co/datasets/open-index/hacker-news" target="_blank" rel="noopener">open-index/hacker-news</a> archive. Built for the AI-education-feed challenge by @0xSero, end to end with Claude Code.</p>`,
  pt: (st, ev) => `
    <h1>Como a trilha é montada</h1>
    <p class="lede">Popularidade é fácil de forjar. Recomendação repetida de quem entende do assunto, não. O Prereq usa só esse segundo sinal e depois põe tudo em ordem.</p>
    <h2>1. Sinal de especialista, não views</h2>
    <ul>
      <li><b>Hacker News, 2007 a 2026.</b> O HackerTube varreu todo comentário do HN atrás de links do YouTube e ficou com os vídeos recomendados por pelo menos 3 pessoas em 3 meses diferentes. Pegamos os ${st.from_hn} candidatos de IA e de matemática para ML do dataset aberto.</li>
      <li><b>Syllabi de cursos e guias de estudo.</b> ${st.curricula} fontes públicas (MIT 6.S191, Stanford CS231n, Zero to Hero do Karpathy, fast.ai, listas de estudo). Vídeo linkado por quem ensina o assunto conta como recomendação.</li>
    </ul>
    <h2>2. Ensina de verdade?</h2>
    <p>Um LLM leu cada candidato contra uma régua rígida: quem assiste precisa sair entendendo um conceito de IA. Demo sem explicação, palestra geral de programação e entretenimento ficaram de fora. ${st.candidates} candidatos viraram ${st.videos} vídeos.</p>
    <h2>3. Um mapa com pré-requisitos</h2>
    <p>${st.nodes} tópicos formam um grafo de dependências (conferido contra ciclos). Cada vídeo ganha um tópico, um nível de "sem base" a "pesquisa" e uma frase do que você entende depois. Dentro do tópico: do mais fácil ao mais difícil, depois pelo sinal mais forte. O "Seu próximo vídeo" percorre o grafo a partir do que você marcou.</p>
    <h2>4. Conferido, com os números publicados</h2>${ev}
    <h2>Limites</h2>
    <ul>
      <li>O HN puxa para fundamentos; conteúdo de LLM muito recente é mais raro. Vídeos marcados como "datado" continuam aparecendo.</li>
      <li>Os rótulos são escritos por um modelo e conferidos por dois juízes cegos; espere alguns por cento de ruído.</li>
      <li>Sem conta, sem analytics. O progresso fica no seu navegador. Thumbnails e players carregam do YouTube.</li>
    </ul>
    <h2>Código aberto</h2>
    <p>Está tudo no <a href="https://github.com/deivithi/prereq" target="_blank" rel="noopener">GitHub</a>, sob MIT: os scripts que montam a base, cada rótulo que o modelo escreveu, as respostas dos dois juízes cegos e o script do eval. Rode de novo, audite um rótulo ou faça um fork para outro assunto. Conhece um vídeo que deveria estar aqui? <a href="${SUGGEST}" target="_blank" rel="noopener">Sugira</a>.</p>
    <h2>Créditos</h2>
    <p>Dados do <a href="https://hackertube.org" target="_blank" rel="noopener">HackerTube</a>, de Andrej Karpathy (ODC-By), e do arquivo <a href="https://huggingface.co/datasets/open-index/hacker-news" target="_blank" rel="noopener">open-index/hacker-news</a>. Feito para o desafio de feed de educação em IA do @0xSero, de ponta a ponta com o Claude Code.</p>`,
};
function viewAbout() {
  const ev = D.eval;
  const head = lang === "pt" ? ["Checagem", "Resultado", "O que significa"] : ["Check", "Result", "What it means"];
  const evHtml = ev ? `<div class="tablewrap"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${ev.rows.map((r) => {
    const m = (lang === "pt" && r.pt?.metric) || r.metric, note = (lang === "pt" && r.pt?.note) || r.note;
    return `<tr><td>${esc(m)}</td><td class="mono">${esc(r.value)}</td><td>${esc(note)}</td></tr>`;
  }).join("")}</tbody></table></div>` : "";
  $main.innerHTML = `<div class="prose">${ABOUT[lang](D.stats, evHtml)}
    <p style="margin-top:28px"><button type="button" class="btn ghost" id="reset">${esc(t("reset"))}</button></p></div>`;
  document.getElementById("reset").addEventListener("click", () => {
    if (!confirm(t("resetAsk"))) return;
    watched = new Set(); saveWatched(); location.hash = "#/trail";
  });
}

function viewMissing() { $main.innerHTML = `<div class="empty">${esc(t("missing"))} <a href="#/trail">${esc(t("backTrail"))}</a></div>`; }

// ---------- command palette ----------
const pal = document.getElementById("palette");
const palInput = document.getElementById("pal-q");
const palList = document.getElementById("pal-list");
let palItems = [], palSel = 0;
function palRender() {
  const q = palInput.value.trim().toLowerCase();
  const tps = D.nodes.filter((n) => (byNode.get(n.id) || []).length && (!q || `${n.name} ${n.pt?.name || ""} ${n.desc}`.toLowerCase().includes(q))).slice(0, q ? 5 : 4);
  const vids = D.videos.filter((v) => !q || `${v.t} ${v.c} ${vo(v)}`.toLowerCase().includes(q)).slice(0, 8);
  palItems = [...tps.map((n) => ({ href: `#/node/${n.id}`, html: `<b>${esc(nm(n))}</b><small>${esc(t("videos", (byNode.get(n.id) || []).length))}</small>`, g: "t" })),
    ...vids.map((v) => ({ href: `#/watch/${v.v}`, html: `<b>${esc(v.t)}</b><small>${esc(v.c)} · ${esc(nm(nodeById.get(v.n)))}</small>`, g: "v" }))];
  palSel = 0;
  let lastG = "";
  palList.innerHTML = palItems.length ? palItems.map((it, i) => {
    const g = it.g !== lastG ? `<li class="pal-g" role="presentation">${esc(it.g === "t" ? t("palTopics") : t("palVideos"))}</li>` : "";
    lastG = it.g;
    return `${g}<li role="option" id="pal-${i}" aria-selected="${i === 0}"><a href="${esc(it.href)}" tabindex="-1">${it.html}</a></li>`;
  }).join("") : `<li class="pal-g" role="presentation">${esc(t("palEmpty"))}</li>`;
  if (palItems.length) palInput.setAttribute("aria-activedescendant", "pal-0");
  else palInput.removeAttribute("aria-activedescendant");
}
function palMove(d) {
  if (!palItems.length) return;
  palSel = (palSel + d + palItems.length) % palItems.length;
  palList.querySelectorAll('[role="option"]').forEach((li, i) => li.setAttribute("aria-selected", String(i === palSel)));
  const el = document.getElementById(`pal-${palSel}`);
  el?.scrollIntoView({ block: "nearest" });
  palInput.setAttribute("aria-activedescendant", `pal-${palSel}`);
}
function openPalette() {
  if (!D || pal.open) return;
  palInput.placeholder = t("palPh");
  document.getElementById("pal-hint").textContent = t("palHint");
  palInput.value = ""; palRender(); pal.showModal(); palInput.focus();
}
palInput.addEventListener("input", palRender);
palInput.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { e.preventDefault(); palMove(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); palMove(-1); }
  else if (e.key === "Enter" && palItems[palSel]) { e.preventDefault(); location.hash = palItems[palSel].href; pal.close(); }
});
palList.addEventListener("click", (e) => { if (e.target.closest("a")) pal.close(); });
pal.addEventListener("click", (e) => { if (e.target === pal) pal.close(); });
document.getElementById("open-search").addEventListener("click", openPalette);

addEventListener("keydown", (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
  if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); openPalette(); return; }
  if (typing || e.metaKey || e.ctrlKey || e.altKey || pal.open || !currentVid) return;
  if (e.key === "m") toggleWatched(currentVid);
  else if (e.key === "n") document.getElementById("nextbtn")?.click();
});
// Skip link: move focus without touching the hash (a "#main" hash is not a route).
document.querySelector(".skip").addEventListener("click", (e) => { e.preventDefault(); $main.focus(); });

// ---------- language ----------
function applyChrome() {
  document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  document.querySelector('[data-tab="trail"]').textContent = t("tabTrail");
  document.querySelector('[data-tab="map"]').textContent = t("tabMap");
  document.querySelector('[data-tab="feed"]').textContent = t("tabFeed");
  document.querySelector('[data-tab="about"]').textContent = t("tabAbout");
  document.getElementById("open-search").setAttribute("aria-label", t("searchBtn"));
  document.getElementById("palette").setAttribute("aria-label", t("searchBtn"));
  document.querySelector(".skip").textContent = t("skip");
  document.querySelector(".foot p").innerHTML = t("foot"); // fixed strings of ours, no data inside
  const code = document.getElementById("code-link");
  code.setAttribute("aria-label", t("codeAria"));
  code.querySelector("span").textContent = t("codeLabel");
  document.querySelectorAll("#lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  document.getElementById("lang").setAttribute("aria-label", t("langLabel"));
}
document.querySelectorAll("#lang button").forEach((b) => b.addEventListener("click", () => {
  if (b.dataset.lang === lang) return;
  lang = b.dataset.lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* session-only */ }
  applyChrome();
  if (!D) return;
  if (currentVid && document.getElementById("wpanel")) {
    renderWatchChrome(currentVid); // keep the playing video
    document.title = `${byVid.get(currentVid).t} — Prereq`;
  } else route(true);
}));

// ---------- routing ----------
const safeDecode = (s) => { try { return decodeURIComponent(s || ""); } catch { return ""; } };
const ROUTES = new Map([
  ["trail", ["trail", () => viewHome()]],
  ["map", ["map", () => viewMap()]],
  ["node", ["map", (a) => viewNode(a)]],
  ["watch", ["trail", (a) => viewWatch(a)]],
  ["feed", ["feed", () => viewFeed()]],
  ["about", ["about", () => viewAbout()]],
]);
let firstRoute = true;
function route(keepScroll) {
  if (!D) return; // data not loaded yet; the fetch below renders once it arrives
  let hash = location.hash || "#/trail";
  if (!hash.startsWith("#/")) {
    // e.g. the "#main" skip link: not a route. After the first render just move focus;
    // on a fresh load with such a hash, show the trail instead of an empty page.
    if (!firstRoute) { $main.focus(); return; }
    history.replaceState(null, "", "#/trail");
    hash = "#/trail";
  }
  const [, rawView, arg] = hash.split("/");
  const view = rawView || "trail";
  const [tab, render] = ROUTES.get(view) || ["", () => viewMissing()];
  const wasFirst = firstRoute;
  currentVid = null; // a shortcut pressed during the transition must not act on the previous video
  const paint = () => {
    document.querySelectorAll(".tabs a").forEach((a) => a.toggleAttribute("aria-current", false));
    const a = document.querySelector(`.tabs a[data-tab="${tab}"]`);
    if (a) a.setAttribute("aria-current", "page");
    render(safeDecode(arg));
    const h1 = $main.querySelector("h1");
    document.title = h1 && view !== "trail" ? `${h1.textContent} — Prereq` : t("title");
    if (keepScroll !== true) window.scrollTo(0, 0);
    if (!wasFirst && keepScroll !== true) $main.focus({ preventScroll: true }); // announce the new page to keyboard / screen reader users
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!wasFirst && !reduce && document.startViewTransition) document.startViewTransition(paint); else paint();
  firstRoute = false;
}

applyChrome();
window.addEventListener("hashchange", () => route());
fetch("data.json").then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((d) => {
  D = d; index(); route();
}).catch(() => { $main.innerHTML = `<div class="empty">${esc(t("loadErr"))}</div>`; });

if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
