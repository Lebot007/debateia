import { aiName, AiInfo } from "@/lib/ais";
import { Attachment, Debate } from "@/lib/types";
import { formatSize } from "@/lib/attachments";

const MAX_CHARS_PER_FILE = 12_000;
const MAX_CHARS_TOTAL_FILES = 30_000;

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

/** Bloco de anexos do tema (TXT/MD com conteúdo; imagens registradas por nome). */
export function attachmentsBlock(attachments: Attachment[] | undefined): string {
  if (!attachments || attachments.length === 0) return "";
  const lines: string[] = ["ARQUIVOS DE APOIO ANEXADOS PELO USUÁRIO AO TEMA:"];
  let budget = MAX_CHARS_TOTAL_FILES;

  for (const att of attachments) {
    if (att.kind === "image") {
      lines.push(
        `- Imagem anexada: "${att.name}" (${formatSize(att.size)}). Se precisar analisá-la visualmente, peça ao usuário para enviá-la diretamente no chat.`,
      );
      continue;
    }
    let content = att.content ?? "";
    if (content.length > MAX_CHARS_PER_FILE) {
      content = `${content.slice(0, MAX_CHARS_PER_FILE)}\n[… truncado]`;
    }
    if (content.length > budget) {
      content = `${content.slice(0, budget)}\n[… truncado por limite total]`;
    }
    budget -= content.length;
    lines.push(`### Arquivo: ${att.name}\n"""\n${content}\n"""`);
    if (budget <= 0) {
      lines.push("(demais arquivos omitidos por limite de tamanho)");
      break;
    }
  }

  return lines.join("\n");
}

/** Prompt de qualquer rodada para uma IA participante. */
export function buildRoundPrompt(
  debate: Debate,
  aiId: string,
  round: number,
  roster: AiInfo[] = [],
  opts: { includeFiles?: boolean } = {},
): string {
  const others = debate.participantIds.filter((id) => id !== aiId);

  if (round <= 1) {
    const parts: string[] = [
      `Você é uma das IAs participantes de um painel de debate estruturado entre ${debate.participantIds.length} assistentes de IA. Ao final do debate, uma IA Chefe (coordenadora) vai avaliar todas as contribuições e produzir uma resposta final consolidada para o usuário.`,
      "",
      topicBlock(debate.topic),
      "",
    ];
    if (opts.includeFiles !== false && debate.topicAttachments.length > 0) {
      parts.push(attachmentsBlock(debate.topicAttachments), "");
    }
    parts.push(
      `SUA TAREFA — RODADA 1 de ${debate.totalRounds}:`,
      "1. Apresente sua resposta/posição sobre o tema de forma completa, estruturada e objetiva.",
      "2. Justifique com argumentos sólidos, exemplos concretos e, quando útil, dados ou referências.",
      "3. Mencione pontos de atenção, limitações ou contrapontos relevantes.",
      "4. Não invente informações: se algo for incerto, diga isso com clareza.",
      "",
      "Responda em português. Vá direto ao ponto, sem apresentações longas.",
    );
    return parts.join("\n");
  }

  const own = debate.answers[aiId]?.[round - 1]?.trim();
  const othersBlocks = others
    .map((id) => {
      const a = debate.answers[id]?.[round - 1]?.trim();
      return a ? `### ${aiName(id, roster)} (IA participante):\n"""\n${a}\n"""` : null;
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
  if (opts.includeFiles !== false && debate.topicAttachments.length > 0) {
    parts.push(attachmentsBlock(debate.topicAttachments), "");
  }
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
export function buildChiefPrompt(
  debate: Debate,
  roster: AiInfo[] = [],
  opts: { includeFiles?: boolean } = {},
): string {
  const names = debate.participantIds.map((id) => aiName(id, roster)).join(", ");
  const blocks = debate.participantIds
    .map((id) => {
      const a = latestAnswer(debate, id);
      return a
        ? `### ${aiName(id, roster)}:\n"""\n${a}\n"""`
        : `### ${aiName(id, roster)}:\n(sem resposta registrada)`;
    })
    .join("\n\n");

  const parts: string[] = [
    `Você é a IA CHEFE, coordenadora de um painel de debate entre ${debate.participantIds.length} assistentes de IA (${names}). Eles debateram o tema abaixo durante ${debate.totalRounds} ${debate.totalRounds === 1 ? "rodada" : "rodadas"} e esta é a resposta final consolidada de cada participante.`,
    "",
    topicBlock(debate.topic),
    "",
  ];
  if (opts.includeFiles !== false && debate.topicAttachments.length > 0) {
    parts.push(attachmentsBlock(debate.topicAttachments), "");
  }
  parts.push(
    "RESPOSTAS FINAIS DO PAINEL:",
    blocks,
    "",
    "SUA TAREFA COMO COORDENADORA:",
    "1. AVALIAÇÃO DO PAINEL — avalie cada resposta em 1 linha por IA: principal ponto forte e principal fragilidade.",
    "2. DIVERGÊNCIAS E RESOLUÇÕES — liste apenas as divergências relevantes e resolva cada uma em 1–2 linhas, com justificativa técnica.",
    "3. RESPOSTA FINAL — escreva a seção final que o usuário vai usar de verdade.",
    "",
    "REGRAS PARA A SEÇÃO \"RESPOSTA FINAL\" (a mais importante):",
    "- Comece a seção com o cabeçalho exato \"RESPOSTA FINAL\" numa linha própria.",
    "- Ela deve ser a resposta correta ao tema, explicada e RESUMIDA: organize em parágrafos curtos e/ou tópicos, do mais importante para o menos importante.",
    "- Explique o necessário, mas sem repetir a avaliação do painel, sem citar as outras IAs e sem meta-comentário (nada de \"como coordenadora\", \"o painel concluiu\"…).",
    "- Seja completa, equilibrada e acionável: o usuário deve poder copiar só essa seção e usar como resposta definitiva.",
    "",
    "Formato obrigatório da resposta:",
    '"Avaliação do painel"',
    '"Divergências e resoluções"',
    '"RESPOSTA FINAL"',
    "",
    "Responda em português.",
  );
  return parts.join("\n");
}

/* ------------------------------------------------------------------ */
/* Extração da resposta final condensada                              */
/* ------------------------------------------------------------------ */

export interface ChiefFinalSplit {
  /** Seção "RESPOSTA FINAL" condensada (ou o texto completo, como reserva). */
  answer: string;
  /** Texto completo colado pelo usuário. */
  full: string;
  /** true quando o texto tinha uma seção "RESPOSTA FINAL" delimitada. */
  hasFinalSection: boolean;
}

const MIN_FINAL_CHARS = 40;

function stripLeadingSeparator(text: string): string {
  const lines = text.split("\n");
  while (lines.length > 0 && /^\s*[-–—=*_\s]*$/.test(lines[0])) lines.shift();
  return lines.join("\n").trim();
}

/**
 * Separa a resposta final condensada do resto da síntese da IA Chefe.
 *
 * O prompt da Chefe pede que a resposta final venha após um cabeçalho
 * "RESPOSTA FINAL" — esta função localiza esse cabeçalho (tolerante a
 * variações: "## Resposta Final", "**RESPOSTA FINAL:**", "3. Resposta Final"…)
 * e devolve só o que vem depois dele. Se nada for encontrado, devolve o
 * texto completo para não perder nada.
 */
export function splitChiefFinal(chiefText: string): ChiefFinalSplit {
  const full = chiefText.trim();
  if (!full) return { answer: "", full: "", hasFinalSection: false };

  const lines = full.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const raw = lines[i].trim();
    if (!raw) continue;

    // Tira decorações de cabeçalho à esquerda: hashes, negrito, bullets e emojis.
    const cleaned = raw
      .replace(/^#{1,6}\s*/, "")
      .replace(/^[^\p{L}\p{N}]+/u, "")
      .trim();

    // Caso 1 — linha curta (rótulo em linha própria ou rótulo curto com conteúdo após ":").
    const noTrail = cleaned.replace(/[\s*_]+$/u, "").trim();
    if (noTrail.length <= 80) {
      const m = noTrail.match(/^(?:resposta|s[íi]ntese)\s+(?:final|consolidada)\b/i);
      if (m) {
        const sameLine = noTrail
          .slice(m[0].length)
          .replace(/^[\s:*_\-–—>]+/, "")
          .trim();
        const after = stripLeadingSeparator(lines.slice(i + 1).join("\n"));
        const answer = [sameLine, after].filter(Boolean).join("\n").trim();
        if (answer.length >= MIN_FINAL_CHARS) {
          return { answer, full, hasFinalSection: true };
        }
      }
      continue;
    }

    // Caso 2 — linha longa: só aceita no formato "RÓTULO CURTO: conteúdo…".
    const inline = cleaned.match(
      /^(?:resposta|s[íi]ntese)\s+(?:final|consolidada)\b[^:]{0,40}:\s*(.+)$/i,
    );
    if (inline) {
      const sameLine = inline[1]
        .replace(/^[\s*_]+/, "")
        .replace(/[\s*_]+$/, "")
        .trim();
      const after = stripLeadingSeparator(lines.slice(i + 1).join("\n"));
      const answer = [sameLine, after].filter(Boolean).join("\n").trim();
      if (answer.length >= MIN_FINAL_CHARS) {
        return { answer, full, hasFinalSection: true };
      }
    }
  }

  return { answer: full, full, hasFinalSection: false };
}

function formatPtDate(ts: number): string {
  return new Date(ts).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
}

/** Transcrição completa do debate em Markdown. */
export function buildTranscriptMarkdown(debate: Debate, roster: AiInfo[] = []): string {
  const modeLabel = debate.mode === "adversarial" ? "Adversarial" : "Colaborativo";
  const lines: string[] = [
    "# DebateIA — Transcrição do debate",
    "",
    `- **Tema:** ${debate.topic}`,
    `- **Data:** ${formatPtDate(debate.updatedAt)}`,
    `- **Modo:** ${modeLabel}`,
    `- **Rodadas:** ${debate.totalRounds}`,
    `- **Participantes:** ${debate.participantIds.map((id) => aiName(id, roster)).join(", ")}`,
    `- **IA Chefe:** ${aiName(debate.chiefId, roster)}`,
  ];

  if (debate.topicAttachments.length > 0) {
    lines.push(
      `- **Anexos do tema:** ${debate.topicAttachments.map((a) => a.name).join(", ")}`,
    );
  }
  lines.push("", "---", "");

  for (let r = 1; r <= debate.totalRounds; r++) {
    const anyAnswer = debate.participantIds.some((id) => debate.answers[id]?.[r]?.trim());
    if (!anyAnswer) continue;
    lines.push(`## Rodada ${r}`, "");
    for (const id of debate.participantIds) {
      const a = debate.answers[id]?.[r]?.trim();
      if (!a) continue;
      lines.push(`### ${aiName(id, roster)}`, "", a, "");
    }
    lines.push("---", "");
  }

  if (debate.chiefFinal.trim()) {
    lines.push(
      `## Síntese da IA Chefe (${aiName(debate.chiefId, roster)})`,
      "",
      debate.chiefFinal.trim(),
      "",
    );
  }

  return lines.join("\n");
}

/** Export estruturado em JSON. */
export function buildJsonExport(debate: Debate, roster: AiInfo[] = []): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: "DebateIA",
      topic: debate.topic,
      mode: debate.mode,
      totalRounds: debate.totalRounds,
      participants: debate.participantIds.map((id) => ({
        id,
        name: aiName(id, roster),
      })),
      chief: { id: debate.chiefId, name: aiName(debate.chiefId, roster) },
      attachments: debate.topicAttachments.map(({ id, kind, name, mime, size }) => ({
        id,
        kind,
        name,
        mime,
        size,
      })),
      answers: debate.answers,
      chiefFinal: debate.chiefFinal,
    },
    null,
    2,
  );
}
