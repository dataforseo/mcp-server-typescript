import { getEnv } from "../env.js";

export interface Credentials {
  login: string;
  password: string;
}

export function getLoginFromEnv(): string | undefined {
  return getEnv("DATAFORSEO_LOGIN") ?? getEnv("DATAFORSEO_USERNAME");
}

export function getPasswordFromEnv(): string | undefined {
  return getEnv("DATAFORSEO_PASSWORD");
}

export function hasEnvCredentials(): boolean {
  return Boolean(getLoginFromEnv() && getPasswordFromEnv());
}

export function tryGetEnvAuthHeader(): string | undefined {
  const login = getLoginFromEnv();
  const password = getPasswordFromEnv();
  if (!login || !password) {
    return undefined;
  }
  return buildAuthHeader({ login, password });
}

export function getCredentials(): Credentials {
  const login = getLoginFromEnv();
  const password = getPasswordFromEnv();

  if (!login || !password) {
    throw new Error(
      "Missing API credentials. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD " +
        "(or DATAFORSEO_USERNAME) as environment variables.\n" +
        "Get credentials at https://app.dataforseo.com/api-access"
    );
  }

  return { login, password };
}

function encodeBase64(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value).toString("base64");
  }
  return btoa(value);
}

export function buildAuthHeader(credentials: Credentials): string {
  return `Basic ${encodeBase64(`${credentials.login}:${credentials.password}`)}`;
}
