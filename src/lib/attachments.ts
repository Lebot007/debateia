import { Attachment } from "@/lib/types";
import { uid } from "@/lib/storage";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_TEXT_BYTES = 300 * 1024; // 300 KB
export const MAX_FILES_PER_DEBATE = 8;

/** Aceita imagens comuns (SVG excluído por segurança) e arquivos .txt / .md. */
export function isSupportedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (file.type.startsWith("image/") && file.type !== "image/svg+xml") return true;
  if (file.type.startsWith("text/")) return true;
  return name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".markdown");
}

export async function fileToAttachment(
  file: File,
): Promise<{ att?: Attachment; error?: string }> {
  if (!isSupportedFile(file)) {
    return {
      error: `Formato não suportado: ${file.name}. Use imagens (JPG/PNG/WebP), .txt ou .md.`,
    };
  }

  if (file.type.startsWith("image/")) {
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: `Imagem muito grande (máx. 5 MB): ${file.name}` };
    }
    return {
      att: {
        id: uid(),
        kind: "image",
        name: file.name || "imagem",
        mime: file.type,
        size: file.size,
        blob: file,
      },
    };
  }

  if (file.size > MAX_TEXT_BYTES) {
    return { error: `Arquivo de texto muito grande (máx. 300 KB): ${file.name}` };
  }
  let content = await file.text();
  if (content.length > 200_000) {
    content = `${content.slice(0, 200_000)}\n\n[… conteúdo truncado por limite de tamanho]`;
  }
  return {
    att: {
      id: uid(),
      kind: "text",
      name: file.name,
      mime: file.type || "text/plain",
      size: file.size,
      content,
    },
  };
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
