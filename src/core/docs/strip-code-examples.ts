const PHP_CODE_BLOCK_MARKER = "```php";

export function stripCodeExamples(content: string): string {
  const index = content.indexOf(PHP_CODE_BLOCK_MARKER);
  if (index === -1) {
    return content;
  }

  return content.slice(0, index).trimEnd();
}
