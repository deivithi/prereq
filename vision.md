# vision.md · deivithi/prereq

Fronteira escrita do que o agente de código pode mergear sozinho e do que volta para o Deivithi. Lida por `/workspace/tools/vision/vision_gate.py`. Gerado em 14/11/2026 a partir da árvore real do repo (45 arquivos no branch `main`, lidos pelo conector GitHub, só leitura). Estado: **RASCUNHO LOCAL**, só vale no repo depois do sim dele.

## (a) Visão

Prereq: trilha de vídeos de IA em ordem de pré-requisito, feita para o desafio do @0xSero sobre os dados do HackerTube (README). Publicado em https://prereq.deivithi74.workers.dev.

## (b) Não-objetivos

- Não hospeda vídeo, só ordena.
- Repo público: sem dado pessoal.
- O agente não muda este arquivo, workflow de CI, segredo nem configuração do GitHub (branch protection, rulesets).

## (c) Níveis de merge

Precedência: VERMELHO vence AMARELO, que vence VERDE (mesma ordem deny > ask > allow do Claude Code). Um arquivo só já sobe o PR inteiro. Caminho que não casa com nada é AMARELO. Sem este arquivo, tudo é VERMELHO.

**VERDE (agente mergeia sozinho):** Só correção de CI e teste aberta pelo próprio agente, com CI verde e revisão de contexto limpo (regra dele em APPROVAL_PREFERENCES, 20/10/2026). Globs reais deste repo no bloco `verde`. Hoje o repo não tem nenhum arquivo de teste, então nada cai em VERDE.

**AMARELO (agente abre o PR e pede o sim):** código de app que não toca caminho protegido; o que muda a régua (config, setup, mock, lock, tsconfig, fixture, dado, golden, snapshot, script .sh ou runner em pasta de teste, package.json, bloco `amarelo`); arquivo dentro de tests/ ou e2e/ que não é teste pelo nome; teste que encolheu, com skip/only/todo ou assert comentado no patch ("Contrato alterado"), sem patch, binário ou com 0 linhas; teste novo puro; PR sem marca de correção (título ou branch `fix/`), sem identidade conferida (dono e autor deivithi, sem fork) ou sem `--verde-hoje`; arquivo apagado; docs, lint e lockfile enquanto as PROPOSTAS não forem aprovadas; PR VERDE acima do teto.

**VERMELHO (só humano):** os globs abaixo, sem diferenciar caixa. Os marcados "(só neste repo)" existem hoje na árvore; os outros são rede para caminho que nascer depois.

- **palavras delimitadas (`vermelho_palavra`):** `auth`, `authz`, `authn`, `rls`, `wipe`, `truncate`, `seed`. Casam só como palavra inteira, separada por / . _ - ou troca camelCase: `auth.test.ts`, `AuthContext.tsx`, `rls_policy.sql` e `seed.sql` caem; `urls`, `useSwipe`, `truncateText`, `AuthorCard` e `seedling` não. Exemplos reais: nenhum arquivo hoje.
- **regras do agente e do próprio gate:** `vision.md`, `**/vision.md`, `AGENTS.md`, `**/AGENTS.md` (rede). Exemplos reais: nenhum arquivo hoje.
- **CI e automação do GitHub:** `.github/**`, `.githooks/**`, `.husky/**`, `.gitlab-ci.yml` (rede). Exemplos reais: nenhum arquivo hoje.
- **segredos:** `**/.env`, `**/.env.*`, `**/*.env`, `**/.envrc` (rede). Exemplos reais: nenhum arquivo hoje.
- **infra e deploy:** `**/*deploy*`, `vercel.json`, `**/vercel.json`, `.vercel/**` (rede). Exemplos reais: nenhum arquivo hoje.
- **migrações e banco:** `**/*.sql`, `**/*migration*`, `**/migrations/**`, `**/migration/**` (rede). Exemplos reais: nenhum arquivo hoje.
- **auth, RLS e permissão:** `**/*authoriz*`, `**/*authent*`, `**/*oauth*`, `**/*login*` (rede). Exemplos reais: nenhum arquivo hoje.
- **pagamento e cobrança:** `**/*stripe*`, `**/*billing*`, `**/billing/**`, `**/*checkout*` (rede). Exemplos reais: nenhum arquivo hoje.
- **apagar ou reescrever dado:** `**/*purge*`, `**/*backfill*`, `**/*delete*`, `**/*excluir*` (rede). Exemplos reais: nenhum arquivo hoje.
- **dados e fonte bruta (só neste repo):** `data/**`. Exemplos reais: `data/batches/batch-1.jsonl`, `data/batches/batch-2.jsonl`, `data/batches/batch-3.jsonl`.

Contagem na árvore de hoje: **22** de 45 arquivos caem em VERMELHO e **0** em VERDE.

## (d) Prova exigida por nível

- **VERDE:** CI verde (check runs + commit status) no head SHA; revisor de contexto limpo com PASS no corpo do PR; pr_pronto.py com PRONTO: OK; genie_guard.py sem ALERTA ou seção 'Contrato alterado'; regression_guard.py OK em PR de correção.
- **AMARELO:** tudo do VERDE + 1 linha de intenção + 1 de causa raiz no corpo; o sim dele na conversa; se mexer em tela: 2 prints antes/depois e 3 estados (regra Emil, pr_pronto.py).
- **VERMELHO:** tudo do AMARELO + plano de reversão escrito no PR; merge e deploy feitos por ele.

## (e) Reversão

- VERDE: revert do squash commit em PR novo; o revert de teste é teste, então passa pelo gate no mesmo nível. Conto a ele em 1 linha depois.
- AMARELO: revert em PR com o sim dele.
- VERMELHO: reversão planejada no próprio PR, executada por ele.

## (f) Tetos

- VERDE: até **200 linhas** e **10 arquivos** por PR, no máximo **3 merges VERDE por dia** neste repo (o Renovate faz 1 por rodada por branch, docs.renovatebot.com).
- Qualquer PR acima de **400 linhas** é VERMELHO: quebrar antes de revisar (mesmo teto do pr_pronto.py).

## (g) Quem decide e como mudar

- Dono e única pessoa que aprova mudança neste arquivo: **Deivithi**. O agente propõe por PR e o PR que toca `vision.md` é VERMELHO por construção.
- Cada decisão nova dele ("pode mergear isso daqui para frente") vira linha datada aqui e em APPROVAL_PREFERENCES, no mesmo turno (o padrão do Kun Chen: "merge 25 and allow that going forward").
- Nada aqui libera mais do que APPROVAL_PREFERENCES já libera. O que for além está em PROPOSTAS.

## PROPOSTAS (não valem até o sim dele)

- **P1 docs VERDE:** `docs/**` e `*.md` (fora AGENTS, CLAUDE e vision) entram em VERDE.
- **P2 lint VERDE:** config de lint e formatação entra em VERDE.
- **P3 lockfile VERDE:** só lockfile, sem package.json (o tipo de update de menor risco para o Renovate, `lockFileMaintenance`).
- **P4 proteger a main:** hoje `main` não tem branch protection e tem 0 regra de ruleset. Proposta: ruleset com status check obrigatório, sem force push e sem apagar branch (OpenSSF Scorecard, Branch-Protection tiers 1 e 3). Mudança de settings: só ele.
- **P5 CODEOWNERS:** `/.github/ @deivithi` e `vision.md @deivithi`, para o GitHub exigir a revisão dele nesses caminhos (docs.github.com, About code owners).

## Bloco que o gate lê

```yaml vision-gate
vision_gate: 1
repo: deivithi/prereq
dono: deivithi
febracis: false
atualizado: 2026-11-14
tetos:
  verde_max_linhas: 200
  verde_max_arquivos: 10
  amarelo_max_linhas: 400
  verde_max_prs_dia: 3
vermelho:
  - "vision.md"
  - "**/vision.md"
  - "AGENTS.md"
  - "**/AGENTS.md"
  - "CLAUDE.md"
  - "**/CLAUDE.md"
  - "CODEOWNERS"
  - ".claude/**"
  - ".cursor/**"
  - ".agents/**"
  - ".devin/**"
  - ".cursorrules"
  - "**/.cursorrules"
  - ".github/**"
  - ".githooks/**"
  - ".husky/**"
  - ".gitlab-ci.yml"
  - ".pre-commit-config.yaml"
  - "**/.env"
  - "**/.env.*"
  - "**/*.env"
  - "**/.envrc"
  - "**/*.pem"
  - "**/*.key"
  - "**/*.p12"
  - "**/id_rsa*"
  - "**/id_ed25519*"
  - "**/id_ecdsa*"
  - "**/*secret*"
  - "**/*credential*"
  - "**/*serviceaccount*"
  - "**/*service-account*"
  - "**/*service_account*"
  - "**/*storagestate*"
  - "**/*storage-state*"
  - "**/*storage_state*"
  - "**/.npmrc"
  - "**/*keychain*"
  - "**/*.keystore"
  - "**/*deploy*"
  - "vercel.json"
  - "**/vercel.json"
  - ".vercel/**"
  - "netlify.toml"
  - "wrangler.toml"
  - "**/wrangler.toml"
  - "fly.toml"
  - "render.yaml"
  - "railway.json"
  - "**/Dockerfile*"
  - "**/docker-compose*"
  - "**/*.tf"
  - "Procfile"
  - "**/*.sql"
  - "**/*migration*"
  - "**/migrations/**"
  - "**/migration/**"
  - "src/lib/supabase*"
  - "**/*reset*database*"
  - "**/*reset*db*"
  - "supabase/**"
  - "prisma/**"
  - "drizzle/**"
  - "d1-migrations/**"
  - "**/schema.prisma"
  - "alembic/**"
  - "**/*authoriz*"
  - "**/*authent*"
  - "**/*oauth*"
  - "**/*login*"
  - "**/*session*"
  - "**/*polic*"
  - "**/*grant*"
  - "**/*rbac*"
  - "**/*permission*"
  - "**/middleware.*"
  - "**/*stripe*"
  - "**/*billing*"
  - "**/billing/**"
  - "**/*checkout*"
  - "**/*payment*"
  - "**/*pagamento*"
  - "**/*cobranca*"
  - "**/*webhook*"
  - "**/*asaas*"
  - "**/*mercadopago*"
  - "**/*invoice*"
  - "**/*subscription*"
  - "**/*purge*"
  - "**/*backfill*"
  - "**/*delete*"
  - "**/*excluir*"
  - "**/*exclusao*"
  - "data/**"
vermelho_palavra:
  - "auth"
  - "authz"
  - "authn"
  - "rls"
  - "wipe"
  - "truncate"
  - "seed"
amarelo:
  - "vitest.config.*"
  - "vitest.workspace.*"
  - "jest.config.*"
  - "playwright.config.*"
  - "pytest.ini"
  - "pyproject.toml"
  - "**/conftest.py"
  - "**/globalSetup.*"
  - "**/global-setup.*"
  - "**/setupTests.*"
  - "**/__snapshots__/**"
  - "**/*.snap"
  - "**/fixtures/**"
  - "fixtures/**"
  - "**/testdata/**"
  - "tests/data/**"
  - "**/*.sh"
  - "package.json"
  - "**/*.setup.*"
  - "**/setup.*"
  - "**/__mocks__/**"
  - "**/*lock*"
  - "**/requirements*.txt"
  - "**/tsconfig*.json"
  - "**/*.config.*"
  - "**/data/**"
  - "**/golden*"
  - "**/security/**"
  - "**/package.json"
  - "**/tests/**/scripts/**"
  - "**/test/**/scripts/**"
  - "**/e2e/**/scripts/**"
  - "**/__tests__/**/scripts/**"
verde: []
verde_proposta:
  - "**/*.md"
prova:
  verde:
    - "CI verde (check runs + commit status) no head SHA"
    - "revisor de contexto limpo com PASS no corpo do PR"
    - "pr_pronto.py com PRONTO: OK"
    - "genie_guard.py sem ALERTA ou seção 'Contrato alterado'"
    - "regression_guard.py OK em PR de correção"
  amarelo:
    - "CI verde (check runs + commit status) no head SHA"
    - "revisor de contexto limpo com PASS no corpo do PR"
    - "pr_pronto.py com PRONTO: OK"
    - "genie_guard.py sem ALERTA ou seção 'Contrato alterado'"
    - "regression_guard.py OK em PR de correção"
    - "1 linha de intenção + 1 de causa raiz no corpo"
    - "o sim dele na conversa"
    - "se mexer em tela: 2 prints antes/depois e 3 estados (regra Emil, pr_pronto.py)"
  vermelho:
    - "CI verde (check runs + commit status) no head SHA"
    - "revisor de contexto limpo com PASS no corpo do PR"
    - "pr_pronto.py com PRONTO: OK"
    - "genie_guard.py sem ALERTA ou seção 'Contrato alterado'"
    - "regression_guard.py OK em PR de correção"
    - "1 linha de intenção + 1 de causa raiz no corpo"
    - "o sim dele na conversa"
    - "se mexer em tela: 2 prints antes/depois e 3 estados (regra Emil, pr_pronto.py)"
    - "plano de reversão escrito no PR"
    - "merge e deploy feitos por ele"
```
