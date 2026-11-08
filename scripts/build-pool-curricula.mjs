// Phase 2: "videos that AI curricula keep linking".
// Fetches course syllabi and study-guide READMEs, extracts YouTube video ids,
// counts distinct sources per video, and resolves title/channel via oEmbed (no API key).
// Output: data/pool-curricula.jsonl + data/sources.json (fetch status per source).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gh = (repo, file = "README.md") => [`https://raw.githubusercontent.com/${repo}/main/${file}`, `https://raw.githubusercontent.com/${repo}/master/${file}`];

// [id, kind, urls-to-try]
const SOURCES = [
  ["karpathy/nn-zero-to-hero", "course", gh("karpathy/nn-zero-to-hero")],
  ["stanford-cs336", "course", ["https://stanford-cs336.github.io/spring2025/", "https://stanford-cs336.github.io/spring2024/"]],
  ["stanford-cs224n", "course", ["https://web.stanford.edu/class/cs224n/"]],
  ["stanford-cs231n", "course", ["https://cs231n.stanford.edu/schedule.html"]],
  ["stanford-cs25", "course", ["https://web.stanford.edu/class/cs25/"]],
  ["mit-6s191", "course", ["https://introtodeeplearning.com/"]],
  ["fast.ai", "course", ["https://course.fast.ai/"]],
  ["gpu-mode/lectures", "course", gh("gpu-mode/lectures")],
  ["mlabonne/llm-course", "guide", gh("mlabonne/llm-course")],
  ["dair-ai/ML-YouTube-Courses", "guide", gh("dair-ai/ML-YouTube-Courses")],
  ["Hannibal046/Awesome-LLM", "guide", gh("Hannibal046/Awesome-LLM")],
  ["rasbt/LLMs-from-scratch", "guide", gh("rasbt/LLMs-from-scratch")],
  ["jacobhilton/deep_learning_curriculum", "guide", gh("jacobhilton/deep_learning_curriculum")],
  ["Developer-Y/cs-video-courses", "guide", gh("Developer-Y/cs-video-courses")],
  ["aishwaryanr/awesome-generative-ai-guide", "guide", gh("aishwaryanr/awesome-generative-ai-guide")],
  ["microsoft/AI-For-Beginners", "guide", gh("microsoft/AI-For-Beginners")],
  ["microsoft/generative-ai-for-beginners", "guide", gh("microsoft/generative-ai-for-beginners")],
  ["GokuMohandas/Made-With-ML", "guide", gh("GokuMohandas/Made-With-ML")],
  ["stas00/ml-engineering", "guide", gh("stas00/ml-engineering")],
  ["keon/awesome-nlp", "guide", gh("keon/awesome-nlp")],
  ["aikorea/awesome-rl", "guide", gh("aikorea/awesome-rl")],
  ["ChristosChristofidis/awesome-deep-learning", "guide", gh("ChristosChristofidis/awesome-deep-learning")],
  ["ujjwalkarn/Machine-Learning-Tutorials", "guide", gh("ujjwalkarn/Machine-Learning-Tutorials")],
  ["louisfb01/start-machine-learning", "guide", gh("louisfb01/start-machine-learning")],
  ["eugeneyan/applied-ml", "guide", gh("eugeneyan/applied-ml")],
  ["Mooler0410/LLMsPracticalGuide", "guide", gh("Mooler0410/LLMsPracticalGuide")],
  ["openai/spinningup", "guide", ["https://spinningup.openai.com/en/latest/spinningup/rl_intro.html", ...gh("openai/spinningup")]],
  ["d2l-ai", "course", ["https://d2l.ai/"]],
];

const ID_RE = /(?:youtube\.com\/(?:watch\?(?:[^"'\s)]*&)?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/g;
const strip = (s) => s.replace(/<[^>]+>/g, " ").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();

async function get(url) {
  const r = await fetch(url, { headers: { "user-agent": "trilha-ia-research/0.1" }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

const hits = new Map(); // vid -> {sources:Set, contexts:[]}
const status = [];
for (const [id, kind, urls] of SOURCES) {
  let ok = null;
  for (const u of urls) {
    try { const text = await get(u); ok = { url: u, text }; break; } catch (e) { ok = ok || null; }
  }
  if (!ok) { status.push({ id, kind, ok: false }); continue; }
  const lines = ok.text.split(/\n|<\/(?:li|tr|p|div)>/i);
  let n = 0;
  for (const line of lines) {
    for (const m of line.matchAll(ID_RE)) {
      const vid = m[1];
      if (!hits.has(vid)) hits.set(vid, { sources: new Set(), contexts: [] });
      const h = hits.get(vid);
      if (!h.sources.has(id)) { h.sources.add(id); n++; const c = strip(line).slice(0, 220); if (c) h.contexts.push(`${id}: ${c}`); }
    }
  }
  status.push({ id, kind, ok: true, url: ok.url, videos: n });
}

// Merge with HackerTube ids so we know which ones already have rich cards.
const ht = new Set(fs.readFileSync(path.join(root, "data/raw/hackertube-data/videos.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l).vid));

async function oembed(vid) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${vid}`, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return { alive: false, http: r.status };
    const j = await r.json();
    return { alive: true, title: j.title, channel: j.author_name };
  } catch { return { alive: null }; }
}

const rows = [...hits.entries()].map(([vid, h]) => ({ vid, n_sources: h.sources.size, sources: [...h.sources], contexts: h.contexts.slice(0, 4), in_hackertube: ht.has(vid) }));
const queue = [...rows];
await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) { const r = queue.shift(); Object.assign(r, await oembed(r.vid)); }
}));

rows.sort((a, b) => b.n_sources - a.n_sources);
fs.writeFileSync(path.join(root, "data/pool-curricula.jsonl"), rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
fs.writeFileSync(path.join(root, "data/sources.json"), JSON.stringify(status, null, 1));
const alive = rows.filter((r) => r.alive);
console.log(JSON.stringify({
  sources_ok: status.filter((s) => s.ok).length, sources_failed: status.filter((s) => !s.ok).map((s) => s.id),
  videos: rows.length, alive: alive.length, dead: rows.filter((r) => r.alive === false).length,
  ge2_sources: alive.filter((r) => r.n_sources >= 2).length, in_hackertube: alive.filter((r) => r.in_hackertube).length,
}, null, 1));
