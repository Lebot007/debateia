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

export const AI_CATALOG: AiInfo[] = [
  { id: "chatgpt", name: "ChatGPT", provider: "OpenAI", url: "https://chatgpt.com", glyph: "GPT", colors: ["#0EA37F", "#0A6E56"], fg: "#FFFFFF" },
  { id: "claude", name: "Claude", provider: "Anthropic", url: "https://claude.ai", glyph: "CL", colors: ["#D97757", "#A85335"], fg: "#FFFFFF" },
  { id: "gemini", name: "Gemini", provider: "Google", url: "https://gemini.google.com", glyph: "GE", colors: ["#4285F4", "#9B72CB"], fg: "#FFFFFF" },
  { id: "deepseek", name: "DeepSeek", provider: "DeepSeek", url: "https://chat.deepseek.com", glyph: "DS", colors: ["#4D6BFE", "#3450D9"], fg: "#FFFFFF" },
  { id: "grok", name: "Grok", provider: "xAI", url: "https://grok.com", glyph: "GK", colors: ["#232526", "#4A4A4C"], fg: "#F5F5F5" },
  { id: "copilot", name: "Copilot", provider: "Microsoft", url: "https://copilot.microsoft.com", glyph: "CO", colors: ["#5CC0DE", "#1560A8"], fg: "#FFFFFF" },
  { id: "perplexity", name: "Perplexity", provider: "Perplexity AI", url: "https://www.perplexity.ai", glyph: "PX", colors: ["#20B8CD", "#0E8496"], fg: "#FFFFFF" },
  { id: "metaai", name: "Meta AI", provider: "Meta", url: "https://www.meta.ai", glyph: "MT", colors: ["#0866FF", "#0053C0"], fg: "#FFFFFF" },
  { id: "mistral", name: "Le Chat", provider: "Mistral AI", url: "https://chat.mistral.ai", glyph: "MI", colors: ["#FA500F", "#FFD800"], fg: "#2B1600" },
  { id: "qwen", name: "Qwen", provider: "Alibaba", url: "https://chat.qwen.ai", glyph: "QW", colors: ["#7C3AED", "#5318C0"], fg: "#FFFFFF" },
  { id: "kimi", name: "Kimi", provider: "Moonshot AI", url: "https://www.kimi.com", glyph: "KM", colors: ["#4F46E5", "#332F9F"], fg: "#FFFFFF" },
  { id: "poe", name: "Poe", provider: "Quora", url: "https://poe.com", glyph: "PO", colors: ["#5D5CDE", "#3D3BB8"], fg: "#FFFFFF" },
];

export const DEFAULT_PARTICIPANTS = ["chatgpt", "claude", "gemini", "deepseek"];
export const DEFAULT_CHIEF = "chatgpt";
export const MAX_PARTICIPANTS = 8;
export const MIN_PARTICIPANTS = 2;
export const MAX_ROUNDS = 4;

export function getAi(id: string): AiInfo | undefined {
  return AI_CATALOG.find((a) => a.id === id);
}

export function aiName(id: string): string {
  return getAi(id)?.name ?? "IA";
}
