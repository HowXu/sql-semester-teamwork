type Level = "INFO" | "PASS" | "WARN" | "FAIL" | "GUIDE";

function sanitize(value: string): string {
  return Array.from(value, (char) => {
    const code = char.charCodeAt(0);
    return code <= 0x1f || (code >= 0x7f && code <= 0x9f)
      ? `\\x${code.toString(16).padStart(2, "0")}`
      : char;
  }).join("");
}

const TAG: Record<Level, string> = {
  INFO: "[INFO]",
  PASS: "[PASS]",
  WARN: "[WARN]",
  FAIL: "[FAIL]",
  GUIDE: "[GUIDE]",
};

function stringify(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") return sanitize(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Error) return sanitize(`${v.name}: ${v.message}`);
  try {
    return JSON.stringify(v);
  } catch {
    return sanitize(String(v));
  }
}

function format(level: Level, msg: string, ctx?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  let line = `${ts} ${TAG[level]} ${sanitize(msg)}`;
  if (ctx && Object.keys(ctx).length > 0) {
    const kv = Object.entries(ctx)
       .map(([k, v]) => `${sanitize(k)}=${stringify(v)}`)
      .join(" ");
    line += ` | ${kv}`;
  }
  return line;
}

export const log = {
  info: (msg: string, ctx?: Record<string, unknown>): void => {
    console.log(format("INFO", msg, ctx));
  },
  pass: (msg: string, ctx?: Record<string, unknown>): void => {
    console.log(format("PASS", msg, ctx));
  },
  warn: (msg: string, ctx?: Record<string, unknown>): void => {
    console.warn(format("WARN", msg, ctx));
  },
  fail: (msg: string, ctx?: Record<string, unknown>): void => {
    console.error(format("FAIL", msg, ctx));
  },
  guide: (msg: string, ctx?: Record<string, unknown>): void => {
    console.log(format("GUIDE", msg, ctx));
  },
};
