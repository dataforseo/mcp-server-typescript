import type { FieldConfiguration } from "./field-configuration.js";

/**
 * Built-in field filters applied when no custom config is provided,
 * and merged in for any paths missing from a custom config.
 */
export const defaultFieldConfiguration: FieldConfiguration = {
  supported_fields: {
    "/v3/on_page/lighthouse/live/json": [
      "id",
      "status_code",
      "status_message",
      "items.lighthouseVersion",
      "items.requestedUrl",
      "items.mainDocumentUrl",
      "items.finalDisplayedUrl",
      "items.finalUrl",
      "items.gatherMode",
      "items.userAgent",
      "items.audits.*.numericValue",
      "items.configSettings",
      "items.categories.*.title",
      "items.categories.*.description",
      "items.categories.*.id",
      "items.categories.*.score",
      "items.category_groups",
      "items.stackPacks.id",
      "items.stackPacks.title",
      "items.stackPacks.descriptions",
      "items.entities.name",
      "items.entities.category",
      "items.timing.total",
    ],
  },
};
