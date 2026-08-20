import { formatDisplayDate, hasArticleBody } from './articles.js'

// Shared presentational cards for News & Updates / Press Releases.
// Used by the public site (App.jsx) and by the admin preview step
// (admin/ArticleForm.jsx) so what gets approved is pixel-identical to what goes live.
// A card only links through to a full /articles/{slug} page when there's an
// actual written body — a link-only or blurb-only post (e.g. reposting someone
// else's announcement via the Hyperlink field) stays exactly as compact as before.

export function ArticleImageGallery({ article }) {
  if (!article.image_urls || article.image_urls.length === 0) return null
  return (
    <div className="pq-article-images">
      {article.image_urls.map((url) => (
        <img key={url} src={url} alt="" className="pq-article-image" />
      ))}
    </div>
  )
}

function ArticleByline({ article }) {
  return (
    <div className="pq-news-date">
      {formatDisplayDate(article.published_date)}
      {article.author && <span className="pq-news-author"> · By {article.author}</span>}
    </div>
  )
}

function ArticleTitleAndLinks({ article, TitleTag }) {
  const readable = hasArticleBody(article)
  return (
    <>
      <TitleTag>
        {readable
          ? <a href={`/articles/${article.slug}`} className="pq-news-title-link">{article.title}</a>
          : article.title}
      </TitleTag>
      <p>{article.description}</p>
      <ArticleImageGallery article={article} />
      <div className="pq-news-links">
        {readable && (
          <a href={`/articles/${article.slug}`} className="pq-news-link">Read the full article →</a>
        )}
        {article.link_url && (
          <a
            href={article.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="pq-news-link"
          >View the announcement →</a>
        )}
      </div>
    </>
  )
}

export function NewsFeaturedCard({ article, showLabel }) {
  return (
    <section className={"pq-news-featured" + (showLabel ? "" : " pq-news-featured--nolabel")}>
      {showLabel && (
        <div className="pq-news-featured-label">Latest Update</div>
      )}
      <div className="pq-news-featured-content">
        <ArticleByline article={article} />
        <ArticleTitleAndLinks article={article} TitleTag="h2" />
      </div>
    </section>
  )
}

export function PressCard({ article }) {
  return (
    <section className="pq-press-card">
      <div className="pq-press-card-label">Press Release</div>
      <ArticleByline article={article} />
      <ArticleTitleAndLinks article={article} TitleTag="h3" />
    </section>
  )
}

export function ArticleEmptyState({ title, message, ctaLabel, onCta }) {
  return (
    <div className="pq-news-empty">
      <div className="pq-news-empty-icon">✦</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {ctaLabel && (
        <button className="pq-nav-cta" onClick={onCta}>{ctaLabel}</button>
      )}
    </div>
  )
}
