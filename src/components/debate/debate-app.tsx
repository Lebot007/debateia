"use client";

import * as React from "react";
import { Github, LayoutGrid, MessagesSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackgroundFx } from "@/components/debate/background-fx";
import { HomeView } from "@/components/debate/home-view";
import { RoomView } from "@/components/debate/room-view";
import { RosterManager } from "@/components/debate/roster-manager";
import { SettingsDialog } from "@/components/debate/settings-dialog";
import { ThemeToggle } from "@/components/debate/theme-toggle";
import {
  deleteDebate as deleteDebateFromStorage,
  loadRoster,
  loadSettings,
  loadStore,
  saveDebate as saveDebateToStorage,
  saveRoster,
  saveSettings,
  wipeDebates,
} from "@/lib/storage";
import { AiInfo } from "@/lib/ais";
import { AppSettings, AppStore, Debate } from "@/lib/types";
const REPO_URL = "https://github.com/Lebot007/debateia";

const DEFAULT_SETTINGS_APP: AppSettings = {
  includeFilesInPrompts: true,
  wipeOnClose: false,
};

function SiteHeader({
  inDebate,
  onHome,
  roster,
  onChangeRoster,
  settings,
  onChangeSettings,
  debatesCount,
  onWipeAll,
}: {
  inDebate: boolean;
  onHome: () => void;
  roster: AiInfo[];
  onChangeRoster: (next: AiInfo[]) => void;
  settings: AppSettings;
  onChangeSettings: (next: AppSettings) => void;
  debatesCount: number;
  onWipeAll: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          aria-label="Ir para a página inicial"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-md">
            <MessagesSquare className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-left leading-tight">
            <span className="block text-sm font-bold tracking-tight">DebateIA</span>
            <span className="hidden text-[11px] text-muted-foreground sm:block">
              arena de debates entre IAs
            </span>
          </span>
        </button>
        <div className="flex items-center gap-0.5 sm:gap-1">
          {inDebate && (
            <Button variant="ghost" size="sm" className="gap-2" onClick={onHome}>
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Meus debates</span>
            </Button>
          )}
          <RosterManager
            roster={roster}
            onChange={onChangeRoster}
            trigger={
              <Button variant="ghost" size="sm" className="gap-2" aria-label="Gerenciar minhas IAs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                  {roster.length}
                </span>
                <span className="hidden sm:inline">IAs</span>
              </Button>
            }
          />
          <SettingsDialog
            settings={settings}
            onChange={onChangeSettings}
            debatesCount={debatesCount}
            onWipeAll={onWipeAll}
            trigger={
              <Button variant="ghost" size="icon" aria-label="Abrir configurações">
                <Settings className="h-4 w-4" aria-hidden="true" />
              </Button>
            }
          />
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild aria-label="Ver o código no GitHub">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto border-t border-border/60 py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
        <p>DebateIA — debates entre IAs, direto no seu navegador. Nada é enviado a servidores.</p>
        <a
          className="underline-offset-2 hover:underline"
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Código aberto no GitHub
        </a>
      </div>
    </footer>
  );
}

export default function DebateApp() {
  const [store, setStore] = React.useState<AppStore | null>(null);
  const [roster, setRoster] = React.useState<AiInfo[]>([]);
  const [settings, setSettings] = React.useState<AppSettings>(DEFAULT_SETTINGS_APP);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [s, r, st] = await Promise.all([
        loadStore(),
        Promise.resolve(loadRoster()),
        Promise.resolve(loadSettings()),
      ]);
      setStore(s);
      setRoster(r);
      setSettings(st);
      setReady(true);
    })();
  }, []);

  /* -------------------- persistência -------------------- */

  const persistEnabled = !settings.wipeOnClose;

  const active = React.useMemo(
    () => (store ? (store.debates.find((d) => d.id === store.activeId) ?? null) : null),
    [store],
  );

  const mutate = React.useCallback((fn: (s: AppStore) => AppStore) => {
    setStore((prev) => {
      if (!prev) return prev;
      return fn(prev);
    });
  }, []);

  const patchActive = React.useCallback(
    (fn: (d: Debate) => Debate) => {
      mutate((s) => ({
        ...s,
        debates: s.debates.map((d) =>
          d.id === s.activeId ? { ...fn(d), updatedAt: Date.now() } : d,
        ),
      }));
    },
    [mutate],
  );

  const openDebate = React.useCallback(
    (id: string) => mutate((s) => ({ ...s, activeId: id })),
    [mutate],
  );

  const goHome = React.useCallback(
    () => mutate((s) => ({ ...s, activeId: null })),
    [mutate],
  );

  const deleteDebate = React.useCallback(
    (id: string) => {
      mutate((s) => {
        const debates = s.debates.filter((d) => d.id !== id);
        return { ...s, debates, activeId: s.activeId === id ? null : s.activeId };
      });
      void deleteDebateFromStorage(id);
    },
    [mutate],
  );

  const createDebate = React.useCallback(
    (d: Debate) => mutate((s) => ({ ...s, debates: [d, ...s.debates], activeId: d.id })),
    [mutate],
  );

  // Autosave do debate ativo (debounced) — desativado no modo sessão
  React.useEffect(() => {
    if (!persistEnabled || !active) return;
    const t = window.setTimeout(() => {
      void saveDebateToStorage(active, true);
    }, 600);
    return () => window.clearTimeout(t);
  }, [active, persistEnabled]);

  const changeRoster = React.useCallback((next: AiInfo[]) => {
    setRoster(next);
    saveRoster(next);
  }, []);

  const changeSettings = React.useCallback((next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
    if (next.wipeOnClose) {
      void wipeDebates();
      setStore((prev) => (prev ? { ...prev, debates: [] } : prev));
    }
  }, []);

  const wipeAll = React.useCallback(() => {
    void wipeDebates();
    mutate((s) => ({ ...s, debates: [], activeId: null }));
  }, [mutate]);

  if (!ready || !store) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <span className="sr-only">Carregando DebateIA...</span>
        <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white">
          <MessagesSquare className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    );
  }

  return (
    <RoomErrorBoundary>
      <div className="relative flex min-h-screen flex-col overflow-x-clip">
        <BackgroundFx />
        <SiteHeader
          inDebate={Boolean(active)}
          onHome={goHome}
          roster={roster}
          onChangeRoster={changeRoster}
          settings={settings}
          onChangeSettings={changeSettings}
          debatesCount={store.debates.length}
          onWipeAll={wipeAll}
        />
        <main className="relative z-10 flex-1 px-4 sm:px-6">
          <div className="mx-auto w-full max-w-6xl">
            {active ? (
              <RoomView
                debate={active}
                roster={roster}
                settings={settings}
                onChange={patchActive}
                onExit={goHome}
                onNewDebate={goHome}
              />
            ) : (
              <HomeView
                debates={store.debates}
                roster={roster}
                onCreate={createDebate}
                onOpen={openDebate}
                onDelete={deleteDebate}
                onChangeRoster={changeRoster}
              />
            )}
          </div>
        </main>
        <SiteFooter />
      </div>
    </RoomErrorBoundary>
  );
}

class RoomErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("DEBATEIA_BOUNDARY", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-3xl p-8">
          <h1 className="text-lg font-bold">Ops! Algo deu errado neste debate.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seus debates continuam salvos no navegador. Tente recarregar a página.
          </p>
          <pre className="mt-3 whitespace-pre-wrap rounded-lg border bg-muted p-4 text-xs">
            {String(this.state.error?.stack || this.state.error)}
          </pre>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Recarregar página
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
