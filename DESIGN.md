## <!-- SEED: re-run $impeccable document once there's code to capture the actual tokens and components. -->

name: Shelf
description: A private, considered record of books read.

---

# Design System: Shelf

> Working title; the recruitment task doesn't name the product, so the design system carries a short placeholder. Rename in the frontmatter when a real name lands.

## 1. Overview

**Creative North Star: "The Reader's Margin"**

A real reader marks up a real book in the margins — a faint pencil tick beside a sentence, a folded corner, a single annotation in red ink the rest of the page never approaches. The whole system is built around that posture: a quiet, paper-toned surface that does the listening, and one committed accent that does the marking. The chrome stays out of the way; the reader and their books sit on the page like entries in a private journal.

The system is **editorial and humanist, not literary-decorative**. Hierarchy comes from a real type scale and weight contrast, not from coloured chips, boxed cards, or decorative serifs piled on cream. Density is loose where the reader needs to breathe (the shelf view) and tight where the reader needs to act (the add-book form). Depth is tonal, never shadowed. Motion exists only as feedback for state.

The system explicitly rejects every reflex the phrase "book tracker app" produces on the first try: **library and leather-bound cliché**, **Goodreads-style dense low-contrast rows with star sprites**, **The StoryGraph / Bookshelf-grid cover walls and gamified streaks**, **SaaS-template cream with a gradient hero and a "Manage your reading life" headline**, and **hero-metric dashboards** with big numbers in coloured tiles. None of these belong on the page.

**Key Characteristics:**

- Tinted near-neutral surface, never `#fff` or `#000`
- One committed accent (Foundry magenta) used on ≤10% of any screen
- Humanist sans for everything except book titles, which receive serif treatment as if typeset in a journal
- Flat by default; depth is tonal, never shadowed
- Motion as feedback only — no entrances, no choreography
- Type and whitespace carry the hierarchy; boxes and badges do not

## 2. Colors

The palette is **Restrained**: tinted near-neutrals plus a single committed accent. Every neutral is gently warmed toward the accent hue so the surface never feels machine-grey, and the accent's rarity is the entire point.

### Primary

- **Foundry Magenta** (target `oklch(~0.55 0.20 15)`, exact value `[to be resolved during implementation]`): the rating colour, the active state, the focus ring, the validation success tick, the single visual reach of the system. Never used as a fill on areas larger than a small chip, a single icon, a short label, or a focus outline. If you find yourself using it on a card background, you've gone too far — back it out.

### Neutral

Every neutral is tinted toward hue 15° (the accent hue family) at a chroma between `0.005` and `0.01`. No raw greys, no pure black, no pure white.

- **Paper** (target `oklch(~0.98 0.005 15)`, exact value `[to be resolved during implementation]`): the page surface; the warmest neutral.
- **Page Edge** (target `oklch(~0.94 0.006 15)`): hairline dividers, the inside edge of inputs, the resting fill of a table row on hover.
- **Margin Ink** (target `oklch(~0.18 0.01 15)`): primary text, headings, list entries.
- **Muted Ink** (target `oklch(~0.50 0.01 15)`): metadata text (ISBN, page count, author beneath the title), placeholder text, secondary labels. Must hold ≥ 4.5:1 contrast against Paper.
- **Soft Ink** (target `oklch(~0.65 0.008 15)`): tertiary copy where size or weight contrast already does the work (form helper text, footnotes).

A parallel set of dark-theme neutrals is implied (same hue, inverted lightness, slightly higher chroma at extremes to compensate for OKLCH chroma falloff). Resolve during implementation; do not default to flipped greys.

### Named Rules

**The One Voice Rule.** The accent is used on ≤10% of any rendered screen, by visible area. Star ratings, the focus ring, a single icon, and short status labels are eligible. Card backgrounds, hero panels, gradient fills, and decorative strokes are not. If a second accent feels needed, the layout is wrong — fix the layout, not the palette.

**The Tinted Neutral Rule.** No `#fff`, no `#000`, no chromaless `oklch(L 0 H)` greys anywhere in the system. Every neutral carries a `0.005`–`0.01` chroma toward the accent hue. This is the rule that makes the surface feel like paper instead of a screenshot of a screenshot.

**The Colour-Only Signal Ban.** Validation, state, and required-field signalling are never colour-alone. Pair every colour signal with an icon, a label, or copy. The accent should add weight to a signal, not be the signal.

## 3. Typography

**Display & Body Font:** Humanist sans `[font pairing to be chosen at implementation — Inter Variable is already shipped in the scaffold; candidates worth auditing: Söhne, Untitled Sans, ABC Diatype, Inter as the safe fallback]`

**Title Font:** Transitional or modern serif used only for book titles in the shelf list `[to be chosen at implementation — candidates worth auditing: GT Sectra, Tiempos Text, Source Serif 4, EB Garamond]`

**Mono Font:** Used only for ISBN values and page counts in the shelf list `[font to be chosen — JetBrains Mono, IBM Plex Mono, or the platform mono stack]`

**Character:** A reading interface that respects both how readers read (humanist sans for ambient text, never cold or geometric) and what they read (each book title rendered in a real serif, as if typeset into a personal journal). The mono is a small concession to the fact that ISBN numbers are not language; they are catalogue entries.

### Hierarchy

Scale steps follow a ≥ 1.25 ratio between adjacent steps. No flat scales.

- **Display** (sans, weight 500, `clamp(2.25rem, 4vw, 3.25rem)`, line-height `1.1`): reserved for the shelf section heading and the empty state. At most one display element per route.
- **Headline** (sans, weight 500, `1.5rem`, line-height `1.25`): section headings inside a route (the "Add a book" form heading, "Filter results" headings).
- **Title (book)** (serif, weight 400, `1.125rem`, line-height `1.3`): the book title in every shelf list row. This is the signature treatment of the system — see The Title-as-Object Rule.
- **Body** (sans, weight 400, `1rem`, line-height `1.55`, max line length `65–75ch`): paragraph copy, form helper text, longer descriptive labels.
- **Label** (sans, weight 500, `0.875rem`, line-height `1.3`, no all-caps): input labels, button text, table headers. Sentence case throughout.
- **Metadata / Mono** (mono, weight 400, `0.8125rem`, line-height `1.4`, slightly negative letter-spacing `-0.005em`): ISBN values and page-count numerals only.

### Named Rules

**The Title-as-Object Rule.** Every book title in the shelf list is rendered in the serif Title style. It is the only place serif appears in the entire system. Author, ISBN, page count, and rating sit in the humanist sans (or mono, for ISBN and pages). This separation is the system's editorial signature — the books look like the content, not the chrome.

**The 65ch Rule.** Body copy line length is capped at `65–75ch`. The form labels and the empty state copy both respect this; nothing in this system asks the reader to read a paragraph longer than a paperback page width.

**The No All-Caps Rule.** No uppercase styling on labels, buttons, or headings. Capitalisation comes from sentence case. The visual reflex of "small + uppercase + tracked" labels reads as SaaS-template; we do not do that here.

## 4. Elevation

The system is **flat by default**. Depth comes from tonal layering between the neutral steps (Paper → Page Edge), never from shadows. Inputs sit on Page Edge against the Paper surface; rows in the shelf list darken to Page Edge on hover. There is no shadow vocabulary.

The one permitted shadow is a focus ring, expressed as an offset outline using the accent hue at low chroma — not a box-shadow blur. Modals, if they appear at all (see Components when they're documented), use a backdrop scrim of `Margin Ink` at low opacity, not a lifted shadow.

### Named Rules

**The Flat-By-Default Rule.** No `box-shadow` blur values anywhere in the system at rest. Hover is a tonal shift, not a lift. Focus is an outline, not a glow. The reflex of "card with subtle shadow" reads as 2014 product UI; we do not do that here.

**The Tonal Depth Rule.** Two surface lightness steps (Paper, Page Edge) are enough for the entire shelf-and-form vocabulary. If a design needs a third, the layout is doing too much.

## 5. Components

_Omitted in seed mode. Components will be designed during `$impeccable shape` / `$impeccable craft` for each surface, then captured here by a re-run of `$impeccable document` in scan mode._

The system currently anticipates: the **add-book form** (single-column, inline validation, a real rating control), the **shelf list** (the signature surface — book titles as serif, ISBN/pages as mono, no cover thumbnails), the **search field** (inline, not a separate page), and a small set of shared primitives (button, input, label, focus ring). When those land in code, this section receives full specs.

## 6. Do's and Don'ts

These guardrails carry PRODUCT.md's strategic anti-references through to the visual layer.

### Do:

- **Do** tint every neutral toward hue 15° at chroma `0.005`–`0.01`. No raw greys.
- **Do** keep the Foundry Magenta accent on ≤10% of any rendered screen, by visible area.
- **Do** typeset every book title in the shelf list as serif (Title style). It is the system's signature; remove it and the system collapses into another sans-only app.
- **Do** use mono for ISBN numbers and page counts in the shelf list. Those are catalogue values, not language.
- **Do** pair every colour signal (validation, state) with an icon or label. Never rely on colour alone.
- **Do** tune the focus ring to a low-chroma variant of the accent hue, visible against both Paper and Page Edge.
- **Do** prefer inline progressive surfaces (a form expanding into place, search filtering the list as you type) over modals.
- **Do** cap body line length at `65–75ch`.

### Don't:

- **Don't** use brown, tan, beige, leather, faux-wood, or paper-texture fills. No bookshelf metaphors, no ribbon bookmarks, no library-card flourishes. (PRODUCT.md anti-reference: _library / leather-bound cliché_.)
- **Don't** build a Goodreads-style row layout: dense low-contrast rows, star-sprite ratings, cover thumbnails, ad-shaped slots, social-network surface noise. (Named anti-reference: _Goodreads_.)
- **Don't** build a StoryGraph- or shelf-grid-style cover wall, gamified streaks, faux-tactile shelves, or any mass-market reading-tracker chrome. (Named anti-reference: _The StoryGraph / bookshelf-grid apps_.)
- **Don't** apply a SaaS template to this app: no cream gradient hero, no feature-card grid, no "Manage your reading life" marketing tone, no Notion-template-applied-to-books look. (Named anti-reference: _SaaS template applied to books_.)
- **Don't** build a hero-metric dashboard with big numerals and small labels in coloured tiles. This is not analytics. (PRODUCT.md anti-reference: _hero-metric dashboard_.)
- **Don't** build an identical-card-grid layout of book entries. The shelf is a list, not a wall. (PRODUCT.md anti-reference: _identical card grids_.)
- **Don't** use `#fff` or `#000` anywhere in the system.
- **Don't** use `box-shadow` blurs on cards, inputs, or rows at rest.
- **Don't** use all-caps labels or tracked-out uppercase microcopy. The reflex of small-uppercase-tracked reads as 2018 SaaS.
- **Don't** use side-stripe `border-left` accents to colour-code list rows, callouts, or alerts. Ever.
- **Don't** use `background-clip: text` gradients on type. The accent's power comes from rarity, not decoration.
- **Don't** use glassmorphism, backdrop-filter blurs, or frosted panels as a default treatment.
- **Don't** use a modal as a first thought. Add-book is inline. Search is inline. Validation is inline.
- **Don't** add a second accent without rewriting these rules first. The One Voice Rule means one voice.
