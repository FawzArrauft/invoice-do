import type { ZodError } from "zod";

/**
 * Convert a ZodError into one readable string.
 * Used by API routes so the client NEVER receives a nested object as `error`.
 */
export function formatZodError(error: ZodError, fallback = "Data tidak valid"): string {
  const issues = error.issues ?? [];
  if (issues.length === 0) return fallback;
  return issues
    .slice(0, 5)
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "form";
      return `${path}: ${issue.message}`;
    })
    .join(" • ");
}

/**
 * Safely turn any API error payload into a single human-readable string.
 * Handles: string · Error · { error: string } · { error: ZodError }
 * · { error: { formErrors, fieldErrors } } (zod flatten)
 * · { error: [{ message }] } · { message: string }
 *
 * Never returns an object — safe to pass straight to showToast()/JSX.
 */
export function toErrorMessage(payload: unknown, fallback = "Terjadi kesalahan"): string {
  if (payload == null) return fallback;

  if (typeof payload === "string") return payload.trim() || fallback;
  if (typeof payload === "number" || typeof payload === "boolean") return String(payload);
  if (payload instanceof Error) return payload.message || fallback;

  if (typeof payload === "object") {
    const obj = payload as Record<string, unknown>;

    if ("error" in obj) {
      if (obj.error !== payload) {
        const inner = toErrorMessage(obj.error, "");
        if (inner) return inner;
      }
    }
    if (typeof obj.message === "string" && obj.message.trim()) return obj.message;

    // zod .flatten() shape
    const fieldErrors = obj.fieldErrors;
    const formErrors = obj.formErrors;
    if (fieldErrors || formErrors) {
      const parts: string[] = [];
      if (Array.isArray(formErrors)) {
        for (const f of formErrors) {
          if (typeof f === "string" && f.trim()) parts.push(f);
        }
      }
      if (fieldErrors && typeof fieldErrors === "object") {
        for (const [field, msgs] of Object.entries(fieldErrors as Record<string, unknown>)) {
          const list = Array.isArray(msgs) ? msgs : [msgs];
          for (const m of list) {
            if (typeof m === "string" && m.trim()) parts.push(`${field}: ${m}`);
          }
        }
      }
      if (parts.length > 0) return parts.slice(0, 5).join(" • ");
    }

    // zod raw issues shape
    if (Array.isArray(obj.issues)) {
      const parts = obj.issues
        .map((issue) => {
          if (issue && typeof issue === "object") {
            const i = issue as Record<string, unknown>;
            const msg = typeof i.message === "string" ? i.message : "";
            const path = Array.isArray(i.path) ? i.path.join(".") : "";
            if (!msg) return "";
            return path ? `${path}: ${msg}` : msg;
          }
          return typeof issue === "string" ? issue : "";
        })
        .filter(Boolean);
      if (parts.length > 0) return parts.slice(0, 5).join(" • ");
    }
  }

  return fallback;
}
