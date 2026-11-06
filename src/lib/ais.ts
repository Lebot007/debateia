export interface AiInfo {
  id: string;
  name: string;
  provider: string;
  /** Site oficial do chat da IA (o usuário usa a própria conta). */
  url: string;
  glyph: string;
  /** Cores da marca para o chip do app. */
  colors: [string, string];
  fg: string;
}

/** Catálogo de IAs prontas — o usuário pode adicionar qualquer uma ao seu elenco. */
export const AI_CATALOG: AiInfo[] = [
  { id: "chatgpt", name: "ChatGPT", provider: "OpenAI", url: "https://chatgpt.com", glyph: "GPT", colors: ["#0EA37F", "#0A6E56"], fg: "#FFFFFF" },
  { id: "claude", name: "Claude", provider: "Anthropic", url: "https://claude.ai", glyph: "CL", colors: ["#D97757", "#A85335"], fg: "#FFFFFF" },
  { id: "gemini", name: "Gemini", provider: "Google", url: "https://gemini.google.com", glyph: "GE", colors: ["#4285F4", "#9B72CB"], fg: "#FFFFFF" },
  { id: "deepseek", name: "DeepSeek", provider: "DeepSeek", url: "https://chat.deepseek.com", glyph: "DS", colors: ["#4D6BFE", "#3450D9"], fg: "#FFFFFF" },
  { id: "grok", name: "Grok", provider: "xAI", url: "https://grok.com", glyph: "GK", colors: ["#232526", "#4A4A4C"], fg: "#F5F5F5" },
  { id: "copilot", name: "Copilot", provider: "Microsoft", url: "https://copilot.microsoft.com", glyph: "CO", colors: ["#5CC0DE", "#1560A8"], fg: "#FFFFFF" },
  { id: "glm", name: "GLM", provider: "Z.ai", url: "https://chat.z.ai", glyph: "GLM", colors: ["#0D9488", "#0F766E"], fg: "#FFFFFF" },
  { id: "qwen", name: "Qwen", provider: "Alibaba", url: "https://chat.qwen.ai", glyph: "QW", colors: ["#7C3AED", "#5318C0"], fg: "#FFFFFF" },
  { id: "perplexity", name: "Perplexity", provider: "Perplexity AI", url: "https://www.perplexity.ai", glyph: "PX", colors: ["#20B8CD", "#0E8496"], fg: "#FFFFFF" },
  { id: "metaai", name: "Meta AI", provider: "Meta", url: "https://www.meta.ai", glyph: "MT", colors: ["#0866FF", "#0053C0"], fg: "#FFFFFF" },
  { id: "mistral", name: "Le Chat", provider: "Mistral AI", url: "https://chat.mistral.ai", glyph: "MI", colors: ["#FA500F", "#FFD800"], fg: "#2B1600" },
  { id: "kimi", name: "Kimi", provider: "Moonshot AI", url: "https://www.kimi.com", glyph: "KM", colors: ["#4F46E5", "#332F9F"], fg: "#FFFFFF" },
  { id: "poe", name: "Poe", provider: "Quora", url: "https://poe.com", glyph: "PO", colors: ["#5D5CDE", "#3D3BB8"], fg: "#FFFFFF" },
];

/** Elenco padrão: 8 IAs prontas para uso, todas editáveis pelo usuário. */
export const DEFAULT_ROSTER_IDS = ["chatgpt", "claude", "gemini", "deepseek", "grok", "copilot", "glm", "qwen"];

export const DEFAULT_PARTICIPANTS = ["chatgpt", "claude", "gemini", "deepseek"];
export const DEFAULT_CHIEF = "chatgpt";
export const MAX_PARTICIPANTS = 8;
export const MIN_PARTICIPANTS = 2;
export const MAX_ROUNDS = 4;
/** Limite do elenco: mantém a interface rápida e organizada. */
export const MAX_ROSTER = 8;

/** Paleta de cores para IAs personalizadas. */
export const AI_PALETTE: { colors: [string, string]; fg: string; label: string }[] = [
  { colors: ["#0EA37F", "#0A6E56"], fg: "#FFFFFF", label: "Verde" },
  { colors: ["#D97757", "#A85335"], fg: "#FFFFFF", label: "Terracota" },
  { colors: ["#7C3AED", "#5318C0"], fg: "#FFFFFF", label: "Violeta" },
  { colors: ["#20B8CD", "#0E8496"], fg: "#FFFFFF", label: "Ciano" },
  { colors: ["#F59E0B", "#D97706"], fg: "#FFFFFF", label: "Âmbar" },
  { colors: ["#EC4899", "#BE185D"], fg: "#FFFFFF", label: "Rosa" },
  { colors: ["#232526", "#4A4A4C"], fg: "#F5F5F5", label: "Grafite" },
  { colors: ["#22C55E", "#15803D"], fg: "#FFFFFF", label: "Esmeralda" },
];

export function getAi(id: string): AiInfo | undefined {
  return AI_CATALOG.find((a) => a.id === id);
}

const FALLBACK_AI: AiInfo = {
  id: "unknown",
  name: "IA (removida)",
  provider: "",
  url: "",
  glyph: "AI",
  colors: ["#64748B", "#475569"],
  fg: "#FFFFFF",
};

/** Resolve uma IA pelo id: primeiro no elenco do usuário (permite renomear), depois no catálogo. */
export function resolveAi(id: string, roster: AiInfo[] = []): AiInfo {
  return roster.find((a) => a.id === id) ?? getAi(id) ?? { ...FALLBACK_AI, id };
}

export function aiName(id: string, roster: AiInfo[] = []): string {
  return resolveAi(id, roster).name;
}

/** Gera as iniciais/glyph a partir do nome de uma IA personalizada. */
export function glyphFor(name: string): string {
  const clean = name.trim();
  if (!clean) return "AI";
  if (clean.length <= 3) return clean.toUpperCase();
  const words = clean.split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}
