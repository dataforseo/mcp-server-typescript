import { DataForSEOClient, DataForSEOConfig } from "../core/client/dataforseo.client.js";
import { EnabledModulesSchema } from "../core/config/modules.config.js";
import { BaseModule } from "../core/modules/base.module.js";
import { ModuleLoaderService } from "../core/utils/module-loader.js";

export function ValidateToolNames(): void {
  const enabledModules = EnabledModulesSchema.parse(process.env.ENABLED_MODULES);
  const dataForSEOConfig: DataForSEOConfig = {
    username: process.env.DATAFORSEO_USERNAME || "",
    password: process.env.DATAFORSEO_PASSWORD || "",
  };
  const dataForSEOClient = new DataForSEOClient(dataForSEOConfig);
  const modules: BaseModule[] = ModuleLoaderService.loadModules(dataForSEOClient, enabledModules);
  const toolNames = new Set<string>();

  var tooLongToolNames: string[] = [];
  modules.forEach(module => {
    const tools = module.getTools();
    Object.keys(tools).forEach(toolName => {
      if (toolNames.has(toolName)) {
        throw new Error(`Duplicate tool name detected: ${toolName}`);
      }

      if (toolName.length === 0) {
        throw new Error(`Tool name cannot be empty`);
      }

      if (toolName.length > 50)
        tooLongToolNames.push(toolName);
    });
  });

  if (tooLongToolNames.length > 0) {
    throw new Error(`The following tool names exceed the maximum length of 50 characters: ${tooLongToolNames.join(', ')}`);
  }
}

ValidateToolNames();