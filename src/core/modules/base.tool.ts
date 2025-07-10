import { z } from 'zod';
import { DataForSEOClient } from '../client/dataforseo.client.js';
import { defaultGlobalToolConfig } from '../config/global.tool.js';
import { filterFields, parseFieldPaths } from '../utils/field-filter.js';
import { FieldConfigurationManager } from '../config/field-configuration.js';

export interface DataForSEOFullResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: Record<string, any>;
    result: any[];
  }>;
}

export interface DataForSEOResponse {
  id: string;
  status_code: number;
  status_message: string;
  items: any[];
}

export abstract class BaseTool {
  protected dataForSEOClient: DataForSEOClient;

  constructor(dataForSEOClient: DataForSEOClient) {
    this.dataForSEOClient = dataForSEOClient;
  }

  protected supportOnlyFullResponse(): boolean {
    return false;
  }

  protected formatError(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  protected validateAndFormatResponse (response: any): { content: Array<{ type: string; text: string }> } {
    console.error(JSON.stringify(response));
    if(defaultGlobalToolConfig.fullResponse || this.supportOnlyFullResponse()){
      let data = response as DataForSEOFullResponse;
      this.validateResponseFull(data);
      let result = data.tasks[0].result;
      return this.formatResponse(result);
    }
    this.validateResponse(response);
    return this.formatResponse(response);
  }

  protected formatResponse(data: any): { content: Array<{ type: string; text: string }> } {
    const fieldConfig = FieldConfigurationManager.getInstance();
    if (fieldConfig.hasConfiguration()) {
      const toolName = this.getName();
      if (fieldConfig.isToolConfigured(toolName)) {
        const fields = fieldConfig.getFieldsForTool(toolName);
        if (fields && fields.length > 0) {
          data = filterFields(data, parseFieldPaths(fields));
        }
      }
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  protected formatErrorResponse(error: unknown): { content: Array<{ type: string; text: string }> } {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${this.formatError(error)}`,
        },
      ],
    };
  }

  protected validateResponse(response: DataForSEOResponse): void {
    if (response.status_code / 100 !== 200) {
      throw new Error(`API Error: ${response.status_message} (Code: ${response.status_code})`);
    }
  }

  protected validateResponseFull(response: DataForSEOFullResponse): void {
    if (response.status_code / 100 !== 200) {
      throw new Error(`API Error: ${response.status_message} (Code: ${response.status_code})`);
    }
    
    if (response.tasks.length === 0) {
      throw new Error('No tasks in response');
    }

    const task = response.tasks[0];
    if (task.status_code / 100 !== 200) {
      throw new Error(`Task Error: ${task.status_message} (Code: ${task.status_code})`);
    }

    if (response.tasks_error > 0) {
      throw new Error(`Tasks Error: ${response.tasks_error} tasks failed`);
    }
  }

  abstract getName(): string;
  abstract getDescription(): string;
  abstract getParams(): z.ZodRawShape;
  abstract handle(params: any): Promise<any>;

  protected filterResponseFields(response: any, fields: string[]): any {
    if (!fields || fields.length === 0) {
      return response;
    }

    const fieldPaths = parseFieldPaths(fields);
    return filterFields(response, fieldPaths);
  }

  protected formatFilters(filters: any[]): any
  {
    if(!filters)
      return null;
    if(filters.length === 0){
      return null;
    }
    return filters;
  }

  protected formatOrderBy(orderBy: any[]): any
  {
    if(!orderBy)
      return null;
    if(orderBy.length === 0){
      return null;
    }
    return orderBy;
  }
} 