import * as fs from 'fs';

export interface FieldConfiguration {
  supported_fields: Record<string, string[]>;
}

export class FieldConfigurationManager {
  private static instance: FieldConfigurationManager;
  private config: FieldConfiguration | null = null;

  private constructor() {}

  public static getInstance(): FieldConfigurationManager {
    if (!FieldConfigurationManager.instance) {
      FieldConfigurationManager.instance = new FieldConfigurationManager();
    }
    return FieldConfigurationManager.instance;
  }

  public loadFromFile(configPath: string): void {
    try {
      if (!fs.existsSync(configPath)) {
        console.warn(`Configuration file not found: ${configPath}`);
        return;
      }
      console.error(`Loading field configuration from: ${configPath}`);
      const configContent = fs.readFileSync(configPath, 'utf8');
      const parsedConfig = JSON.parse(configContent);

      // Validate the configuration structure
      if (!parsedConfig.supported_fields || typeof parsedConfig.supported_fields !== 'object') {
        throw new Error('Invalid configuration format. Expected { "supported_fields": { "tool_name": ["field1", "field2"] } }');
      }

      this.config = parsedConfig;
      console.log(`Field configuration loaded from: ${configPath}`);
    } catch (error) {
      console.error('Error loading field configuration:', error);
      throw error;
    }
  }

  public getFieldsForTool(toolName: string): string[] | null {
    if (!this.config) {
      return null; // No configuration loaded, return all fields
    }

    return this.config.supported_fields[toolName] || null;
  }

  public hasConfiguration(): boolean {
    return this.config !== null;
  }

  public isToolConfigured(toolName: string): boolean {
    return this.config !== null && toolName in this.config.supported_fields;
  }

  public getConfiguration(): FieldConfiguration | null {
    return this.config;
  }

  public clearConfiguration(): void {
    this.config = null;
  }
}

// Helper functions for easy access
export function getFieldsForTool(toolName: string): string[] | null {
  return FieldConfigurationManager.getInstance().getFieldsForTool(toolName);
}

export function isToolConfigured(toolName: string): boolean {
  return FieldConfigurationManager.getInstance().isToolConfigured(toolName);
}

export function hasFieldConfiguration(): boolean {
  return FieldConfigurationManager.getInstance().hasConfiguration();
}

export function loadFieldConfiguration(configPath: string): void {
  FieldConfigurationManager.getInstance().loadFromFile(configPath);
}

export function initializeFieldConfiguration(): void {
  const configPath = process.env.FIELD_CONFIG_PATH;
  
  if (configPath) {
    try {
      loadFieldConfiguration(configPath);
    } catch (error) {
      console.error('Failed to load field configuration:', error);
    }
  }
}