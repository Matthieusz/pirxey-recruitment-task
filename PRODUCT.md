# Product

## Register

product

## Users

A person who reads regularly and wants a private, calm place to record what they've finished. Solo use, not social. They open it to add a book they just closed, to scan what they've read this year, or to find that one novel from two years ago whose author they've forgotten. They use it on a laptop in the evening and occasionally on a phone in a chair. They are not power users of "reading tracker" apps — they tried Goodreads once and closed the tab.

Secondary audience: the recruiter evaluating this submission, who will read the code, click the UI, and judge taste, structure, and decision-making.

## Product Purpose

Keep a personal, durable record of books read. Three jobs, in order of frequency:

1. **Log a book** in under thirty seconds while the impression is fresh: title, author, ISBN, pages, a 1–5 rating.
2. **Browse the shelf** — see the full list of what's been read, scannable at a glance, no decorative noise between you and the data.
3. **Find one specific book** by title or author when memory is partial.

Success is the user reaching for it without thinking, and the list being something they'd be a little proud to show someone. The app is designed to scale to ten million records on the backend, but the surface must feel like a personal notebook, not an enterprise table.

## Brand Personality

Curious, observant, a little wry. Three words: **considered, warm, quiet**. Voice is human and present-tense — _"Add a book you've finished"_, not _"Create new record"_. Never cute, never marketing-cheerful, never corporate. The interface treats reading as a private practice worth a small ritual, not a productivity habit to be gamified.

## Anti-references

Everything that the phrase "book tracker app" would produce on the first try:

- **Library / leather-bound cliché**: brown and tan palettes, ornamental serif headlines, faux-wood or paper textures, bookshelf metaphors, ribbon bookmarks, anything that visually shouts "BOOKS".
- **Goodreads**: dense low-contrast rows, ad-shaped slots, generic stock cover thumbnails, star-rating sprites, social-network noise.
- **SaaS-template feel**: cream backgrounds with a gradient hero, a "Manage your reading life" marketing headline, feature-card grids, the Notion-template look applied to books.
- **Hero-metric dashboard**: big number, small label, supporting stats. This is not analytics.
- **Identical card grids** of book covers. We don't have covers and we don't fake them.

The category reflex says brown serif on cream. We do not do brown serif on cream.

## Design Principles

1. **The list is the product.** Adding a book is a means; reading the shelf is the end. Optimise the list view first; the form serves the list, not the other way around.
2. **Type does the work.** Hierarchy comes from a real editorial type scale and weight contrast, not from coloured chips, badges, or boxed cards. If a divider line or whitespace can do the job, the box doesn't get added.
3. **One quiet voice.** Restrained palette: tinted near-neutrals plus a single committed accent used sparingly and meaningfully (the rating, the active state, the focus ring). No second accent earned without a reason.
4. **Respect the reader's time.** Forms validate clearly and recover gracefully; the list stays fast at any size; nothing animates that doesn't communicate. No modals where inline would do.
5. **Defensible at any zoom.** Every visible choice — a margin, a weight, a label phrasing — should withstand a recruiter asking "why this and not the obvious thing?" If the answer is "it's the default", change it or commit to it on purpose.

## Accessibility & Inclusion

Target **WCAG 2.2 AA** as a floor, not a ceiling.

- Semantic HTML throughout: real `<form>`, `<label>`, `<button>`, `<table>` or `<ul>` as appropriate. No `div` with `role="button"`.
- Visible, palette-tuned focus rings on every interactive element. Keyboard reachability for the full add-book + list + search flow.
- Form errors wired with `aria-describedby` and announced; never colour-only signalling.
- Rating control operable by keyboard and exposed to assistive tech (radiogroup or equivalent), not a hover-only star widget.
- Contrast checked against the chosen palette in both themes; muted text stays ≥ 4.5:1 against its background.
- `prefers-reduced-motion` honoured for any transition added; never animate layout properties.
- Language attribute set; document title reflects the active route.
