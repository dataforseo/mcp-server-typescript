import { defaultGlobalToolConfig } from '../config/global.tool.js';

export class DataForSEOClient {
  private config: DataForSEOConfig;

  constructor(config: DataForSEOConfig) {
    this.config = config;
    if (defaultGlobalToolConfig.debug) {
      console.error('DataForSEOClient initialized with config:', config);
    }
  }

  async makeRequest<T>(endpoint: string, method: string = 'POST', body?: any, forceFull: boolean = false): Promise<T> {
    let url = `${this.config.baseUrl || "https://api.dataforseo.com"}${endpoint}`;
    if (!defaultGlobalToolConfig.fullResponse && !forceFull) {
      url += '.ai';
    }
    // Import version dynamically to avoid circular dependencies
    const { version } = await import('../utils/version.js');

    const headers = {
      'Authorization': this.config.authHeader,
      'Content-Type': 'application/json',
      'User-Agent': `DataForSEO-MCP-TypeScript-SDK/${version}`
    };

    console.error(`Making request to ${url} with method ${method} and body`, body);
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export interface DataForSEOConfig {
  authHeader: string;
  baseUrl?: string;
}

export function buildBasicAuthHeader(username: string, password: string): string {
  return `Basic ${btoa(`${username}:${password}`)}`;
}
