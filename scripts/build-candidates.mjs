// Phase 3: validate the trail DAG, merge both pools into data/candidates.jsonl,
// and split them into batches for LLM classification (data/batches/batch-N.jsonl).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8").trim().split("\n").map(JSON.parse);

// --- DAG check: known prereqs, no cycle, every node reachable from a root.
const trail = JSON.parse(fs.readFileSync(path.join(root, "data/trail.json"), "utf8"));
const ids = new Set(trail.nodes.map((n) => n.id));
const byId = Object.fromEntries(trail.nodes.map((n) => [n.id, n]));
for (const n of trail.nodes) for (const p of n.prereqs) if (!ids.has(p)) throw new Error(`unknown prereq ${p} in ${n.id}`);
const state = {};
const visit = (id) => {
  if (state[id] === 1) throw new Error(`cycle at ${id}`);
  if (state[id] === 2) return;
  state[id] = 1; byId[id].prereqs.forEach(visit); state[id] = 2;
};
trail.nodes.forEach((n) => visit(n.id));
const roots = trail.nodes.filter((n) => !n.prereqs.length).map((n) => n.id);

// --- merge pools
const hn = read("data/pool-hn.jsonl");
const cur = read("data/pool-curricula.jsonl").filter((r) => r.alive);
const ht = new Map(read("data/raw/hackertube-data/videos.jsonl").map((v) => [v.vid, v]));
const merged = new Map();
for (const v of hn) merged.set(v.vid, { vid: v.vid, title: v.title, channel: v.channel, summary: v.summary, why_hn: v.why_hn, tags: v.tags, content_type: v.content_type, hn_score: v.score, hn_recommenders: v.recommenders, first_year: v.first_year, curricula: [], contexts: [] });
for (const c of cur) {
  const base = merged.get(c.vid) || (() => {
    const h = ht.get(c.vid); // in HackerTube but filtered out of the HN pool: keep its card for context
    return { vid: c.vid, title: c.title, channel: c.channel, summary: h?.summary || "", why_hn: h?.why_hn || "", tags: h?.tags || [], content_type: h?.content_type || "", hn_score: h?.score || 0, hn_recommenders: h?.hn.recommenders || 0, first_year: h?.hn.first_year || null, curricula: [], contexts: [] };
  })();
  base.curricula = c.sources; base.contexts = c.contexts;
  merged.set(c.vid, base);
}
const all = [...merged.values()];
fs.writeFileSync(path.join(root, "data/candidates.jsonl"), all.map((r) => JSON.stringify(r)).join("\n") + "\n");

const N = 4;
fs.mkdirSync(path.join(root, "data/batches"), { recursive: true });
for (let i = 0; i < N; i++) {
  const part = all.filter((_, j) => j % N === i).map(({ vid, title, channel, summary, why_hn, tags, content_type, contexts }) => ({ vid, title, channel, summary, why_hn, tags, content_type, contexts }));
  fs.writeFileSync(path.join(root, `data/batches/batch-${i + 1}.jsonl`), part.map((r) => JSON.stringify(r)).join("\n") + "\n");
}
console.log(JSON.stringify({ dag_ok: true, nodes: trail.nodes.length, roots, candidates: all.length, from_hn: hn.length, curricula_only: all.length - hn.length, batches: N }, null, 1));
