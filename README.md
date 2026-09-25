# Shahid Malik — robotics portfolio

A static GitHub Pages site covering current robotics work at Field AI, earlier
computer vision projects, publications, and research at Saint Louis University.

## Preview

From this directory, run:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765. No build or npm dependencies are required.
`npm run check` checks the JavaScript syntax; `npm start` starts the same server.

## Files

- `index.html`: content, metadata, project links, experience and publications.
- `portfolio.css`: responsive layout, typography, media viewer and motion preferences.
- `portfolio.js`: project filters, media dialog, gallery and procedural canvas scene.
- `assets/portfolio/`: compressed WebP previews of existing portfolio images.
- Existing root photos, videos and PDFs: full-size media and downloadable documents.

Keep original media alongside the new files: the lightbox opens full-size images
and videos on demand. The site does not preload the video library. The procedural
hero is illustrative geometry, not a Field AI scene or measured reconstruction.
Its animation stops offscreen and honors reduced-motion preferences.

## Content updates

The Field AI entry currently describes the work focus, without an unconfirmed
formal job title or start date. Update the current role in `#experience` once those
are confirmed. The existing contact email and CV PDF are retained; the PDF itself
has not been revised to add Field AI experience.

Projects remain readable without JavaScript; media links open their source files.
The image gallery has a basic no-JavaScript fallback. JavaScript adds filters,
media dialogs, scene controls and an expandable gallery of 18 existing images.

## Publish

Merge the portfolio pull request into `main`, using the repository's existing
GitHub Pages publication configuration. Alternatively, copy the files in the
update bundle into the existing repository root and commit them to `main`.
The update bundle is not a standalone copy of the original media library.

Browser checks covered desktop/mobile layouts (including 320px width), project
filters, image/video dialogs, Escape dismissal, mobile navigation, gallery assets,
scene controls and reduced motion. No page script errors or asset HTTP errors
were observed in those checks.
