# PreQualy — Interest List Landing Page

A responsive, single-file landing page for the PreQualy interest list, with four
audience-specific multi-step questionnaires (Future Homebuyer, Real Estate
Professional, Government Agency, Nonprofit Organization).

## What's in this folder

    index.html                      The entire landing page (HTML + CSS + JS in one file)
    assets/
      prequaly-logo.png             Official logo, web-optimized (transparent, 620px)
      prequaly-logo-original.png    Full-resolution source logo (backup)
      favicon.svg                   Brand keyhole favicon
      og-image.jpg                  Social-share preview image (1200x630)

## Run it

Open index.html in a browser (double-click). Or serve locally:

    python -m http.server 8000    # then visit http://localhost:8000

## Connect the forms (IMPORTANT — do this before launch)

Out of the box the page runs in DEMO MODE: it validates and shows the success
screen but does NOT store signups anywhere (it logs them to the browser console
only). To capture real signups, open index.html, find PREQUALY_CONFIG near the
bottom, and set formEndpoint to your provider's URL:

    const PREQUALY_CONFIG = {
      formEndpoint: "https://formspree.io/f/xxxxxxxx",  // your endpoint here
      redirectOnSuccess: ""                             // optional thank-you URL
    };

The form sends a JSON POST with: audience, submittedAt, source, all field values,
and interests (an array). Works with Formspree, a Google Apps Script web app,
Zapier/Make webhooks, or any custom API that accepts JSON.

## Improvements in this version

- Official PreQualy logo (transparent, web-optimized) in header, footer, favicon,
  and social-share image; tagline "Unlocking Opportunities for Homeownership To Millions."
- Exact brand palette (navy #0A2233, teal #19C9DB) applied throughout.
- Real submission handler with one-line config, loading state, and error handling.
- Anti-spam honeypot on every form.
- Open Graph + Twitter meta tags and a share image so links look right on social.
- Accessibility: skip link, associated form labels, focus management, focus-visible
  outlines, aria-live form area, reduced-motion support.
- Success screen with built-in "Share on X / Facebook" buttons for the social push.
- A commented-out partnership/announcement banner slot (for the CalOSBA banner later).

## Later: partnership / CalOSBA banner

Search index.html for "PARTNERSHIP / ANNOUNCEMENT BANNER SLOT" and uncomment the
block to announce the CalOSBA grant or a partnership. It links to the sign-up section.
