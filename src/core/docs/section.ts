import { AVAILABLE_SECTIONS } from "../../config/index.js";

export function filterBySection(content: string, section: string): string {
  const normalizedSection = section.trim();
  const lines = content.split("\n");

  const matchingSection = AVAILABLE_SECTIONS.find(
    (s) => s.toLowerCase() === normalizedSection.toLowerCase()
  );

  if (!matchingSection) {
    const available = AVAILABLE_SECTIONS.map((s) => `  - ${s}`).join("\n");
    throw new Error(
      `Unknown section "${section}". Available sections:\n${available}`
    );
  }

  const headerToFind = `## ${matchingSection}`;
  const startIndex = lines.findIndex((line) => line.trim() === headerToFind);

  if (startIndex === -1) {
    throw new Error(`Section "${matchingSection}" not found in documentation index.`);
  }

  const result: string[] = [`# ${matchingSection}`, ""];
  let i = startIndex + 1;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ") && !line.startsWith("###")) {
      break;
    }
    result.push(line);
    i++;
  }

  return result.join("\n").trimEnd();
}

export function listSections(): string {
  return AVAILABLE_SECTIONS.map((s) => `- ${s}`).join("\n");
}
