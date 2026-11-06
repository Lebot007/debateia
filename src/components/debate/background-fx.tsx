export function BackgroundFx() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="blob animate-drift left-[-12%] top-[-12%] h-[420px] w-[420px] bg-violet-600/20 dark:bg-violet-600/30" />
      <div className="blob animate-drift-slow right-[-15%] top-[18%] h-[520px] w-[520px] bg-cyan-500/15 dark:bg-cyan-500/20" />
      <div
        className="blob animate-drift bottom-[-22%] left-[28%] h-[480px] w-[480px] bg-fuchsia-600/15 dark:bg-fuchsia-600/20"
        style={{ animationDelay: "4s" }}
      />
    </div>
  );
}
