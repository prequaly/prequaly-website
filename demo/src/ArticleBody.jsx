import { sanitizeArticleHtml } from './sanitizeArticle.js'

// Renders a full article's rich-text body. Sanitized again here (in addition to
// at save time in admin/RichTextEditor.jsx) since this is the point where the
// HTML actually reaches dangerouslySetInnerHTML.
export default function ArticleBody({ html }) {
  if (!html || !html.trim() || html === '<p></p>') {
    return null
  }
  return (
    <div className="pq-article-body" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(html) }} />
  )
}
