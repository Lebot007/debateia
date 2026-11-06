"use client";

import * as React from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fileToAttachment, formatSize, MAX_FILES_PER_DEBATE } from "@/lib/attachments";
import { Attachment } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACCEPT = "image/png,image/jpeg,image/webp,.txt,.md,.markdown";

interface AttachmentStripProps {
  attachments: Attachment[];
  onChange: (next: Attachment[]) => void;
}

/** Faixa de anexos do tema: imagens (até 5 MB) + TXT/MD (entram nos prompts). */
export function AttachmentStrip({ attachments, onChange }: AttachmentStripProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_FILES_PER_DEBATE - attachments.length;
    const list = Array.from(files).slice(0, Math.max(room, 0));
    if (files.length > room) {
      toast.warning(`Máximo de ${MAX_FILES_PER_DEBATE} anexos por debate.`);
    }
    const next = [...attachments];
    for (const file of list) {
      const { att, error } = await fileToAttachment(file);
      if (error || !att) {
        toast.error(error ?? "Não foi possível anexar o arquivo.");
        continue;
      }
      next.push(att);
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(id: string) {
    onChange(attachments.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
          aria-label="Anexar imagem, TXT ou MD ao tema do debate"
        >
          <Paperclip className="h-4 w-4" aria-hidden="true" />
          Anexar
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <p className="text-[11px] leading-snug text-muted-foreground">
          TXT e MD entram automaticamente nos prompts · imagens (máx. 5 MB) ficam como
          referência
        </p>
      </div>

      {attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Arquivos anexados ao tema">
          {attachments.map((att) =>
            att.kind === "image" ? (
              <ImageThumb key={att.id} att={att} onRemove={() => remove(att.id)} />
            ) : (
              <li key={att.id}>
                <span className="inline-flex max-w-[220px] items-center gap-1.5 rounded-lg border bg-card px-2 py-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="truncate font-medium">{att.name}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatSize(att.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(att.id)}
                    aria-label={`Remover o anexo ${att.name}`}
                    className="ml-0.5 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function ImageThumb({ att, onRemove }: { att: Attachment; onRemove: () => void }) {
  const [url, setUrl] = React.useState<string>("");

  React.useEffect(() => {
    if (!att.blob) return;
    const u = URL.createObjectURL(att.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [att.blob]);

  return (
    <li className={cn("group relative overflow-hidden rounded-lg border bg-card")}>
      {url ? (
        <img
          src={url}
          alt={`Anexo: ${att.name}`}
          className="h-16 w-24 object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-16 w-24 items-center justify-center text-[10px] text-muted-foreground">
          imagem
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover a imagem ${att.name}`}
        className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-foreground shadow hover:text-destructive"
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
      <span className="absolute inset-x-0 bottom-0 truncate bg-background/85 px-1 py-0.5 text-[9px] text-muted-foreground">
        {att.name}
      </span>
    </li>
  );
}
