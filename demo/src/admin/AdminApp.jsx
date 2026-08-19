import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { fetchPublishedArticles } from '../articles.js'
import Login from './Login.jsx'
import ArticleList from './ArticleList.jsx'
import ArticleForm from './ArticleForm.jsx'
import './admin.css'

export default function AdminApp() {
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

  const [sessionChecked, setSessionChecked] = useState(false)
  const [session, setSession] = useState(null)

  useEffect(() => {
    if (!supabase) { setSessionChecked(true); return }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionChecked(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const [articles, setArticles] = useState(null)
  const [articlesError, setArticlesError] = useState(null)
  const [view, setView] = useState({ mode: 'list' }) // { mode: 'list' } | { mode: 'new' } | { mode: 'edit', article }

  async function loadArticles() {
    const { data, error } = await fetchPublishedArticles()
    if (error) setArticlesError(error)
    else { setArticlesError(null); setArticles(data) }
  }

  useEffect(() => {
    if (session) loadArticles()
  }, [session])

  if (!supabase) {
    return (
      <div className="adm-loading">
        Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
        (see demo/.env.example) and reload.
      </div>
    )
  }

  if (!sessionChecked) {
    return <div className="adm-loading">Loading…</div>
  }

  if (!session) {
    return <Login />
  }

  return (
    <div className="adm-shell">
      <header className="adm-header">
        <span className="adm-header-title">PreQualy Article Manager</span>
        <div className="adm-header-right">
          <span className="adm-muted">{session.user.email}</span>
          <button className="adm-btn" onClick={() => supabase.auth.signOut()}>Log out</button>
        </div>
      </header>

      <main className="adm-main">
        {articlesError && (
          <p className="adm-error" role="alert">Couldn't load articles: {articlesError.message}</p>
        )}

        {articles === null && !articlesError && (
          <p className="adm-muted">Loading articles…</p>
        )}

        {articles !== null && view.mode === 'list' && (
          <ArticleList
            articles={articles}
            onNew={() => setView({ mode: 'new' })}
            onEdit={(article) => setView({ mode: 'edit', article })}
            onDeleted={(id) => setArticles((prev) => prev.filter((a) => a.id !== id))}
          />
        )}

        {view.mode === 'new' && (
          <ArticleForm
            mode="create"
            onCancel={() => setView({ mode: 'list' })}
            onDone={() => { setView({ mode: 'list' }); loadArticles() }}
          />
        )}

        {view.mode === 'edit' && (
          <ArticleForm
            mode="edit"
            initialArticle={view.article}
            onCancel={() => setView({ mode: 'list' })}
            onDone={() => { setView({ mode: 'list' }); loadArticles() }}
          />
        )}
      </main>
    </div>
  )
}
