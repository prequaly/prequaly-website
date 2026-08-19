import { useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) setError('Invalid email or password.')
  }

  return (
    <div className="adm-login-wrap">
      <form className="adm-login-card" onSubmit={handleSubmit}>
        <h1>PreQualy Article Manager</h1>
        <p className="adm-muted">Sign in to manage News &amp; Updates and Press Releases.</p>
        <div className="adm-field">
          <label htmlFor="adm-email">Email</label>
          <input
            id="adm-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="adm-field">
          <label htmlFor="adm-password">Password</label>
          <input
            id="adm-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="adm-error" role="alert">{error}</p>}
        <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
