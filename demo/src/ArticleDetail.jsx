import { useEffect, useState } from 'react'
import { fetchArticleBySlug, formatDisplayDate, hasArticleBody, TYPE_LABELS } from './articles.js'
import { ArticleImageGallery } from './ArticleCards.jsx'
import ArticleBody from './ArticleBody.jsx'

export default function ArticleDetail({ slug }) {
  const [state, setState] = useState({ status: 'loading', article: null })

  useEffect(() => {
    const id = 'pq-fonts'
    if (!document.getElementById(id)) {
      const l = document.createElement('link')
      l.id = id
      l.rel = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap'
      document.head.appendChild(l)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchArticleBySlug(slug).then(({ data, error }) => {
      if (cancelled) return
      if (error || !data) setState({ status: 'not-found', article: null })
      else setState({ status: 'ready', article: data })
    })
    return () => { cancelled = true }
  }, [slug])

  return (
    <div className="pq-article-page">
      <style>{CSS}</style>
      <header className="pq-article-head">
        <a href="/" className="pq-article-brand" aria-label="PreQualy home">
          <img src="/Dark%20PreQualy%20Logo.png" alt="PreQualy" className="pq-brand-logo" />
        </a>
        <a href="/?tab=news" className="pq-article-back">← Back to News &amp; Updates</a>
      </header>

      <main className="pq-article-main">
        {state.status === 'loading' && <p className="pq-article-status">Loading…</p>}

        {state.status === 'not-found' && (
          <div className="pq-article-empty">
            <h1>Article not found</h1>
            <p>This article may have been moved or removed.</p>
            <a href="/?tab=news" className="pq-nav-cta">Back to News &amp; Updates</a>
          </div>
        )}

        {state.status === 'ready' && (
          <article>
            <div className="pq-article-badge">{TYPE_LABELS[state.article.type]}</div>
            <h1 className="pq-article-title">{state.article.title}</h1>
            <div className="pq-article-byline">
              {formatDisplayDate(state.article.published_date)}
              {state.article.author && <span> · By {state.article.author}</span>}
            </div>

            <ArticleImageGallery article={state.article} />

            {hasArticleBody(state.article) ? (
              <ArticleBody html={state.article.body_html} />
            ) : (
              <p className="pq-article-body-fallback">{state.article.description}</p>
            )}

            {state.article.link_url && (
              <a
                href={state.article.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="pq-article-external"
              >
                View the announcement →
              </a>
            )}
          </article>
        )}
      </main>

      <footer className="pq-article-foot">
        <p>© 2026 PreQualy. All rights reserved.</p>
      </footer>
    </div>
  )
}

const CSS = `
:root{
  --navy:#0A2233; --cyan:#19C9DB; --cyan-soft:#E4F8FB; --teal:#0FA6B8; --teal-dark:#0FA6B8;
  --mist:#E4F8FB; --line:#DFE9EF; --ink:#1F2933; --muted:#61708F;
  --shadow:0 18px 50px rgba(10,34,51,.10); --radius:22px;
}
*{box-sizing:border-box}
.pq-article-page{min-height:100vh;background:#fff;color:var(--ink);font-family:Inter,system-ui,sans-serif;display:flex;flex-direction:column}
.pq-brand-logo{height:40px;display:block}
.pq-article-head{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px 40px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.pq-article-back{color:var(--teal-dark);font-weight:700;font-size:.9rem;text-decoration:none}
.pq-article-back:hover{text-decoration:underline}
.pq-article-main{flex:1;width:100%;max-width:760px;margin:0 auto;padding:50px 24px 90px}
.pq-article-status{color:var(--muted);text-align:center;padding:60px 0}
.pq-article-empty{text-align:center;padding:60px 0}
.pq-article-empty h1{font-family:"Manrope",sans-serif;color:var(--navy);margin:0 0 10px}
.pq-article-empty p{color:var(--muted);margin:0 0 24px}
.pq-article-badge{display:inline-flex;align-items:center;padding:7px 13px;border-radius:999px;background:var(--cyan-soft);color:var(--teal-dark);font-size:.72rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;margin-bottom:18px}
.pq-article-title{font-family:"Manrope",sans-serif;color:var(--navy);font-size:clamp(1.8rem,4vw,2.6rem);line-height:1.15;margin:0 0 14px}
.pq-article-byline{color:var(--muted);font-size:.9rem;font-weight:600;margin:0 0 28px}
.pq-article-images{display:flex;flex-wrap:wrap;gap:14px;margin:0 0 28px}
.pq-article-image{flex:1 1 220px;max-width:100%;height:auto;aspect-ratio:220/150;object-fit:cover;border-radius:16px;border:1px solid var(--line);box-shadow:0 6px 18px rgba(10,34,51,.10)}
.pq-article-body{font-size:16px;line-height:1.8;color:var(--ink)}
.pq-article-body p{margin:0 0 18px}
.pq-article-body h2{font-family:"Manrope",sans-serif;color:var(--navy);font-size:1.5rem;margin:28px 0 14px}
.pq-article-body h3{font-family:"Manrope",sans-serif;color:var(--navy);font-size:1.2rem;margin:24px 0 12px}
.pq-article-body ul,.pq-article-body ol{margin:0 0 18px;padding-left:26px}
.pq-article-body li{margin:0 0 8px}
.pq-article-body a{color:var(--teal-dark)}
.pq-article-body blockquote{margin:0 0 18px;padding-left:16px;border-left:3px solid var(--teal);color:var(--muted)}
.pq-article-body-fallback{font-size:16px;line-height:1.8;color:var(--muted)}
.pq-article-external{display:inline-flex;align-items:center;gap:6px;margin-top:10px;color:var(--teal-dark);font-weight:800;text-decoration:underline;text-underline-offset:3px}
.pq-nav-cta{display:inline-flex;align-items:center;gap:8px;padding:13px 26px;border-radius:999px;background:var(--navy);color:#fff;font-weight:700;text-decoration:none;border:0;cursor:pointer}
.pq-article-foot{border-top:1px solid var(--line);background:var(--mist);padding:22px 40px;text-align:center}
.pq-article-foot p{margin:0;font-size:13px;color:var(--muted)}
@media(max-width:600px){.pq-article-head{padding:18px 20px}.pq-article-main{padding:36px 20px 70px}}
`
