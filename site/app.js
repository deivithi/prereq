"use strict";
// Prereq — static client. State (watched videos) lives only in localStorage.
const LEVELS = { 1: "No background", 2: "Some code / math", 3: "Practitioner", 4: "Research" };
const KEY = "prereq.watched.v1";
const SUGGEST = "https://github.com/deivithi/prereq/issues/new?title=Suggest%20a%20video";
const $main = document.getElementById("main");
let D = null; // data.json
let byVid = new Map(), byNode = new Map(), nodeById = new Map(), order = [];
const feedState = { level: 0, stage: "", q: "", dated: false, sort: "trail" };

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const thumb = (v) => `https://i.ytimg.com/vi/${encodeURIComponent(v)}/mqdefault.jpg`;
function loadWatched() { try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { return new Set(); } }
let watched = loadWatched();
function saveWatched() { try { localStorage.setItem(KEY, JSON.stringify([...watched])); } catch { /* private mode: progress is session-only */ } }

function index() {
  D.nodes.forEach((n) => nodeById.set(n.id, n));
  order = D.stages.flatMap((s) => D.nodes.filter((n) => n.stage === s.id).map((n) => n.id));
  for (const v of D.videos) {
    byVid.set(v.v, v);
    if (!byNode.has(v.n)) byNode.set(v.n, []);
    byNode.get(v.n).push(v);
  }
  // Inside a node: easiest first, then strongest expert signal.
  for (const list of byNode.values()) list.sort((a, b) => a.l - b.l || b.s - a.s);
}

const nodeVideos = (id) => (byNode.get(id) || []).filter((v) => v.f !== "dated");
function nodeProgress(id) {
  const list = nodeVideos(id);
  const seen = list.filter((v) => watched.has(v.v)).length;
  const need = Math.min(2, list.length);
  return { seen, total: list.length, done: list.length > 0 && seen >= need };
}
function upNext(skip) {
  const fresh = (x) => !watched.has(x.v) && x.v !== skip;
  for (const id of order) {
    const n = nodeById.get(id);
    if (nodeProgress(id).done || !nodeVideos(id).length) continue;
    if (!n.prereqs.every((p) => nodeProgress(p).done || !nodeVideos(p).length)) continue;
    const v = nodeVideos(id).find(fresh);
    if (v) return v;
  }
  return D.videos.find(fresh) || null;
}
function nextInTrail(vid) {
  const v = byVid.get(vid);
  const list = nodeVideos(v.n);
  const i = list.findIndex((x) => x.v === vid);
  const after = list.slice(i + 1).find((x) => !watched.has(x.v));
  if (after) return after;
  const nx = upNext(vid);
  return nx && nx.v !== vid ? nx : null;
}

function signalChips(v) {
  const out = [];
  if (v.r) out.push(`<span class="chip${v.r >= 5 ? " hot" : ""}" title="Distinct Hacker News users who recommended it">${v.r} HN rec${v.r === 1 ? "" : "s"}</span>`);
  if (v.cu?.length) out.push(`<span class="chip hot" title="${esc(v.cu.join(", "))}">in ${v.cu.length} curricul${v.cu.length === 1 ? "um" : "a"}</span>`);
  if (v.f === "dated") out.push(`<span class="chip" title="Still useful, but the field has moved on">dated</span>`);
  return out.join("");
}
function card(v) {
  return `<a class="card" href="#/watch/${esc(v.v)}">
    <div class="thumb"><img loading="lazy" width="320" height="180" src="${thumb(v.v)}" alt="">${watched.has(v.v) ? '<span class="seen">watched</span>' : ""}</div>
    <h3>${esc(v.t)}</h3>
    <p class="ol">${esc(v.o)}</p>
    <div class="by">${esc(v.c)} · ${LEVELS[v.l] || ""}</div>
    <div class="sig">${signalChips(v)}</div>
  </a>`;
}

function viewTrail() {
  const nx = upNext();
  const st = D.stats;
  const nextHtml = nx ? `<a class="next" href="#/watch/${esc(nx.v)}">
      <img width="320" height="180" src="${thumb(nx.v)}" alt="">
      <div><div class="label">${watched.size ? "Up next for you" : "Start here"}</div>
      <h2>${esc(nx.t)}</h2><p class="muted" style="margin:4px 0 0">${esc(nx.o)}</p>
      <div class="mono muted" style="margin-top:8px">${esc(nodeById.get(nx.n).name)} · ${esc(nx.c)}</div></div></a>` : "";
  const stages = D.stages.map((s, i) => {
    const nodes = D.nodes.filter((n) => n.stage === s.id && (byNode.get(n.id) || []).length);
    if (!nodes.length) return "";
    return `<section class="stage" aria-labelledby="st-${s.id}">
      <div class="stage-head"><span class="stage-num">${String(i).padStart(2, "0")}</span><div><h2 id="st-${s.id}">${esc(s.name)}</h2><span class="muted">${esc(s.blurb)}</span></div></div>
      <div class="nodes">${nodes.map((n) => {
        const p = nodeProgress(n.id);
        const pre = n.prereqs.length ? `<div class="pre">${n.prereqs.map((x) => `<span class="chip">after ${esc(nodeById.get(x).name)}</span>`).join("")}</div>` : "";
        return `<a class="node${p.done ? " done" : ""}" href="#/node/${esc(n.id)}">
          <h3>${esc(n.name)}</h3><p>${esc(n.desc)}</p>${pre}
          <div class="bar" aria-hidden="true"><i style="width:${p.total ? Math.round((100 * p.seen) / p.total) : 0}%"></i></div>
          <div class="meta"><span>${p.total} videos</span><span>${p.seen} watched</span></div></a>`;
      }).join("")}</div></section>`;
  }).join("");
  $main.innerHTML = `<div class="hero">
      <h1>Learn AI in the order it actually makes sense.</h1>
      <p class="lede">${st.videos} videos that experts keep recommending — mined from 20 years of Hacker News and real course syllabi, then arranged into a trail with prerequisites. Watch, mark it, get the next one.</p>
      <div class="stats"><span><b>${st.videos}</b> videos</span><span><b>${st.nodes}</b> topics</span><span><b>${st.recommenders.toLocaleString("en")}</b> HN recommendations</span><span><b>${st.curricula}</b> course &amp; guide sources</span></div>
    </div>${nextHtml}${stages}`;
}

function viewNode(id) {
  const n = nodeById.get(id);
  if (!n) return viewMissing();
  const all = byNode.get(id) || [];
  const p = nodeProgress(id);
  const pre = n.prereqs.map((x) => `<a class="chip" href="#/node/${esc(x)}">${esc(nodeById.get(x).name)}</a>`).join(" ");
  $main.innerHTML = `<a class="back" href="#/trail">← Trail</a>
    <h1>${esc(n.name)}</h1><p class="lede">${esc(n.desc)}</p>
    ${pre ? `<p class="muted">Helps to know first: ${pre}</p>` : ""}
    <p class="mono muted">${p.seen} of ${p.total} watched · ordered easiest first, then by expert signal</p>
    <div class="grid">${all.map(card).join("")}</div>
    ${all.length < 5 ? `<p class="empty" style="margin-top:20px">Few videos here clear the bar of repeated expert recommendation yet. Know one that should? <a href="${SUGGEST}" rel="noopener">Suggest it</a> with where experts recommend it.</p>` : ""}`;
}

function feedList() {
  const s = feedState;
  const q = s.q.trim().toLowerCase();
  const list = D.videos.filter((v) => (!s.level || v.l === s.level) && (!s.stage || nodeById.get(v.n).stage === s.stage) && (s.dated || v.f !== "dated")
    && (!q || `${v.t} ${v.c} ${v.o}`.toLowerCase().includes(q)));
  return s.sort === "signal" ? [...list].sort((a, b) => b.s - a.s) : order.flatMap((id) => list.filter((v) => v.n === id));
}
// Re-render only the results so the search box keeps focus, IME state and caret.
function renderFeedResults() {
  const list = feedList();
  document.getElementById("count").textContent = `${list.length} videos`;
  document.getElementById("results").innerHTML = list.length ? `<div class="grid">${list.map(card).join("")}</div>` : `<div class="empty">Nothing matches. Clear the search or pick another level.</div>`;
  $main.querySelectorAll("[data-set]").forEach((b) => b.setAttribute("aria-pressed", String(String(feedState[b.dataset.set]) === b.dataset.val)));
}
function viewFeed() {
  const s = feedState;
  const seg = (name, val, label, cur) => `<button type="button" data-set="${name}" data-val="${val}" aria-pressed="${cur === val}">${label}</button>`;
  $main.innerHTML = `<h1>The feed</h1>
    <p class="lede">Every video in the trail. Filter by how much background you have.</p>
    <div class="controls">
      <input type="search" id="q" placeholder="Search titles, channels, topics" value="${esc(s.q)}" aria-label="Search">
      <div class="row seg" role="group" aria-label="Level">${seg("level", 0, "All levels", s.level)}${[1, 2, 3, 4].map((l) => seg("level", l, LEVELS[l], s.level)).join("")}</div>
      <div class="row">
        <select id="stage" aria-label="Stage"><option value="">All stages</option>${D.stages.map((x) => `<option value="${x.id}"${s.stage === x.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
        <span class="row seg" role="group" aria-label="Order">${seg("sort", "trail", "Trail order", s.sort)}${seg("sort", "signal", "Most recommended", s.sort)}</span>
        <label class="toggle"><input type="checkbox" id="dated"${s.dated ? " checked" : ""}> Include dated</label>
      </div>
      <div class="mono muted" id="count" aria-live="polite"></div>
    </div>
    <div id="results"></div>`;
  let t = 0;
  document.getElementById("q").addEventListener("input", (e) => { s.q = e.target.value; clearTimeout(t); t = setTimeout(renderFeedResults, 150); });
  document.getElementById("stage").addEventListener("change", (e) => { s.stage = e.target.value; renderFeedResults(); });
  document.getElementById("dated").addEventListener("change", (e) => { s.dated = e.target.checked; renderFeedResults(); });
  $main.querySelectorAll("[data-set]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.set; s[k] = k === "level" ? Number(b.dataset.val) : b.dataset.val; renderFeedResults();
  }));
  renderFeedResults();
}

function viewWatch(vid) {
  const v = byVid.get(vid);
  if (!v) return viewMissing();
  const n = nodeById.get(v.n);
  const nx = nextInTrail(vid);
  const isSeen = watched.has(vid);
  const quote = v.q ? `<blockquote>“${esc(v.q.text)}”</blockquote><div class="mono muted">— <a href="https://news.ycombinator.com/item?id=${encodeURIComponent(v.q.id)}" rel="noopener">Hacker News comment, ${esc(v.q.year)}</a></div>` : "";
  const cur = v.cu?.length ? `<div><div class="mono muted">Linked from</div><div class="pre" style="margin-top:4px">${v.cu.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div></div>` : "";
  $main.innerHTML = `<a class="back" href="#/node/${esc(n.id)}">← ${esc(n.name)}</a>
    <div class="watch">
      <iframe class="player" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(vid)}?rel=0" title="${esc(v.t)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
      <aside class="panel">
        <h2>${esc(v.t)}</h2>
        <div class="mono muted">${esc(v.c)} · ${LEVELS[v.l]}${v.y ? ` · on HN since ${v.y}` : ""}</div>
        <p style="margin:0"><b>After this:</b> ${esc(v.o)}</p>
        <div class="sig">${signalChips(v)}</div>
        ${v.w ? `<p class="muted" style="margin:0">${esc(v.w)}</p>` : ""}
        ${quote}${cur}
        <div class="btns">
          <button class="btn${isSeen ? " ghost" : ""}" id="mark" type="button" aria-pressed="${isSeen}">${isSeen ? "Watched ✓ (undo)" : "Mark as watched"}</button>
          <span id="nextslot">${nextLink(nx)}</span>
        </div>
        <a class="mono muted link" href="https://www.youtube.com/watch?v=${encodeURIComponent(vid)}" target="_blank" rel="noopener">Open on YouTube</a>
      </aside>
    </div>`;
  // Update the panel in place: re-rendering would reload the iframe and restart the video.
  document.getElementById("mark").addEventListener("click", (e) => {
    if (watched.has(vid)) watched.delete(vid); else watched.add(vid);
    saveWatched();
    const seen = watched.has(vid);
    e.currentTarget.textContent = seen ? "Watched ✓ (undo)" : "Mark as watched";
    e.currentTarget.classList.toggle("ghost", seen);
    e.currentTarget.setAttribute("aria-pressed", String(seen));
    document.getElementById("nextslot").innerHTML = nextLink(nextInTrail(vid));
  });
}
function nextLink(nx) {
  return nx ? `<a class="btn ghost" href="#/watch/${esc(nx.v)}">Next: ${esc(nx.t.slice(0, 40))}${nx.t.length > 40 ? "…" : ""}</a>` : "";
}

function viewAbout() {
  const st = D.stats, ev = D.eval;
  const evRows = ev ? ev.rows.map((r) => `<tr><td>${esc(r.metric)}</td><td class="mono">${esc(r.value)}</td><td>${esc(r.note)}</td></tr>`).join("") : "";
  $main.innerHTML = `<div class="prose">
    <h1>How the trail is built</h1>
    <p class="lede">Popularity is easy to fake. Repeated recommendation from people who know the subject is not. Prereq only uses that second signal, then puts it in order.</p>
    <h2>1. Expert signal, not views</h2>
    <ul>
      <li><b>Hacker News, 2007–2026.</b> HackerTube scanned every HN comment for YouTube links and kept videos recommended by at least 3 people in 3 different months. We took the ${st.from_hn} AI and ML-math candidates from its open dataset.</li>
      <li><b>Course syllabi and study guides.</b> ${st.curricula} public sources (MIT 6.S191, Stanford CS231n, Karpathy's Zero to Hero, fast.ai, GPU MODE, curated study lists). A video linked by people who teach the subject counts as a recommendation.</li>
    </ul>
    <h2>2. Does it actually teach?</h2>
    <p>Every candidate was read by an LLM against a strict rubric: a viewer must come away understanding an AI concept. Demos without explanation, general programming talks and entertainment were dropped. ${st.candidates} candidates became ${st.videos} videos.</p>
    <h2>3. A trail with prerequisites</h2>
    <p>${st.nodes} topics in ${D.stages.length} stages form a dependency graph (checked for cycles). Each video gets one topic, a level from "no background" to "research", and a one-line "after this you will understand…". Inside a topic, easiest first, then strongest signal. The "Up next" card walks the graph using what you have marked as watched.</p>
    <h2>4. Checked, with the numbers published</h2>
    ${ev ? `<div class="tablewrap"><table><thead><tr><th>Check</th><th>Result</th><th>What it means</th></tr></thead><tbody>${evRows}</tbody></table></div>` : "<p class=\"muted\">Eval pending.</p>"}
    <h2>Limits</h2>
    <ul>
      <li>HN skews to fundamentals; very recent LLM material is thinner (videos with "dated" are still shown, marked).</li>
      <li>Labels are written by a model and checked by a second pass; expect a few percent of noise.</li>
      <li>No accounts, no analytics. Progress lives in your browser. Thumbnails and players load from YouTube.</li>
    </ul>
    <h2>Credits</h2>
    <p>Data from <a href="https://hackertube.org" rel="noopener">HackerTube</a> by Andrej Karpathy (ODC-By) and the <a href="https://huggingface.co/datasets/open-index/hacker-news" rel="noopener">open-index/hacker-news</a> archive. Built for the AI-education-feed challenge by @0xSero. Built end to end with Claude Code.</p>
  </div>`;
}

function viewMissing() { $main.innerHTML = `<div class="empty">That page does not exist. <a href="#/trail">Back to the trail</a></div>`; }

const safeDecode = (s) => { try { return decodeURIComponent(s || ""); } catch { return ""; } };
const ROUTES = new Map([
  ["trail", ["trail", () => viewTrail()]],
  ["node", ["trail", (a) => viewNode(a)]],
  ["watch", ["trail", (a) => viewWatch(a)]],
  ["feed", ["feed", () => viewFeed()]],
  ["about", ["about", () => viewAbout()]],
]);
let firstRoute = true;
function route() {
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
  document.querySelectorAll(".tabs a").forEach((a) => a.toggleAttribute("aria-current", false));
  const a = document.querySelector(`.tabs a[data-tab="${tab}"]`);
  if (a) a.setAttribute("aria-current", "page");
  render(safeDecode(arg));
  const h1 = $main.querySelector("h1, h2");
  document.title = h1 && view !== "trail" ? `${h1.textContent} — Prereq` : "Prereq — learn AI in the right order";
  window.scrollTo(0, 0);
  if (!firstRoute) $main.focus({ preventScroll: true }); // announce the new page to keyboard / screen reader users
  firstRoute = false;
}

window.addEventListener("hashchange", route);
fetch("data.json").then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((d) => {
  D = d; index(); route();
}).catch(() => { $main.innerHTML = `<div class="empty">Could not load the trail. Check your connection and reload.</div>`; });

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
