# Prereq — learn AI in the right order

The AI videos that experts keep recommending, ordered into a learning path with prerequisites.
Built for [@0xSero's AI-education-feed challenge](https://x.com/0xSero/status/2119119840929866025),
on top of Andrej Karpathy's [HackerTube](https://hackertube.org) data.

## How it works

1. **Expert signal, not views.** Candidates come from two places: HackerTube's open dataset (YouTube
   videos recommended on Hacker News by ≥3 people in ≥3 months, 2007–2026) and YouTube links in public
   course syllabi and study guides (MIT 6.S191, Stanford CS231n, Zero to Hero, fast.ai, …).
2. **Does it actually teach?** An LLM labels every candidate against a strict rubric
   (`teaches_ai`, topic, level 1–4, one-line outcome, dated/weak flag).
3. **A trail.** 18 topics in 7 stages form a DAG (`data/trail.json`, checked for cycles).
   Inside a topic: easiest first, then strongest signal. "Up next" walks the graph from what you watched.
4. **Eval, published.** Two independent LLM judges re-label 60 random candidates blind.
   Results are on the site's Method page and in `data/eval.json`; labels outvoted by both judges are
   corrected in `data/overrides.json`.

## Rebuild

```bash
# 1. data (put hackertube-data.zip from https://hackertube.org/data into data/raw/ and unzip)
node scripts/build-pool-hn.mjs
node scripts/build-pool-curricula.mjs
node scripts/build-candidates.mjs
# 2. label data/batches/*.jsonl -> data/class/*.jsonl (LLM step, see PLANO-trilha-ia.md)
node scripts/eval.mjs sample   # then two blind judges -> data/eval/judge-{1,2}.jsonl
node scripts/eval.mjs score
node scripts/build-site-data.mjs
python scripts/make-icons.py
# 3. serve
python -m http.server 4320 --directory site
```

The site is static (`site/`): no backend, no accounts, progress in `localStorage`, installable PWA.
Home is a streaming-style shelf view; `#/map` is the interactive prerequisite map (point at a topic to
light up what it needs and unlocks); `/` or Ctrl+K opens search; on a video page `m` marks it watched and
`n` jumps to the next one. English by default, Portuguese via the EN/PT toggle (`data/i18n/pt-*.jsonl`
holds the translated per-video lines; `data/trail.json` holds topic names in both languages).

## Credits and license

Video data: [HackerTube](https://hackertube.org) (ODC-By 1.0), derived from the
[open-index/hacker-news](https://huggingface.co/datasets/open-index/hacker-news) archive. Hacker News
comments remain the work of their authors; video titles and channels belong to their creators.
Not affiliated with YouTube, Google, Hacker News or any course. Code: MIT.
