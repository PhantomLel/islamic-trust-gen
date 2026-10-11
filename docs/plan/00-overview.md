# Phase 1 completion plan: overview

**Read this first, in every session.** Then read `00-tests.md`, then do exactly one task file.

**Tests come first.** Before touching app code, write that task's tests from `00-tests.md`, confirm they fail, then implement until they pass.

## Context
- Stack: SvelteKit 2, Svelte 5 runes, Drizzle on Neon Postgres, better-auth, Resend, Stripe, UploadThing, Vitest, deployed on Vercel.
- One app serves two sites:
  - muslimlegacyplanning.com (MLP) is the root route tree.
  - mcdanielestateplanning.com (MEP) is `src/routes/mcdaniel/**`, reached through the reroute in `src/hooks.ts`.
- Specs, verbatim, live in `docs/specs/`:
  - `v3-spec.md`, cited as **V3 §x**
  - `appendix-a-deliverables.md`, cited as **AppA §x**
  - `addendum-a-websites.md`, cited as **AA Wx**
  - `addendum-b.md`, cited as **AB Bx**
  - `will-templates-v2.md`, cited as **TPL**. Its appendix holds the Texas self-proving affidavit.
- Precedence: owner decisions below > AB > AA > V3 > AppA.
- `docs/spec-v3-implementation-plan.md` is **superseded**. Do not follow its "Do not build" table.

## Ticket IDs
Code comments already use `A1–A8`, `B1–B7` and `C1–C6`. Those refer to an older free-will fixes packet, not Addendum B. Tag new comments as follows:
- `AB-6.1` for Addendum B tickets.
- `AA-W2.3` for Addendum A tickets.
- `V3-4.3` for v3 spec sections.

## Owner decisions (override the specs)
| # | Decision |
|---|---|
| D1 | The free will is delivered as a **plain PDF** generated directly in code. It is not locked, and no DOCX is produced or stored. Store the PDF and the answers. Overrides AB B6.8 and the TPL "Output" row. |
| D2 | TPL prints the backup executor and backup guardian sentences unconditionally, so require **2 executors** and, when there are minor children, **2 guardians**. The third executor stays optional. |
| D3 | The TPL wasiyyah "Notes" column renders empty. |
| D4 | The free will has **no account step**. Collect name, email and the opt-in, then generate, email and show a download link. Existing accounts and signed-in users keep working. |
| D5 | **One role: `admin`.** Remove `content_author` and `content_publisher` and convert existing holders to `admin`. Remove 2FA, `/login/staff`, the security page, the team page and the 12-hour idle logout. Video editors get **no** portal account. Overrides AB B3 and V3 7.1. |
| D6 | Content statuses are `draft`, `published` and `unpublished`. Remove "in review" and "submit". Keep scheduling, where a scheduled page is a draft with `scheduledPublishAt` set. |
| D7 | Videos are entered by **YouTube URL**. Editors upload Unlisted to the firm channel through YouTube Studio's Editor role. The server auto-fills the title, description, duration, date, privacy status and thumbnail from the YouTube Data API using an **API key only** (no OAuth), with oEmbed as a fallback. The transcript comes from an uploaded captions file. Publishing never calls YouTube. Overrides AB B4. |
| D8 | Reviews come from the owner's paid **Elfsight Google Reviews widget**, embedded on both home pages only. No Places API. Overrides AA W5.1's "no Google script in the browser" and server-side rendering. W5's other rules still apply: no star filtering, no review JSON-LD, read and leave links, testimonial disclaimer. |
| D9 | The canonical host is **www** for both domains. |
| D10 | **MEP and MLP keep distinct styles.** Apply AA W8 defect fixes only. Ignore W8.2's "make them identical", except the price format and the footer NAP. |
| D11 | **Do not change the help assistant.** V3 §12 is already done. |
| D12 | **The privacy policy (AB B9) is deferred.** Render "Privacy Policy" mentions as plain text, with no link, until `/privacy` exists. |
| D13 | Remove the free will's end-of-flow acknowledgment step entirely: both the self-help checkbox and the Texas community-property checkbox. AB B6.1 and B6.6 replace them. |
| D14 | Webinar: one "next webinar" record. The call is **Zoom only**. `join_url` must be an `https` Zoom join link (`zoom.us` or a subdomain, path `/j/`, `/w/`, `/s/`, `/my/`, or `/wc/`). No Zoom API, Zoom registration, or Zoom reminder mail. We send our own emails. Overrides the V3 11.2 hold to confirm a platform. |
| D15 | Attribution uses `?src=` codes validated against the AB B2 patterns. Stop writing new `utm_tracking_event` rows; keep the table and the admin tab read-only. |
| D16 | Self-host all web fonts and the Video.js CSS. |
| D17 | Skip `llms.txt` (AA W9.7). |
| D18 | The firm NAP everywhere is AA W9.5 (Wortham), including the CAN-SPAM email footer. |
| D19 | **AB B6.9 is dropped.** No 15-case calculation test suite and no `docs/b69-results.md`. The PDF (task 04) may ship without it. Do not modify the inheritance calculator or its existing tests. |

## Out of scope
- Phase 2 app work: fees, payment routing, the closing letter, the trust templates.
- AB B9 privacy policy.
- V3 §5.3 analytics.
- Help-assistant changes.
- Drip emails: leave them as they are, with sends stopped.

## Rules for every task
- Use copy from `docs/specs` **verbatim**. Never draft legal or marketing copy. If a string is missing, leave a `TODO(Leonard)` and list it in your final message.
- Never rename internal keys: `goodtree-trust`, `goodtree_fit`, DB columns, Calendly `utm_source=goodtree`.
- Never delete historical rows.
- Schema changes go in hand-written, idempotent SQL in `drizzle/00NN_*.sql`, following the style of `0008`, plus matching `src/lib/server/db/*.schema.ts` edits. Do not run `drizzle-kit generate`; the snapshots are stale.
- No third-party script or request may be added to the free will, the trust app, login, payment or dashboard.
- Write the tests from `00-tests.md` **first**. Keep to that list; it is the required minimum, and you should not pile on more. `npm test` must pass before you finish.
- Finish each task with a short report: what changed, the tests added, and any TODO(Leonard).

## Order (do one per session)
1. `01-foundation.md`: settings helper, NAP, origins, superseding the old plan.
2. `02-free-will-flow.md`: AB B6.1–B6.7, the kill switch, no account step.
3. *(removed: there is no separate calculation-engine test task.)*
4. `04-free-will-pdf.md`: AB B6.8 with TPL.
5. `05-mlp-copy.md`: V3 §2, AA W2, W3.1–W3.2, W6.2, W7, AB B8.
6. `06-mep-pages.md`: AA W4, W6.1, AB B7.
7. `07-hosts-routing.md`: AA W1.
8. `08-reviews.md`: AA W5.
9. `09-a11y-polish.md`: AA W8 and the hero image.
10. `10-seo.md`: AA W9 and V3 §6 deltas.
11. `11-plans-quiz-calculator.md`: AA W3.3.
12. `12-attribution-share.md`: V3 §5 with AB B2 codes, and V3 10.4.
13. `13-portal-simplify.md`: D5 and D6, categories, caveats.
14. `14-video-by-url.md`: D7, video metadata filled in from YouTube.
15. `15-tool-pages.md`: V3 §10.
16. `16-webinar.md`: V3 §11 and D14.

## Human-only items (no code)
- V3 §1: check the Vercel, Stripe, Resend, Clio and Calendly dashboards for injected tags (see `docs/tracking-inventory.md`).
- Vercel: add the `www` domains and set apex → www redirects.
- Google Cloud: enable YouTube Data API v3 and set `YOUTUBE_API_KEY`.
- Elfsight: confirm the reviews widget has no star filter, rich snippets off, and branding hidden (task 08 §4).
- YouTube Studio: give each editor the Editor role.
