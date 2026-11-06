"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/clipboard";

interface CopyButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick" | "children"> {
  text: string;
  label?: string;
  toastMessage?: string;
  onCopied?: () => void;
  iconOnly?: boolean;
}

export function CopyButton({
  text,
  label = "Copiar",
  toastMessage = "Copiado para a área de transferência",
  onCopied,
  iconOnly = false,
  className,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  async function handleClick() {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      toast.success(toastMessage);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
      onCopied?.();
    } else {
      toast.error("Não foi possível copiar automaticamente. Selecione e copie manualmente.");
    }
  }

  return (
    <Button onClick={handleClick} className={cn("gap-2", className)} {...props}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {!iconOnly && label}
    </Button>
  );
}
