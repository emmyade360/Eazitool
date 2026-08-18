/**
 * Keeps an occasional model formatting slip out of the editable and downloaded
 * application-letter draft, while preserving its plain prose.
 */
export function normaliseApplicationLetter(letter: string) {
  return letter
    .replace(/^```(?:text|markdown)?\s*|\s*```$/gi, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^(?:application|cover)\s+letter(?:\s+for .*)?\s*\n+/gim, '')
    .replace(/^(?:subject|re):\s*[^\n]+\n+/gim, '')
    .replace(/^dear\s+[^\n]{1,100}[,:]\s*\n+/i, '')
    .replace(/\n+(?:yours faithfully|yours sincerely|sincerely|kind regards|best regards|regards)[,!.\s]*(?:\n[\s\S]*)?$/i, '')
    .replace(/^[ \t]*(?:[-*•]\s+|\d+[.)]\s+)/gm, '')
    .replace(/(\*\*|__|`)/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, ', ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
