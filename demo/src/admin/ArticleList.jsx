import { useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { formatDisplayDate, TYPE_LABELS } from '../articles.js'

export default function ArticleList({ articles, onEdit, onDeleted, onNew }) {
  const [confirmingId, setConfirmingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)

  async function handleDelete(id) {
    setDeletingId(id)
    setError(null)
    const { error } = await supabase.from('articles').delete().eq('id', id)
    setDeletingId(null)
    setConfirmingId(null)
    if (error) setError(error.message)
    else onDeleted(id)
  }

  return (
    <div className="adm-card">
      <div className="adm-list-header">
        <h2>Articles</h2>
        <button className="adm-btn adm-btn-primary" onClick={onNew}>+ New Article</button>
      </div>

      {error && <p className="adm-error" role="alert">{error}</p>}

      {articles.length === 0 && (
        <p className="adm-muted">No articles yet. Click "New Article" to publish the first one.</p>
      )}

      <ul className="adm-list">
        {articles.map((a) => (
          <li key={a.id} className="adm-list-row">
            <span className={`adm-badge adm-badge-${a.type}`}>{TYPE_LABELS[a.type]}</span>
            <div className="adm-list-row-content">
              <div className="adm-list-row-date">{formatDisplayDate(a.display_month, a.display_year)}</div>
              <div className="adm-list-row-title">{a.title}</div>
            </div>
            <div className="adm-list-row-actions">
              <button className="adm-btn" onClick={() => onEdit(a)}>Edit</button>
              {confirmingId === a.id ? (
                <>
                  <button
                    className="adm-btn adm-btn-danger"
                    onClick={() => handleDelete(a.id)}
                    disabled={deletingId === a.id}
                  >
                    {deletingId === a.id ? 'Deleting…' : 'Confirm Delete'}
                  </button>
                  <button className="adm-btn" onClick={() => setConfirmingId(null)}>Cancel</button>
                </>
              ) : (
                <button className="adm-btn adm-btn-danger-outline" onClick={() => setConfirmingId(a.id)}>
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
