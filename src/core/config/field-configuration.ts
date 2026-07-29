import { getEnv } from "../env.js";
import { filterFields, parseFieldPaths } from "../utils/field-filter.js";

export interface FieldConfiguration {
  supported_fields: Record<string, string[]>;
}

/**
 * Normalize an API path or URL for field-config lookup:
 * strip host/query, trailing slash, and optional `.ai` suffix.
 */
export function normalizeEndpointPath(pathOrUrl: string): string {
  let pathname = pathOrUrl.trim();

  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    pathname = new URL(pathname).pathname;
  }

  const queryIndex = pathname.indexOf("?");
  if (queryIndex !== -1) {
    pathname = pathname.slice(0, queryIndex);
  }

  pathname = pathname.replace(/\/+$/, "");
  if (pathname.endsWith(".ai")) {
    pathname = pathname.slice(0, -3);
  }

  if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }

  return pathname.toLowerCase();
}

export class FieldConfigurationManager {
  private static instance: FieldConfigurationManager;
  private config: FieldConfiguration | null = null;
  private normalizedIndex: Map<string, string[]> | null = null;

  private constructor() {}

  static getInstance(): FieldConfigurationManager {
    if (!FieldConfigurationManager.instance) {
      FieldConfigurationManager.instance = new FieldConfigurationManager();
    }
    return FieldConfigurationManager.instance;
  }

  loadFromObject(parsedConfig: unknown): void {
    if (
      !parsedConfig ||
      typeof parsedConfig !== "object" ||
      !("supported_fields" in parsedConfig) ||
      typeof (parsedConfig as FieldConfiguration).supported_fields !== "object" ||
      (parsedConfig as FieldConfiguration).supported_fields === null
    ) {
      throw new Error(
        'Invalid configuration format. Expected { "supported_fields": { "/v3/.../path": ["field1", "field2"] } }'
      );
    }

    this.config = parsedConfig as FieldConfiguration;
    this.normalizedIndex = new Map();

    for (const [key, fields] of Object.entries(this.config.supported_fields)) {
      if (!Array.isArray(fields)) {
        throw new Error(
          `Invalid field list for "${key}". Expected an array of field paths.`
        );
      }
      this.normalizedIndex.set(normalizeEndpointPath(key), fields);
    }
  }

  async loadFromFile(configPath: string): Promise<void> {
    const { readFile, access } = await import("node:fs/promises");
    const { constants } = await import("node:fs");

    try {
      await access(configPath, constants.R_OK);
    } catch {
      console.warn(`Configuration file not found: ${configPath}`);
      return;
    }

    console.error(`Loading field configuration from: ${configPath}`);
    const configContent = await readFile(configPath, "utf8");
    this.loadFromObject(JSON.parse(configContent));
    console.error(`Field configuration loaded from: ${configPath}`);
  }

  getFieldsForPath(pathOrUrl: string): string[] | null {
    if (!this.normalizedIndex) {
      return null;
    }
    return this.normalizedIndex.get(normalizeEndpointPath(pathOrUrl)) ?? null;
  }

  hasConfiguration(): boolean {
    return this.config !== null;
  }

  isPathConfigured(pathOrUrl: string): boolean {
    return this.getFieldsForPath(pathOrUrl) !== null;
  }

  getConfiguration(): FieldConfiguration | null {
    return this.config;
  }

  clearConfiguration(): void {
    this.config = null;
    this.normalizedIndex = null;
  }
}

export function getFieldsForPath(pathOrUrl: string): string[] | null {
  return FieldConfigurationManager.getInstance().getFieldsForPath(pathOrUrl);
}

export function hasFieldConfiguration(): boolean {
  return FieldConfigurationManager.getInstance().hasConfiguration();
}

export function loadFieldConfigurationFromObject(config: unknown): void {
  FieldConfigurationManager.getInstance().loadFromObject(config);
}

export async function loadFieldConfiguration(configPath: string): Promise<void> {
  await FieldConfigurationManager.getInstance().loadFromFile(configPath);
}

/**
 * Apply field filtering to an API response for the given request path.
 * Fields are applied to each object in `tasks[].result[]` when present;
 * otherwise to the top-level object / array items.
 */
export function applyFieldConfigurationToResponse(
  data: unknown,
  pathOrUrl: string
): unknown {
  const manager = FieldConfigurationManager.getInstance();
  if (!manager.hasConfiguration()) {
    return data;
  }

  const fields = manager.getFieldsForPath(pathOrUrl);
  if (!fields || fields.length === 0) {
    return data;
  }

  const fieldPaths = parseFieldPaths(fields);
  return filterResponseByFields(data, fieldPaths);
}

function filterResponseByFields(
  data: unknown,
  fieldPaths: ReturnType<typeof parseFieldPaths>
): unknown {
  if (Array.isArray(data)) {
    return data.map((item) =>
      item && typeof item === "object" ? filterFields(item, fieldPaths) : item
    );
  }

  if (data && typeof data === "object" && "tasks" in data) {
    const response = data as {
      tasks?: Array<Record<string, unknown> & { result?: unknown }>;
    };
    if (!Array.isArray(response.tasks)) {
      return filterFields(data, fieldPaths);
    }

    return {
      ...response,
      tasks: response.tasks.map((task) => {
        if (!task || typeof task !== "object") {
          return task;
        }
        if (!("result" in task)) {
          return task;
        }
        const result = task.result;
        if (Array.isArray(result)) {
          return {
            ...task,
            result: result.map((item) =>
              item && typeof item === "object"
                ? filterFields(item, fieldPaths)
                : item
            ),
          };
        }
        if (result && typeof result === "object") {
          return {
            ...task,
            result: filterFields(result, fieldPaths),
          };
        }
        return task;
      }),
    };
  }

  if (data && typeof data === "object") {
    return filterFields(data, fieldPaths);
  }

  return data;
}

export async function initializeFieldConfiguration(): Promise<void> {
  const jsonConfig = getEnv("FIELD_CONFIG_JSON");
  if (jsonConfig) {
    try {
      loadFieldConfigurationFromObject(JSON.parse(jsonConfig));
      console.error("Field configuration loaded from FIELD_CONFIG_JSON");
    } catch (error) {
      console.error("Failed to load FIELD_CONFIG_JSON:", error);
    }
    return;
  }

  const configPath = getEnv("FIELD_CONFIG_PATH");
  if (!configPath) {
    return;
  }

  try {
    await loadFieldConfiguration(configPath);
  } catch (error) {
    console.error("Failed to load field configuration:", error);
  }
}
