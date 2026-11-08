# PLANO — Trilha IA (desafio 0xSero, 07/11/2026)

## Pedido

Desafio de @0xSero (x.com/0xSero/status/2119119840929866025): US$ 100 para o "highest quality AI education feed". Base: HackerTube e TristanTube do Karpathy. Formato escolhido pelo Deivithi: **trilha + feed**.

## Tese

Um feed só ordenado por popularidade é fácil de copiar. Ganha quem **ensina em ordem** e **prova a qualidade**:

1. Sinal de especialista, não de views (método Karpathy: quem recomenda, quantas vezes, em quantos meses).
2. Trilha com pré-requisitos (fundamentos → redes → transformers → LLMs → agentes/evals).
3. Eval publicado (LLM-judge + amostra conferida à mão).

## Estado medido (07/11, 23:40 BRT)

| Fonte | Medida | Veredito |
|---|---|---|
| HackerTube (`data/raw/hackertube-data`, ODC-By) | 6.454 vídeos; IA = 395; IA recomendada e não-news = 279; LLM = 58; LLM de 2024+ = 20 | Base boa para fundamentos; rasa em LLM recente; tem ruído (colormap, Hans Rosling) |
| Lista do Tristan (thume.ca) | canais nerd gerais; IA só Two Minute Papers | Fora como fonte de IA |
| `level` do HackerTube | 132 de 279 = "general" | Sinal fraco, como o próprio DATA.md avisa: é a lacuna da trilha |

## Fases (cada uma com critério observável)

| # | Fase | Critério de pronto |
|---|---|---|
| 1 | Pool HN: filtrar IA + matemática de base, tirar news/ruído, dedupe | `data/pool-hn.jsonl` com N contado; 20 itens conferidos sem ruído óbvio |
| 2 | 2ª fonte: links de YouTube em syllabi (Stanford CS229/CS224N/CS231N/CS336/CS25, MIT 6.S191, Berkeley) e READMEs de estudo no GitHub; sinal = nº de fontes distintas | `data/pool-curricula.jsonl`; cada vídeo com ≥2 fontes e as URLs de origem |
| 3 | Grafo da trilha: ~20–25 nós com pré-requisitos (DAG) | `data/trilha.json` validado: sem ciclo, todo nó alcançável da raiz |
| 4 | Classificação por LLM (Sonnet via Workflow/subagentes, tokens da assinatura): nó, nível real, pré-requisito, "depois disso você consegue…" | 100% do pool classificado; schema validado |
| 5 | Eval: juiz LLM roda 2×, mede concordância; 30 itens conferidos à mão | relatório de concordância ≥0,8; erros listados |
| 6 | Protótipo de UI (gate humano): refs de galeria, trilha + feed, mobile-first, PWA | **Deivithi aprova o protótipo** antes do código final |
| 7 | Site + publicação + post de resposta ao 0xSero | URL no ar, smoke mobile/desktop, post revisado por ele |

## Riscos

- Regras do desafio sem prazo nem critério `[Não verificado]`: publicar o MVP cedo (fase 1+3+4 em cima do HN) e evoluir.
- YouTube API: metadados (duração, vídeo apagado) pedem chave do Google Cloud; é passo humano de ~5 min (DATA.md §"Steps for the human").
- Licença: ODC-By, com crédito a HackerTube e open-index/hacker-news no site.

## Fora do escopo

Versão PT-BR, conta/login, backend com banco. O estado fica no navegador, como no HackerTube.
