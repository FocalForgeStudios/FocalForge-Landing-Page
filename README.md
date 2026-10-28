# Focal Forge Studios — Industrial Brand Hub

A responsive studio website with a restrained black / charcoal / white palette and a single orange accent (`#FF5722`). Built with semantic HTML, vanilla CSS/JavaScript, and an optional Node/PostgreSQL API.

## Frontend features

- Sticky glass-effect navigation and responsive mobile menu
- Interactive cinematography/software hero mode switch
- Distinct visual media and software capability worlds
- Filterable project archive with case-study dialogs
- Four-step project scoper with editable indicative UGX assumptions
- Interactive client workspace preview for milestones, proofing and vault metadata
- Accessible focus states, reduced-motion support, semantic labels, and responsive layouts
- Inquiry form with API submission when configured and email/WhatsApp fallback links

## Backend

See [backend/README.md](backend/README.md). The Express API validates and stores project enquiries in PostgreSQL, supports published-project and pricing-catalog read endpoints, and optionally sends webhook notifications. The schema and migration runner are included.

## Run locally

For a quick frontend preview, serve the repository root with any static server. For example:

```sh
python -m http.server 8080
```

Open `http://localhost:8080`. To enable database-backed enquiries, deploy/configure the API separately and set the `ff-api-base` meta tag in `index.html` to its HTTPS origin.

## Important launch boundaries

- The project scoper provides a **directional estimate only**. Baseline prices are assumptions in `main.js` and must be approved by the studio before they are treated as a commercial price list.
- Archive entries and case-study descriptions are illustrative until the studio supplies approved, verified project briefs and outcomes. No fabricated client metrics are claimed.
- The client workspace is a front-end demo. It is not authenticated, does not store proofing sign-offs, and does not provide real downloads.
- Database storage and webhook alerts are not active until the backend is deployed with valid environment variables.
- Add CAPTCHA/Turnstile, monitoring, backup policies and a secured admin/CMS workflow before a production launch.

## Palette and type

- Black: `#101010`
- Charcoal: `#191919` / `#202020`
- White: `#F5F5F2`
- Brand orange: `#FF5722`
- Display: Space Grotesk; body: Inter; metadata: DM Mono
