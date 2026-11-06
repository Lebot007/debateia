export type DebateMode = "collaborative" | "adversarial";

/** Fases do debate: rodadas entre as IAs auxiliares e depois a síntese da IA Chefe. */
export type DebatePhase = "rounds" | "chief" | "done";

export interface Debate {
  id: string;
  topic: string;
  mode: DebateMode;
  totalRounds: number;
  /** IDs das IAs participantes (auxiliares + chefe). */
  participantIds: string[];
  /** IA que coordena o painel e sintetiza a resposta final. */
  chiefId: string;
  phase: DebatePhase;
  /** Rodada atual (1-based). */
  currentRound: number;
  /** answers[aiId][rodada] = resposta colada pelo usuário. */
  answers: Record<string, Record<number, string>>;
  /** Síntese final produzida pela IA Chefe. */
  chiefFinal: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppStore {
  version: 1;
  debates: Debate[];
  activeId: string | null;
}
