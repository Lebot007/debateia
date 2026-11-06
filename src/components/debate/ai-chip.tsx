import { AiInfo } from "@/lib/ais";
import { cn } from "@/lib/utils";

interface AiChipProps {
  ai: AiInfo;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Chip com as cores da marca da IA. */
export function AiChip({ ai, size = "md", className }: AiChipProps) {
  const dims =
    size === "sm"
      ? "h-7 w-7 rounded-md text-[9px]"
      : size === "lg"
        ? "h-12 w-12 rounded-xl text-sm"
        : "h-9 w-9 rounded-lg text-[11px]";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center font-bold tracking-tight shadow-sm",
        dims,
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${ai.colors[0]}, ${ai.colors[1]})`,
        color: ai.fg,
      }}
    >
      {ai.glyph}
    </span>
  );
}
