// Phase 7a: merge candidates + LLM labels (+ eval) into site/data.json.
// Signal = HackerTube score + curriculum bonus (course source 3, study guide 2).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lines = (f) => fs.readFileSync(path.join(root, f), "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);

const trail = JSON.parse(fs.readFileSync(path.join(root, "data/trail.json"), "utf8"));
const nodeIds = new Set(trail.nodes.map((n) => n.id));
const sources = JSON.parse(fs.readFileSync(path.join(root, "data/sources.json"), "utf8"));
const kind = Object.fromEntries(sources.map((s) => [s.id, s.kind]));
const ht = new Map(lines("data/raw/hackertube-data/videos.jsonl").map((v) => [v.vid, v]));
const cand = new Map(lines("data/candidates.jsonl").map((c) => [c.vid, c]));

const labels = new Map();
const classDir = path.join(root, "data/class");
for (const f of fs.readdirSync(classDir).filter((f) => /^batch-\d+\.jsonl$/.test(f))) {
  for (const l of lines(`data/class/${f}`)) labels.set(l.vid, l);
}
// PT-BR translations of the per-video lines (data/i18n/pt-N.jsonl). English stays the default.
const i18nDir = path.join(root, "data/i18n");
const pt = new Map();
if (fs.existsSync(i18nDir)) {
  for (const f of fs.readdirSync(i18nDir).filter((f) => /^pt-\d+\.jsonl$/.test(f))) {
    for (const l of lines(`data/i18n/${f}`)) pt.set(l.vid, l);
  }
}
const overrides =fs.existsSync(path.join(root, "data/overrides.json")) ? JSON.parse(fs.readFileSync(path.join(root, "data/overrides.json"), "utf8")) : {};

const problems = [];
const videos = [];
for (const [vid, c] of cand) {
  const lab = { ...labels.get(vid), ...(overrides[vid] || {}) };
  if (!labels.has(vid)) { problems.push(`missing label ${vid}`); continue; }
  if (!lab.teaches_ai) continue;
  if (!nodeIds.has(lab.node)) { problems.push(`bad node ${vid} ${lab.node}`); continue; }
  if (![1, 2, 3, 4].includes(lab.level)) { problems.push(`bad level ${vid}`); continue; }
  if (lab.flag === "weak") continue; // shallow duplicates of better material on the same topic
  const bonus = (c.curricula || []).reduce((a, s) => a + (kind[s] === "course" ? 3 : 2), 0);
  const h = ht.get(vid);
  videos.push({
    v: vid, t: c.title, c: c.channel, n: lab.node, l: lab.level, o: lab.one_liner, f: lab.flag === "dated" ? "dated" : "ok",
    s: Math.round(((c.hn_score || 0) + bonus) * 10) / 10, r: c.hn_recommenders || 0, cu: c.curricula || [],
    y: c.first_year || null, w: h?.why_hn || "",
    q: h?.quote?.text ? { text: h.quote.text, id: h.quote.hn_comment_id, year: h.quote.year } : null,
  });
  const tr = pt.get(vid);
  if (pt.size) {
    if (!tr?.o) problems.push(`missing pt translation ${vid}`);
    else Object.assign(videos[videos.length - 1], { op: tr.o, wp: tr.w || "" });
  }
}
videos.sort((a, b) => b.s - a.s);
for (const n of trail.nodes) for (const p of n.prereqs) if (!nodeIds.has(p)) problems.push(`unknown prereq ${p} in ${n.id}`);
if (problems.length && !process.argv.includes("--allow-problems")) {
  console.error(JSON.stringify({ problems }, null, 1));
  console.error("site/data.json NOT written. Fix the labels or pass --allow-problems.");
  process.exit(1);
}

const evalPath = path.join(root, "data/eval.json");
const data = {
  generated: new Date().toISOString().slice(0, 10),
  stats: {
    videos: videos.length, nodes: new Set(videos.map((v) => v.n)).size, candidates: cand.size,
    from_hn: [...cand.values()].filter((c) => c.hn_score > 0).length,
    recommenders: videos.reduce((a, v) => a + v.r, 0), curricula: sources.filter((s) => s.ok && s.videos > 0).length,
  },
  stages: trail.stages, nodes: trail.nodes, videos,
  eval: fs.existsSync(evalPath) ? JSON.parse(fs.readFileSync(evalPath, "utf8")) : null,
};
fs.writeFileSync(path.join(root, "site/data.json"), JSON.stringify(data));
const perNode = {}; for (const v of videos) perNode[v.n] = (perNode[v.n] || 0) + 1;
console.log(JSON.stringify({ labels: labels.size, kept: videos.length, dropped_weak: [...labels.values()].filter((l) => l.teaches_ai && l.flag === "weak").length, problems, perNode, stats: data.stats }, null, 1));
