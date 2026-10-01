/** Display-only redaction. Never use masked values for saving, searching or sending money. */
export function maskName(value: string | null | undefined): string {
  if (!value) return "—";
  return value.trim().split(/\s+/).map((part) => part.length <= 1 ? "*" : `${part[0]}${"*".repeat(Math.min(part.length - 1, 8))}`).join(" ");
}

export function maskEmail(value: string | null | undefined): string {
  if (!value) return "—";
  const at = value.indexOf("@");
  if (at < 1) return maskText(value);
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  return `${local[0]}${"*".repeat(Math.max(3, Math.min(local.length - 1, 8)))}@${dot > 0 ? `${domain[0]}***${domain.slice(dot)}` : "***"}`;
}

export function maskIdentifier(value: string | null | undefined, visible = 4): string {
  if (!value) return "—";
  const text = String(value);
  const keep = Math.min(visible, Math.max(0, text.length - 1));
  return `${"*".repeat(Math.max(4, Math.min(text.length - keep, 12)))}${text.slice(-keep)}`;
}

export function maskPhone(value: string | null | undefined): string {
  if (!value) return "—";
  const text = String(value);
  const digits = text.replace(/\D/g, "");
  const prefix = text.startsWith("+") ? `+${digits.slice(0, Math.min(2, Math.max(1, digits.length - 4)))}` : "";
  return `${prefix}${"*".repeat(Math.max(4, Math.min(digits.length - 4, 10)))}${digits.slice(-4)}`;
}

export function maskText(value: string | null | undefined): string {
  if (!value) return "—";
  return String(value).replace(/[\p{L}\p{N}]/gu, "*");
}

/** Redact contact data embedded in free-text transaction descriptions and notices. */
export function maskPersonalText(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, (match) => maskEmail(match))
    .replace(/\+?\d[\d\s().-]{7,}\d/g, (match) => maskPhone(match))
    .replace(/\b(?:from|to|for|by)\s+([\p{L}][\p{L}'-]+(?:\s+[\p{L}][\p{L}'-]+){1,3})/giu,
      (_match, name: string) => `${_match.slice(0, _match.indexOf(name))}${maskName(name)}`);
}