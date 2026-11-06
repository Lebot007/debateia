/** Copia texto para a área de transferência com fallback para contextos não seguros (http). */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // cai para o fallback abaixo
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** A leitura da área de transferência exige contexto seguro + suporte do navegador. */
export function clipboardReadAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.clipboard &&
    typeof navigator.clipboard.readText === "function" &&
    typeof window !== "undefined" &&
    window.isSecureContext
  );
}

/**
 * Tenta ler texto da área de transferência.
 * `denied` = true quando o navegador bloqueou (permissão negada/expirada).
 */
export async function tryReadClipboard(): Promise<{ text: string | null; denied: boolean }> {
  if (!clipboardReadAvailable()) return { text: null, denied: false };
  try {
    const text = await navigator.clipboard.readText();
    return { text, denied: false };
  } catch (err) {
    const name = (err as DOMException | undefined)?.name;
    return { text: null, denied: name === "NotAllowedError" || name === "SecurityError" };
  }
}
