"use client";

import * as React from "react";
import { Check, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AiChip } from "@/components/debate/ai-chip";
import {
  AI_CATALOG,
  AI_PALETTE,
  AiInfo,
  DEFAULT_ROSTER_IDS,
  getAi,
  glyphFor,
  MAX_ROSTER,
} from "@/lib/ais";
import { uid } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface RosterManagerProps {
  roster: AiInfo[];
  onChange: (next: AiInfo[]) => void;
  trigger?: React.ReactNode;
}

type EditingState =
  | { mode: "edit"; base: AiInfo }
  | { mode: "new" }
  | null;

export function RosterManager({ roster, onChange, trigger }: RosterManagerProps) {
  const [editing, setEditing] = React.useState<EditingState>(null);
  const [open, setOpen] = React.useState(false);

  const full = roster.length >= MAX_ROSTER;
  const catalogAddable = AI_CATALOG.filter((c) => !roster.some((r) => r.id === c.id));

  function closeEditor() {
    setEditing(null);
  }

  function commit(ai: AiInfo) {
    if (editing?.mode === "edit") {
      onChange(roster.map((r) => (r.id === ai.id ? ai : r)));
      toast.success(`${ai.name} atualizada.`);
    } else {
      onChange([...roster, ai]);
      toast.success(`${ai.name} adicionada ao elenco.`);
    }
    closeEditor();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) closeEditor();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-2">
            IAs
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Minhas IAs ({roster.length}/{MAX_ROSTER})</DialogTitle>
          <DialogDescription>
            Edite qualquer IA, remova ou adicione novas — inclusive IAs personalizadas como
            GLM, Qwen ou qualquer outra. O limite de {MAX_ROSTER} mantém tudo rápido e
            organizado.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="scrollbar-thin max-h-[46vh] pr-3">
          <ul className="space-y-2">
            {roster.map((ai) => (
              <li key={ai.id}>
                <div className="flex items-center gap-2 rounded-xl border bg-card p-2.5">
                  <AiChip ai={ai} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight">{ai.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {ai.provider || "IA personalizada"}
                      {ai.url ? ` · ${safeHost(ai.url)}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={`Editar ${ai.name}`}
                    onClick={() => setEditing({ mode: "edit", base: ai })}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Remover ${ai.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover {ai.name} do elenco?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ela deixa de aparecer nas opções de novos debates. Debates antigos
                          continuam funcionando normalmente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => {
                            onChange(roster.filter((r) => r.id !== ai.id));
                            closeEditor();
                            toast.success(`${ai.name} removida.`);
                          }}
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                {editing?.mode === "edit" && editing.base.id === ai.id && (
                  <div className="mt-2">
                    <AiEditorForm
                      initial={ai}
                      onSave={commit}
                      onCancel={closeEditor}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>

        {/* Adicionar IA */}
        <div className="space-y-2 border-t pt-3">
          {editing?.mode === "new" ? (
            <AiEditorForm
              initial={blankAi()}
              onSave={commit}
              onCancel={closeEditor}
            />
          ) : (
            <>
              {!full && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setEditing({ mode: "new" })}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    IA personalizada
                  </Button>
                  {catalogAddable.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        if (full) {
                          toast.warning(`Limite de ${MAX_ROSTER} IAs no elenco.`);
                          return;
                        }
                        onChange([...roster, c]);
                        toast.success(`${c.name} adicionada.`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary/50"
                    >
                      <AiChip ai={c} size="sm" className="h-5 w-5 rounded text-[8px]" />
                      + {c.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground">
                  {full
                    ? `Elenco cheio (${MAX_ROSTER}/${MAX_ROSTER}) — remova uma para adicionar outra.`
                    : `${roster.length} de ${MAX_ROSTER} vagas usadas`}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      Restaurar padrão
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Restaurar elenco padrão?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Suas personalizações e IAs adicionadas serão substituídas pelas 8 IAs
                        padrão (ChatGPT, Claude, Gemini, DeepSeek, Grok, Copilot, GLM e Qwen).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          const defaults = DEFAULT_ROSTER_IDS.map(getAi).filter(
                            (a): a is AiInfo => Boolean(a),
                          );
                          onChange(defaults);
                          closeEditor();
                          toast.success("Elenco restaurado.");
                        }}
                      >
                        Restaurar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function blankAi(): AiInfo {
  return {
    id: "",
    name: "",
    provider: "",
    url: "",
    glyph: "AI",
    colors: AI_PALETTE[2].colors,
    fg: AI_PALETTE[2].fg,
  };
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function AiEditorForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: AiInfo;
  onSave: (ai: AiInfo) => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState(initial.name === "IA (removida)" ? "" : initial.name);
  const [provider, setProvider] = React.useState(initial.provider);
  const [url, setUrl] = React.useState(initial.url);
  const [colorIndex, setColorIndex] = React.useState(() => {
    const idx = AI_PALETTE.findIndex(
      (p) => p.colors[0] === initial.colors[0] && p.colors[1] === initial.colors[1],
    );
    return idx >= 0 ? idx : 2;
  });

  const isNew = initial.id === "";
  const preview: AiInfo = {
    ...initial,
    name: name || "Nova IA",
    glyph: glyphFor(name || (isNew ? "Nova IA" : initial.name)),
    colors: AI_PALETTE[colorIndex].colors,
    fg: AI_PALETTE[colorIndex].fg,
  };

  function handleSave() {
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("Dê um nome para a IA.");
      return;
    }
    const cleanUrl = url.trim();
    if (cleanUrl) {
      try {
        const parsed = new URL(cleanUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
      } catch {
        toast.error("O site oficial precisa ser um endereço válido (ex.: https://…).");
        return;
      }
    }
    onSave({
      id: isNew ? `${slugId(cleanName)}-${uid().slice(0, 6)}` : initial.id,
      name: cleanName,
      provider: provider.trim(),
      url: cleanUrl,
      glyph: glyphFor(cleanName),
      colors: AI_PALETTE[colorIndex].colors,
      fg: AI_PALETTE[colorIndex].fg,
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-primary/40 bg-primary/[0.04] p-3">
      <div className="flex items-center gap-2">
        <AiChip ai={preview} size="md" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{preview.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {isNew ? "nova IA" : "editando"}
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="ai-name" className="text-xs">Nome *</Label>
          <Input
            id="ai-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: GLM, Qwen Chat, Minha IA…"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ai-provider" className="text-xs">Empresa (opcional)</Label>
          <Input
            id="ai-provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="Ex.: Z.ai"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="ai-url" className="text-xs">Site oficial do chat</Label>
        <Input
          id="ai-url"
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://chat.exemplo.com"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Cor</Label>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Cor da IA">
          {AI_PALETTE.map((p, i) => (
            <button
              key={p.label}
              type="button"
              role="radio"
              aria-checked={i === colorIndex}
              aria-label={`Cor ${p.label}`}
              onClick={() => setColorIndex(i)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg shadow-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring",
                i === colorIndex && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
              style={{ background: `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]})` }}
            >
              {i === colorIndex && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" className="flex-1" onClick={handleSave}>
          Salvar
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function slugId(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "ia";
}
