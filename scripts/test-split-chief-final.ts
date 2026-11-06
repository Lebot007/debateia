/** Teste rápido do parser splitChiefFinal com formatos reais de resposta de IA. */
import { splitChiefFinal } from "../src/lib/prompts";

const cases: { name: string; text: string; expectSection: boolean }[] = [
  {
    name: "Padrão do prompt (RESPOSTA FINAL em linha própria)",
    text: `Avaliação do painel
- GPT: sólido, mas omitiu riscos.
- Claude: equilado.

Divergências e resoluções
- Sobre custo: GPT disse X, Claude disse Y. Prevalece Y.

RESPOSTA FINAL
Use o plano A. Primeiro configure o servidor, depois teste.
Em resumo: plano A é o caminho.`,
    expectSection: true,
  },
  {
    name: "Markdown com ## e avaliação detalhada",
    text: `## Avaliação do painel
GPT respondeu bem; DeepSeek inventou dados.

## Divergências e resoluções
Nenhuma relevante.

## Resposta Final
**1.** Instale o pacote.
**2.** Rode o comando de deploy.
Pronto — o sistema ficará no ar.`,
    expectSection: true,
  },
  {
    name: "Negrito com dois-pontos na mesma linha",
    text: `Avaliação do painel: ok.
Divergências: nada grave.
**RESPOSTA FINAL:** A resposta correta é a opção B, porque o algoritmo converge mais rápido.`,
    expectSection: true,
  },
  {
    name: "Com emoji e numeração",
    text: `✅ Avaliação do painel
Todas boas.

🎯 RESPOSTA FINAL
A resposta é 42, explicada resumidamente: calcule a soma e multiplique por dois.`,
    expectSection: true,
  },
  {
    name: "Sem seção marcada (fallback = texto completo)",
    text: `A resposta ao seu tema é simples: use caches eficientes e depois meça o resultado. Isso cobre performance e confiabilidade sem custo adicional.`,
    expectSection: false,
  },
  {
    name: "Menção casual a resposta final no meio (não deve cortar)",
    text: `O painel debateu bastante. Aqui está minha resposta final consolidada ao tema:

O plano recomendado é migrar para Postgres, mantendo Redis como cache.
Isso reduz latência e simplifica o modelo de dados.`,
    expectSection: false,
  },
  {
    name: "Cabeçalho no fim sem conteúdo depois (ignora e usa fallback)",
    text: `Avaliação do painel: boa.
RESPOSTA FINAL`,
    expectSection: false,
  },
  {
    name: "Síntese Consolidada como rótulo",
    text: `**Síntese Consolidada:**
O resultado do debate indica usar arquitetura serverless com fila assíncrona.
Isso reduz custo operacional e aumenta a escalabilidade do produto final.`,
    expectSection: true,
  },
];

let failures = 0;
for (const c of cases) {
  const r = splitChiefFinal(c.text);
  const ok = r.hasFinalSection === c.expectSection && r.full === c.text.trim();
  const cond = ok ? "OK " : "FAIL";
  console.log(
    `[${cond}] ${c.name} — hasFinalSection=${r.hasFinalSection} | answer(${r.answer.length} chars)=${JSON.stringify(r.answer.slice(0, 60))}`,
  );
  if (!ok) failures++;
}

// extra: caso vazio
const empty = splitChiefFinal("");
console.log(
  `[${empty.answer === "" && !empty.hasFinalSection ? "OK " : "FAIL"}] Texto vazio`,
);
console.log(failures === 0 ? "\nTODOS OS TESTES PASSARAM ✅" : `\n${failures} FALHAS ❌`);
process.exit(failures === 0 ? 0 : 1);
