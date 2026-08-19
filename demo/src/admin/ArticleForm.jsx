import { useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { MONTH_NAMES } from '../articles.js'
import { NewsFeaturedCard, PressCard } from '../ArticleCards.jsx'

const CURRENT_YEAR = new Date().getFullYear()

function blankForm(initialArticle) {
  if (initialArticle) {
    return {
      type: initialArticle.type,
      title: initialArticle.title,
      description: initialArticle.description,
      link_url: initialArticle.link_url || '',
      display_month: initialArticle.display_month,
      display_year: initialArticle.display_year,
    }
  }
  return {
    type: 'news',
    title: '',
    description: '',
    link_url: '',
    display_month: new Date().getMonth() + 1,
    display_year: CURRENT_YEAR,
  }
}

export default function ArticleForm({ mode, initialArticle, onDone, onCancel }) {
  const [step, setStep] = useState('edit') // 'edit' | 'preview'
  const [form, setForm] = useState(() => blankForm(initialArticle))
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleContinue(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.')
      return
    }
    setError(null)
    setStep('preview')
  }

  async function handlePublish() {
    setSubmitting(true)
    setError(null)
    const payload = {
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      link_url: form.link_url.trim() || null,
      display_month: Number(form.display_month),
      display_year: Number(form.display_year),
    }
    const { error } = mode === 'edit'
      ? await supabase.from('articles').update(payload).eq('id', initialArticle.id)
      : await supabase.from('articles').insert([payload])
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    onDone()
  }

  const previewArticle = {
    ...form,
    display_month: Number(form.display_month),
    display_year: Number(form.display_year),
  }

  return (
    <div className="adm-card">
      <h2>{mode === 'edit' ? 'Edit Article' : 'New Article'}</h2>

      {step === 'edit' && (
        <form onSubmit={handleContinue}>
          <div className="adm-field">
            <label>Type</label>
            <div className="adm-choice">
              <label className="adm-radio">
                <input
                  type="radio"
                  name="type"
                  checked={form.type === 'news'}
                  onChange={() => update('type', 'news')}
                /> News &amp; Update
              </label>
              <label className="adm-radio">
                <input
                  type="radio"
                  name="type"
                  checked={form.type === 'press'}
                  onChange={() => update('type', 'press')}
                /> Press Release
              </label>
            </div>
          </div>

          <div className="adm-row">
            <div className="adm-field">
              <label htmlFor="adm-month">Month</label>
              <select
                id="adm-month"
                value={form.display_month}
                onChange={(e) => update('display_month', e.target.value)}
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label htmlFor="adm-year">Year</label>
              <input
                id="adm-year"
                type="number"
                min="2000"
                max="2100"
                value={form.display_year}
                onChange={(e) => update('display_year', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="adm-field">
            <label htmlFor="adm-title">Title</label>
            <input
              id="adm-title"
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              required
            />
          </div>

          <div className="adm-field">
            <label htmlFor="adm-description">Description</label>
            <textarea
              id="adm-description"
              rows={4}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              required
            />
          </div>

          <div className="adm-field">
            <label htmlFor="adm-link">Hyperlink (optional)</label>
            <input
              id="adm-link"
              type="url"
              placeholder="https://…"
              value={form.link_url}
              onChange={(e) => update('link_url', e.target.value)}
            />
          </div>

          {error && <p className="adm-error" role="alert">{error}</p>}

          <div className="adm-actions">
            <button type="button" className="adm-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="adm-btn adm-btn-primary">Preview</button>
          </div>
        </form>
      )}

      {step === 'preview' && (
        <div>
          <p className="adm-muted">This is exactly how the article will look on the site.</p>
          <div className="adm-preview">
            {previewArticle.type === 'news'
              ? <NewsFeaturedCard article={previewArticle} showLabel />
              : <PressCard article={previewArticle} />}
          </div>

          {error && <p className="adm-error" role="alert">{error}</p>}

          <div className="adm-actions">
            <button type="button" className="adm-btn" onClick={() => setStep('edit')} disabled={submitting}>
              Back to Edit
            </button>
            <button type="button" className="adm-btn adm-btn-primary" onClick={handlePublish} disabled={submitting}>
              {submitting ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Confirm & Publish'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
