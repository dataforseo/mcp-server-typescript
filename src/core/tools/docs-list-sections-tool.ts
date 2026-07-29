import { z } from "zod";
import { listSections } from "../docs/section.js";
import { BaseTool } from "./base-tool.js";
import { textResult } from "./types.js";

export const docsListSectionsInputSchema = z.object({});

export type DocsListSectionsInput = z.infer<typeof docsListSectionsInputSchema>;

export class DocsListSectionsTool extends BaseTool<DocsListSectionsInput> {
  readonly name = "docs_list_sections";
  readonly title = "Docs List Sections";
  readonly description =
    "Return available DataForSEO API documentation section names";
  readonly schema = docsListSectionsInputSchema;

  protected async execute() {
    return textResult(listSections());
  }
}
