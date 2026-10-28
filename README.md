# Focal Forge Studios — Website

A fresh static website for Focal Forge Studios, an independent creative and digital studio based in Kampala, Uganda.

## The idea

The website is designed around the studio's two disciplines as distinct experiences, rather than a generic agency template:

- **Creative production** — cinematic, image-led, tactile, editorial.
- **Digital engineering** — precise, typographic, system-led, with its own visual language.

The disciplines share a studio voice and an orange accent, but deliberately differ in composition, imagery, surfaces, and content rhythm. The page uses a consistent dark base with subtle charcoal variation to avoid abrupt, unnecessary light-section jumps.

## Stack

- Semantic HTML
- Separate CSS design system in `styles.css`
- Vanilla JavaScript in `main.js`
- No build step or framework dependency; compatible with GitHub Pages
- Responsive layout, keyboard-operable discipline selector, portfolio filters, reduced-motion support, and basic organization metadata

## Run locally

Open `index.html` in a browser or serve the directory using any static file server.

## Enquiry form

The contact form validates the brief and prepares an email through the visitor's mail application. It does **not** persist submissions to a database. A server-side delivery route and spam protection should be added before relying on this as a lead-management system.

## Before calling it production-ready

1. Confirm image rights and approve the final image selections.
2. Replace sample portfolio labels with real, approved case studies, outcomes, and client names where permitted.
3. Verify all business details and social links.
4. Test at real mobile, tablet, and desktop sizes and check keyboard navigation.
5. If form submissions need to be captured reliably, connect a backend and configure delivery and spam protection.
6. Confirm the final domain, canonical URL, analytics and privacy requirements.
