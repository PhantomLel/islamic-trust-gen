# Spec v3 implementation plan

Handoff for an implementing agent. Source of truth, in order:

1. Developer Build Specification v3 (24 September 2026).
2. Appendix A Deliverables (1 October 2026), where it supplies copy or a build ticket.
3. This plan, which cuts the spec down to work that can be finished with the facts already in those two documents.

Stack: SvelteKit 2, Svelte 5, Drizzle, Postgres, better-auth, Stripe, Resend, UploadThing, Vitest. Both public sites are this app. `src/hooks.ts` rewrites `mcdanielestateplanning.com` onto the `/mcdaniel` route tree. Muslim Legacy Planning is the rest of the routes.

## Rules for the whole job

- Use shaded and quoted sentences exactly. If a sentence does not fit, change the layout.
- Do not draft legal, marketing, biography, fee, signing, or advertisement copy. If a string is not in the spec or the Appendix A deliverable, leave the slot empty or keep the existing sentence.
- Do not rename internal keys (`goodtree_fit`, `goodtree-trust`, Calendly `utm_source=goodtree`, database columns). Those are stored data and webhook contracts. Change user-facing text only.
- Do not delete historical rows, email templates, knowledge-base versions, or analytics configuration. Disable or stop sending. Keep the old template files in the repo.
- Bump `LOE_AGREEMENT_VERSION` in `src/lib/loe.ts` when the engagement text changes. Do not rewrite acceptance records already stored on matters.
- Run `npm test` before finishing. Add tests next to the behavior they lock.

## Do not build

These are blocked, withdrawn, or still missing a fact. Skip them even if the surrounding feature would be cleaner with them.

| Item | Why it stops |
|---|---|
| Spec section 0 | Access terms. Not a code ticket. |
| Spec 4.1 pre-intake notice | Holding for the free-will representation decision. |
| California will-signing steps | Appendix A marks them DRAFT. Do not render them. |
| California Schedule A | Deed, transfer-tax, and homeowners-exemption items are not written. Do not reuse the Texas schedule for a California matter. |
| Payment routing by state (Appendix A F1) | Leonard has not said whether a Texas fee lands in the IOLTA or the operating account. Leave the current Stripe destination alone. Do not add Illinois, Michigan, New York, or New Jersey routing. |
| Firm countersignature on the engagement agreement | Appendix A says both sides execute. It does not say how the firm signs. Do not invent a signature image or an auto-signature. |
| Street address in the footer, schema, or webinar block | Appendix A item 1 was not delivered. Do not use `firmMailingAddress` in `src/lib/config.ts` for those surfaces. That constant may stay for CAN-SPAM mail already in production. |
| Source-code list, live analytics, Facebook ads | No code list. Spec 5.3 says send the analytics configuration for approval before it goes live. Do not add Google Analytics, a pixel, Tag Manager, or a conversion upload. |
| Licensed hero image | Not delivered. Remove `picsum.photos`. Do not fetch a replacement from another third party. |
| Category list and extra jurisdiction-caveat variants | Not delivered. The Texas marital-property caveat in spec 8.5 is delivered and should be the default. |
| Share-prompt copy, article body copy, video scripts, brand assets | Not delivered. |
| Webinar platform, registration page, reminder mail | Spec 11.2 says confirm the platform before building against it. The registration block also needs the missing address. |
| Yaser Ali Law sentence in the biography | Appendix A says naming that firm is optional. Omit it. |
| “One flat fee. One optional add-on…” | Appendix A marks that line as suggested, not approved. Delete “Nothing extra to buy.” Do not replace it with the suggestion. |
| Masjid-hosted embed, co-branded will wrapper, retargeting audiences, automatic ad text, generative page or chatbot prose | Spec section 13. Withdrawn. |
| Automatic transfer of $75 or 5% to Jabal at checkout | Appendix A: the donation is firm money, not a checkout split. Do not create a Stripe transfer, a second charge, or a payout. |
| “Nonrefundable,” “earned on receipt,” “earned by completing the interview” | Must not appear in checkout or the engagement flow. |

California commercial co-venturer contract is Leonard’s, not a code task. Still replace the live giving copy. The current sentences (“treasurer,” “personally oversees,” “same day,” “5% of your plan,” “was donated”) are the claims Appendix A exists to remove. Do not add the giving claim to any page that does not already make it.

---

## Phase 1 — Tracking inventory, then the privacy notice

Spec 1, then spec 4.2.

Write `docs/tracking-inventory.md` from the code, before changing tags. Record, for each mechanism: where it loads, what it sends, and whether it runs on the free-will interview, the trust app, login, booking, payment, or client pages.

Known mechanisms to include:

- No Meta Pixel, Google Analytics, Tag Manager, session replay, or advertising pixel in `src/app.html` or `src/routes/+layout.svelte`. State that as a finding, not as an assumption.
- Google Fonts stylesheet in `src/app.html`, on every route including the interview and the app.
- `picsum.photos` on the homepage (`src/routes/+page.svelte`).
- Clio Grow booking URL and Calendly notarization URL in `src/lib/config.ts`.
- Stripe Checkout, UploadThing on deed upload, Resend.
- Help assistant calls from inside the trust app, dashboard, and funding flow (`HelpLauncher` on `create-trust`, `dashboard`, `make-your-trust-work`). Retrieval uses Voyage and an OpenAI verifier. `src/lib/help/decisions.ts` already forbids the model from writing the answer. The inventory must say user questions leave the server for ranking and verification.
- First-party UTM capture (`src/lib/utm.ts`, `utm_tracking_event`) stores source, medium, campaign, and on will completion the email. That store is first-party. Say so.

Do not remove Stripe, Calendly, UploadThing, Resend, or the help verifier in this phase. Do not delete `utm_tracking_event` rows.

After the inventory shows no advertising tag on the sensitive routes, add the spec 4.2 notice where substantive intake starts: the first family, asset, or heir question on the free will, and the trust screening / interview. Exact text:

> We use your information to evaluate and, if accepted, provide legal services. Access is limited to authorized firm personnel and service providers operating under confidentiality and security obligations. We do not send your interview answers, documents, or identifiable consultation or client activity to advertising platforms, and we do not use them to build advertising audiences. Optional educational and marketing subscriptions are separate. Our privacy notice explains the information collected, its purposes, service providers, retention, and how to contact us about privacy.

If you find an advertising pixel that this plan missed, stop and do not ship this notice.

Sensitive routes must stay incapable of loading a later sitewide tag. Put any future public-page analytics behind an explicit allowlist of path prefixes. The default is off. Do not implement the analytics property itself.

---

## Phase 2 — Product name and live claim corrections

Spec 2, using Appendix A where it replaces a claim.

### One configuration value

Add the product name to `src/lib/config.ts` and read it from there everywhere a person can see it.

- Full name, used as the tier name and wherever the product is named as an offer or heading: `The Muslim Legacy Planning Guided Trust`
- Approved short forms, used only in running sentences: `the Guided Trust`, `our guided trust plan`
- Required sentence, rendered in the same view whenever the full name is a tier, offer, or heading:

> Complete the guided interview online or with our assistance; an attorney reviews your information and documents before finalization.

Forbidden in user-facing text: `self-guided`, `self-service`, `DIY`, `automated`, `GoodTree`, `Good Tree`.

Sweep pages, email HTML, document templates, PDF output, funding cards, and chatbot strings. `src/lib/server/emails/drip/**` is marketing copy this plan does not rewrite. See Phase 4 for how those sends stop.

Surfaces that already hardcode the old name and need the config value:

- `src/routes/+page.svelte`, `src/routes/plans/+page.svelte`, `src/routes/trust/+page.svelte`, `src/routes/which-plan/+page.svelte`, `src/routes/mcdaniel/+page.svelte`
- `src/lib/components/ScreeningStep.svelte` (the engagement text the client sees)
- `src/lib/components/help/HelpPanel.svelte` greeting and titles
- `src/lib/funding/content.ts`, `src/lib/server/fundingReminders.ts`
- `src/lib/server/emails/freeWillReadyV2.ts`, `paymentReceived.ts`, `closingLetter.ts`, and the other non-drip service templates
- Help answers at render time, via the token in Phase 8

Internal plan keys stay `goodtree-trust`.

### Exact claim edits

Homepage footer (`src/routes/+page.svelte`), replace the national sentence with:

> Attorney-led Islamic estate planning for Muslim families in Texas and California.

Homepage hero, replace the final sentence “We fix both.” with:

> We help families address both.

Problem item 02, replace “A properly funded trust avoids it entirely.” with:

> A properly funded trust is designed to avoid probate for the assets it holds.

FAQ heading, replace “What is probate and why should I avoid it?” with:

> What is probate, and why do families plan around it?

The FAQ answer under that heading still says a trust “avoids probate entirely.” Delete that outcome sentence. Do not write a new one. Do the same anywhere else a sentence states that a trust avoids probate, guarantees a religious result, or says the free will is available in every state. The homepage FAQ “Do you serve families outside Texas and California?” currently says the free will is available in all states. Replace that answer’s scope with the spec 3.1 boundary already quoted in Phase 3. Do not leave “all states” up.

Replace “our educational and technology platform” and close paraphrases with:

> An attorney-led estate-planning practice offering educational resources and technology-assisted legal services.

Firm line, visible beside the primary consultation action without scrolling, on Muslim Legacy Planning:

> Muslim Legacy Planning is the Islamic estate-planning service of McDaniel Estate Planning, PLLC. Legal services by Leonard McDaniel, licensed in Texas and California.

Do not add a street address under it.

Reviews: delete the “13 five-star Google reviews” count. Use “Read our Google reviews.” Point every review link on both sites at:

`https://search.google.com/local/writereview?placeid=ChIJszQ9uNfRQIYRg3017kJNF8Y`

Current bad target is `https://g.page/r/review` in `src/routes/+page.svelte` and `src/routes/mcdaniel/+page.svelte`.

Testimonials in `src/routes/+page.svelte`: remove Aidah Aqil (Atlanta) and the Dr. Mohammad Haque quotation (probate and shariah outcome). Do not relabel them. Build one disclaimer component and render it with the remaining testimonial block, visible without a click:

> Client experience; not a guarantee of results. Legal outcomes depend on the circumstances, proper execution, and implementation.

Reuse that component for any testimonial video in Phase 7.

Tier badge: remove “Self-service.” “Online” may stay. The tier title is the full product name from config, with the required sentence directly under it. Same on `plans`, `which-plan`, and the homepage plans block.

Jabal role outside the giving paragraphs: “serves without compensation as secretary of Jabal Foundation's board.” Delete “treasurer” and “personally oversees its finances.” The giving paragraphs themselves use the Appendix A text in Phase 5, which already includes the secretary sentence.

Biography claims to remove from `src/routes/+page.svelte` and `src/routes/mcdaniel/+page.svelte`: “five years,” “UH Law, top of class,” any Darul Qasim or similar credential. The replacement biography is the attorney page in Phase 6, not a rewrite of the homepage into new marketing.

---

## Phase 3 — Free will gate, notices, flags, watermark, Texas signing

Spec 3 and spec 4.2–4.5. Files: `src/lib/free-will/config.ts`, `src/lib/free-will/logic.ts`, `src/routes/free-islamic-will/+page.svelte`, `src/lib/components/WillWaitlistCapture.svelte`, `src/routes/api/will-waitlist/+server.ts`, `src/lib/server/documents/renderWill.ts`, `src/lib/server/emails/freeWillReadyV2.ts`.

### State gate

State stays the first question. `isStepAnswered` already refuses to continue unless the state is TX or CA. Keep that.

When the selected state is not TX or CA:

- Stop. Do not show name, address, gender, family, asset, or heir questions. Today those steps exist later in `willSteps` and are only blocked by validation. Also hide them.
- Replace the “Coming soon” / “We’ll email you the moment we launch” waitlist copy with the exact spec 3.1 text:

> We currently prepare wills only for Texas and California matters. We are not able to prepare a document for the state you selected.
>
> You are welcome to use the educational resources on this site. If you would like a referral to an attorney licensed in your state, contact us and we will help where we can.

- Then ask, exactly:

> Do you own real property in Texas or California, or do you expect your estate to be administered there?

- Yes routes to consultation booking (`consultationBookingUrl`). The tool does not start the interview.
- No stays on the educational exit. Link to the content library index and the video library index from Phase 7. Until those indexes exist, link to the homepage sections that will be replaced by them, and switch the hrefs when the indexes ship.
- Optional email on that screen is for the referral only. Store it on a lead with a distinct type such as `referral_request`. Do not set a drip sequence. Do not check a marketing box. The current `WillWaitlistCapture` enrolls a marketing lead. That behavior goes away for this screen.

### Notices at account email

Email is collected when the in-state user creates an account at the end of the interview, not at question one. On that screen:

- State that the email is for delivering the document and communicating about the request.
- Marketing checkbox, unchecked by default, not bundled into account creation. Exact label:

> Send me occasional educational and service emails from McDaniel Estate Planning. I may unsubscribe at any time; this is not required to request the free will.

- Persist consent boolean and timestamp on the lead or the user. Unsubscribe already exists (`src/routes/unsubscribe`). Marketing unsubscribe must not suppress service mail (document delivery, payment, signing, booking reminders).

### Flags

When the will flags a situation it cannot handle, replace the user-facing flag copy with exactly:

> This tool does not handle the situation you selected. That does not establish that you need a trust or a paid service from us. Please consult an attorney about your options; you may contact our firm or another attorney.

Do not use “Your will will not work,” “You need our trust,” “You are protected,” or any sentence that assesses the user’s legal position. `emailFlagLabels` in `src/lib/free-will/logic.ts` currently does that (“a will alone does not avoid probate,” and similar). Stop showing those labels to the user and stop putting them in the delivery email.

If `recommendPlan` returns no plan, show no paid offer on the completion screen and none in the delivery email. That function already returns `plan: null` for a zero-flag user. Extend the check to the email renderer in `freeWillReadyV2.ts`.

### Delivery email versus marketing

`freeWillReadyV2.ts` is a document delivery. Remove plan-recommendation cards and other promotional blocks from it. Keep delivery of the document and the signing wrapper below.

Drip sequences under `src/lib/server/emails/drip/**` are marketing and contain the old name and “self-service.” Do not rewrite them. Stop enrolling new leads into those sequences, and stop `processDue` from sending further drip keys. Leave the template files in place. Service mail must still send.

### Watermark

Any free-will document the user can view or download before attorney review gets a header or watermark on every page, in the generated file itself, not only in CSS:

> DRAFT — NOT FOR SIGNATURE

Paid trust documents generated after attorney approval are not this path. Do not watermark those.

### Texas signing instructions

On the free-will completion screen, in the delivery email, and on the pour-over will signing card in the funding module, show the spec 3.4 wrapper for every delivered will:

> Downloading or completing this document does not make it an executed will. Follow the signing and witness instructions for the applicable state before relying on it. Notarization alone is not a substitute for required will witnesses. Ask an attorney about uncertainty or unusual signing circumstances.

Under that wrapper, if and only if the state is Texas, show Appendix A section 4.1, heading and eight steps, verbatim, beginning “How to sign your will in Texas.” If the state is California, show the wrapper only. Do not show section 4.2.

---

## Phase 4 — Attribution plumbing without a code list

Spec 5.1 and 5.2 only.

Add `attribution_code` on `marketing_lead` and on the trust matter. Add `src/lib/attribution.ts` with an exported map of incoming campaign values to short codes. Ship the map empty.

On arrival, read the campaign parameter. If it matches a map key, store the short code through booking and onto the matter at creation. Do not store the raw query string on new lead or matter rows. Do not store email on new `utm_tracking_event` rows. Do not delete old rows.

Do not add an external weekly export, a conversion upload, or analytics. Spec 5.4 is an ads-account setting, not an app change, apart from keeping pixels off the sensitive routes.

---

## Phase 5 — Fee schedule, acceptance record, charity copy

Appendix A sections 1–3, except the blocked rows in the table at the top.

### Texas Schedule A

Append Appendix A section 1.1, verbatim, to the Texas engagement agreement in `ScreeningStep.svelte`. The fee amount rendered in the agreement is the matter’s actual charge (`customPrice` or `defaultPrepFee` from `src/lib/config.ts`). Schedule A’s own text keeps saying “the Flat Fee stated in this Agreement.” Do not hardcode 1499 inside the schedule.

The $35 house-deed retrieval line stays an optional service fee. Do not add a separate recording, filing, or county-cost line item to the same Stripe payment as the legal fee.

Delete “Four documents. One flat fee. Nothing extra to buy.” from `src/routes/trust/+page.svelte`. Do not insert a replacement sentence.

### California clause

For a California matter only, insert Appendix A section 2.1 into the agreement the client signs, verbatim, including “By electronically signing this Agreement, Client expressly agrees to the foregoing arrangement.” Do not put that clause on the payment page instead of the agreement. Do not show it on a Texas agreement.

At the acceptance control, state that clicking constitutes the client’s electronic signature. That phrase is the requirement in Appendix A F2. Keep the existing checkboxes and typed date.

On acceptance, email the client a PDF of the agreement text they accepted, plus the timestamp, the checkboxes, and the date they typed. Store that file on the matter using the existing document storage (`src/lib/server/documents/storage.ts`). The PDF is the client’s acceptance copy. Do not label it as signed by the firm.

### Charity copy

Replace `jabalGivingRate` / `computeJabalDonation` as the displayed donation. One config value: `75` dollars. Do not compute 5% of the charged fee. A $1 test charge must not display $0.05.

Landing page giving section (`src/routes/+page.svelte` and the matching block on `src/routes/trust/+page.svelte`):

> For every Guided Trust purchased, McDaniel Estate Planning donates $75 of its own funds to Jabal Foundation's Legacy Waqf, which supports orphan development and ongoing meal distribution. The donation is made by the Firm and is not part of your fee. Leonard McDaniel serves without compensation as secretary of Jabal Foundation's board.

“Guided Trust” in that sentence is the approved short form. Render it from config so a rename updates it. Do not otherwise edit the sentence.

Payment screen (`src/routes/create-trust/[trust_id]/payment/+page.svelte`), beneath the fee:

> With your purchase, McDaniel Estate Planning will donate $75 of its own funds to Jabal Foundation's Legacy Waqf. This does not come from or add to your fee. Leonard McDaniel serves without compensation as secretary of Jabal Foundation's board.

Confirmation after payment, and the same paragraph in `src/lib/server/emails/paymentReceived.ts`:

> Thank you. McDaniel Estate Planning will donate $75 of its own funds to Jabal Foundation's Legacy Waqf in connection with your purchase. Leonard McDaniel serves without compensation as secretary of the foundation's board.

Use “will donate.” Do not say “was donated” or “the same day.”

Charitable picker, `src/lib/components/NationalCharitiesPicker.svelte`. Replace the heading “A few well-regarded Islamic charities you may want to consider…” with:

> Some Islamic charities in Texas. Listing an organization here is not a recommendation. You may also add any U.S. charity by its legal name and EIN, or leave no charitable gift.

Beside the Jabal Foundation entry:

> Leonard McDaniel, your attorney, serves without compensation as secretary of this organization's board. Including it is entirely your choice and has no effect on your plan, your fee, or our work for you.

If Jabal is selected, require an explicit confirm before the answer is stored. Record the confirmation with a timestamp, same pattern as the heba acknowledgment. Exact prompt:

> You have selected Jabal Foundation, where your attorney serves as an unpaid board secretary. Please confirm this gift reflects your own wishes.

Apply the same heading, disclosure, and confirm on the free-will wasiyyah picker if it lists Jabal.

---

## Phase 6 — Crawlability, attorney page, homepage media

Spec 6, except the missing hero file and the missing street address.

### Tags and files

- Open Graph and Twitter card tags on every public route: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, and the matching Twitter tags. Per page, not one sitewide default. Existing marketing routes set them in `svelte:head` or a small helper. CMS pages in Phase 7 set them from fields.
- `og:image` must be a local file under `static/`, 1200×630 if you can export one from `static/mcdaniel.png` without fetching a remote image. Do not use `picsum.photos`. Remove every `picsum.photos` URL, including homepage video-card seeds.
- `static/robots.txt`. Do not disallow the public marketing routes, the content library, the video library, the free-will landing route, or the calculator.
- `src/routes/sitemap.xml/+server.ts` for Muslim Legacy Planning. A second sitemap response for the McDaniel host that lists public URLs without the internal `/mcdaniel` prefix. Include published CMS URLs and last-modified dates once Phase 7 exists.
- Canonical link on every public page. Muslim Legacy Planning URLs canonical to `https://www.muslimlegacyplanning.com`. McDaniel host URLs canonical to `https://mcdanielestateplanning.com` with the `/mcdaniel` prefix stripped. The two homepages are different pages and must not canonicalize to each other.
- JSON-LD `Organization` and `LegalService` on both hosts. `areaServed` is Texas and California only. Name and phone from `src/lib/config.ts` (`firmPhone`). Omit `address` and `sameAs` until Leonard supplies the address and a verified profile URL. Do not emit the Austin address. Do not link Avvo.

### Attorney profile

New route `src/routes/mcdaniel/about/+page.svelte`, which the host rewrite serves at `mcdanielestateplanning.com/about`.

Person and Attorney structured data. Visible fields: Leonard McDaniel, JD; Texas admitted 2021; California admitted 2023; founder, McDaniel Estate Planning, PLLC; University of Houston Law Center. Arizona stays off this page. The long biography is Appendix A section 5.3 without the Yaser Ali Law sentence:

> Leonard McDaniel is an estate planning attorney and the founder of McDaniel Estate Planning, PLLC. He is licensed in Texas and California and is a graduate of the University of Houston Law Center.
>
> Leonard has focused on estate planning for Muslim families since 2022. He continues to study Islamic inheritance law privately.
>
> He built the Muslim Legacy Planning Guided Trust so that more families could put an attorney-supervised plan in place that reflects Islamic inheritance and is structured under the law of the state where they live.
>
> Leonard serves without compensation as secretary of the board of Jabal Foundation.

The product name in the third paragraph is rendered from config. The sentence is otherwise exact. Drop “when he began working at Yaser Ali Law, an Islamic estate planning firm” rather than keeping a broken clause. The remaining sentence is the one above.

Point the Muslim Legacy Planning About link at `https://mcdanielestateplanning.com/about`, not at a homepage anchor.

Content-page byline, used by the Phase 7 template:

> Leonard McDaniel is an estate planning attorney licensed in Texas and California. He has focused on estate planning for Muslim families since 2022.

The name links to the attorney profile.

### Performance

Run Lighthouse mobile against the homepage, the free-will route, and the McDaniel homepage. Record the scores in `docs/tracking-inventory.md` or a short `docs/performance-baseline.md`. Fix a mobile failure that blocks the page from loading or makes the primary action unusable. Do not chase a perfect score.

---

## Phase 7 — Content platform, page template, video library

Spec 7, 8, and 9. This is the largest phase. Build it in this app, on Muslim Legacy Planning. Do not create a second site.

### Roles

better-auth today has `client` and `admin` (`src/lib/server/auth.ts`). Add `content_author` and `content_publisher`.

- `content_author` creates and edits drafts. Server actions reject publish, unpublish, and schedule.
- `content_publisher` can publish, unpublish, and schedule. Existing `admin` may publish. `admin` remains the role that sees client matters. Do not give Sumayya `admin` in order to let her draft.
- Session lifetime for these two roles: 12 hours idle, then re-authentication.
- Enable better-auth’s two-factor plugin for `content_author` and `content_publisher`. If the installed `better-auth` version does not expose that plugin, stop and report. Do not invent a one-off TOTP.
- Audit table: actor id, action, target type, target id, timestamp. Append only. No UI delete.

### Schema

Drizzle tables, migration via `npm run db:generate`. Suggested shape:

- `content_category`: id, name, slug, sort order. Seed nothing. The publisher can add categories. An empty category list blocks publication with a plain message, which is correct until Leonard sends the list.
- `content_page`: status `draft | in_review | published | unpublished`; question title; slug; answer summary; body JSON; meta description; jurisdiction `TX | CA | BOTH | GENERAL`; category id; last reviewed date; CTA key; social image; published at; scheduled publish at; author id.
- `content_page_revision`: page id, body snapshot, actor, timestamp. Autosave writes a revision. Revert restores one.
- `content_faq`: page id, question, answer, sort.
- `content_related`: page id, related page id, sort, max four enforced in the action.
- `content_redirect`: from path, to path, status code. Editable in the publisher UI. Changing a published slug must prompt to insert a redirect. Unpublish removes the page from the sitemap and returns 404, not a soft 200.
- `video_page`: title, YouTube id, description, transcript, duration, jurisdiction, series, series order, related content page id, testimonial flag, release-on-file flag, speaker title, speaker relationship, status, the same SEO fields as a content page.
- `media_asset`: UploadThing key, alt text, width, height. Alt text required. Publication of a page that uses an image without alt text fails.

Product-name token: a body node type `productName` with no stored string. The renderer substitutes `productName` from config. Server-side validation warns when the body text contains “Muslim Legacy Planning Guided Trust,” “GoodTree,” or “Good Tree” as literal characters. The warning does not silently rewrite the author’s words.

### Editor

Use TipTap, stored as JSON, rendered to HTML on the server. Extensions: heading, bold, italic, link, bullet list, ordered list, blockquote, the product-name token. No raw HTML, no script, no iframe, no style attributes. Paste from Word must drop classes and inline styles.

Preview route renders the same component as production, including a narrow viewport. Required-field messages are plain language: “Answer summary must be 40 to 60 words,” “Meta description must be 150 to 160 characters,” “Title should end with a question mark” (warning, not a hard block, unless you already hard-block the other required fields — the question mark is a warning per spec 7.3). Last reviewed date, jurisdiction, category, and CTA are hard blocks.

Statuses and actions: save draft, submit for review, publish, schedule, unpublish. A scheduled page goes live from a cron path next to the existing drip cron (`src/routes/api/cron/drip/+server.ts`), or a sibling cron. Publishing and unpublishing regenerate sitemap data. Do not call a Search Console API unless credentials already exist in the project. They do not. Skip the ping rather than adding a new Google credential.

### Public template

One component, `src/lib/components/content/ContentPage.svelte`, used by `src/routes/answers/[slug]/+page.server.ts`. Flat path `/answers/{slug}`. Load published pages on the server so the answer summary is in the document HTML.

Order, with nothing between the first two:

1. H1, the question title.
2. Answer summary, a `<p>` or `<div>` in the server HTML, visually distinct (light background, indent, larger type).
3. Byline: the short biography from Phase 6, name linked to the attorney profile, plus the last-reviewed date.
4. Body. H2s are the author’s.
5. Jurisdiction caveat when jurisdiction is TX, CA, or BOTH. Default Texas text, exact:

> This example concerns Texas community-property law. California also has community property, but its rules are not identical, and other states may treat ownership and spousal rights differently.

Store an optional per-page override. Empty override uses the default for TX. CA and BOTH use the override if present, and the same default if not. GENERAL pages render no caveat and no state gate.

6. FAQ block, if any, plus `FAQPage` JSON-LD.
7. Related questions, up to four.
8. One CTA from this set: book a consultation, use the free Islamic will, watch the related video, read the next question, none. “Use the free Islamic will” is selectable only when jurisdiction is TX or CA. GENERAL pages cannot select it. “Register for the webinar” is omitted until Phase 11 is unblocked. “None” renders nothing.

Also emit `Article` JSON-LD whose author `@id` is the attorney profile URL, `BreadcrumbList`, canonical, and Open Graph from the page fields. Heading hierarchy starts at the H1 already rendered. Do not put a hero, breadcrumb bar, share buttons, or newsletter form between the H1 and the summary. A visually hidden breadcrumb is not a substitute. Breadcrumb schema can exist without a bar in that slot. Put any visible breadcrumb below the summary if you need one for navigation.

### Library index, search, review dates

- `/answers` is a server-rendered index, filterable by category and jurisdiction. It is a real document, not a client-only list.
- Site search covers published answers and published videos. A server endpoint is enough. No third-party search vendor.
- Publisher dashboard lists pages whose last-reviewed date is older than six months.
- Monthly email to Leonard with that list, sent through Resend from the cron. One email. Do not enroll him in a marketing drip.

Homepage, plans, trust, free will, and calculator stay as code. Say that in the publisher UI so “unpublish” is not implied for those routes.

### Video

Each video is `/videos/{slug}`, plus `/videos` index and series pages with next and previous.

Embed rules:

- Facade: local thumbnail and a play button. Do not request `youtube.com` or `i.ytimg.com` on load.
- On click, iframe `https://www.youtube-nocookie.com/embed/{id}`.
- Transcript is required and is visible text under the player.
- `VideoObject` JSON-LD: name, description, thumbnail URL on this site, upload date, duration, embed URL.
- Testimonial flag requires `release_on_file` before publish. The Phase 2 disclaimer component is on screen with the video, not only in the description.
- If the testimonial is an endorsement, speaker title and relationship are required and visible.
- No video iframe, facade, or `VideoPlayer` YouTube usage inside `create-trust`, the free-will interview, payment, consultation, dashboard, or funding. The existing `src/lib/components/VideoPlayer.svelte` plays uploaded mp4 for the app. Leave that player on those routes. Do not point it at YouTube.

Transcript product-name mentions use the same token as articles. There are no source video files in the repo. Do not build a file closet for unedited camera masters inside the web app. That is a storage decision outside this codebase.

Featured video on the homepage: a publisher-selected published video id. If none is selected, render no video slot. Do not keep the picsum cards.

---

## Phase 8 — Chatbot additions

Spec 12. The retrieval design stays. `HELP_PRODUCT_DECISIONS.modelsNeverWriteProse` stays true. Do not add a generation call.

- When `HelpPanel.svelte` opens, show this before the first answer, not behind a link:

> Automated information assistant, not an attorney. It provides approved general information about our services and cannot advise on your situation. Please do not enter confidential information here.

- Search help prompts, greetings, and knowledge-base answers for questions that ask for family details, asset descriptions, or the user’s situation. Remove those prompts. If an answer needs those facts, the response routes to intake or consultation and does not ask.
- Low confidence (`resolveResponsePolicy` fallback in `src/lib/help/responsePolicy.ts`): return up to five approved entry titles as a “did you mean” list, each linking to that entry’s answer or, when Phase 7 has a published page linked from the entry, to that page. Then the existing support route. Do not stitch fragments of several answers into a new paragraph. Keep `noPossiblyRelatedOnLowConfidence` behavior for anything that is not an approved title.
- `kb_entry_version` already snapshots entries. When a message is served, store the version row id on the help message. Admin transcript view shows that id and `createdAt`.
- Render `{{productName}}`, `{{productNameShort}}`, and `{{productNameRunning}}` in approved answers from config at serve time. Replace hardcoded “GoodTree” / “Good Tree” in served answer text with the token. Do not rephrase the rest of the answer.
- Add an optional content-page slug on the knowledge-base entry. When that page is published, the served answer includes the link.

---

## Phase 9 — Tool routes

Spec 10, limited to what can be done without article copy.

Do not write a new essay for the will, the calculator, or the trust product. Do this:

- Confirm the introductory text already in `src/routes/free-islamic-will/+page.svelte`, `src/routes/inheritance-calculator/+page.svelte`, and `src/routes/trust/+page.svelte` is in the server-rendered HTML.
- Add the Phase 6 social tags, canonical, and a specific `og:description` taken from sentences already on those pages. Do not write a new family-group-chat blurb.
- The free-will route stays nationally readable. The interview itself remains gated by Phase 3.
- The trust route uses the product name, the required attorney-review sentence, and the Phase 5 edits. It is not a new article.
- Share links may append the attribution parameter from Phase 4. Do not add a completion-screen share prompt. That sentence was not delivered.

---

## Tests to add

- Product-name helper is the only source of the full name. A fixture page or email render contains the config value and does not contain `GoodTree`.
- Out-of-state free will: after a non-TX/CA selection, the active step list does not include `full_legal_name` or heirs. Referral email does not create an active drip row.
- Texas completion email contains “How to sign your will in Texas” and “DRAFT — NOT FOR SIGNATURE” is present in the generated free-will document. California completion email does not contain the California draft steps.
- Zero-flag `recommendPlan` path: delivery email has no paid-plan card.
- Displayed Jabal amount is 75 at any fee, including a 1 dollar fee.
- Texas agreement render includes “SCHEDULE A — SCOPE OF THE FLAT FEE” and the matter fee. California agreement render includes “Deposit to Operating Account” and the Texas schedule is absent.
- A string search over user-facing agreement and payment components finds no “nonrefundable” and no “earned on receipt.”
- Content publish action rejects a missing answer summary, a summary outside 40–60 words, a meta description outside 150–160 characters, a missing alt text, and a testimonial video with `release_on_file` false.
- `content_author` publish action throws. Unpublish of a published page yields 404.
- Renderer substitutes the product-name token and does not require a republish when the config constant changes. Test by rendering twice with two values.

## Done when

- A person in a state other than Texas or California cannot enter a family fact into the free will.
- No advertising script is loaded on the interview, app, login, booking, payment, or client pages.
- The homepage no longer says the practice is nationwide, that a trust avoids probate outright, that Leonard is treasurer, or that the will exists for every state.
- The product name used on a heading comes from `src/lib/config.ts`.
- A publisher can create a question page, publish it, see it at `/answers/{slug}` with the summary in the raw HTML, and unpublish it to a 404 without a deploy.
- A video page shows a local thumbnail, loads `youtube-nocookie.com` only after a click, and shows the transcript as text.
- Texas clients see Schedule A and the eight signing steps. California clients do not see the Texas schedule or the draft California steps.
- The donation figure on the payment page is $75 of firm funds, including the secretary sentence, and checkout does not transfer that money.

## Still Leonard’s

Address, free-will representation decision and the 4.1 notice, California signing steps, California Schedule A, where Texas fees are deposited, firm countersignature, source codes, hero photograph, categories, caveat variants, share prompt, articles, video scripts, webinar platform, analytics approval, and the Jabal co-venturer contract.
