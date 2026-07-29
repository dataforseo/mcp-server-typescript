export function parseParamEntry(entry: string): [string, unknown] {
  const eqIndex = entry.indexOf("=");
  if (eqIndex === -1) {
    throw new Error(
      `Invalid --param format: "${entry}". Use key=value (e.g. --param keyword=dataforseo).`
    );
  }

  const key = entry.slice(0, eqIndex);
  if (!key) {
    throw new Error(
      `Invalid --param format: "${entry}". Key cannot be empty.`
    );
  }

  return [key, parseParamValue(entry.slice(eqIndex + 1))];
}

export function parseParamValue(raw: string): unknown {
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  if (/^-?\d+$/.test(raw) || /^-?\d+\.\d+$/.test(raw)) {
    return Number(raw);
  }
  if (raw.startsWith("{") || raw.startsWith("[")) {
    try {
      return JSON.parse(raw);
    } catch {
      const bracketMatch = raw.match(/^\[(.*)\]$/s);
      if (bracketMatch) {
        const inner = bracketMatch[1].trim();
        if (inner === "") {
          return [];
        }
        if (inner.includes("|")) {
          return inner.split("|").map((part) => part.trim()).filter(Boolean);
        }
        return [inner];
      }
    }
  }
  return raw;
}

function parseRequestDataValue(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return [{}];
    }

    const first = parsed[0];
    if (typeof first !== "object" || first === null || Array.isArray(first)) {
      throw new Error(
        "Request body array must contain objects. See SKILL.md in the project root."
      );
    }

    return [{ ...(first as Record<string, unknown>) }, ...parsed.slice(1)];
  }

  if (typeof parsed === "object" && parsed !== null) {
    return [parsed as Record<string, unknown>];
  }

  throw new Error(
    "Request body must be a JSON object or array of objects. See SKILL.md in the project root."
  );
}

function parseRequestData(data: string): Record<string, unknown>[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Invalid JSON in request body: ${detail}. See SKILL.md in the project root.`
    );
  }

  return parseRequestDataValue(parsed);
}

export function buildRequestBody(
  data: unknown | undefined,
  params: Record<string, unknown>
): string | undefined {
  const hasParams = Object.keys(params).length > 0;

  if (data === undefined && !hasParams) {
    return undefined;
  }

  const tasks =
    data === undefined
      ? [{}]
      : typeof data === "string"
        ? parseRequestData(data)
        : parseRequestDataValue(data);

  for (const [key, value] of Object.entries(params)) {
    tasks[0][key] = value;
  }

  return JSON.stringify(tasks);
}

export function collectParam(
  value: string,
  previous: Record<string, unknown>
): Record<string, unknown> {
  const [key, parsedValue] = parseParamEntry(value);

  if (key in previous) {
    const existing = previous[key];
    if (Array.isArray(existing)) {
      existing.push(parsedValue);
    } else {
      previous[key] = [existing, parsedValue];
    }
  } else {
    previous[key] = parsedValue;
  }

  return previous;
}
