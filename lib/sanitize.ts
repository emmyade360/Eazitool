/**
 * Minimal HTML sanitizer for CV templates
 * Removes dangerous tags/attributes while preserving formatting
 */

const ALLOWED_TAGS = new Set([
  'html', 'head', 'body', 'meta', 'title', 'style',
  'header', 'section', 'article', 'div', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'ul', 'ol', 'li',
  'strong', 'b', 'em', 'i', 'u',
  'a', 'span', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
]);

export function sanitizeHtml(html: string): string {
  // Remove script tags and their content
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  
  // Remove iframe tags
  html = html.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  
  // Remove on* event handlers
  html = html.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: URLs
  html = html.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  
  // Remove style attributes with javascript or expression
  html = html.replace(/style\s*=\s*["'][^"']*(javascript|expression)["']/gi, '');
  
  // Basic tag validation - remove disallowed tags but keep content
  html = html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tagName) => {
    if (ALLOWED_TAGS.has(tagName.toLowerCase())) {
      return match;
    }
    return '';
  });

  return html;
}
