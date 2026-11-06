import { AiInfo } from "@/lib/ais";

export interface PasteDetection {
  aiId: string;
  /** Confiança estimada de 0 a 1. */
  confidence: number;
  matches: string[];
}

const MIN_TEXT_LENGTH = 40;
const MIN_SCORE = 2;

/**
 * Tenta identificar de qual IA veio um texto colado, usando as palavras-chave
 * de cada IA do elenco (padrão do catálogo + personalizadas pelo usuário).
 *
 * Ex.: o usuário copia a resposta do GLM no site da Z.ai e volta para cá —
 * o texto contém "GLM" / "z.ai" e o app reconhece a origem automaticamente.
 */
export function detectAiFromText(
  text: string,
  roster: AiInfo[],
  excludeId?: string,
): PasteDetection | null {
  const t = text.toLowerCase();
  if (t.length < MIN_TEXT_LENGTH) return null;

  let best: { id: string; score: number; matches: string[] } | null = null;

  for (const ai of roster) {
    if (ai.id === excludeId) continue;
    const sigs = new Set<string>([
      ai.name.toLowerCase(),
      ...(ai.signatures ?? []).map((s) => s.toLowerCase().trim()),
    ]);

    let score = 0;
    const matches: string[] = [];
    for (const s of sigs) {
      if (!s) continue;
      if (t.includes(s)) {
        const weight = s === ai.name.toLowerCase() ? 3 : s.length >= 6 ? 2 : 1;
        score += weight;
        matches.push(s);
      }
    }
    if (score > (best?.score ?? 0)) best = { id: ai.id, score, matches };
  }

  if (!best || best.score < MIN_SCORE) return null;
  return {
    aiId: best.id,
    confidence: Math.min(0.95, best.score / 6),
    matches: best.matches,
  };
}
