"use client";

import * as React from "react";
import { ExternalLink, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CopyButton } from "@/components/debate/copy-button";
import { copyToClipboard } from "@/lib/clipboard";

interface PromptBoxProps {
  /** Título exibido no diálogo do prompt completo. */
  title: string;
  prompt: string;
  /** URL do chat oficial da IA (opcional). */
  openUrl?: string;
  /** Nome da IA para o botão de abrir. */
  openLabel?: string;
}

/**
 * Caixa de prompt: pré-visualização com fade, diálogo com o texto completo,
 * botão de copiar e botão que copia + abre o site oficial da IA.
 */
export function PromptBox({ title, prompt, openUrl, openLabel }: PromptBoxProps) {
  const preview = prompt.length > 320 ? `${prompt.slice(0, 320)}…` : prompt;

  async function handleOpen() {
    const ok = await copyToClipboard(prompt);
    if (ok) {
      toast.success("Prompt copiado! Agora é só colar no chat da IA.");
    } else {
      toast.error("Não foi possível copiar automaticamente. Use o botão de copiar.");
    }
    if (openUrl) {
      window.open(openUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="space-y-3">
      <div className="prompt-fade relative max-h-28 overflow-hidden rounded-lg border bg-muted/50 p-3">
        <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-muted-foreground">
          {preview}
        </pre>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              Ver prompt completo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                Copie o prompt e cole no chat oficial da IA. Depois, volte e cole a resposta
                aqui.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="scrollbar-thin max-h-[55vh] rounded-lg border bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
                {prompt}
              </pre>
            </ScrollArea>
            <DialogFooter className="gap-2">
              <CopyButton
                text={prompt}
                label="Copiar prompt"
                className="flex-1 sm:flex-none"
              />
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <CopyButton
          text={prompt}
          label="Copiar prompt"
          toastMessage="Prompt copiado! Agora é só colar no chat da IA."
          variant="secondary"
          size="sm"
          className="flex-1 sm:flex-none"
        />
        {openUrl && (
          <Button size="sm" className="flex-1 gap-2 sm:flex-none" onClick={handleOpen}>
            <ExternalLink className="h-4 w-4" />
            {openLabel ? `Abrir ${openLabel}` : "Abrir IA"}
          </Button>
        )}
      </div>
    </div>
  );
}
