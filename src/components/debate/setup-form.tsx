"use client";

import * as React from "react";
import { ArrowRight, Check, Crown, ExternalLink, Minus, Plus, Sparkles, Swords, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AiChip } from "@/components/debate/ai-chip";
import { AttachmentStrip } from "@/components/debate/attachment-strip";
import { RosterManager } from "@/components/debate/roster-manager";
import { AiInfo, MAX_PARTICIPANTS, MAX_ROUNDS, MIN_PARTICIPANTS, resolveAi } from "@/lib/ais";
import { createDebate } from "@/lib/storage";
import { Attachment, Debate, DebateMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const TOPIC_SUGGESTIONS = [
  "Como aprender programação de forma eficiente em 2026?",
  "Quais profissões serão mais impactadas pela IA nos próximos 5 anos?",
  "Vale a pena abrir uma empresa de software no Brasil hoje?",
  "Qual a melhor estratégia para estudar para um concurso público?",
];

interface SetupFormProps {
  roster: AiInfo[];
  onChangeRoster: (next: AiInfo[]) => void;
  onCreate: (debate: Debate) => void;
}

export function SetupForm({ roster, onChangeRoster, onCreate }: SetupFormProps) {
  const [topic, setTopic] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>(() =>
    ["chatgpt", "claude", "gemini", "deepseek"].filter((id) =>
      roster.some((r) => r.id === id),
    ),
  );
  const [chiefId, setChiefId] = React.useState<string>("chatgpt");
  const [rounds, setRounds] = React.useState(2);
  const [mode, setMode] = React.useState<DebateMode>("collaborative");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);

  // Se o usuário remover IAs do elenco enquanto monta o painel, ajusta a seleção
  React.useEffect(() => {
    setSelected((prev) => {
      const next = prev.filter((id) => roster.some((r) => r.id === id));
      setChiefId((c) => (next.includes(c) ? c : next[0] ?? ""));
      return next;
    });
  }, [roster]);

  function toggleAi(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= MIN_PARTICIPANTS) {
          toast.warning(`Um debate precisa de pelo menos ${MIN_PARTICIPANTS} IAs.`);
          return prev;
        }
        const next = prev.filter((x) => x !== id);
        setChiefId((c) => (next.includes(c) ? c : next[0] ?? ""));
        return next;
      }
      if (prev.length >= MAX_PARTICIPANTS) {
        toast.warning(`Máximo de ${MAX_PARTICIPANTS} IAs por debate.`);
        return prev;
      }
      const next = [...prev, id];
      setChiefId((c) => (next.includes(c) ? c : next[0] ?? ""));
      return next;
    });
  }

  const topicOk = topic.trim().length >= 10;
  const aisOk = selected.length >= MIN_PARTICIPANTS && selected.length <= MAX_PARTICIPANTS;
  const chiefOk = Boolean(chiefId) && selected.includes(chiefId);
  const canCreate = topicOk && aisOk && chiefOk;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) return;
    onCreate(
      createDebate({
        topic,
        mode,
        totalRounds: rounds,
        participantIds: selected,
        chiefId,
        topicAttachments: attachments,
      }),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 1. Tema */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">1</span>
            Tema do debate
          </CardTitle>
          <CardDescription>
            A pergunta ou problema que as IAs vão debater. Quanto mais específico, melhor a
            síntese final.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="topic" className="sr-only">
              Tema do debate
            </Label>
            <Textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex.: Como montar um plano de estudos realista para aprender inglês em 6 meses?"
              className="min-h-[96px] bg-background/60 text-base"
              aria-describedby="topic-hint"
            />
            <div id="topic-hint" className="flex flex-wrap gap-2">
              {TOPIC_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTopic(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              📎 Material de apoio (opcional) — vai junto nos prompts de todas as IAs
            </p>
            <AttachmentStrip attachments={attachments} onChange={setAttachments} />
          </div>
        </CardContent>
      </Card>

      {/* 2. Participantes */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">2</span>
                IAs auxiliares do painel
              </CardTitle>
              <CardDescription className="mt-1.5">
                Selecione de {MIN_PARTICIPANTS} a {MAX_PARTICIPANTS} IAs do seu elenco.
              </CardDescription>
            </div>
            <RosterManager
              roster={roster}
              onChange={onChangeRoster}
              trigger={
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  Gerenciar IAs ({roster.length})
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Seu elenco está vazio. Use “Gerenciar IAs” para adicionar ao menos{" "}
              {MIN_PARTICIPANTS}.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {roster.map((a) => {
                const isSelected = selected.includes(a.id);
                return (
                  <div
                    key={a.id}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => toggleAi(a.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleAi(a.id);
                      }
                    }}
                    className={cn(
                      "relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3 transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                        : "border-border bg-card/70 hover:border-primary/50 hover:bg-accent/40",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <AiChip ai={a} />
                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.provider || "IA personalizada"}
                      </p>
                    </div>
                    {a.url && (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Abrir o site oficial de ${a.name} em outra aba`}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        site oficial
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            {selected.length} de {MAX_PARTICIPANTS} selecionadas
          </p>
        </CardContent>
      </Card>

      {/* 3. IA Chefe */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">3</span>
            IA Chefe (coordenadora)
          </CardTitle>
          <CardDescription>
            No fim do debate, ela avalia todas as respostas, resolve divergências e escreve a
            resposta final.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selected.length === 0 ? (
            <p className="text-sm text-muted-foreground">Selecione as IAs do painel primeiro.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selected.map((id) => {
                const ai = resolveAi(id, roster);
                const isChief = chiefId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setChiefId(id)}
                    aria-pressed={isChief}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      isChief
                        ? "border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : "border-border bg-card text-foreground hover:border-primary/50",
                    )}
                  >
                    <AiChip ai={ai} size="sm" />
                    {ai.name}
                    {isChief && <Crown className="h-3.5 w-3.5" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Rodadas e estilo */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">4</span>
            Rodadas e estilo do debate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border bg-card/70 p-3">
            <div>
              <p className="text-sm font-medium">Número de rodadas</p>
              <p className="text-xs text-muted-foreground">
                Depois da rodada 1, cada IA lê as respostas das outras e responde de novo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Diminuir número de rodadas"
                onClick={() => setRounds((r) => Math.max(1, r - 1))}
                disabled={rounds <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="min-w-8 justify-center text-sm">
                {rounds}
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Aumentar número de rodadas"
                onClick={() => setRounds((r) => Math.min(MAX_ROUNDS, r + 1))}
                disabled={rounds >= MAX_ROUNDS}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("collaborative")}
              aria-pressed={mode === "collaborative"}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
                mode === "collaborative"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card/70 hover:border-primary/50",
              )}
            >
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold">Colaborativo</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  As IAs leem as respostas das outras, incorporam os melhores pontos e refinam
                  juntas.
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode("adversarial")}
              aria-pressed={mode === "adversarial"}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
                mode === "adversarial"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card/70 hover:border-primary/50",
              )}
            >
              <Swords className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold">Adversarial</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  As IAs criticam as respostas das outras, defendem suas posições e antecipam
                  objeções.
                </span>
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="space-y-2">
        <Button
          type="submit"
          size="lg"
          disabled={!canCreate}
          className="w-full gap-2 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-95"
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          Iniciar debate
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Button>
        {!topicOk && (
          <p className="text-center text-xs text-muted-foreground">
            Descreva o tema com pelo menos 10 caracteres.
          </p>
        )}
        {topicOk && !aisOk && (
          <p className="text-center text-xs text-muted-foreground">
            Selecione entre {MIN_PARTICIPANTS} e {MAX_PARTICIPANTS} IAs.
          </p>
        )}
      </div>
    </form>
  );
}
