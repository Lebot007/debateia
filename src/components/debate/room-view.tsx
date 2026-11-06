"use client";

import * as React from "react";
import {
  ArrowRight,
  ChevronDown,
  Crown,
  FileDown,
  FileJson,
  Home,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { AiChip } from "@/components/debate/ai-chip";
import { AnswerSlot } from "@/components/debate/answer-slot";
import { AttachmentStrip } from "@/components/debate/attachment-strip";
import { CopyButton } from "@/components/debate/copy-button";
import { PromptBox } from "@/components/debate/prompt-box";
import { TranscriptDialog } from "@/components/debate/transcript-dialog";
import { aiName, AiInfo, resolveAi } from "@/lib/ais";
import {
  buildChiefPrompt,
  buildJsonExport,
  buildTranscriptMarkdown,
  latestAnswer,
} from "@/lib/prompts";
import { downloadText, slugify } from "@/lib/download";
import { AppSettings, Debate } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RoomViewProps {
  debate: Debate;
  roster: AiInfo[];
  settings: AppSettings;
  onChange: (updater: (d: Debate) => Debate) => void;
  onExit: () => void;
  onNewDebate: () => void;
}

export function RoomView({ debate, roster, settings, onChange, onExit, onNewDebate }: RoomViewProps) {
  function setAnswer(aiId: string, round: number, text: string) {
    onChange((d) => ({
      ...d,
      answers: {
        ...d.answers,
        [aiId]: { ...(d.answers[aiId] ?? {}), [round]: text },
      },
    }));
  }

  function setAttachments(next: Debate["topicAttachments"]) {
    onChange((d) => ({ ...d, topicAttachments: next }));
  }

  function goFinishRound() {
    const isLast = debate.currentRound >= debate.totalRounds;
    if (!isLast) {
      onChange((d) => ({ ...d, currentRound: d.currentRound + 1 }));
      toast.success(
        `Rodada ${debate.currentRound} concluída. Prepare os prompts da rodada ${debate.currentRound + 1}.`,
      );
    } else {
      onChange((d) => ({ ...d, phase: "chief" }));
      toast.info("Debate encerrado. Agora peça a síntese da IA Chefe.");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const answeredNow = debate.participantIds.filter((id) =>
    debate.answers[id]?.[debate.currentRound]?.trim(),
  ).length;
  const progress =
    debate.phase === "rounds"
      ? Math.round((answeredNow / Math.max(debate.participantIds.length, 1)) * 100)
      : 100;

  const roundsToRender =
    debate.phase === "rounds"
      ? Array.from({ length: debate.currentRound }, (_, i) => i + 1)
      : Array.from({ length: debate.totalRounds }, (_, i) => i + 1);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 py-6 sm:py-10">
      <TopicCard
        debate={debate}
        roster={roster}
        progress={progress}
        answeredNow={answeredNow}
        onAttachments={setAttachments}
        onExit={onExit}
      />

      {roundsToRender.map((r) => (
        <RoundSection
          key={r}
          debate={debate}
          roster={roster}
          settings={settings}
          round={r}
          isCurrent={debate.phase === "rounds" && r === debate.currentRound}
          onAnswer={setAnswer}
          onFinish={goFinishRound}
        />
      ))}

      {debate.phase !== "rounds" && (
        <ChiefPanel debate={debate} roster={roster} settings={settings} onChange={onChange} onNewDebate={onNewDebate} />
      )}
    </div>
  );
}

function TopicCard({
  debate,
  roster,
  progress,
  answeredNow,
  onAttachments,
  onExit,
}: {
  debate: Debate;
  roster: AiInfo[];
  progress: number;
  answeredNow: number;
  onAttachments: (next: Debate["topicAttachments"]) => void;
  onExit: () => void;
}) {
  const isChiefPhase = debate.phase !== "rounds";
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Debate em andamento
            </p>
            <h2 className="mt-1 text-lg font-semibold leading-snug sm:text-xl">
              {debate.topic}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <TranscriptDialog debate={debate} roster={roster} />
            <Button variant="ghost" size="sm" className="gap-2" onClick={onExit}>
              <Home className="h-4 w-4" aria-hidden="true" />
              Meus debates
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">
            {debate.mode === "adversarial" ? "Adversarial" : "Colaborativo"}
          </Badge>
          <Badge variant="secondary">
            {debate.totalRounds} {debate.totalRounds === 1 ? "rodada" : "rodadas"}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Crown className="h-3 w-3 text-amber-500" aria-hidden="true" />
            {aiName(debate.chiefId, roster)} coordena
          </Badge>
          {debate.participantIds.map((id) => {
            const ai = resolveAi(id, roster);
            const answered = Boolean(latestAnswer(debate, id));
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-1 text-[11px]"
              >
                <AiChip ai={ai} size="sm" />
                {ai.name}
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    answered ? "bg-emerald-500" : "bg-muted-foreground/40",
                  )}
                />
              </span>
            );
          })}
        </div>
        <div className="mt-4">
          <AttachmentStrip
            attachments={debate.topicAttachments}
            onChange={onAttachments}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {isChiefPhase
              ? debate.chiefFinal.trim()
                ? "Debate concluído — resposta final pronta."
                : "Fase final: síntese da IA Chefe."
              : `Rodada ${debate.currentRound} de ${debate.totalRounds} · ${answeredNow}/${debate.participantIds.length} IAs responderam`}
          </span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} aria-label="Progresso da rodada atual" />
      </CardContent>
    </Card>
  );
}

function RoundSection({
  debate,
  roster,
  settings,
  round,
  isCurrent,
  onAnswer,
  onFinish,
}: {
  debate: Debate;
  roster: AiInfo[];
  settings: AppSettings;
  round: number;
  isCurrent: boolean;
  onAnswer: (aiId: string, round: number, text: string) => void;
  onFinish: () => void;
}) {
  const [open, setOpen] = React.useState(isCurrent);

  React.useEffect(() => {
    if (!isCurrent) setOpen(false);
  }, [isCurrent]);

  const answered = debate.participantIds.filter((id) =>
    debate.answers[id]?.[round]?.trim(),
  ).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-accent/50"
            aria-expanded={open}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary">
                {round}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  Rodada {round} de {debate.totalRounds}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {answered}/{debate.participantIds.length} IAs responderam
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {isCurrent && <Badge>Atual</Badge>}
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
                aria-hidden="true"
              />
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 border-t pt-4">
            {debate.participantIds.map((id) => {
              const ai = resolveAi(id, roster);
              return (
                <AnswerSlot
                  key={id}
                  debate={debate}
                  roster={roster}
                  ai={ai}
                  round={round}
                  settings={settings}
                  onAnswer={onAnswer}
                />
              );
            })}
            {isCurrent && (
              <RoundFooter debate={debate} roster={roster} round={round} onFinish={onFinish} />
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function RoundFooter({
  debate,
  roster,
  round,
  onFinish,
}: {
  debate: Debate;
  roster: AiInfo[];
  round: number;
  onFinish: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const missing = debate.participantIds
    .filter((id) => !debate.answers[id]?.[round]?.trim())
    .map((id) => aiName(id, roster));
  const answered = debate.participantIds.length - missing.length;
  const isLast = round >= debate.totalRounds;

  function handleClick() {
    if (answered === 0) {
      toast.warning("Cole ao menos uma resposta antes de avançar.");
      return;
    }
    if (missing.length > 0) {
      setConfirmOpen(true);
    } else {
      onFinish();
    }
  }

  return (
    <div className="border-t pt-4">
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Button
          onClick={handleClick}
          className="w-full gap-2 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 text-white hover:opacity-95 sm:w-auto"
        >
          {isLast ? (
            <Crown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
          {isLast
            ? "Ir para a síntese da IA Chefe"
            : `Concluir rodada ${round} e avançar`}
        </Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Algumas IAs ainda não responderam</AlertDialogTitle>
            <AlertDialogDescription>
              Sem resposta: {missing.join(", ")}.{" "}
              {isLast
                ? "Elas ficarão de fora da síntese da IA Chefe."
                : "Elas ficarão de fora das rodadas seguintes."}{" "}
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={onFinish}>Concluir mesmo assim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ChiefPanel({
  debate,
  roster,
  settings,
  onChange,
  onNewDebate,
}: {
  debate: Debate;
  roster: AiInfo[];
  settings: AppSettings;
  onChange: (updater: (d: Debate) => Debate) => void;
  onNewDebate: () => void;
}) {
  const chief = resolveAi(debate.chiefId, roster);
  const prompt = buildChiefPrompt(debate, roster, {
    includeFiles: settings.includeFilesInPrompts,
  });
  const done = debate.chiefFinal.trim().length > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg">
          <Crown className="h-5 w-5 text-amber-500" aria-hidden="true" />
          Fase final — IA Chefe
        </h3>
        <Button variant="ghost" size="sm" onClick={() => onChange((d) => ({ ...d, phase: "rounds" }))}>
          Revisar rodadas
        </Button>
      </div>

      <Card className="chief-glow border-amber-500/40">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <AiChip ai={chief} />
            {chief.name} coordena a síntese
          </CardTitle>
          <CardDescription>
            A IA Chefe recebe todas as respostas do painel, avalia cada uma, resolve as
            divergências e escreve a resposta final consolidada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PromptBox
            title={`Prompt de síntese para ${chief.name} (IA Chefe)`}
            prompt={prompt}
            openUrl={chief.url || undefined}
            openLabel={chief.name}
          />
          <Textarea
            value={debate.chiefFinal}
            onChange={(e) =>
              onChange((d) => ({
                ...d,
                chiefFinal: e.target.value,
                phase: e.target.value.trim() ? "done" : "chief",
              }))
            }
            placeholder={`Cole aqui a síntese final de ${chief.name}…`}
            aria-label="Síntese final da IA Chefe"
            className="min-h-[180px] bg-background/60"
          />
          <p className="text-xs text-muted-foreground">
            {debate.chiefFinal.length.toLocaleString("pt-BR")} caracteres
          </p>
        </CardContent>
      </Card>

      {done && <FinalAnswerCard debate={debate} roster={roster} onNewDebate={onNewDebate} />}
    </div>
  );
}

function FinalAnswerCard({
  debate,
  roster,
  onNewDebate,
}: {
  debate: Debate;
  roster: AiInfo[];
  onNewDebate: () => void;
}) {
  const base = `debateia-${slugify(debate.topic)}`;
  return (
    <Card className="final-glow border-emerald-500/40">
      <CardHeader className="pb-4">
        <Badge className="w-fit bg-emerald-500 text-white hover:bg-emerald-500">
          Resposta final
        </Badge>
        <CardTitle className="text-lg">Síntese consolidada do painel</CardTitle>
        <CardDescription>
          Resultado do debate entre {debate.participantIds.map((id) => aiName(id, roster)).join(", ")} —
          sintetizado por {aiName(debate.chiefId, roster)}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap rounded-lg border bg-muted/50 p-4 text-sm leading-relaxed">
          {debate.chiefFinal}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <CopyButton
          text={debate.chiefFinal}
          label="Copiar resposta final"
          toastMessage="Resposta final copiada!"
          className="flex-1 sm:flex-none"
        />
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2 sm:flex-none"
          onClick={() =>
            downloadText(
              `${base}.md`,
              buildTranscriptMarkdown(debate, roster),
              "text/markdown;charset=utf-8",
            )
          }
        >
          <FileDown className="h-4 w-4" aria-hidden="true" />
          Transcrição .md
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2 sm:flex-none"
          onClick={() =>
            downloadText(
              `${base}.json`,
              buildJsonExport(debate, roster),
              "application/json;charset=utf-8",
            )
          }
        >
          <FileJson className="h-4 w-4" aria-hidden="true" />
          Dados .json
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2 sm:flex-none"
          onClick={onNewDebate}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo debate
        </Button>
      </CardFooter>
    </Card>
  );
}
