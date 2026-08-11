export function getEnv(name: string): string | undefined {
  const workerEnv = (globalThis as { workerEnv?: Record<string, unknown> })
    .workerEnv;
  if (workerEnv) {
    const workerValue = workerEnv[name];
    if (workerValue !== undefined && workerValue !== null && workerValue !== "") {
      return String(workerValue);
    }
  }

  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }

  const value = process.env[name];
  if (value === undefined || value === "") {
    return undefined;
  }
  return value;
}

export function requireEnv(name: string): string {
  const value = getEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
