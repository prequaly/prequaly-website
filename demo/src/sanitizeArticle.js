import DOMPurify from 'dompurify'

// Shared allowlist for article body HTML — used both when saving from the
// admin rich-text editor and when rendering on the public article page.
export function sanitizeArticleHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'blockquote',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}
