import { DEFAULT_CHIEF, DEFAULT_PARTICIPANTS } from "@/lib/ais";
import { AppStore, Debate, DebateMode } from "@/lib/types";

const STORAGE_KEY = "debateia:v1";

export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `d-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyStore(): AppStore {
  return { version: 1, debates: [], activeId: null };
}

export function loadStore(): AppStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as AppStore;
    if (!parsed || !Array.isArray(parsed.debates)) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: AppStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // storage cheio ou bloqueado: o app continua funcionando em memória
  }
}

export function createDebate(params: {
  topic: string;
  mode: DebateMode;
  totalRounds: number;
  participantIds?: string[];
  chiefId?: string;
}): Debate {
  const now = Date.now();
  const participantIds = params.participantIds?.length
    ? params.participantIds
    : DEFAULT_PARTICIPANTS;
  const chiefId = params.chiefId && participantIds.includes(params.chiefId)
    ? params.chiefId
    : participantIds[0] ?? DEFAULT_CHIEF;
  return {
    id: uid(),
    topic: params.topic.trim(),
    mode: params.mode,
    totalRounds: Math.min(Math.max(params.totalRounds, 1), 4),
    participantIds,
    chiefId,
    phase: "rounds",
    currentRound: 1,
    answers: {},
    chiefFinal: "",
    createdAt: now,
    updatedAt: now,
  };
}
