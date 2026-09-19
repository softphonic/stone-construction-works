# Ashok Jadhav Stone Construction Works — website

Bilingual (English / Marathi) marketing site for a stone masonry and civil
construction business in Maharashtra. It is a plain static site: no build step,
no framework and no dependencies. Any static host (Netlify, Vercel, GitHub
Pages, cPanel, S3) can serve the repository root as-is.

Production domain: <https://ashokstoneworks.com/>

## Structure

```
/
├── index.html               Home
├── about.html               About, mission/vision/values, why us  (#why)
├── services.html            All nine services (#stone-masonry …) + process (#process)
├── projects.html            Filterable project gallery with lightbox
├── faq.html                 Frequently asked questions
├── contact.html             Contact details, enquiry form, map
├── privacy-policy.html      Legal
├── terms-of-service.html    Legal
├── 404.html                 Not-found page (uses root-absolute asset paths)
├── robots.txt
├── sitemap.xml
├── css/
│   └── styles.css           The single stylesheet for every page
├── js/
│   ├── translations.js      English + Marathi dictionary
│   └── main.js              All page behaviour
└── images/                  Photography, logo and favicon
```

The header, footer and floating action buttons are repeated in each HTML file.
That is deliberate: without a build step it keeps every page fully rendered for
crawlers and for visitors with JavaScript disabled. **When you change the header
or footer, apply the same change to every page.**

## Running locally

Open `index.html` directly in a browser, or serve the folder over HTTP so that
absolute paths in `404.html` resolve:

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000/>.

## Editing content

### Text and translations

All visible copy lives twice: once as the English default inside the HTML, and
once per language in `js/translations.js`.

* `<span data-i18n="about.title">` — the element's text is replaced on language change.
* `<meta data-i18n-attr="content:meta.home.desc">` — one or more attributes are
  replaced, in `attr:key,attr2:key2` form.

To change wording, update the HTML **and** the matching `en` entry so the page
reads correctly before JavaScript runs. Then update the `mr` entry.

English is the default language. `js/main.js` only switches to Marathi when the
visitor has previously chosen it (stored under `preferredLang` in
`localStorage`); the browser locale is deliberately ignored.

### Adding a gallery image

1. Drop a descriptively named file into `images/` (lower case, hyphens, no spaces).
2. Add a `<button class="gallery-item" data-category="masonry|civil|dam|building">`
   block in `projects.html` with `alt` text and a caption key.
3. Add the caption key to both languages in `js/translations.js`.

### Adding a page

Copy the closest existing page, then update: `<title>`, meta description,
canonical URL, the Open Graph block, the breadcrumb, `aria-current="page"` on
the matching nav link, and add the URL to `sitemap.xml`.

## Contact form

The form has no backend. On submit it validates locally, builds a pre-filled
WhatsApp message and opens `https://wa.me/918208322416`. Nothing is stored or
transmitted by the site itself, so there are no secrets or API keys in the
front-end. A hidden honeypot field (`#cCompany`) discards naive bot submissions,
and a visible fallback link appears if the browser blocks the pop-up.

## Business details used across the site

| Item | Value |
| --- | --- |
| Phone / WhatsApp | 8208322416 |
| Email | pashokjadhav8888@gmail.com |
| Hours | Monday–Sunday, 8:00 AM – 9:00 PM |
| Service area | Maharashtra, India |

These appear in the top bar, contact cards, footer, floating buttons and the
JSON-LD structured data. Update all of them together.
