"use client";

import * as React from "react";
import { Settings, ShieldAlert, Trash2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AppSettings } from "@/lib/types";

interface SettingsDialogProps {
  settings: AppSettings;
  onChange: (next: AppSettings) => void;
  debatesCount: number;
  onWipeAll: () => void;
  trigger?: React.ReactNode;
}

export function SettingsDialog({
  settings,
  onChange,
  debatesCount,
  onWipeAll,
  trigger,
}: SettingsDialogProps) {
  const [confirmWipe, setConfirmWipe] = React.useState(false);
  const [confirmWipeAll, setConfirmWipeAll] = React.useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" aria-label="Abrir configurações">
            <Settings className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            Automação, privacidade e controle dos dados salvos neste navegador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3 rounded-xl border bg-card p-3">
            <div className="space-y-0.5">
              <Label htmlFor="set-detect" className="text-sm font-medium">
                Colagem inteligente
              </Label>
              <p className="text-xs text-muted-foreground">
                Ao voltar para esta aba com uma resposta copiada, o DebateIA identifica a IA de
                origem e oferece colar no slot certo, com um clique.
              </p>
            </div>
            <Switch
              id="set-detect"
              checked={settings.autoDetectPaste}
              onCheckedChange={(v) => onChange({ ...settings, autoDetectPaste: v })}
            />
          </div>

          <div className="flex items-start justify-between gap-3 rounded-xl border bg-card p-3">
            <div className="space-y-0.5">
              <Label htmlFor="set-files" className="text-sm font-medium">
                Anexos nos prompts
              </Label>
              <p className="text-xs text-muted-foreground">
                O conteúdo dos arquivos TXT/MD anexados ao tema entra nos prompts gerados para
                todas as IAs (imagens são citadas por nome).
              </p>
            </div>
            <Switch
              id="set-files"
              checked={settings.includeFilesInPrompts}
              onCheckedChange={(v) => onChange({ ...settings, includeFilesInPrompts: v })}
            />
          </div>

          <div className="flex items-start justify-between gap-3 rounded-xl border bg-card p-3">
            <div className="space-y-0.5">
              <Label htmlFor="set-session" className="text-sm font-medium">
                Modo sessão
              </Label>
              <p className="text-xs text-muted-foreground">
                Nada é salvo no navegador. Ao fechar a aba, tudo some — como uma sessão
                temporária.
              </p>
            </div>
            <Switch
              id="set-session"
              checked={settings.wipeOnClose}
              onCheckedChange={(v) => setConfirmWipe(v)}
            />
          </div>

          <div className="rounded-xl border border-destructive/40 bg-destructive/[0.04] p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden="true" />
              Privacidade total
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {debatesCount > 0
                ? `${debatesCount} ${debatesCount === 1 ? "debate está" : "debates estão"} salvos neste navegador.`
                : "Nenhum debate salvo neste navegador."}
            </p>
            <AlertDialog open={confirmWipeAll} onOpenChange={setConfirmWipeAll}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                  disabled={debatesCount === 0}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Apagar todos os debates salvos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apagar tudo deste navegador?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Todos os debates, respostas e anexos serão removidos permanentemente do
                    armazenamento local. Essa ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => {
                      onWipeAll();
                      toast.success("Todos os dados locais foram apagados.");
                    }}
                  >
                    Apagar tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>

      {/* Confirmação ao ativar o modo sessão */}
      <AlertDialog open={confirmWipe} onOpenChange={setConfirmWipe}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ativar modo sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Tudo que está salvo agora será apagado imediatamente, e novos debates não serão
              gravados no navegador. Ao fechar a aba, tudo desaparece.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => onChange({ ...settings, wipeOnClose: false })}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                onChange({ ...settings, wipeOnClose: true });
                toast.success("Modo sessão ativado — nada será salvo neste navegador.");
              }}
            >
              Ativar e apagar agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
