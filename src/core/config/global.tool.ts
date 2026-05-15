import { debug } from 'console';
import { z } from 'zod';

export const GlobalToolConfigSchema = z.object({
  simpleFilter: z.boolean().default(false),
  fullResponse: z.boolean().default(false),
  debug: z.boolean().default(false),
  authServer: z.string().default('https://data.dataforseo.com')
});

export type GlobalToolConfig = z.infer<typeof GlobalToolConfigSchema>;

// Parse config from environment variables
export function parseGlobalToolConfig(): GlobalToolConfig {
  const fullResponseEnv = process.env.DATAFORSEO_FULL_RESPONSE as string;
  const debugEnv = process.env.DEBUG as string;
  const simpleFilterEnv = process.env.DATAFORSEO_SIMPLE_FILTER as string;
  const authServer = process.env.AUTH_SERVER_URL ?? 'https://data.dataforseo.com'
  const config = {
    fullResponse: fullResponseEnv === 'true',
    debug: debugEnv === 'true',
    simpleFilter: simpleFilterEnv === 'true',
    authServer: authServer
  };
  
  return GlobalToolConfigSchema.parse(config);
}

// Export default config
export const defaultGlobalToolConfig = parseGlobalToolConfig(); 