**McDANIEL ESTATE PLANNING, PLLC**

**Developer Build Specification**

Complete build — compliance, content platform, discovery

| **Field** | **Detail** |
| --- | --- |
| For | Abdullah |
| From | Leonard McDaniel |
| Date | September 24, 2026 |
| Version | 3.0 — supersedes v1.0 and v2.0 in full |
| Properties | muslimlegacyplanning.com, mcdanielestateplanning.com, the trust app, the free Islamic will, the chatbot |
| Product name | Changed. See Section 2 — this is the main difference from v2.0. |
| Supersedes | All earlier tracking and analytics instructions, including any prior request to install Meta Pixel, Conversions API, or a site-wide tag manager container |

# **How to use this document**

This is the complete build. It is written so you can work through it start to finish without coming back to me for architectural decisions — everything structural is settled here. Where I still owe you a fact or a piece of copy, it is marked and listed in Appendix A.

Some of this reverses instructions I gave earlier, following a professional-responsibility review of the whole marketing programme. Where this document and anything I previously said conflict, this document wins.

**Order matters. **Section 1 is stop-work and comes before everything, including work in progress. Sections 2 through 5 are compliance gates — nothing customer-facing launches until they are done. Sections 6 through 11 are the build proper, and Section 7 is the largest piece of work in the document. Section 13 is a list of things not to build.

**On the copy blocks. **Any text in a shaded box is approved language. Use it exactly as written. Do not improve it, shorten it, or adapt it to fit a layout — if it does not fit, change the layout and tell me. Each of those sentences was drafted to satisfy a specific rule and a small edit can break it.

**On judgment calls. **If a ticket is ambiguous, or you find something that looks like it belongs in Section 1 but is not listed, message me rather than deciding. I would rather answer a question than discover an assumption later.

**If you already started from v2.0: **the only substantive change is the product name and the naming hygiene that goes with it — tickets 2.1 to 2.3, plus 7.4b, 9.2b and 12.5. Everything else is identical. Keep going with whatever you have in progress.

No hour estimates are requested. Bill your actual time.

# **What we are building, and why**

Context so the tickets make sense as a whole rather than a list.

The business runs on booked consultations. Most convert to app clients on the same call. My constraint is that I am in El Paso for the next year, cannot travel to Houston or Dallas, and hold a full-time position — so anything requiring my physical presence or weekly attention will fail.

That rules out the channels I have leaned on for four years. What replaces them has to work while I am not looking at it: content that ranks and gets cited, video that keeps playing, and a tool people share.

Three things follow, and they explain most of this document:

- The site currently has nowhere to put content. One article, near-orphaned. Two interactive tools that generate no crawlable pages at all. Section 7 fixes this — it builds a content platform I can publish to without you, which is the single most important thing in this spec.

- AI assistants are producing clients. A recent client found me by asking an assistant who to use in Houston; ordinary search produced one click in the same month. Pages therefore need to be structured so an assistant can lift a clean answer and attribute it. That shapes the page templates in Section 8.

- The free will is the best asset we have and it is currently invisible. It emits no URLs, captures nothing at the start, and shares as a bare link with no preview. Sections 6, 4 and 10 address those three failures.

Muslim Legacy Planning is the destination: where someone reads, watches, uses the tools, and books. McDaniel Estate Planning stays the credibility anchor and the attorney profile lives there. Content goes on Muslim Legacy Planning.

# **Section 0 — Before you touch anything**

Conditions on access, not tickets. They apply for the duration of the project.

### **0.1  ****Written terms before production access**

A short signed agreement needs to be in place before you have access to any system holding client or prospective-client information. I am drafting it. It covers confidentiality, security, no secondary use, no AI training on data from these systems, no subcontractors without my written approval, access logging, incident reporting within 72 hours, and deletion on request.

This is not about trust. Information in a law practice carries obligations that follow the data to whoever holds it, and I am required to have this documented rather than assumed.

### **0.2  ****Least privilege, named accounts, time-limited**

- Your own named account on every system. Never my credentials.

- Access requested per task and scoped to it; tell me when done so I can revoke.

- Multi-factor authentication wherever supported.

- No full-database exports. If a task seems to need one, ask first.

### **0.3  ****Staging and synthetic data by default**

Build and test against fabricated records. No real client data in development fixtures, demo environments, screenshots, or anything shared for review. Public demonstrations of the app run on staging with invented families.

### **0.4  ****Practice management system**

Do not request Clio access. Sumayya handles work inside it. If a ticket here appears to require it, it is either misdrafted or hers — flag it.

# **Section 1 — Stop first**

**This comes before all other work, including anything in progress. **Advertising and analytics code may be transmitting information about people using the free will interview and the trust app. Those interviews collect family names, asset descriptions and heir information. Sending a record of that activity to an advertising company is a confidentiality problem regardless of whether field contents travel with it, because it reveals that an identified person sought legal help with their estate — on a site that also identifies them by faith.

### **1.1  ****Inventory every tracking mechanism currently live**

**Deliverable: **A written list, sent to me before you change anything

Across both domains, the trust app and the free will, identify everything transmitting to a third party:

- Google Analytics in any version, and Google Tag Manager containers

- Meta Pixel, Conversions API, or any server-side Meta integration

- Any other advertising pixel — Google Ads, LinkedIn, TikTok, anything

- Session recording or heatmap tools

- Chat widgets, scheduling embeds, form services, and what each transmits

- Embedded YouTube players, which load tracking on page render

- Anything loaded through a tag manager rather than hard-coded

For each: what pages it runs on, what events fire, what data those events carry.

### **1.2  ****Disable transmission on sensitive workflows**

**Mechanisms to disable:**

- Meta Pixel and any advertising conversion API

- Remarketing and retargeting tags of any kind

- Session replay

- Enhanced matching and user-ID-based analytics

- Unrestricted tag manager containers — a container that can be given new tags later is itself the problem

**Areas where none of them may run:**

- The free will interview, from the first substantive question onward

- The trust app, all of it

- Account creation, login, and any logged-in page

- Consultation booking pages and anything showing consultation details

- Payment pages

- Client confirmation and delivery pages

Disable transmission first. Do not remove code in a way that destroys the record of what was configured — see 1.3.

### **1.3  ****Preserve the record — do not delete**

**Important. **I need to assess what may already have gone out, and that assessment needs evidence. Do not delete configurations, containers, historical data or account records. Disable, then preserve in place.

- Which events actually fired, not merely which were configured

- What each sent — parameters, URLs, referrers, query strings, page titles

- Date ranges of transmission

- Which platforms received data

- Whether any audience, custom audience, lookalike or matching process was built from it

- Whether the data can be retrieved or deleted from the receiving platform

Look past visible form fields. URLs, referrers, event names, query strings, cookies, hidden fields, page titles, error logs and server exports can all carry identifying information. Hashed emails and phone numbers are still identifiers; server-side transmission is not anonymous.

### **1.4  ****Report before proceeding**

Send 1.1 and 1.3 together. Section 5 depends on knowing what is currently there, and I have decisions to make on the basis of it.

# **Section 2 — Product naming, and claim corrections**

The product name has changed. That is the main difference between this version and the last one, and tickets 2.1 to 2.3 are new. Everything from 2.4 onward is unchanged from v2.0 — if you already started those, keep going.

## **Product naming**

**Background, briefly. **Trademark counsel found a close-named estate planning business and recommended holding the old name out of permanent assets while it was investigated. Rather than run that investigation and delay the build, I am dropping the name. The product now sits under the Muslim Legacy Planning brand, which removes the trademark question entirely and is better for search anyway, since it contains the words people actually type.

### **2.1  ****The product name**

The product is:

The Muslim Legacy Planning Guided Trust

In running copy, shorten to "the Guided Trust" or "our guided trust plan." Both are fine.

**One hard requirement. **The word "guided" must never appear without attorney involvement being clear nearby. Wherever the product is named as a tier, offer or heading, this sentence appears with it:

Complete the guided interview online or with our assistance; an attorney reviews your information and documents before finalization.

Never use "self-guided," "self-service," "DIY," "automated," or anything else implying no lawyer is involved. I review every document and the client is a client throughout — copy suggesting otherwise is a professional-responsibility problem, not a wording preference.

### **2.2  ****One name, one place**

**This ticket is what makes a future rename cheap, and I care about it more than the name itself. **

- The product name lives in a single configuration value. One edit changes it everywhere.

- Never hard-code the name in a template, a page, a component, an email, a document template, or a chatbot answer.

- The CMS renders it from that value, so published pages inherit a change automatically rather than needing fifty edits.

- The chatbot answer library references the field, never the literal name — see 12.5.

- Product URLs stay generic and contain no brand name. The path stays /trust.

If you find a place where the name genuinely cannot be templated, tell me rather than hard-coding it.

### **2.3  ****Remove the old name**

Sweep both domains, the app, the chatbot library, email templates, document templates and PDF output. Replace every instance with the configured value. Nothing should reference the previous name in user-facing text.

Do not delete anything from version history or archives — I need the historical record preserved. This is a forward-looking change to what users see, not an erasure.

## **Claim corrections**

Small edits, real consequences. Several are statements currently inaccurate on live pages. These should go out this week, ahead of the larger build.

### **2.4  ****Jurisdiction claim in the Muslim Legacy Planning footer**

**Where: **muslimlegacyplanning.com, footer block beneath the logo

**Currently: **Attorney-led Islamic estate planning for Muslim families across the United States.

Replace with:

Attorney-led Islamic estate planning for Muslim families in Texas and California.

The page contradicts itself two sentences apart — this line claims national reach, the next states two admissions. The McDaniel Estate Planning footer is already correct.

### **2.5  ****Probate outcome claims**

We cannot state that a trust avoids probate as an outcome; it depends on funding, asset types and execution. Three fixes on muslimlegacyplanning.com:

### **Homepage hero**

**Currently: **…and no plan that follows Islamic inheritance. We fix both.

Replace the final sentence:

We help families address both.

### **Problem section, item 02**

**Currently: **A properly funded trust avoids it entirely.

A properly funded trust is designed to avoid probate for the assets it holds.

### **FAQ heading**

**Currently: **What is probate and why should I avoid it?

What is probate, and why do families plan around it?

### **2.6  ****Jabal Foundation role and financial oversight claim**

**Where: **muslimlegacyplanning.com, the waqf section

**Currently: **serves as treasurer of Jabal Foundation's board and personally oversees its finances

The title is wrong and the oversight claim overstates the role. Replace with:

serves without compensation as secretary of Jabal Foundation's board

Delete the phrase about personally overseeing finances entirely. Check both sites and any other page referencing the role.

### **2.7  ****Review count**

**Where: **Both domains, reviews section

A stated count must stay accurate. Either omit the number — "Read our Google reviews" — or build a live widget. If live, verify it points at the correct business profile and does not round misleadingly.

### **2.8  ****Testimonials**

### **The Atlanta testimonial**

Remove from both sites pending my review of what the representation actually was. Do not relabel it or add a Texas connection.

### **The probate and shariah testimonial**

The quoted statement predicts a future legal and religious outcome I cannot substantiate. Remove the quotation on both sites; I am arranging a replacement with the client.

### **Remaining and future testimonials**

Place this with the testimonial block, visible without scrolling or clicking:

Client experience; not a guarantee of results. Legal outcomes depend on the circumstances, proper execution, and implementation.

Build this as a reusable component — video testimonials in Section 9 need it too, on screen rather than in a description.

### **2.9  ****Service tier label**

**Where: **Plans section, plans page, anywhere the tier is labeled

"Self-service" suggests no lawyer is involved, which is wrong. The tier is named per 2.1:

The Muslim Legacy Planning Guided Trust

Rendered from the configuration value, never hard-coded. Required supporting sentence immediately beneath it:

Complete the guided interview online or with our assistance; an attorney reviews your information and documents before finalization.

Remove "Self-service" from the tier badge; "Online" alone is fine.

### **2.10  ****How Muslim Legacy Planning describes itself**

**Currently: **our educational and technology platform

This describes the front end of a law practice as software. Replace everywhere it appears, including the McDaniel cross-link section:

An attorney-led estate-planning practice offering educational resources and technology-assisted legal services.

### **2.11  ****Firm identity beside the primary call to action**

Firm attribution currently sits only in the footer. It needs to appear beside the main service description or the primary consultation button, visible without scrolling:

Muslim Legacy Planning is the Islamic estate-planning service of McDaniel Estate Planning, PLLC. Legal services by Leonard McDaniel, licensed in Texas and California.

Add the full business address to the footer of both sites — see Appendix A, item 1. Do not pull an address from an existing listing.

# **Section 3 — Jurisdiction gating on the free will**

**Gate this before anything else in this section ships. **The free will currently generates a personalized will for anyone, anywhere. Wills have state-specific execution requirements and I am admitted in two states. A disclaimer does not fix this.

### **3.1  ****State gate before substantive intake**

State selection becomes the first question, before any family, asset or heir information is collected. Order matters — I should not receive confidential details from people I then have to turn away.

Texas or California — proceed to the interview.

Any other state — stop. Collect nothing further. Show:

We currently prepare wills only for Texas and California matters. We are not able to prepare a document for the state you selected.

You are welcome to use the educational resources on this site. If you would like a referral to an attorney licensed in your state, contact us and we will help where we can.

Offer an email field on that screen only if the person chooses to give one for referral purposes, with its own explanation. Do not roll them into the marketing list from here.

**Route them onward rather than dead-ending. **Link to the content library and the video library. Education is available nationally even though the document is not — see Section 8.4.

### **3.2  ****Residence is not the whole question**

Someone living in Georgia can have a Texas matter — property here, for instance. For anyone selecting another state, ask:

Do you own real property in Texas or California, or do you expect your estate to be administered there?

If yes, route to consultation booking rather than the interview. I make that determination; the tool does not.

### **3.3  ****Draft marker on previews**

Any document visible or downloadable before attorney review carries a visible, unremovable marker on every page:

DRAFT — NOT FOR SIGNATURE

Watermark or header, present on screen and in any generated PDF. It must not be possible to produce a clean copy through the preview path.

### **3.4  ****Execution instructions with every delivered will**

Deliver with the document, as its own screen and in the delivery email, state-specific to their selection:

Downloading or completing this document does not make it an executed will. Follow the signing and witness instructions for the applicable state before relying on it. Notarization alone is not a substitute for required will witnesses. Ask an attorney about uncertainty or unusual signing circumstances.

Texas and California instructions differ. Both sets come from me — Appendix A, item 4. Do not write them.

# **Section 4 — Intake notices and consent**

**One ticket here is blocked on a decision I owe you. **I am choosing between two models for the free will: limited no-charge representation with attorney review, or genuine self-help publication with no review. The notice text differs completely. Build 4.2 through 4.5 now; hold 4.1. My deadline for the decision is October 15.

### **4.1  ****Pre-intake notice — HOLD**

Do not build yet. For planning: a notice shown before any substantive question, requiring explicit acknowledgment — checkbox or button, not a passive footer — recorded with a timestamp against the session.

### **4.2  ****Intake privacy notice**

Settled; build now. Show where substantive information is first collected, in both the free will and the trust app:

We use your information to evaluate and, if accepted, provide legal services. Access is limited to authorized firm personnel and service providers operating under confidentiality and security obligations. We do not send your interview answers, documents, or identifiable consultation or client activity to advertising platforms, and we do not use them to build advertising audiences. Optional educational and marketing subscriptions are separate. Our privacy notice explains the information collected, its purposes, service providers, retention, and how to contact us about privacy.

**Condition: **this states as fact that we do not send interview data to advertising platforms. Do not publish it until Section 1 is complete and you have verified it is true. Publishing it while a pixel is still firing would be worse than not publishing at all.

### **4.3  ****Email capture and marketing opt-in**

Capturing email at the start of the interview is fine, but purpose must be explained and marketing separately optional.

- State plainly what the email is for — delivering the document and communicating about the request

- Marketing consent is a separate checkbox, unchecked by default; never pre-checked, never bundled into terms acceptance

Checkbox label, exactly:

Send me occasional educational and service emails from McDaniel Estate Planning. I may unsubscribe at any time; this is not required to request the free will.

Record consent state and timestamp against the record. I need to show, per person, what they agreed to and when.

### **4.4  ****Delivery mail separate from marketing mail**

- Never bundle promotional content into a document delivery email

- Unsubscribing from marketing must not stop service email about a live request

- Unsubscribe honored within 10 business days at the outside — build it immediate

Marketing sequence copy comes from me and carries specific labeling requirements. Do not write it.

### **4.5  ****Eligibility flag language**

When the tool flags a situation it cannot handle it states a product boundary. It does not tell the user what they need. Replace existing flag messaging with:

This tool does not handle the situation you selected. That does not establish that you need a trust or a paid service from us. Please consult an attorney about your options; you may contact our firm or another attorney.

Never use, anywhere in the flag path: "Your will will not work," "You need our trust," "You are protected," or any phrasing assessing the user's legal position.

**Also: **a user who trips no flags must not be told their plan is sufficient and must see no paid upsell. Silence is correct. If the current build shows an offer to zero-flag users, remove it.

# **Section 5 — First-party attribution**

I still need to know which marketing produces consultations. The method changes: captured once, stored in our own systems, reported externally only in aggregate. Nothing identifying a person leaves our infrastructure.

### **5.1  ****First-party source capture**

- Read campaign parameters on arrival, store a short source code in a first-party value

- Carry it through to the booking form or intake as a hidden field

- Write it into the matter record at creation

- Discard the raw parameters — keep the code, not the tracking string

Code list comes from me — Appendix A, item 5. Keep it short and legible.

### **5.2  ****What may be reported externally**

Aggregate counts only, never tied to an individual — a weekly total of consultations by source, for instance. No per-person events, no identifiers, no hashed emails, no conversion uploads.

If a platform needs individual-level conversion data to optimize, we do without the optimization. That is a decision I have made; do not work around it.

### **5.3  ****Public pages may carry minimal analytics**

Homepage, content library, video library, about page — basic analytics permitted with accurate disclosure. Conditions:

- IP anonymization on

- No user ID or cross-session identity features

- No advertising or remarketing features enabled on the property

- No data sharing with advertising products

- Coverage stops at the boundary of the sensitive areas in 1.2

Send me the configuration before it goes live so I can check the boundary.

### **5.4  ****Facebook advertising**

- No pixel on interview, app, booking, payment or client pages

- Conversion measurement at landing-page level only, before intake begins

- Geographic targeting restricted to Texas and California

- Ad copy comes from me, pre-approved. Disable any automatic text generation or dynamic creative feature that would produce wording I have not seen.

# **Section 6 — Crawlability foundation**

None of this is sensitive. It is the groundwork the content platform sits on, and some of it is costing real traffic today.

### **6.1  ****Link preview tags**

**Priority: **Highest in this section — do it first

Neither site has Open Graph or Twitter card tags. Every link shared in a WhatsApp group renders as a bare URL with no title, image or description. WhatsApp is our best-converting channel by a wide margin. It currently looks like spam.

- og:title, og:description, og:image, og:url, og:type on every page

- Matching Twitter card tags

- 1200x630 image, real brand imagery

- Per-page values, editable in the CMS — not one sitewide default

- Test with WhatsApp preview and the Facebook sharing debugger before calling it done

### **6.2  ****Placeholder image in the homepage hero**

The Muslim Legacy Planning hero loads from picsum.photos, a random placeholder service — every visitor sees a different arbitrary photograph while the alt text describes a family reviewing documents. Replace with a licensed image (Appendix A, item 6) and audit both sites for other placeholder sources.

### **6.3  ****Review links**

Both sites link review CTAs to g.page/r/review, which is not a valid destination. Every review link on both sites is broken. Use:

https://search.google.com/local/writereview?placeid=ChIJszQ9uNfRQIYRg3017kJNF8Y

Verify it opens the review form for the correct profile before shipping.

### **6.4  ****Sitemap, canonicals, indexing**

- XML sitemap on both domains, regenerated automatically when content publishes — see 7.6

- Submitted to Search Console for both hostnames

- Canonical tags on every page, especially given two domains with overlapping content

- robots.txt reviewed — confirm nothing valuable is blocked

- Resolve duplicate-content signals between the two domains

### **6.5  ****Organization-level structured data**

- Organization and LegalService schema on both domains

- areaServed limited to Texas and California — this matters for both accuracy and AI retrieval

- sameAs links to verified profiles once directory records are cleaned

- Consistent name, address and phone across both sites and every external listing

### **6.6  ****Attorney profile page**

The About link on Muslim Legacy Planning points to a homepage anchor rather than a page. Build a real page at a real URL on mcdanielestateplanning.com, cross-linked prominently from Muslim Legacy Planning.

- Person and Attorney structured data

- Full licensed name, active admissions, responsible firm, business address

- Practice background and training with the institution named

- This page is the author entity every content page links to — see 8.3

**Do not reuse the current biography copy. **Two claims in it — the five-year practice focus and the class ranking — need substantiation I am gathering. Build the structure; leave the biography as a placeholder until I send verified text (Appendix A, item 2).

### **6.7  ****Performance baseline**

No Lighthouse score or Core Web Vitals figure exists for either property. Run both, record the numbers, and fix anything egregious — particularly on mobile, since most WhatsApp traffic arrives there. I do not need a perfect score; I need to know nothing is badly broken before we drive traffic at it.

# **Section 7 — Content management system**

**This is the largest and most important piece of work in the document. **Everything else is a fix or an addition; this changes what the business can do. The site currently has no way to add a page without you deploying code, which is workable at eight pages and impossible at fifty. Fifty is roughly what owning this category takes.

Build it on muslimlegacyplanning.com. The goal is that I can write a page on a Sunday evening and publish it without you, and that the page is correctly structured for search and AI retrieval without me knowing anything about either.

### **7.1  ****Authentication and roles**

- Two roles: Author (create and edit drafts, cannot publish) and Publisher (everything, including publish and unpublish)

- Sumayya is an Author. I am a Publisher.

- Named accounts, multi-factor authentication, session timeout

- An audit log recording who changed what and when, retained indefinitely

**Why the split: **published pages are attorney advertising and carry professional obligations. Nothing goes live without my approval. Build the roles so that is enforced by the system rather than by memory.

### **7.2  ****The editor**

- Rich text with headings, bold, italic, links, lists, block quotes

- No arbitrary HTML — I should not be able to break the page structure by pasting something

- Paste from Word or a chat window without carrying junk formatting

- Autosave, with draft history I can revert to

- Preview that renders exactly as the live page will, including on mobile

### **7.3  ****Fields on every content page**

These are not optional extras — the field list is what makes the page work for AI retrieval. Required fields should block publication when empty, with a plain-language message telling me what is missing.

| **Field** | **Purpose and rules** |
| --- | --- |
| Question title | Required. The H1. Phrased as a real question someone would type or ask aloud. Validation should warn if it does not end in a question mark. |
| URL slug | Required. Auto-generated from the title, editable. Never changes after publication without a redirect — see 7.7. |
| Answer summary | Required. 40 to 60 words, enforced with a live counter. This is the block an AI assistant lifts. It must stand alone and make sense with no surrounding context. |
| Body | Required. The full explanation. |
| Meta description | Required. 150 to 160 characters, live counter. |
| Jurisdiction | Required. Texas, California, Both, or General. Drives the caveat component — see 8.5. |
| Category | Required. From a fixed list I maintain. |
| Related questions | Optional, up to four. Manual selection, not automatic. |
| FAQ pairs | Optional, repeatable question-and-answer rows. Feeds FAQPage schema. |
| Social image | Optional, falls back to a category default. Never the placeholder service. |
| Published date | Automatic. |
| Last reviewed date | Required, manually set. Displayed on the page. See 7.8. |
| Call to action | Required. Select which CTA component appears — see 8.6. |

### **7.4  ****Publishing workflow**

- Draft, In review, Published, Unpublished

- Scheduled publishing — set a date and it goes live on its own

- One-click unpublish that removes the page and returns a proper status code, not a broken link

- Publishing regenerates the sitemap and pings Search Console automatically

**Unpublish matters more than it looks. **If I ever need to take a claim down quickly, I need to do it myself in under a minute, at any hour, without reaching you.

### **7.4b  ****Product name token**

The CMS must render the product name from the single configuration value described in 2.2, not from typed text.

- A token I can insert while writing, which renders the current name

- Changing the configuration value updates every published page with no re-editing

- A validation warning if I type the product name literally instead of using the token

This is what keeps a future rename to one edit rather than fifty. Counsel advised keeping the name centrally editable, and I want that preserved permanently rather than only through the current uncertainty.

### **7.5  ****Images**

- Upload, crop, and reuse from a library

- Alt text is a required field on every image — publication blocks without it

- Automatic compression and modern formats with fallbacks

- Automatic dimensions to prevent layout shift

### **7.6  ****Automatic technical output**

Every published page produces, without me doing anything:

- Clean semantic HTML with correct heading hierarchy

- Article schema, with author pointing at the attorney profile entity

- FAQPage schema where FAQ pairs exist

- Open Graph and Twitter tags from the page fields

- Canonical URL

- Sitemap entry with last-modified date

- Breadcrumb schema

### **7.7  ****URL and redirect management**

- A redirect table I can edit without touching code

- Changing a published slug prompts to create a redirect automatically

- 404 monitoring with a report I can see

- Flat URL structure under a single content path — no deep nesting

### **7.8  ****Review dates**

Legal content goes stale and stale legal content is a liability. Build:

- A visible "last reviewed" date on every content page

- A dashboard listing pages not reviewed in six months

- An email to me monthly with that list

### **7.9  ****Search and navigation**

- Site search across content and video

- Category and jurisdiction filtering

- A content library index page that is itself a real indexable page, not a script-rendered list

- Every page reachable within two clicks of the homepage — the current site has an orphaned article, which is how content becomes invisible

# **Section 8 — Page structure for AI retrieval**

Background, because it changes how you build the template. A recent client found me by asking an AI assistant who to use in Houston. In the same month, ordinary search produced one click. Assistants are a real acquisition channel for this practice, and they behave differently from search engines: they lift a passage and attribute it, rather than ranking a link.

That means the page has to make one clean, liftable, attributable answer easy to find. The template below does that structurally, so I do not have to think about it when writing.

### **8.1  ****The content page template**

Fixed order, every page:

- H1 — the question, exactly as entered

- Answer summary block — visually distinct, immediately below the H1, before anything else

- Byline — my name linking to the attorney profile, admissions stated, last reviewed date

- Body — H2 subheadings, themselves phrased as questions

- Jurisdiction caveat component where applicable

- FAQ block if pairs exist

- Related questions

- Call to action

**Nothing goes between the H1 and the answer summary. **No hero image, no breadcrumb bar, no share buttons, no newsletter prompt. That adjacency is the whole point of the template.

### **8.2  ****The answer summary block**

- Rendered as a plain semantic block in the HTML — not a script-injected widget, not inside a tab or accordion

- Visually distinct: light background, slight indent, larger type

- Must appear in the raw HTML source, since assistants that do not run scripts will otherwise miss it

- Marked up so it is identifiable as the direct answer to the H1

### **8.3  ****Author and expertise markup**

Assistants weight who is saying something. Every content page must connect to a consistent author entity.

- Article schema with author as a Person referencing the attorney profile URL

- Same Person entity across every page, every time — one canonical identifier

- Visible byline, not only markup

- Credentials and admissions stated on the page, not only on the profile

**Connected to this: **the third-party records for my name are currently contaminated — an unclaimed Avvo record describing a health care attorney in Arizona, and a Phoenix listing carrying a Houston area code that is not my number. When an assistant hits that contradiction it hedges or names someone else. Sumayya is claiming and correcting those records; the sameAs links in 6.5 should point only to records that are verified and mine.

### **8.4  ****Content is national, tools are not**

The free will is gated to two states. Educational content is not, and should not be. Build the template so a page can be nationally useful while the tool stays restricted:

- General-jurisdiction pages carry no state gate

- Texas or California pages state the jurisdiction clearly in the title and the caveat

- Every page carries the licensure line in the byline regardless

- CTAs on general pages route to content and video, not to the will tool

### **8.5  ****Jurisdiction caveat component**

Reusable component, placed automatically based on the jurisdiction field:

This example concerns Texas community-property law. California also has community property, but its rules are not identical, and other states may treat ownership and spousal rights differently.

Build it so the body text is editable per page — some pages need a variant. I will supply the alternates. Default to the above for any Texas page touching marital property.

### **8.6  ****Call-to-action components**

Selectable per page from a fixed set, so I can match the CTA to the reader's stage:

- Book a consultation

- Use the free Islamic will — Texas and California pages only

- Watch the related video

- Read the next question in the series

- Register for the webinar

- None

"None" must be available and must be genuinely nothing. Some pages should carry no offer at all — that is deliberate, not an oversight.

# **Section 9 — Video library**

Video hosts on YouTube; the library lives on Muslim Legacy Planning. YouTube handles delivery and is itself a discovery surface worth being on. The visitor experience should be entirely ours — browsing a library on our site, not bouncing to a YouTube channel.

### **9.1  ****Privacy-safe embedding**

**Read this before building any embed. **A standard YouTube embed loads Google tracking the moment the page renders, before the visitor does anything. That conflicts directly with Section 1.

- Use the privacy-enhanced domain (youtube-nocookie.com) for every embed

- Click-to-load facade: show a thumbnail and play button; load the player only when clicked

- Host the thumbnail on our own server, not fetched from Google

- No video embeds of any kind inside the app, the interview, or booking and payment pages

### **9.2  ****Video as a content type**

Each video is a page in its own right, with its own URL and its own fields:

| **Field** | **Purpose and rules** |
| --- | --- |
| Title | Required. Question-shaped where it fits naturally. |
| YouTube ID | Required. |
| Description | Required. Real prose, not a sentence. This is crawlable text where the video is not. |
| Transcript | Required. Full text, displayed on the page beneath the player. The single highest-value field here — see below. |
| Duration | Required. Feeds schema. |
| Series and order | Optional. Drives sequential navigation. |
| Related content | Optional. Links to written pages on the same question. |
| Jurisdiction | Required. Same handling as written content. |
| Testimonial flag | Required if the video contains a client statement — triggers the mandatory disclaimer in 9.5. |

**On transcripts. **A video is invisible to search engines and AI assistants; a transcript is not. Every minute I spend on camera produces text that works for us permanently, but only if the transcript is on the page. Make the field required. YouTube generates a rough transcript automatically — Sumayya cleans it and pastes it in.

### **9.2b  ****Keep branded segments replaceable**

Recorded video is the most expensive thing to change if a name ever moves. Structure it so the substance survives independently:

- Branded introductions and closings are separate segments, not woven through the body

- The educational content itself refers to "our guided trust plan" or "the trust plan" rather than repeating the full product name

- Store the unedited source files so an intro or outro can be re-cut without re-recording the substance

- Transcripts render the product name from the token per 7.4b where the CMS controls the text

### **9.3  ****Library structure**

- An index page listing all videos, filterable by category and series — a real indexable page

- Series pages grouping sequential videos, with next and previous navigation

- Each video page cross-linked to the written page on the same question, both directions

- Featured video slot on the homepage, selectable in the CMS

### **9.4  ****Video structured data**

- VideoObject schema on every video page — name, description, thumbnail, upload date, duration, embed URL

- Transcript included in the markup where the format allows

- Video entries in the sitemap

### **9.5  ****Testimonial videos**

Client testimonial videos carry obligations ordinary videos do not.

- Disclaimer displayed on screen with the video, not in the description — reuse the component from 2.8

- A release-on-file field in the CMS. A video flagged as a testimonial cannot publish unless it is ticked.

- Endorsement videos from community leaders need a speaker title and relationship field, displayed with the video

That publication block is deliberate. I need the system to stop me, not remind me.

# **Section 10 — Making the tools discoverable**

The free will and the inheritance calculator are the best assets we have and they are effectively invisible. They are interactive applications that emit no crawlable pages, so search engines and AI assistants have almost nothing to index. The calculator draws impressions today with no optimization behind it at all, which suggests what a properly built page around it would do.

### **10.1  ****A real landing page for the free Islamic will**

Build a substantial content page that the tool sits within, rather than a bare launch button.

- Question-shaped H1 and an answer summary, same template as any content page

- Real explanatory prose — what the tool does, what it produces, what it does not cover, who it suits

- FAQ block with schema

- The tool itself below the content, launching in place

- Fully indexable; the content must be present in the raw HTML

Jurisdiction handling: the page is nationally readable, the tool is gated at the point of use per Section 3. Someone in Michigan can read and understand it and cannot start it.

### **10.2  ****The same for the inheritance calculator**

Identical treatment. This page has the strongest existing search signal on the property and the least content supporting it.

### **10.3  ****A page for the trust product**

Not a pricing table — a real page explaining the Guided Trust: what it includes, what it excludes, how the process runs, what the client does and what I do. Uses the product name and the required supporting sentence from 2.1 and 2.9 throughout.

### **10.4  ****Shareability**

The free will is shared person to person in WhatsApp groups, which is how roughly a fifth of clients have arrived. Treat that as a primary channel rather than an accident:

- Dedicated Open Graph image and description for the will and calculator pages, written for a family group chat

- A share prompt at completion — copy comes from me

- Share links carry a source code so the channel is measurable per Section 5

- Test the preview in WhatsApp specifically, on both iOS and Android, before shipping

# **Section 11 — Webinar infrastructure**

A recurring live session where I demonstrate the trust app on screen for a group. It is the main planned acquisition path alongside content, and it is entirely remote.

### **11.1  ****Registration page**

Hosted on Muslim Legacy Planning, not on a third-party platform's page. We own the page, the capture and the source code; the platform only carries the call.

- Registration form capturing name, email, and state

- Source code carried through per Section 5

- Marketing opt-in separate and unchecked, same pattern as 4.3

- Indexable page with schema for the event

Required text on the registration page, exactly:

Educational webinar and demonstration of the firm's attorney-guided trust service. Presented by Leonard McDaniel, licensed in Texas and California, for McDaniel Estate Planning, PLLC. The family and documents shown are fictional. Attendance does not engage the firm or provide advice about your circumstances. Do not submit confidential or identifying family information. A consultation invitation will be offered; purchase is not required.

The full address goes into this block — Appendix A, item 1.

### **11.2  ****Platform and confirmation flow**

- Use an established webinar platform for the call itself. Confirm your recommendation with me before building against it.

- Confirmation email, reminder at 24 hours, reminder at one hour

- Reminders are service communications, not marketing — keep them in the service stream per 4.4

- Post-webinar email with the consultation link, sent to attendees and registrants who did not attend

### **11.3  ****Demonstration environment**

**The demonstration runs on staging with fabricated families. **Never the production app, never a real client record. Build a dedicated demo account with invented data that resets cleanly between sessions, and confirm no notifications, no other browser tabs, and no credentials are visible in a shared screen.

### **11.4  ****Recording and republication**

- Record the presenter and the demonstration only — not attendee video, audio or chat

- If attendee participation is captured at all, it is removed before any republication

- A recorded session becomes a video library entry per Section 9, with a transcript

# **Section 12 — Chatbot**

The retrieval-only design — matching questions to pre-approved answers rather than generating them — is correct and stays. These are additions.

### **12.1  ****Disclosure on the widget**

Visible when the chat opens, not behind a link:

Automated information assistant, not an attorney. It provides approved general information about our services and cannot advise on your situation. Please do not enter confidential information here.

### **12.2  ****Do not solicit confidential detail**

The chatbot must never ask for family details, asset information, or anything about the user's situation. If an answer would require those facts, it routes to intake rather than asking. Review every existing prompt and branch and remove questions that invite personal detail.

### **12.3  ****Low-confidence behavior**

With no confident match, the fallback is a clickable "did you mean" list of approved topics, then routing to me. It must not guess, and must not synthesize an answer from fragments of several approved answers.

### **12.4  ****Version logging**

Every answer carries a version and a date; approved changes are recorded. I need to be able to establish what the chatbot was saying on a given date.

### **12.5  ****Product name as a field, not text**

The answer library must reference the product name through the configuration value from 2.2, never as literal text inside individual answers. With hundreds of entries planned, a name change must not mean hundreds of edits and a re-approval cycle.

Sweep existing answers for hard-coded product references and replace them.

### **12.6  ****Connect it to the content library**

Where an approved answer corresponds to a published page, the chatbot links to it. This is the one place the two systems should meet — the knowledge base stays pre-approved and separate, but a user asking a question we have written about should be sent to that page.

# **Section 13 — Do not build**

Some of these I previously asked for. They are withdrawn.

### **13.1  ****The mosque-hosted embed**

Do not build the masjid-hosted free will, the co-branded wrapper, or the bequest prompt directing gifts to a host institution. The arrangement needs restructuring before any of it is built. Paused, not cancelled.

### **13.2  ****Retargeting and custom audiences**

- No audiences built from people who used the interview, the app, or booked a consultation

- No client or prospective-client email uploads as custom audiences

- No lookalike seeds from any of the above

- No exclusion audiences either — suppressing ads from a list still discloses the list

### **13.3  ****Automated ad text**

Disable any feature generating or varying ad copy automatically. Every published variant must be one I approved, and I need a record of which ran when.

### **13.4  ****Payment and fee language**

Do not implement, anywhere in checkout or the engagement flow, language describing the fee as nonrefundable, earned on receipt, or earned by completing the interview. Do not build a flow taking payment before the engagement agreement is presented and accepted. Replacement fee language comes from me.

### **13.5  ****Charitable donation automation**

Do not build anything automatically transferring a portion of a payment to a charity at the moment of purchase. The mechanism needs restructuring. Leave the existing description alone until I send replacement copy.

### **13.6  ****AI-generated content or answers**

No generative AI writing content pages, chatbot answers, meta descriptions, or anything else that publishes under my name. Everything published is written or approved by me. AI may be used for matching a question to an approved answer; never for producing one.

# **Section 14 — Standing rules**

These apply to everything on this project, including work not described here. Several go beyond what the rules strictly require; treat them as firm policy regardless.

| **#** | **Rule** |
| --- | --- |
| 1 | Never send interview answers, documents, identifiable booking or client events, or client lists to an advertising platform. No pixels, retargeting, session replay, enhanced matching, or conversion exports inside sensitive workflows. |
| 2 | No real client data in demonstrations, development fixtures, screenshots, or staging. |
| 3 | No blanket practice-management access, no shared master credentials, no whole-database exports, no vendor or AI training on any data from these systems. |
| 4 | Never publish a claim of nationwide representation, market exclusivity, lowest price, guaranteed probate avoidance, guaranteed religious compliance, artificial scarcity, or an unverified credential or title. |
| 5 | Never generate a personalized will for a state we do not support. Never tell a user that an absence of flags means their plan is sufficient. |
| 6 | Never let the chatbot or any automated flow choose the user's legal solution for them. |
| 7 | Never take payment or finalize a paid matter before attorney screening, client identification, and a presented engagement agreement. |
| 8 | Never offer anything in exchange for a review, and never filter review requests to only satisfied clients. |
| 9 | Never publish an identifiable client testimonial without a release on file, and never alter a speaker's meaning. |
| 10 | Never release new ad copy, headline variants, or partner-facing material without my written approval. Do not assume a platform or vendor obtained it. |
| 11 | Escalate immediately: suspected disclosures, unexpected app outputs, errors in generated documents, complaints, or any published claim you did not see me approve. Preserve the record; do not quietly fix and overwrite. |

# **Section 15 — Sequence**

Dates are my external commitments. If something will slip, tell me early — several of these gate work involving other people.

| **By** | **Work** |
| --- | --- |
| Immediately | Section 1 in full — inventory, disable, preserve, report. Nothing else starts until this is done. |
| This week | Section 2 in full — including the naming change in 2.1 to 2.3 — plus ticket 6.1 (link previews). All small, all currently wrong or costing traffic. |
| October 8 | Section 6 complete. Section 0 terms signed and access settled. Confirm the data map so I can clear the intake notice in 4.2. |
| October 15 | Section 3 complete. Sections 4.2 through 4.5. I will have made the free-will model decision and will send you 4.1. |
| October 29 | Section 7 — the content platform. This is the long one; start it in parallel once Section 1 is cleared rather than waiting for the compliance work to finish. |
| November 5 | Section 8 (page templates) and Section 5 (attribution) live and verified. |
| November 12 | Section 9 (video library) and Section 10 (tool landing pages). |
| November 19 | Section 11 (webinar) and Section 12 (chatbot). Attorney profile with final verified copy. |
| November 26 | Full pass: confirm nothing regressed, all schema validates, every page reachable, previews render correctly in WhatsApp. |

# **Appendix A — What I owe you**

Items I need to supply. Where one blocks a ticket, the ticket is marked. Chase me if I am slow — several of these gate work you cannot start without them.

| **#** | **Item and where it lands** |
| --- | --- |
| 1 | Full business address, for both footers and the webinar registration block (2.11, 11.1). |
| 2 | Verified biography copy, once the practice-focus period and class ranking are substantiated (6.6). |
| 3 | Free-will relationship model decision, and the pre-intake notice text that follows from it (4.1). Due October 15. |
| 4 | Texas and California will execution instructions, as separate copy (3.4). |
| 5 | Source code list for attribution (5.1). |
| 6 | Licensed hero image to replace the placeholder (6.2). |
| 7 | Category list for the content library, and the jurisdiction caveat variants (7.3, 8.5). |
| 8 | Share prompt copy for the free will completion screen (10.4). |
| 9 | Replacement fee and engagement language (13.4). |
| 10 | Replacement charitable giving copy (13.5). |
| 11 | Brand assets for the Guided Trust, if any are needed beyond existing Muslim Legacy Planning styling (2.1). |
| 12 | All content pages and video scripts. The platform is yours; the writing is mine. |

# **Appendix B — What success looks like**

So you can check your own work without me reviewing every ticket.

- I can publish a new page, with correct structure and schema, without contacting you.

- A link to any page, pasted into WhatsApp, shows a title, description and image.

- No advertising or analytics code fires anywhere inside the interview, the app, booking, payment, or client pages.

- The free will refuses to generate a document for any state other than Texas and California, before collecting any family information.

- Every published page validates against schema testing tools with no errors.

- Every page on the site is reachable within two clicks of the homepage.

- A video page shows a thumbnail on load, loads the player only on click, and carries a full transcript as page text.

- I can take any page offline myself in under a minute.

- Changing the product name in one configuration value updates the site, the app, the emails, the documents and the chatbot, with no other edits. Test this before calling the build done — change it to something obviously wrong, confirm it propagates everywhere, change it back.

*Questions come to me rather than being resolved on your end. **Particularly anything in Sections 1, 3 or 13 — those exist because of specific constraints I am working under, and a sensible-looking workaround can defeat the point of the ticket.*