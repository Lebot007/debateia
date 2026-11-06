export type DebateMode = "collaborative" | "adversarial";

/** Fases do debate: rodadas entre as IAs auxiliares e depois a síntese da IA Chefe. */
export type DebatePhase = "rounds" | "chief" | "done";

/** Arquivo anexado ao tema do debate (imagem, TXT ou MD). */
export interface Attachment {
  id: string;
  kind: "image" | "text";
  name: string;
  mime: string;
  size: number;
  /** Conteúdo textual (apenas TXT/MD). */
  content?: string;
  /** Arquivo de imagem em si (apenas imagens; IndexedDB guarda Blob sem pesar na RAM). */
  blob?: Blob;
}

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
  /** Arquivos de apoio anexados ao tema — entram automaticamente nos prompts. */
  topicAttachments: Attachment[];
  /** Síntese final produzida pela IA Chefe. */
  chiefFinal: string;
  createdAt: number;
  updatedAt: number;
}

/** Preferências do usuário (salvas no localStorage). */
export interface AppSettings {
  /** Ao voltar para a aba com uma resposta copiada, identifica a IA e oferece colar. */
  autoDetectPaste: boolean;
  /** Inclui o conteúdo dos TXT/MD anexados ao tema dentro dos prompts gerados. */
  includeFilesInPrompts: boolean;
  /** Modo sessão: nada é persistido; ao fechar a aba tudo some. */
  wipeOnClose: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoDetectPaste: true,
  includeFilesInPrompts: true,
  wipeOnClose: false,
};

export interface AppStore {
  version: 2;
  debates: Debate[];
  activeId: string | null;
}
