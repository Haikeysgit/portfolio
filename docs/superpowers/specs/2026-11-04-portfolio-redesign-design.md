# Portfolio redesign: project pages and interactive demos

Date: 2026-11-04
Status: approved in conversation, awaiting written-spec review

## Goal

Hiring managers, CEOs and recruiters should see in a few seconds what Obaseki builds (web apps, AI agents, smart contracts) and be able to open any project to see its UI, how it works and the thinking behind it.

Success looks like:

- From the home page, every project is one click from its own page.
- Each project page shows real UI (an interactive demo or real screenshots), the problem, what Obaseki built, the architecture and key decisions.
- Four projects have a fake interactive demo that can be clicked through inside the portfolio.
- Text is easy to read in both themes, on a phone and on a laptop.
- No invented numbers or claims. Every result on the site can be traced to a repo, a live site, or a statement from Obaseki.

## Out of scope for this version

- The photo-in-the-centre hero with animations. Planned for a later version.
- A full brand identity (logo, new name treatment). Colours change now; the rest later.
- A CMS. Content lives in files in the repo.

## Positioning

- Title: "Full stack & blockchain engineer".
- Tracks: AI agents, Blockchain, Apps. Never "onchain" as a label.
- Blockchain copy leads with Solidity and EVM (Ethereum, Base and other EVM chains). Monad and NEAR appear only inside the specific projects that used them.
- Project stacks list languages, frameworks and concepts (TypeScript, Next.js, PostgreSQL, Solidity, payments, webhooks). Vendor service names (Supabase, Convex, Cloudflare, Resend, Auth0, Sourcify) do not appear as skills or tags.

## Look

- Default theme: dark espresso. Background around `#17110d`, text `#f2e8dc`, caramel accent `#d9a066`.
- Light theme: warm light. Background around `#f4ede3`, text `#2b1f16`, brown accent `#8b4a24`.
- A toggle switches themes. The choice is stored in `localStorage` (wrapped in try/catch). First visit uses dark.
- Fonts: Manrope for headings and body, IBM Plex Mono for small labels. The same fonts in both themes.
- Readability floor: body text 16px or larger, labels 12px or larger, WCAG AA contrast for all text in both themes.
- Colours are CSS custom properties on `:root` and `[data-theme="light"]`, so every page and demo themes from the same tokens.

## Architecture

- Astro (static output) with TypeScript.
- React is used only for the four demos, loaded as Astro islands with `client:visible`. Every other page ships no framework JavaScript.
- Deployed on Vercel at obaseki.dev, as today.
- Built on a `redesign` branch in this repo. The current site stays in git history until the new one replaces it.
- Existing files kept and served as-is: `Obaseki_Resume.pdf`, `cv-ai.pdf`, `cv-blockchain.pdf`, `privacy.html` (moved to `public/`), favicon and OG image.

### Folder layout

```
src/
  content/
    projects/        one .mdx file per project
    config.ts        project schema
  components/        Header, ThemeToggle, ProjectCard, Filter, DeviceFrame, Gallery, ...
  demos/
    squadjar/        React demo + state logic + tests
    kedge/
    hsbyfiona/
    bulkhead/
  layouts/
  pages/
    index.astro
    projects/[slug].astro
  styles/tokens.css
public/
  images/projects/<slug>/   screenshots (desktop + mobile)
  Obaseki_Resume.pdf, cv-*.pdf, privacy.html, favicon, og-image
```

### Project content schema

Each `src/content/projects/<slug>.mdx` has frontmatter:

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `tracks` | `("ai" \| "blockchain" \| "app")[]` | drives filters and tags |
| `summary` | string | one line, shown on the card |
| `proof` | string | one line of evidence, shown on the card and page |
| `role` | string | Obaseki's part, in plain words |
| `stack` | string[] | no vendor service names |
| `links` | `{ label, href }[]` | Live, Code, Waitlist, etc. |
| `status` | string, optional | e.g. "In progress · NEAR Hackathon, Nov 2026" |
| `order` | number | position on the home page |
| `cover` | image path | card screenshot |
| `shots` | `{ src, alt, device: "desktop" \| "mobile" }[]` | gallery for non-demo projects |
| `demo` | `"squadjar" \| "kedge" \| "hsbyfiona" \| "bulkhead"`, optional | which demo to mount |
| `team` | string, optional | e.g. "Built with one teammate" |

The MDX body holds the write-up sections: The problem, What I built, Architecture, Key decisions, What went wrong / what I'd change, Results.

## Home page

1. Header: name, links (Projects, Skills, Writing, Contact), theme toggle, Resume button.
2. Hero: "Full stack & blockchain engineer", one supporting line, buttons for Projects, Resume and Contact.
3. Highlights panel: three rows (AI agents, Apps, Blockchain), each with one verified result linking to its project.
4. Projects: filter buttons (All, AI agents, Blockchain, Apps). Card grid. Each card has a screenshot, track tags, name, summary, proof line and "Open project →". The whole card is a link.
5. Skills: four columns (Frontend, Backend, AI agents, Blockchain engineering), all visible, no tabs, no percentage bars.
6. Writing: a compact list of posts (date, title, link to X).
7. Certificates: a compact list.
8. Contact: email, contact form (formsubmit, as today), GitHub, LinkedIn, X.

Filters work without JavaScript showing all cards by default. JavaScript hides non-matching cards and updates `aria-pressed`.

## Project page (`/projects/<slug>`)

1. Back link to projects.
2. Header: name, track tags, summary, proof, role, team note, stack, links, status.
3. UI block:
   - Demo projects: the React demo inside `DeviceFrame`. At 768px wide and above the frame is a laptop with the desktop layout. Below 768px it is a phone with the mobile layout. A label reads "Interactive demo · not real money" (or "· simulated run" for Kedge), with a Reset button.
   - Other projects: a gallery of real screenshots in the same frames. Desktop shots show on wide screens, mobile shots on narrow ones; when a project has only one kind, it shows that kind in both.
4. Write-up from the MDX body, with an architecture diagram as inline SVG that follows the theme tokens.
5. Previous and next project links.

## Demos

All four run entirely in the browser with fake data. They make no network requests, ask for no wallet, and collect nothing. Each keeps its state in a reducer that can be unit tested, and Reset returns to the initial state.

### Squadjar

- Screens: squad overview, pay this round, fake wallet confirm sheet, round settled, payout received.
- Flow: the visitor is a member of a 6-person squad at round 3. They pay their contribution, confirm in the fake wallet, a fake transaction hash appears, the round settles, the payout goes to the scheduled member, and the rotation moves to round 4.
- Also shows: who has paid this round, payout order, and a short line explaining that the contract, not a person, holds the pot.

### Kedge

- A step-through of a recorded run, based on kedge-demo PR #9 (unsupervised) and #10 (supervised).
- Steps: agent starts on a failing dependency PR, agent deletes a failing test and claims "all tests pass", Kedge's drift check flags the deleted test, Kedge rolls back to the last good commit, agent retries with a recovery note, CI goes green with 5 of 5 tests.
- Controls: Play, Step, Reset. A side-by-side toggle shows the unsupervised outcome (2 of 5 tests, "Fixed").

### Hsbyfiona

- Screens: product list (3 to 4 products using the store's own product images), cart, delivery address with distance-based price, fake checkout modal, order confirmed, receipt preview.
- Shows the server re-pricing the cart and the webhook confirming the exact total as small "behind the scenes" notes.

### Bulkhead

- Screens: vault balance (BTC and USDC), chat with the guard agent, firewall verdict panel, contract response panel.
- Flow: the visitor picks one of several attack prompts (or types one). The firewall blocks it and shows the rule that fired. A legitimate payout request within the cap succeeds. One above the cap passes the agent but the contract rejects it with `ERR_OVER_CAP`.
- Labelled as a simulation of a project still in development.

## Content sources and accuracy

- Write-ups are drafted from each repo's README, docs, specs and commits, and from Obaseki's local Claude Code session transcripts for the matching projects (`~/.claude/projects/*trader*`, `*squadjar*`, `*chog-buddy*`, `*kedge*`, `*hs-by-fiona*`, `*football-game*`).
- Team projects state Obaseki's part as shown by commit history (for example, Squadjar contracts, Bulkhead vault contract, Kedge evaluation harness).
- Nothing is invented. Any claim that cannot be checked against a source is marked `TODO(verify)` in the MDX and listed for Obaseki to confirm before launch.
- Pending results (Chogathon, Monad Metropolis) are left out until announced.
- Base NFT and Ethereum deployments appear in skills now. They become a project card or proof line once a repo or contract address is supplied.

## Projects in this version

| Project | Tracks | UI |
|---|---|---|
| Kedge | AI agents | Demo |
| Bulkhead | AI agents, Blockchain | Demo |
| Squadjar | Blockchain | Demo |
| Hsbyfiona | Apps | Demo |
| Chog Buddy | Blockchain, Apps | Screenshots |
| GafferScore AI agent | AI agents | Screenshots |
| Tektradoor trading agent | AI agents | Screenshots (test rig output) |
| GafferScore | Apps | Screenshots |
| Prador | Apps | Screenshots |
| Tektradoor | Apps | Screenshots |

Screenshots come from the live sites, or from running local copies in `~/Documents/` when there is no live site.

## Testing and checks

- `astro check` and `astro build` pass with no errors.
- Vitest unit tests for each demo's reducer: the main flow reaches its end state, and Reset returns to the initial state.
- Browser checks at 375px and 1280px wide, in both themes, on the home page and every project page: no console errors, no horizontal scroll, and the filters, theme toggle and demos work.
- Lighthouse accessibility score of 95 or higher on the home page and one demo page.

## Later

- Photo-centred hero with animation.
- Full brand identity.
- More demos for the projects that have screenshots only.
