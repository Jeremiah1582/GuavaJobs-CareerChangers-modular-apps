/**
 * Normalize job-description HTML (ATS or Adzuna) into readable plain text.
 * Handles entity-encoded markup (&lt;p&gt;…), structural tags, and double-encoding.
 */
export function stripHtml(html: string): string {
  if (!html?.trim()) {
    return '';
  }

  let text = decodeHtmlEntities(html);

  text = text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  // Block / list structure before wiping remaining tags
  text = text
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|section|article|h[1-6]|li|tr)\s*>/gi, '\n')
    .replace(/<\s*(p|div|section|article|h[1-6]|tr)[^>]*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<\/\s*(ul|ol)\s*>/gi, '\n')
    .replace(/<\s*(ul|ol)[^>]*>/gi, '\n')
    .replace(/<\/\s*td\s*>/gi, ' ')
    .replace(/<\/\s*th\s*>/gi, ' ');

  text = text.replace(/<[^>]+>/g, ' ');

  // Entities that only appear after tag strip (e.g. leftover &nbsp;)
  text = decodeHtmlEntities(text);

  return normalizePlainText(text);
}

/** Re-normalize cached descriptions that still look like escaped HTML. */
export function ensurePlainJobDescription(description: string): string {
  if (!description?.trim()) {
    return '';
  }
  if (
    /&lt;[a-z/!]|<[a-z][\s>/]|<\/[a-z]/i.test(description) ||
    /&amp;(?:lt|gt|quot|nbsp|#)/i.test(description)
  ) {
    return stripHtml(description);
  }
  return description.trim();
}

/** Decode common + numeric HTML entities; loop for double-encoding (&amp;lt;). */
export function decodeHtmlEntities(input: string): string {
  let text = input;
  for (let i = 0; i < 3; i += 1) {
    const next = text
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
        const code = Number.parseInt(hex, 16);
        return Number.isFinite(code) ? String.fromCodePoint(code) : _;
      })
      .replace(/&#(\d+);/g, (_, dec: string) => {
        const code = Number.parseInt(dec, 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : _;
      });
    if (next === text) {
      break;
    }
    text = next;
  }
  return text;
}

function normalizePlainText(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
