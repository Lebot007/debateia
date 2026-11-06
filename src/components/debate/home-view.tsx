"use client";

import * as React from "react";
import {
  CalendarClock,
  ClipboardCopy,
  Crown,
  ExternalLink,
  MessageSquareReply,
  Tags,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AiChip } from "@/components/debate/ai-chip";
import { SetupForm } from "@/components/debate/setup-form";
import { AiInfo, resolveAi } from "@/lib/ais";
import { Debate } from "@/lib/types";

const STEPS = [
  {
    icon: ClipboardCopy,
    title: "1. Copie o prompt",
    desc: "O DebateIA monta o prompt perfeito para cada IA — com o tema, os anexos e as respostas das outras já embutidos.",
  },
  {
    icon: ExternalLink,
    title: "2. Abra a IA oficial",
    desc: "Um clique copia e abre o site da IA (ChatGPT, Claude, GLM, Qwen…). Você usa a sua conta de sempre, sem API.",
  },
  {
    icon: Tags,
    title: "3. Cole no slot certo",
    desc: "Cada slot já é marcado com a IA de origem — você escolhe e cola a resposta nele. Anexos de imagem, TXT e MD são bem-vindos.",
  },
  {
    icon: Crown,
    title: "4. Síntese da IA Chefe",
    desc: "No fim, a IA Chefe avalia o painel, resolve divergências e entrega a resposta final — condensada e pronta para usar.",
  },
];

function phaseLabel(d: Debate): string {
  if (d.phase === "rounds") return `Rodada ${d.currentRound}/${d.totalRounds}`;
  if (d.phase === "chief") return "Síntese da IA Chefe";
  return "Concluído";
}

function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

interface HomeViewProps {
  debates: Debate[];
  roster: AiInfo[];
  onCreate: (debate: Debate) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onChangeRoster: (next: AiInfo[]) => void;
}

export function HomeView({
  debates,
  roster,
  onCreate,
  onOpen,
  onDelete,
  onChangeRoster,
}: HomeViewProps) {
  return (
    <div className="space-y-12 py-8 sm:py-12">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <Badge
          variant="outline"
          className="mb-5 border-primary/40 bg-primary/10 text-primary"
        >
          100% no navegador · sem API · anexos e síntese final
        </Badge>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
          Suas IAs debatem entre si.{" "}
          <span className="text-gradient">A IA Chefe decide.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-muted-foreground sm:text-lg">
          Monte um painel com as IAs que você já usa — GPT, Claude, Gemini, DeepSeek, GLM,
          Qwen e qualquer outra. O DebateIA automatiza o revezamento: monta cada prompt,
          organiza as respostas por IA e prepara a síntese final da IA Chefe.
        </p>
      </motion.section>

      {/* Como funciona */}
      <section aria-labelledby="how-title">
        <h2 id="how-title" className="sr-only">
          Como funciona
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            >
              <Card className="h-full border-border/70 bg-card/70">
                <CardContent className="space-y-3 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <s.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Novo debate */}
      <section aria-labelledby="new-title" className="scroll-mt-20">
        <h2
          id="new-title"
          className="mb-5 text-xl font-bold tracking-tight sm:text-2xl"
        >
          Novo debate
        </h2>
        <SetupForm
          roster={roster}
          onChangeRoster={onChangeRoster}
          onCreate={onCreate}
        />
      </section>

      {/* Histórico */}
      <section aria-labelledby="history-title">
        <h2 id="history-title" className="mb-5 text-xl font-bold tracking-tight sm:text-2xl">
          Meus debates
        </h2>
        {debates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            Nenhum debate salvo ainda. Crie o primeiro acima — ele fica salvo automaticamente
            neste navegador (ou ative o modo sessão nas configurações para nada ser gravado).
          </div>
        ) : (
          <div className="space-y-3">
            {debates.map((d) => (
              <HistoryItem
                key={d.id}
                debate={d}
                roster={roster}
                onOpen={onOpen}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HistoryItem({
  debate,
  roster,
  onOpen,
  onDelete,
}: {
  debate: Debate;
  roster: AiInfo[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const chips: AiInfo[] = debate.participantIds
    .map((id) => resolveAi(id, roster));

  return (
    <Card className="transition-colors hover:border-primary/50">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={debate.phase === "done" ? "default" : "secondary"}
              className={
                debate.phase === "done"
                  ? "bg-emerald-500 text-white hover:bg-emerald-500"
                  : ""
              }
            >
              {phaseLabel(debate)}
            </Badge>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarClock className="h-3 w-3" aria-hidden="true" />
              {shortDate(debate.updatedAt)}
            </span>
            {debate.topicAttachments.length > 0 && (
              <Badge variant="outline" className="text-[11px]">
                📎 {debate.topicAttachments.length}
              </Badge>
            )}
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-medium">{debate.topic}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {chips.map((a) => (
              <AiChip key={a.id} ai={a} size="sm" />
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" onClick={() => onOpen(debate.id)}>
            Continuar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Excluir o debate sobre ${debate.topic}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir este debate?</AlertDialogTitle>
                <AlertDialogDescription>
                  Todas as respostas, anexos e a síntese deste debate serão apagados
                  permanentemente deste navegador. Essa ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(debate.id)}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
