import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Route-based code splitting: /editarticles pulls in the TipTap rich-text editor
// (a large dependency), which the public marketing site should never have to
// download just to render the homepage.
const App = lazy(() => import('./App.jsx'))
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))
const ArticleDetail = lazy(() => import('./ArticleDetail.jsx'))

const path = window.location.pathname.replace(/\/+$/, '') || '/'
const articleMatch = path.match(/^\/articles\/(.+)$/)

let root
if (articleMatch) {
  root = <ArticleDetail slug={decodeURIComponent(articleMatch[1])} />
} else if (path === '/editarticles') {
  root = <AdminApp />
} else {
  root = <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={null}>
      {root}
    </Suspense>
  </StrictMode>,
)
