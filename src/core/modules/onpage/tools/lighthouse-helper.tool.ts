import { z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { baseProperties, properties } from '../../lighthouse-properties.js';

export class LighthouseHelperTool extends BaseTool {

    constructor(private client: DataForSEOClient) {
        super(client);
    }

    getName(): string {
        return 'on_page_lighthouse_helper';
    }

    getDescription(): string {
        return 'This helper tool provides a list of available Lighthouse result properties that can be requested from the on_page_lighthouse tool';
    }

    getParams(): z.ZodRawShape {
        return {
            base_property_name: z.enum(baseProperties).optional().describe("Base property name to return. For example, audits, configSettings, categories, categoryGroups, timing, i18n, or stackPacks"),
            property_name: z.string().optional().describe("Specific property name within the base property to return"),
        };
    }

    async handle(params: any): Promise<any> {
        try {

            if (!params.base_property_name && !params.property_name) {
                return this.formatResponse([]);
            }

            let responce = properties.filter(x => 
                (!params.base_property_name || x.startsWith(params.base_property_name + ".")) 
                && (!params.property_name || x.includes(params.property_name.toLowerCase())));

            return this.formatResponse(responce);
        } catch (error) {
            return this.formatErrorResponse(error);
        }
    }
}
