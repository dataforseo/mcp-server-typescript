export interface ToolTextContent {
  type: "text";
  text: string;
}

export interface ToolResult {
  content: ToolTextContent[];
  isError?: boolean;
}

export function textResult(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

export function errorResult(message: string): ToolResult {
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}

export function bodyResult(body: unknown, isError = false): ToolResult {
  const text =
    typeof body === "string" ? body : JSON.stringify(body, null, 2);

  return {
    content: [{ type: "text", text }],
    ...(isError ? { isError: true } : {}),
  };
}
