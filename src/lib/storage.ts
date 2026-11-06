import { AppSettings, AppStore, Attachment, Debate, DEFAULT_SETTINGS } from "@/lib/types";
import { AiInfo, AI_CATALOG, DEFAULT_ROSTER_IDS, getAi, MAX_ROSTER } from "@/lib/ais";

const DB_NAME = "debateia";
const DB_VERSION = 1;
const DEBATES_STORE = "debates";
const LEGACY_KEY = "debateia:v1"; // store antigo (localStorage, somente texto)
const FALLBACK_KEY = "debateia:store:ls"; // reserva quando IndexedDB não está disponível
const ROSTER_KEY = "debateia:roster:v1";
const SETTINGS_KEY = "debateia:settings:v1";

let dbPromise: Promise<IDBDatabase | null> | null = null;
let migrated = false;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(DEBATES_STORE)) {
            db.createObjectStore(DEBATES_STORE, { keyPath: "id" });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `d-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeAttachment(a: Attachment): Attachment {
  return {
    id: a.id ?? uid(),
    kind: a.kind === "image" ? "image" : "text",
    name: a.name ?? "arquivo",
    mime: a.mime ?? "application/octet-stream",
    size: Number(a.size) || 0,
    content: a.content,
    blob: a.blob instanceof Blob ? a.blob : undefined,
  };
}

function normalizeDebate(d: Debate): Debate {
  return {
    id: d.id ?? uid(),
    topic: d.topic ?? "",
    mode: d.mode === "adversarial" ? "adversarial" : "collaborative",
    totalRounds: Math.min(Math.max(Number(d.totalRounds) || 2, 1), 4),
    participantIds: Array.isArray(d.participantIds) ? d.participantIds : [],
    chiefId: d.chiefId || d.participantIds?.[0] || "",
    phase: d.phase === "chief" || d.phase === "done" ? d.phase : "rounds",
    currentRound: Math.max(Number(d.currentRound) || 1, 1),
    answers: d.answers ?? {},
    topicAttachments: (d.topicAttachments ?? []).map(normalizeAttachment),
    chiefFinal: d.chiefFinal ?? "",
    createdAt: Number(d.createdAt) || Date.now(),
    updatedAt: Number(d.updatedAt) || Date.now(),
  };
}

/* ------------------------------------------------------------------ */
/* Migração do store antigo (localStorage) para o IndexedDB            */
/* ------------------------------------------------------------------ */

async function migrateLegacy(): Promise<void> {
  if (migrated || typeof window === "undefined") return;
  migrated = true;
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as AppStore;
    if (!parsed || !Array.isArray(parsed.debates) || parsed.debates.length === 0) {
      window.localStorage.removeItem(LEGACY_KEY);
      return;
    }
    for (const d of parsed.debates.map(normalizeDebate)) {
      await putDebateRecord(d);
    }
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // migração é best-effort: o app funciona mesmo que falhe
  }
}

/* ------------------------------------------------------------------ */
/* Store de debates (IndexedDB, com reserva em localStorage)           */
/* ------------------------------------------------------------------ */

async function loadFallbackStore(): Promise<AppStore> {
  try {
    const raw = window.localStorage.getItem(FALLBACK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppStore;
      if (parsed && Array.isArray(parsed.debates)) {
        return { version: 2, debates: parsed.debates.map(normalizeDebate), activeId: null };
      }
    }
  } catch {
    // ignore
  }
  return { version: 2, debates: [], activeId: null };
}

function saveFallbackStore(store: AppStore): void {
  try {
    // Blobs não podem ir para localStorage — preserva apenas metadados + conteúdo textual
    const slim: AppStore = {
      ...store,
      debates: store.debates.map((d) => ({
        ...d,
        topicAttachments: d.topicAttachments.map(({ blob: _blob, ...rest }) => rest),
      })),
    };
    window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(slim));
  } catch {
    // storage cheio ou bloqueado: o app continua funcionando em memória
  }
}

async function putDebateRecord(debate: Debate): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DEBATES_STORE, "readwrite");
    tx.objectStore(DEBATES_STORE).put(debate);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadStore(): Promise<AppStore> {
  if (typeof window === "undefined") return { version: 2, debates: [], activeId: null };
  await migrateLegacy();
  const db = await openDb();
  if (!db) return loadFallbackStore();
  try {
    const debates = await new Promise<Debate[]>((resolve, reject) => {
      const tx = db.transaction(DEBATES_STORE, "readonly");
      const req = tx.objectStore(DEBATES_STORE).getAll();
      req.onsuccess = () => resolve((req.result as Debate[]).map(normalizeDebate));
      req.onerror = () => reject(req.error);
    });
    return { version: 2, debates, activeId: null };
  } catch {
    return loadFallbackStore();
  }
}

/** Salva um debate no navegador (IndexedDB). Ignorado no modo sessão. */
export async function saveDebate(debate: Debate, persist = true): Promise<void> {
  if (typeof window === "undefined" || !persist) return;
  try {
    const db = await openDb();
    if (!db) {
      const store = await loadFallbackStore();
      const debates = [debate, ...store.debates.filter((d) => d.id !== debate.id)];
      saveFallbackStore({ version: 2, debates, activeId: null });
      return;
    }
    await putDebateRecord(debate);
  } catch {
    // best-effort
  }
}

/** Remove um debate (e seus anexos) do navegador. */
export async function deleteDebate(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const db = await openDb();
    if (!db) {
      const store = await loadFallbackStore();
      saveFallbackStore({
        version: 2,
        debates: store.debates.filter((d) => d.id !== id),
        activeId: null,
      });
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DEBATES_STORE, "readwrite");
      tx.objectStore(DEBATES_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // best-effort
  }
}

/** Apaga TODOS os debates e anexos guardados neste navegador. */
export async function wipeDebates(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const db = await openDb();
    if (!db) {
      window.localStorage.removeItem(FALLBACK_KEY);
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DEBATES_STORE, "readwrite");
      tx.objectStore(DEBATES_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // best-effort
  }
  try {
    window.localStorage.removeItem(FALLBACK_KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
}

export function createDebate(params: {
  topic: string;
  mode: Debate["mode"];
  totalRounds: number;
  participantIds?: string[];
  chiefId?: string;
  topicAttachments?: Attachment[];
}): Debate {
  const now = Date.now();
  const participantIds = params.participantIds?.length
    ? params.participantIds
    : DEFAULT_ROSTER_IDS.slice(0, 4);
  const chiefId =
    params.chiefId && participantIds.includes(params.chiefId)
      ? params.chiefId
      : participantIds[0] ?? DEFAULT_ROSTER_IDS[0];
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
    topicAttachments: (params.topicAttachments ?? []).map(normalizeAttachment),
    chiefFinal: "",
    createdAt: now,
    updatedAt: now,
  };
}

/* ------------------------------------------------------------------ */
/* Elenco de IAs (localStorage — leve, poucos bytes)                   */
/* ------------------------------------------------------------------ */

export function defaultRoster(): AiInfo[] {
  return DEFAULT_ROSTER_IDS.map(getAi).filter((a): a is AiInfo => Boolean(a));
}

function normalizeAi(a: AiInfo): AiInfo {
  const catalog = AI_CATALOG.find((c) => c.id === a.id);
  return {
    id: a.id ?? uid(),
    name: a.name ?? catalog?.name ?? "IA",
    provider: a.provider ?? catalog?.provider ?? "",
    url: a.url ?? catalog?.url ?? "",
    glyph: a.glyph || catalog?.glyph || "AI",
    colors: Array.isArray(a.colors) && a.colors.length === 2 ? a.colors : catalog?.colors ?? ["#64748B", "#475569"],
    fg: a.fg || "#FFFFFF",
  };
}

export function loadRoster(): AiInfo[] {
  if (typeof window === "undefined") return defaultRoster();
  try {
    const raw = window.localStorage.getItem(ROSTER_KEY);
    if (!raw) return defaultRoster();
    const parsed = JSON.parse(raw) as AiInfo[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultRoster();
    return parsed.slice(0, MAX_ROSTER).map(normalizeAi);
  } catch {
    return defaultRoster();
  }
}

export function saveRoster(roster: AiInfo[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROSTER_KEY, JSON.stringify(roster.slice(0, MAX_ROSTER)));
  } catch {
    // best-effort
  }
}

/* ------------------------------------------------------------------ */
/* Configurações                                                       */
/* ------------------------------------------------------------------ */

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // best-effort
  }
}
