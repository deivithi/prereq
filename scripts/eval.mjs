// Phase 5: blind eval of the labels.
//   node scripts/eval.mjs sample   -> data/eval/sample.jsonl (60 candidates, fixed seed, no labels)
//   node scripts/eval.mjs score    -> data/eval.json (agreement classifier vs judges, judge vs judge)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lines = (f) => fs.readFileSync(path.join(root, f), "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
const N = 60;

if (process.argv[2] === "sample") {
  let seed = 20261107; // deterministic LCG so the sample is reproducible
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const all = lines("data/candidates.jsonl");
  const pick = [...all].map((c) => [rand(), c]).sort((a, b) => a[0] - b[0]).slice(0, N).map(([, c]) => c);
  fs.mkdirSync(path.join(root, "data/eval"), { recursive: true });
  fs.writeFileSync(path.join(root, "data/eval/sample.jsonl"), pick.map(({ vid, title, channel, summary, why_hn, tags, content_type, contexts }) => JSON.stringify({ vid, title, channel, summary, why_hn, tags, content_type, contexts })).join("\n") + "\n");
  console.log(`sample: ${pick.length}`);
} else if (process.argv[2] === "score") {
  const cls = new Map();
  for (const f of fs.readdirSync(path.join(root, "data/class")).filter((f) => /^batch-\d+\.jsonl$/.test(f))) for (const l of lines(`data/class/${f}`)) cls.set(l.vid, l);
  const j1 = new Map(lines("data/eval/judge-1.jsonl").map((l) => [l.vid, l]));
  const j2 = new Map(lines("data/eval/judge-2.jsonl").map((l) => [l.vid, l]));
  const vids = lines("data/eval/sample.jsonl").map((s) => s.vid).filter((v) => cls.has(v) && j1.has(v) && j2.has(v));
  const agree = (a, b, f) => {
    const n = vids.filter((v) => f(a.get(v)) === f(b.get(v))).length;
    return { n, of: vids.length, pct: Math.round((100 * n) / vids.length) };
  };
  // Node agreement only where both sides say it teaches AI.
  const nodeAgree = (a, b) => {
    const both = vids.filter((v) => a.get(v).teaches_ai && b.get(v).teaches_ai);
    const n = both.filter((v) => a.get(v).node === b.get(v).node).length;
    return { n, of: both.length, pct: both.length ? Math.round((100 * n) / both.length) : 0 };
  };
  const ta = (x) => !!x.teaches_ai;
  const r = {
    sample: vids.length,
    teaches: { cls_j1: agree(cls, j1, ta), cls_j2: agree(cls, j2, ta), j1_j2: agree(j1, j2, ta) },
    node: { cls_j1: nodeAgree(cls, j1), cls_j2: nodeAgree(cls, j2), j1_j2: nodeAgree(j1, j2) },
  };
  // Majority vote: the published label is "wrong" when both judges disagree with it.
  const outvoted = vids.filter((v) => ta(cls.get(v)) !== ta(j1.get(v)) && ta(j1.get(v)) === ta(j2.get(v)));
  r.outvoted = outvoted.map((v) => ({ vid: v, cls: ta(cls.get(v)), judges: ta(j1.get(v)) }));
  const f = (o) => `${o.pct}% (${o.n}/${o.of})`;
  const out = {
    method: `Blind re-labeling of ${vids.length} random candidates (fixed seed) by two independent LLM judges that never saw the published labels.`,
    rows: [
      { metric: "Keep/drop agreement: published vs judge A", value: f(r.teaches.cls_j1), note: "Does the video actually teach AI?",
        pt: { metric: "Manter ou cortar: publicado × juiz A", note: "O vídeo ensina IA de verdade?" } },
      { metric: "Keep/drop agreement: published vs judge B", value: f(r.teaches.cls_j2), note: "Same question, second independent judge.",
        pt: { metric: "Manter ou cortar: publicado × juiz B", note: "A mesma pergunta, com um 2º juiz independente." } },
      { metric: "Judge A vs judge B", value: f(r.teaches.j1_j2), note: "Ceiling: how much two careful raters agree with each other.",
        pt: { metric: "Juiz A × juiz B", note: "O teto: quanto dois avaliadores cuidadosos concordam entre si." } },
      { metric: "Topic agreement: published vs judge A", value: f(r.node.cls_j1), note: `Same one of ${18} trail topics, among videos both kept.`,
        pt: { metric: "Tópico: publicado × juiz A", note: "O mesmo dos 18 tópicos, entre os vídeos que os dois mantiveram." } },
      { metric: "Topic agreement: published vs judge B", value: f(r.node.cls_j2), note: "Neighbouring topics (e.g. training vs nn-basics) count as misses.",
        pt: { metric: "Tópico: publicado × juiz B", note: "Tópico vizinho (ex.: training × nn-basics) conta como erro." } },
      { metric: "Published label outvoted by both judges", value: `${r.outvoted.length}/${vids.length}`, note: "Each was reviewed; fixes go into overrides.json.",
        pt: { metric: "Rótulo publicado vencido pelos 2 juízes", note: "Cada um foi revisto; as correções vão para overrides.json." } },
    ],
    raw: r,
  };
  fs.writeFileSync(path.join(root, "data/eval.json"), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(r, null, 1));
}
