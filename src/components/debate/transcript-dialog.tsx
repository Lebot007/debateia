"use client";

import * as React from "react";
import { FileText } from "lucide-react";
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
import { downloadText, slugify } from "@/lib/download";
import { buildTranscriptMarkdown } from "@/lib/prompts";
import { Debate } from "@/lib/types";

interface TranscriptDialogProps {
  debate: Debate;
}

export function TranscriptDialog({ debate }: TranscriptDialogProps) {
  const md = React.useMemo(() => buildTranscriptMarkdown(debate), [debate]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" aria-hidden="true" />
          Transcrição
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Transcrição completa do debate</DialogTitle>
          <DialogDescription>
            Todas as rodadas, participantes e a síntese da IA Chefe em um único texto.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="scrollbar-thin max-h-[60vh] rounded-lg border bg-muted/50 p-4">
          <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
            {md}
          </pre>
        </ScrollArea>
        <DialogFooter className="gap-2">
          <CopyButton
            text={md}
            label="Copiar transcrição"
            toastMessage="Transcrição copiada!"
            className="flex-1 sm:flex-none"
          />
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() =>
              downloadText(
                `debateia-${slugify(debate.topic)}.md`,
                md,
                "text/markdown;charset=utf-8",
              )
            }
          >
            Baixar .md
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
