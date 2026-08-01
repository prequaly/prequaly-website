import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The Google Apps Script proxy has been removed.
// Supabase JS client handles its own CORS negotiation natively,
// so no dev proxy is needed for dashboard data fetching.
//
// The Edge Function (submit-interest) also sets its own CORS headers,
// so form POSTs from index.html work cross-origin without a proxy.

export default defineConfig({
  plugins: [react()],
})