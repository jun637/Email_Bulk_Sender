/**
 * Extract {{variable}} names from template HTML/text.
 */
export function extractVariables(template: string): string[] {
  const regex = /\{\{\s*(\w+)\s*\}\}/g;
  const vars = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    vars.add(match[1]);
  }
  return Array.from(vars);
}

/**
 * Replace {{variable}} placeholders with actual values.
 */
export function replaceVariables(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    return values[key] ?? `{{${key}}}`;
  });
}

/**
 * Replace cid: references in HTML with base64 data URIs for preview.
 */
export function replaceCidWithDataUri(
  html: string,
  inlineImages: { contentId: string; mimeType: string; data: string }[]
): string {
  if (!inlineImages || inlineImages.length === 0) return html;
  let result = html;
  for (const img of inlineImages) {
    result = result.replaceAll(
      `cid:${img.contentId}`,
      `data:${img.mimeType};base64,${img.data}`
    );
  }
  return result;
}
