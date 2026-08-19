import { formatDisplayDate } from './articles.js'

// Shared presentational cards for News & Updates / Press Releases.
// Used by the public site (App.jsx) and by the admin preview step
// (admin/ArticleForm.jsx) so what gets approved is pixel-identical to what goes live.

export function NewsFeaturedCard({ article, showLabel }) {
  return (
    <section className={"pq-news-featured" + (showLabel ? "" : " pq-news-featured--nolabel")}>
      {showLabel && (
        <div className="pq-news-featured-label">Latest Update</div>
      )}
      <div className="pq-news-featured-content">
        <div className="pq-news-date">
          {formatDisplayDate(article.display_month, article.display_year)}
        </div>
        <h2>{article.title}</h2>
        <p>{article.description}</p>
        {article.link_url && (
          <a
            href={article.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="pq-news-link"
          >View the announcement →</a>
        )}
      </div>
    </section>
  )
}

export function PressCard({ article }) {
  return (
    <section className="pq-press-card">
      <div className="pq-press-card-label">Press Release</div>
      <div className="pq-news-date">
        {formatDisplayDate(article.display_month, article.display_year)}
      </div>
      <h3>{article.title}</h3>
      <p>{article.description}</p>
      {article.link_url && (
        <a
          href={article.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="pq-news-link"
        >View the announcement →</a>
      )}
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
