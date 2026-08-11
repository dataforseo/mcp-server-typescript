export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  const text = await response.text();

  if (!response.ok) {
    return `HTTP ${response.status} ${response.statusText}\n${text}`;
  }

  return text;
}
