# Sattam · சட்டம் — static site

A **pure static HTML website** that explains everyday Indian laws to ordinary people.

Every sentence is shown **twice**: the **Tamil line first**, and the **same line in English**
just below it. There is **no language switcher** — both languages are always on the page,
so anyone in a family or a group can read together, whatever language they are comfortable
with.

## What is inside

```
index.html                 Home
guides/index.html          All guides + search
emergency/index.html       Helpline numbers + official websites
about/index.html           About
<guide-slug>/index.html    One page per guide (17 guides)
topic/<category>/index.html  Topic pages
assets/style.css           The whole design (bilingual typography)
assets/app.js              Optional search + mobile menu
assets/search-index.json   Search data
404.html  sitemap.xml  robots.txt
```

There is **no build step and no dependencies** — the files are plain HTML, CSS and a little
JavaScript. The site is fully readable with JavaScript switched off; JS only adds search.

## Coverage

- **Complete Rights Checklist** (4 guides) — all 165 everyday points: constitutional rights,
  police and criminal procedure, traffic, cybercrime, consumer, employment, banking and tax,
  property, family, government services, public behaviour, environment, the main laws by name,
  a daily checklist and official websites.
- **Topic guides** — traffic, police, cybercrime, consumer, employment, banking, housing,
  property, family, identity documents, everyday laws, fundamental rights, emergencies.
- Language is deliberately simple, with any legal term explained in plain brackets, so that
  both educated and less-educated readers can follow.

## Design

- Tamil line: large, dark, Noto Sans Tamil.
- English line: smaller and softer, Inter, directly underneath.
- Comfortable line height, big tap targets, high contrast, keyboard-friendly, and a mobile
  layout that stacks cleanly.

## Deploy

Any static host works (GitHub Pages, Netlify, Cloudflare Pages, Vercel, or any web server).

- **GitHub Pages:** Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)`.
- The site is built to be served from `https://vishnuu12.github.io/sattam-static-site/`.
  If you host it at a domain root instead, the links that start with `/sattam-static-site/`
  must be changed to `/` (or rebuild from the generator with an empty base path).

## Disclaimer

Sattam gives **general legal information for education only**. It is not legal advice. Laws
change and vary by state. For your situation, consult a qualified lawyer or your nearest free
legal aid centre (helpline 15100).

All content is marked as **pending legal review** until a named reviewer signs off.
