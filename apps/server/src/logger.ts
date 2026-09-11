type Level = "INFO" | "PASS" | "WARN" | "FAIL" | "GUIDE";

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
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function format(level: Level, msg: string, ctx?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  let line = `${ts} ${TAG[level]} ${msg}`;
  if (ctx && Object.keys(ctx).length > 0) {
    const kv = Object.entries(ctx)
      .map(([k, v]) => `${k}=${stringify(v)}`)
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
