import { aiName } from "@/lib/ais";
import { Debate } from "@/lib/types";

/** Última resposta não vazia de uma IA (percorre as rodadas de trás pra frente). */
export function latestAnswer(debate: Debate, aiId: string): string {
  for (let r = debate.totalRounds; r >= 1; r--) {
    const a = debate.answers[aiId]?.[r]?.trim();
    if (a) return a;
  }
  return "";
}

function topicBlock(topic: string): string {
  return `TEMA DO DEBATE:\n"""\n${topic.trim()}\n"""`;
}

/** Prompt de qualquer rodada para uma IA participante. */
export function buildRoundPrompt(debate: Debate, aiId: string, round: number): string {
  const others = debate.participantIds.filter((id) => id !== aiId);

  if (round <= 1) {
    return [
      `Você é uma das IAs participantes de um painel de debate estruturado entre ${debate.participantIds.length} assistentes de IA. Ao final do debate, uma IA Chefe (coordenadora) vai avaliar todas as contribuições e produzir uma resposta final consolidada para o usuário.`,
      "",
      topicBlock(debate.topic),
      "",
      `SUA TAREFA — RODADA 1 de ${debate.totalRounds}:`,
      "1. Apresente sua resposta/posição sobre o tema de forma completa, estruturada e objetiva.",
      "2. Justifique com argumentos sólidos, exemplos concretos e, quando útil, dados ou referências.",
      "3. Mencione pontos de atenção, limitações ou contrapontos relevantes.",
      "4. Não invente informações: se algo for incerto, diga isso com clareza.",
      "",
      "Responda em português. Vá direto ao ponto, sem apresentações longas.",
    ].join("\n");
  }

  const own = debate.answers[aiId]?.[round - 1]?.trim();
  const othersBlocks = others
    .map((id) => {
      const a = debate.answers[id]?.[round - 1]?.trim();
      return a ? `### ${aiName(id)} (IA participante):\n"""\n${a}\n"""` : null;
    })
    .filter((b): b is string => Boolean(b));

  const modeInstructions =
    debate.mode === "adversarial"
      ? [
          "1. Atue como revisor crítico: aponte falhas, riscos, contradições e omissões nas respostas dos demais participantes, uma a uma.",
          "2. Defenda com argumentos os pontos da sua resposta anterior que você considera corretos.",
          "3. Conceda, com honestidade intelectual, os pontos em que você foi contestado com legitimidade.",
          "4. Entregue sua resposta FINAL reforçada, antecipando as objeções mais fortes.",
        ]
      : [
          "1. Leia atentamente as respostas dos demais participantes da rodada anterior.",
          "2. Reconheça explicitamente os pontos em que eles têm razão e incorpore-os à sua resposta.",
          "3. Aponte, com educação, onde eles erram ou exageram — sempre com justificativa.",
          "4. Corrija eventuais erros ou lacunas da sua própria resposta anterior.",
          "5. Entregue sua resposta FINAL revisada: mais completa, precisa e equilibrada que a anterior.",
        ];

  const parts: string[] = [
    `Rodada ${round} de ${debate.totalRounds} do painel de debate entre várias IAs.`,
    "",
    topicBlock(debate.topic),
    "",
  ];
  if (own) {
    parts.push(`SUA RESPOSTA NA RODADA ANTERIOR:\n"""\n${own}\n"""`, "");
  }
  if (othersBlocks.length > 0) {
    parts.push("RESPOSTAS DOS DEMAIS PARTICIPANTES (rodada anterior):", ...othersBlocks, "");
  }
  parts.push(`SUA TAREFA — RODADA ${round}:`, ...modeInstructions, "", "Responda em português.");
  return parts.join("\n");
}

/** Prompt de síntese para a IA Chefe. */
export function buildChiefPrompt(debate: Debate): string {
  const names = debate.participantIds.map(aiName).join(", ");
  const blocks = debate.participantIds
    .map((id) => {
      const a = latestAnswer(debate, id);
      return a ? `### ${aiName(id)}:\n"""\n${a}\n"""` : `### ${aiName(id)}:\n(sem resposta registrada)`;
    })
    .join("\n\n");

  return [
    `Você é a IA CHEFE, coordenadora de um painel de debate entre ${debate.participantIds.length} assistentes de IA (${names}). Eles debateram o tema abaixo durante ${debate.totalRounds} ${debate.totalRounds === 1 ? "rodada" : "rodadas"} e esta é a resposta final consolidada de cada participante.`,
    "",
    topicBlock(debate.topic),
    "",
    "RESPOSTAS FINAIS DO PAINEL:",
    blocks,
    "",
    "SUA TAREFA COMO COORDENADORA:",
    "1. AVALIAÇÃO DO PAINEL — avalie objetivamente cada resposta: pontos fortes, pontos fracos e confiabilidade (1 a 2 linhas por IA).",
    "2. DIVERGÊNCIAS — liste as principais divergências entre as respostas e resolva cada uma com justificativa técnica.",
    "3. RESPOSTA FINAL — produza a síntese definitiva do painel: completa, equilibrada, acionável e sem repetições. Essa é a resposta que o usuário vai usar.",
    "",
    "Formato obrigatório da resposta:",
    '- "Avaliação do painel"',
    '- "Divergências e resoluções"',
    '- "RESPOSTA FINAL"',
    "",
    "Responda em português.",
  ].join("\n");
}

function formatPtDate(ts: number): string {
  return new Date(ts).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
}

/** Transcrição completa do debate em Markdown. */
export function buildTranscriptMarkdown(debate: Debate): string {
  const modeLabel = debate.mode === "adversarial" ? "Adversarial" : "Colaborativo";
  const lines: string[] = [
    "# DebateIA — Transcrição do debate",
    "",
    `- **Tema:** ${debate.topic}`,
    `- **Data:** ${formatPtDate(debate.updatedAt)}`,
    `- **Modo:** ${modeLabel}`,
    `- **Rodadas:** ${debate.totalRounds}`,
    `- **Participantes:** ${debate.participantIds.map(aiName).join(", ")}`,
    `- **IA Chefe:** ${aiName(debate.chiefId)}`,
    "",
    "---",
    "",
  ];

  for (let r = 1; r <= debate.totalRounds; r++) {
    const anyAnswer = debate.participantIds.some((id) => debate.answers[id]?.[r]?.trim());
    if (!anyAnswer) continue;
    lines.push(`## Rodada ${r}`, "");
    for (const id of debate.participantIds) {
      const a = debate.answers[id]?.[r]?.trim();
      if (!a) continue;
      lines.push(`### ${aiName(id)}`, "", a, "");
    }
    lines.push("---", "");
  }

  if (debate.chiefFinal.trim()) {
    lines.push(`## Síntese da IA Chefe (${aiName(debate.chiefId)})`, "", debate.chiefFinal.trim(), "");
  }

  return lines.join("\n");
}

/** Export estruturado em JSON. */
export function buildJsonExport(debate: Debate): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: "DebateIA",
      topic: debate.topic,
      mode: debate.mode,
      totalRounds: debate.totalRounds,
      participants: debate.participantIds.map((id) => ({ id, name: aiName(id) })),
      chief: { id: debate.chiefId, name: aiName(debate.chiefId) },
      answers: debate.answers,
      chiefFinal: debate.chiefFinal,
    },
    null,
    2,
  );
}
