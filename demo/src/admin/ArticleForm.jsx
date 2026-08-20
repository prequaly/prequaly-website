import { useRef, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { generateUniqueSlug, hasArticleBody } from '../articles.js'
import { NewsFeaturedCard, PressCard } from '../ArticleCards.jsx'
import ArticleBody from '../ArticleBody.jsx'
import ImageCropper from './ImageCropper.jsx'
import RichTextEditor from './RichTextEditor.jsx'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
// Matches the display box in ArticleCards.jsx / App.jsx's .pq-article-image (220x150),
// so what gets cropped here is exactly what renders on the site. Output is rendered at
// 4x that box size for reasonable sharpness.
const ARTICLE_IMAGE_ASPECT = 220 / 150
const ARTICLE_IMAGE_OUTPUT_WIDTH = 880
const ARTICLE_IMAGE_OUTPUT_HEIGHT = 600

function blankForm(initialArticle) {
  if (initialArticle) {
    return {
      type: initialArticle.type,
      title: initialArticle.title,
      author: initialArticle.author || '',
      description: initialArticle.description,
      body_html: initialArticle.body_html || '',
      link_url: initialArticle.link_url || '',
      published_date: initialArticle.published_date || todayIso(),
      image_urls: initialArticle.image_urls || [],
      slug: initialArticle.slug,
    }
  }
  return {
    type: 'news',
    title: '',
    author: '',
    description: '',
    body_html: '',
    link_url: '',
    published_date: todayIso(),
    image_urls: [],
    slug: null,
  }
}

export default function ArticleForm({ mode, initialArticle, onDone, onCancel }) {
  const [step, setStep] = useState('edit') // 'edit' | 'preview'
  const [form, setForm] = useState(() => blankForm(initialArticle))
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [imageError, setImageError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const fileInputRef = useRef(null)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleFileChosen(e) {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    setImageError(null)
    if (!file.type.startsWith('image/')) {
      setImageError('Only image files can be uploaded.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Images must be 5MB or smaller.')
      return
    }
    setPendingFile(file)
  }

  async function handleCropApply(blob, outType) {
    setPendingFile(null)
    setImageError(null)
    setUploading(true)
    const ext = outType === 'image/png' ? 'png' : 'jpg'
    const path = `${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(path, blob, { contentType: outType })
    if (uploadError) {
      setImageError(uploadError.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('article-images').getPublicUrl(path)
    setForm((f) => ({ ...f, image_urls: [...f.image_urls, data.publicUrl] }))
    setUploading(false)
  }

  function removeImage(index) {
    setForm((f) => ({ ...f, image_urls: f.image_urls.filter((_, i) => i !== index) }))
  }

  function handleContinue(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.author.trim() || !form.description.trim() || !form.published_date) {
      setError('Title, author, description, and date are required.')
      return
    }
    setError(null)
    setStep('preview')
  }

  async function handlePublish() {
    setSubmitting(true)
    setError(null)
    const slug = form.slug || await generateUniqueSlug(form.title.trim())
    const payload = {
      type: form.type,
      title: form.title.trim(),
      author: form.author.trim(),
      description: form.description.trim(),
      body_html: form.body_html,
      link_url: form.link_url.trim() || null,
      published_date: form.published_date,
      image_urls: form.image_urls,
      slug,
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

  const previewArticle = form

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
              <label htmlFor="adm-author">Author</label>
              <input
                id="adm-author"
                type="text"
                value={form.author}
                onChange={(e) => update('author', e.target.value)}
                required
              />
            </div>
            <div className="adm-field">
              <label htmlFor="adm-date">Date</label>
              <input
                id="adm-date"
                type="date"
                value={form.published_date}
                onChange={(e) => update('published_date', e.target.value)}
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
            <label htmlFor="adm-description">Card Summary</label>
            <textarea
              id="adm-description"
              rows={4}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              required
            />
          </div>

          <div className="adm-field">
            <label htmlFor="adm-body">Full Article (optional)</label>
            <p className="adm-muted">
              Leave this blank if you're just posting a link to something written elsewhere —
              the card will show the summary above and link straight to the Hyperlink field
              below. Write here when you want a full page on the site with your own formatting.
            </p>
            <RichTextEditor value={form.body_html} onChange={(html) => update('body_html', html)} />
          </div>

          <div className="adm-field">
            <label htmlFor="adm-images">Images (optional)</label>
            <input
              id="adm-images"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChosen}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="adm-btn"
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : '+ Add Image'}
            </button>
            {imageError && <p className="adm-error" role="alert">{imageError}</p>}
            {form.image_urls.length > 0 && (
              <div className="adm-image-grid">
                {form.image_urls.map((url, i) => (
                  <div className="adm-image-thumb" key={url}>
                    <img src={url} alt="" />
                    <button
                      type="button"
                      className="adm-image-remove"
                      onClick={() => removeImage(i)}
                      aria-label="Remove image"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
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
          <p className="adm-muted">This is exactly how the card will look on the News &amp; Updates page.</p>
          <div className="adm-preview">
            {previewArticle.type === 'news'
              ? <NewsFeaturedCard article={previewArticle} showLabel />
              : <PressCard article={previewArticle} />}
          </div>

          {hasArticleBody(previewArticle) ? (
            <>
              <p className="adm-muted">This is how the full article page will look when someone clicks through.</p>
              <div className="adm-preview adm-preview-full">
                <ArticleBody html={previewArticle.body_html} />
              </div>
            </>
          ) : (
            <p className="adm-muted">
              No full article written — the card above won't link to a full page{previewArticle.link_url ? ', just to the hyperlink you added.' : '.'}
            </p>
          )}

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

      {pendingFile && (
        <ImageCropper
          file={pendingFile}
          aspect={ARTICLE_IMAGE_ASPECT}
          outputWidth={ARTICLE_IMAGE_OUTPUT_WIDTH}
          outputHeight={ARTICLE_IMAGE_OUTPUT_HEIGHT}
          onCancel={() => setPendingFile(null)}
          onApply={handleCropApply}
        />
      )}
    </div>
  )
}
