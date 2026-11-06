"use client";

import * as React from "react";
import { ClipboardPaste } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiChip } from "@/components/debate/ai-chip";
import { PromptBox } from "@/components/debate/prompt-box";
import { AiInfo } from "@/lib/ais";
import { tryReadClipboard } from "@/lib/clipboard";
import { buildRoundPrompt } from "@/lib/prompts";
import { AppSettings, Debate } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AnswerSlotProps {
  debate: Debate;
  roster: AiInfo[];
  ai: AiInfo;
  round: number;
  settings: AppSettings;
  onAnswer: (aiId: string, round: number, text: string) => void;
}

/**
 * Slot de resposta de uma IA em uma rodada.
 * Você marca manualmente a IA de origem: cada slot já é fixo de uma IA,
 * e o botão "Colar" lê a área de transferência direto para este slot.
 */
export function AnswerSlot({ debate, roster, ai, round, settings, onAnswer }: AnswerSlotProps) {
  const text = debate.answers[ai.id]?.[round] ?? "";
  const answered = text.trim().length > 0;
  const prompt = buildRoundPrompt(debate, ai.id, round, roster, {
    includeFiles: settings.includeFilesInPrompts,
  });

  async function handlePasteButton() {
    const { text: clip, denied } = await tryReadClipboard();
    if (clip && clip.trim()) {
      onAnswer(ai.id, round, clip.trim());
      toast.success(`Resposta colada no slot de ${ai.name}.`);
      return;
    }
    if (denied) {
      toast.error(
        "O navegador bloqueou a leitura da área de transferência. Use Ctrl+V dentro do campo de texto.",
      );
    } else {
      toast.error("Não foi possível ler a área de transferência. Use Ctrl+V dentro do campo.");
    }
  }

  function handleNativePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData?.items ?? []);
    const img = items.find((i) => i.type.startsWith("image/"));
    if (img) {
      e.preventDefault();
      toast.info(
        "Imagem colada — anexe-a ao tema do debate (botão 📎 Anexar) para que todas as IAs fiquem cientes.",
        { duration: 7000 },
      );
    }
  }

  return (
    <div
      id={`slot-${ai.id}-${round}`}
      className={cn(
        "scroll-mt-24 rounded-xl border p-4 transition-colors",
        answered ? "border-emerald-500/40 bg-emerald-500/[0.04]" : "border-border bg-card",
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <AiChip ai={ai} />
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">{ai.name}</p>
          <p className="text-[11px] text-muted-foreground">{ai.provider || "IA personalizada"}</p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            answered
              ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
              : "border-amber-500/50 text-amber-600 dark:text-amber-400",
          )}
        >
          {answered ? "Respondida" : "Aguardando"}
        </Badge>
      </div>

      <PromptBox
        title={`Prompt para ${ai.name} — Rodada ${round} de ${debate.totalRounds}`}
        prompt={prompt}
        openUrl={ai.url || undefined}
        openLabel={ai.name}
      />

      <div className="mt-3 space-y-2">
        <Textarea
          value={text}
          onChange={(e) => onAnswer(ai.id, round, e.target.value)}
          onPaste={handleNativePaste}
          placeholder={`Cole aqui a resposta de ${ai.name} para a rodada ${round}…`}
          aria-label={`Resposta de ${ai.name}, rodada ${round}`}
          className="min-h-[140px] bg-background/60"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs"
              onClick={handlePasteButton}
              aria-label={`Colar resposta de ${ai.name} da área de transferência`}
            >
              <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
              Colar
            </Button>
            <span>{text.length.toLocaleString("pt-BR")} caracteres</span>
          </div>
          {text.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onAnswer(ai.id, round, "")}
            >
              Limpar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
