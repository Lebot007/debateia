<div align="center">

<img src="src/app/icon.svg" width="96" alt="Logo do DebateIA" />

# DebateIA

**Faça suas IAs debaterem entre si — e receba a resposta final da IA Chefe.**

[Site ao vivo](https://lebot007.github.io/debateia/) · [Como funciona](#-como-funciona) · [Rodando localmente](#-rodando-localmente) · [Deploy](#-deploy)

![Deploy to GitHub Pages](https://github.com/Lebot007/debateia/actions/workflows/deploy.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-blue.svg)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black)

</div>

## O que é

O **DebateIA** é uma arena de debates entre assistentes de IA. Você escolhe o tema, monta um
painel com as IAs do **seu elenco** — ChatGPT, Claude, Gemini, DeepSeek, Grok, Copilot, GLM,
Qwen ou **qualquer IA personalizada** que você cadastrar — e escolhe uma delas como
**IA Chefe**, que coordena o painel.

As IAs auxiliares debatem o tema em **rodadas** — em cada rodada elas leem as respostas das
outras e refinam (ou criticam) as próprias respostas. No final, a **IA Chefe** recebe todas as
respostas, avalia o painel, resolve as divergências e escreve a **resposta final consolidada**.

Tudo roda **100% no seu navegador**: sem API, sem chave, sem backend e sem cadastro.

## Como funciona (sem API)

Nenhum site consegue "puxar" respostas direto do ChatGPT ou do Gemini sem API oficial — os
navegadores bloqueiam isso por segurança (CORS e cookies de sessão), além de violar os termos
de uso desses serviços. O DebateIA resolve isso automatizando ao máximo o copia-e-cola:

1. **Copie o prompt** — o app monta o prompt ideal para cada IA, já embutindo o tema, os
   anexos e as respostas das outras IAs da rodada anterior;
2. **Abra a IA oficial** — um clique copia o prompt e abre o site oficial da IA. Você usa a
   sua conta de sempre (plano gratuito funciona);
3. **Cole no slot certo** — cada slot já é fixo de uma IA: você escolhe quem disse o quê e
   cola a resposta nele (botão Colar ou Ctrl+V). Se você colar no slot errado, é só limpar e
   colar de novo no certo;
4. **Síntese da IA Chefe** — ao final das rodadas, o app monta o prompt de síntese para a IA
   Chefe avaliar o painel e produzir a resposta final. O app destaca automaticamente a seção
   **RESPOSTA FINAL** condensada, pronta para copiar e usar.

A "prancheta" faz o transporte, e o DebateIA faz toda a orquestração: formatação dos prompts,
controle de rodadas, status de cada IA, transcrição e exportação.

### Modos de debate

- **Colaborativo** — as IAs incorporam os melhores pontos das outras e refinam juntas;
- **Adversarial** — as IAs criticam as respostas das outras, defendem suas posições e
  antecipam objeções.

## Funcionalidades

- **Elenco editável de IAs (máx. 8)** — edite nome, empresa, site oficial e cor de qualquer
  IA; adicione **IAs personalizadas** (GLM, Qwen Chat, Kimi…) ou escolha prontas do catálogo
  (13 IAs); restaure o padrão quando quiser
- **Marcação manual da origem** — cada slot de resposta é fixo de uma IA: simples e à prova
  de confusão, sem detecção automática que possa errar
- **Anexos no tema** — imagens (JPG/PNG/WebP, até 5 MB), `.txt` e `.md` (até 300 KB); o
  conteúdo dos textos entra automaticamente nos prompts de todas as IAs
- **Resposta final condensada** — a IA Chefe entrega a avaliação do painel, as divergências e
  a **RESPOSTA FINAL**; o app destaca essa seção em um cartão limpo e mantém a síntese
  completa em uma seção expansível
- **Armazenamento leve com IndexedDB** — debates e anexos ficam no disco do navegador (não na
  RAM); autosave a cada alteração
- **Modo sessão (opcional)** — nada é gravado no navegador; ao fechar a aba, tudo some
- **Exclusão por debate e "apagar tudo"** — remover um debate apaga também seus anexos do
  armazenamento local
- Rodadas configuráveis (1 a 4) com prompts montados automaticamente
- Botão **"Abrir IA"** que copia o prompt e abre o site oficial em nova aba
- Status de cada IA (aguardando / respondida) e progresso do debate
- **Transcrição completa** do debate (visualizar, copiar, baixar `.md`)
- Exportação estruturada em **`.json`**
- Tema claro/escuro, layout responsivo (celular, tablet e desktop)
- Sem dependência de servidor: o build estático funciona em qualquer hospedagem

## Tecnologias

- [Next.js 16](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **IndexedDB** (via API nativa) para debates + anexos, `localStorage` para elenco e
  configurações
- [Framer Motion](https://motion.dev/), [Sonner](https://sonner.emilkowal.ski/), [next-themes](https://github.com/pacocoursey/next-themes)
- [Lucide Icons](https://lucide.dev/)

## Rodando localmente

Requisitos: [Bun](https://bun.sh/) (ou Node.js 20+ com npm).

```bash
# com Bun
bun install
bun run dev

# com npm
npm install
npm run dev
```

Abra `http://localhost:3000`.

### Build estático (GitHub Pages)

```bash
NEXT_PUBLIC_PAGES=1 NEXT_PUBLIC_BASE_PATH=/debateia npm run build:pages
```

O resultado fica na pasta `out/` — pode ser hospedado em qualquer servidor estático
(GitHub Pages, Netlify, Vercel, Cloudflare Pages...). Sem `NEXT_PUBLIC_BASE_PATH`, o build
serve na raiz (útil para Netlify/Vercel).

## Deploy

O repositório inclui o workflow **`.github/workflows/deploy.yml`**: a cada push em `main`, o
site é construído e publicado automaticamente no **GitHub Pages** em

> https://lebot007.github.io/debateia/

Se for publicar em outro repositório, habilite **Settings → Pages → Source: GitHub Actions**.
O `basePath` é derivado do nome do repositório automaticamente pelo workflow.

## Privacidade

Nenhum dado sai do seu navegador: debates, respostas, anexos e sínteses ficam apenas no
**IndexedDB/localStorage** do seu dispositivo. O site não tem backend, não usa cookies
próprios e não coleta nada. A leitura da área de transferência acontece apenas quando você
clica no botão **Colar** — e o texto nunca é enviado para lugar nenhum.

## Licença

[MIT](./LICENSE) — uso livre com atribuição.
