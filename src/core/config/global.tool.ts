import { debug } from 'console';
import { z } from 'zod';

export const GlobalToolConfigSchema = z.object({
  fullResponse: z.boolean().default(false),
  debug: z.boolean().default(false)
});

export type GlobalToolConfig = z.infer<typeof GlobalToolConfigSchema>;

// Parse config from environment variables
export function parseGlobalToolConfig(): GlobalToolConfig {
  const fullResponseEnv = process.env.DATAFORSEO_FULL_RESPONSE as string;
  const debugEnv = process.env.DEBUG as string;
  
  const config = {
    fullResponse: fullResponseEnv === 'true',
    debug: debugEnv === 'true'
  };
  
  return GlobalToolConfigSchema.parse(config);
}

// Export default config
export const defaultGlobalToolConfig = parseGlobalToolConfig(); 