import { defaultGlobalToolConfig } from '../config/global.tool.js';
import { version } from '../utils/version.js';

export class DataForSEOClient {
  private config: DataForSEOConfig;
  private authHeader: string;
  private userAgent: string;

  constructor(config: DataForSEOConfig) {
    this.config = config;
    if(defaultGlobalToolConfig.debug) {
      console.error('DataForSEOClient initialized with config:', config);
    }
    const token = btoa(`${config.username}:${config.password}`);
    this.authHeader = `Basic ${token}`;
    this.userAgent = `DataForSEO-MCP-TypeScript-SDK/${version}`;
  }

  async makeRequest<T>(endpoint: string, method: string = 'POST', body?: any, forceFull: boolean = false): Promise<T> {
    let url = `${this.config.baseUrl || "https://api.dataforseo.com"}${endpoint}`;
    if(!defaultGlobalToolConfig.fullResponse && !forceFull){
      url += '.ai';
    }

    const headers = {
      'Authorization': this.authHeader,
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent
    };

    if(defaultGlobalToolConfig.debug) {
      console.log(`Making request to ${url} with method ${method} and body`, body);
    }
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
  username: string;
  password: string;
  baseUrl?: string;
}