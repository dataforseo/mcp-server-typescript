import { z } from 'zod';

// Define available module names
export const AVAILABLE_MODULES = ['SERP', 'KEYWORDS_DATA', 'ONPAGE', 'DATAFORSEO_LABS', 'BACKLINKS', 'BUSINESS_DATA', 'DOMAIN_ANALYTICS', 'CONTENT_ANALYSIS'] as const;
export type ModuleName = typeof AVAILABLE_MODULES[number];

// Schema for validating the ENABLED_MODULES environment variable
export const EnabledModulesSchema = z.any()
  .transform((val:string) => {
    if (!val) return AVAILABLE_MODULES; // If not set, enable all modules
    return val.toString().split(',').map(name => name.trim().toUpperCase() as ModuleName);
  })
  .refine((modules) => {
    return modules.every(module => AVAILABLE_MODULES.includes(module));
  }, {
    message: `Invalid module name. Available modules are: ${AVAILABLE_MODULES.join(', ')}`
  });

export type EnabledModules = z.infer<typeof EnabledModulesSchema>;

// Helper function to check if a module is enabled
export function isModuleEnabled(moduleName: ModuleName, enabledModules: EnabledModules): boolean {
  return enabledModules.includes(moduleName);
}

// Default configuration (all modules enabled)
export const defaultEnabledModules: EnabledModules = AVAILABLE_MODULES; 