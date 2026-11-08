// Phase 1: build the HN candidate pool for the AI education trail.
// Input: data/raw/hackertube-data/videos.jsonl (ODC-By, credit HackerTube + open-index/hacker-news)
// Output: data/pool-hn.jsonl + a count summary on stdout.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "data/raw/hackertube-data/videos.jsonl");
const out = path.join(root, "data/pool-hn.jsonl");

const AI_CATS = new Set([
  "machine-learning", "llms-generative-ai", "ai-safety-impact",
  "computer-vision-speech", "data-science-statistics", "ai-data-other",
]);
// Math prerequisites count only when the tags say they feed ML.
const MATH_CATS = new Set([
  "pure-mathematics", "probability-game-theory", "information-theory",
  "recreational-math", "algorithms-data-structures",
]);
const MATH_TAG = /linear algebra|calculus|probabilit|statistic|bayes|gradient|matri|entropy|information theory|optimi[sz]|fourier|eigen/i;
const DROP_TYPES = new Set(["comedy", "music", "news"]);

const norm = (t) => t.toLowerCase().replace(/\(.*?\)|\[.*?\]|[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const videos = fs.readFileSync(src, "utf8").trim().split("\n").map(JSON.parse);
const seen = new Map();
const stats = { input: videos.length, ai: 0, math: 0, dropped_news: 0, dropped_unrecommended: 0, dropped_type: 0, dupes: 0 };

for (const v of videos) {
  const ids = v.categories.map((c) => c.id);
  const isAi = ids.some((id) => AI_CATS.has(id));
  const blob = [v.primary_topic, ...(v.tags || [])].join(" ");
  const isMath = !isAi && ids.some((id) => MATH_CATS.has(id)) && MATH_TAG.test(blob);
  if (!isAi && !isMath) continue;
  if (v.shelf_life === "news") { stats.dropped_news++; continue; }
  if (v.hn.recommenders === 0) { stats.dropped_unrecommended++; continue; }
  if (DROP_TYPES.has(v.content_type)) { stats.dropped_type++; continue; }
  const key = norm(v.title);
  if (seen.has(key)) { stats.dupes++; continue; } // input is best-scored first, so the first copy wins
  seen.set(key, {
    vid: v.vid, title: v.title, channel: v.channel, summary: v.summary, why_hn: v.why_hn,
    content_type: v.content_type, level_hn: v.level, shelf_life: v.shelf_life,
    primary_topic: v.primary_topic, tags: v.tags, categories: ids,
    bucket: isAi ? "ai" : "math", score: v.score,
    recommenders: v.hn.recommenders, first_year: v.hn.first_year, last_year: v.hn.last_year,
    source: "hackertube",
  });
  isAi ? stats.ai++ : stats.math++;
}

const pool = [...seen.values()];
fs.writeFileSync(out, pool.map((p) => JSON.stringify(p)).join("\n") + "\n");
console.log(JSON.stringify({ ...stats, pool: pool.length, out: path.relative(root, out) }, null, 1));
