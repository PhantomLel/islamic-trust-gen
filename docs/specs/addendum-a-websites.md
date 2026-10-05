**McDANIEL ESTATE PLANNING, PLLC**

**Addendum A — Websites**

To Developer Build Specification v3.0 · Copy, ethics, aesthetics and search for both public sites

| **Field** | **Detail** |
| --- | --- |
| For | Abdullah |
| From | Leonard McDaniel |
| Date | 3 October 2026 |
| Scope | mcdanielestateplanning.com, muslimlegacyplanning.com (public pages only), and the freemuslimwill.org redirect |
| Not in scope | Anything behind login: intake, payment, dashboard, admin, generated documents, transactional emails. Those come in a separate app spec, after this. |
| Relationship to v3.0 | Adds to v3.0. Where this addendum and v3.0 conflict on a public page, this addendum wins. v3.0 Sections 13 (Do not build) and 14 (Standing rules) still apply to everything. |

# **Why this exists, and the new order of work**

The goal is to finish both websites properly — accurate, compliant, polished and findable — so we can move to fixing the app, and only then start marketing in earnest with video, articles, webinars and paid ads. Doing the sites first means every visitor we later pay to attract lands on pages that are right.

| **Phase** | **Work** | **Source** |
| --- | --- | --- |
| 1 — Websites (now) | Stop-work tracking audit; all copy, claim and identity fixes; site roles and domains; live reviews; Family Waqf Plan page; aesthetic polish and accessibility; search and AI-retrieval foundations; free-will gating and intake notices; first-party attribution | v3.0 Sections 0–6 plus this addendum |
| 2 — App | Document templates, closing letter, consent capture, retirement questions, payment routing, California jurisdiction field | Separate app spec, to follow |
| 3 — Marketing infrastructure | Content management system, page templates for AI retrieval, video library, tool landing pages, webinar, chatbot additions | v3.0 Sections 7–12 |

**This moves v3.0 Sections 7–12 later than v3.0****'****s own sequence table. **That is deliberate: the content platform only earns its keep once we are producing content, which starts in Phase 3.

## **How to use this addendum**

- Shaded boxes are approved copy once I sign off. Use them exactly as written; change the layout, not the words.

- Each copy ticket quotes what the page says today. If the live wording differs from the quote, apply the rules in W7 and tell me rather than guessing.

- W7 is the standing list of things never to write. Run it against every public page on both sites, including pages this addendum does not mention.

# **W1 — Site roles and domains**

### **W1.1  ****What each site is for**

| **Site** | **Its job** |
| --- | --- |
| mcdanielestateplanning.com | The law firm. Attorney profile, the full-service practice (consultations, Legacy Plan, Family Waqf Plan, probate and estate administration, business succession planning), reviews, consultation booking. This is the entity AI assistants, directories and bar records resolve to, so it carries the professional biography. |
| muslimlegacyplanning.com | The destination. Free Islamic will, inheritance calculator, Guided Trust, routing quiz, and later the content library, videos and webinars. Shows the full-service options briefly and links to the firm site for detail. |
| freemuslimwill.org | A short address for print and QR codes only. Redirects; never a site of its own. |

### **W1.2  ****End the duplication between the two homepages**

The MEP homepage currently repeats MLP's biography and all four testimonials nearly word for word. Search engines treat that as two sites competing for the same text.

- MLP keeps the personal story (conversion, community) with short credentials, and links to the attorney page on MEP.

- MEP carries the professional biography (W4.3). No paragraph should appear on both sites.

- Testimonials are removed from both (W2.9, W4.4) and replaced with live Google reviews (W5).

### **W1.3  ****One app, two hostnames — route by host**

Both hostnames are served by the same application. Observed: mcdanielestateplanning.com/admin returns a page titled "Muslim Legacy Planning."

- MEP serves only MEP pages, with MEP titles and metadata.

- Every app and tool route — /login, /trust, /create-trust/*, /dashboard, /admin/*, /make-your-trust-work/*, /free-islamic-will, /inheritance-calculator, /which-plan, /plans — exists only on MLP. The same path requested on MEP returns a 301 to the MLP equivalent.

- Page titles and metadata are set per host; nothing on MEP may carry the MLP title, or the reverse.

### **W1.4  ****One canonical host per domain**

MEP links to muslimlegacyplanning.com without www; MLP itself resolves at www. Pick one form per domain (www for both is fine), 301 the other, use it in every internal link, canonical tag, sitemap and schema reference.

### **W1.5  ****freemuslimwill.org**

- Confirm it returns a permanent 301, not a 302, to muslimlegacyplanning.com/free-islamic-will.

- Pass any campaign parameters through so QR attribution survives (v3.0 Section 5).

- On our own pages, link to the canonical /free-islamic-will URL directly, not through the redirect.

### **W1.6  ****Cross-links**

- MEP → MLP: the free will and the Guided Trust.

- MLP → MEP: the attorney page, the Legacy Plan, the Family Waqf Plan, probate and business succession pages, and consultation booking.

# **W2 — muslimlegacyplanning.com homepage**

In page order. Items already covered by v3.0 Section 2 are restated here so this is the single checklist for the page.

### **W2.1  ****Title and meta description**

**Currently: **Meta: "Attorney-led Islamic estate planning for Muslim families. Wills, trusts, prenuptials, and business succession grounded in Qur'anic principles and U.S. law."

Prenuptials are not offered, and business succession belongs on the firm site. Replace with:

Title: Muslim Legacy Planning — Islamic Estate Planning in Texas & California

Meta: Islamic estate planning for Muslim families in Texas and California — a free Islamic will, the Guided Trust, and attorney-designed plans.

### **W2.2  ****Navigation**

"GoodTree Trust" in the menu becomes "Guided Trust," rendered from the product-name setting (v3.0 2.1–2.2).

### **W2.3  ****Hero**

**Currently: **"Most Muslim families in Texas have no plan to keep their home and assets out of probate court — and no plan that follows Islamic inheritance. We fix both."

Many Muslim families in Texas and California have no plan to keep their home out of probate court — and no plan that follows Islamic inheritance. We help families address both.

"Most" is a statistic we cannot support; "We fix both" is an outcome promise. This supersedes v3.0 2.5's hero edit.

Firm identity line under the button — the placement is already right. Swap the wording to the approved text:

**Currently: **"Attorney-led platform. Legal services provided by McDaniel Estate Planning, PLLC — licensed in Texas and California."

Muslim Legacy Planning is the Islamic estate-planning service of McDaniel Estate Planning, PLLC. Legal services by Leonard McDaniel, licensed in Texas and California.

Hero image: still the picsum placeholder. Replace per v3.0 6.2 once I supply the image.

### **W2.4  ****"****The Problem****"**** section**

**Currently: **Heading: "Three things most Muslim families don't know."

Three things many Muslim families don't know.

**Currently: **Item 02, last sentence: "A properly funded trust avoids it entirely."

A properly funded trust is designed to avoid probate for the assets it holds.

**Currently: **Item 03, last clause: "…that most plans ignore."

…that many plans don't address.

### **W2.5  ****Plans section**

**Currently: **"Every plan is shariah-compliant and attorney-supervised."

Every plan is attorney-supervised and designed around Islamic inheritance principles.

### **Guided Trust card**

- Badge "Self-service · Online" becomes "Online" (v3.0 2.9).

- Card title "GoodTree Trust" becomes "Guided Trust"; button "Start Your GoodTree Trust" becomes "Start Your Guided Trust."

Description — the current text says the trust is for "individuals and families," but the app supports married couples only. Replace until a single-person path exists:

**Currently: **"Attorney-drafted Islamic revocable living trust for individuals and families with straightforward estates. Build at your own pace, with attorney access throughout."

An attorney-supervised Islamic revocable living trust for married couples with straightforward estates. Complete the guided interview online or with our assistance; an attorney reviews your information and documents before finalization.

**Currently: **Bullet: "Shariah-compliant distribution logic"

Distribution built around the Qur'anic shares

Price line: show "$1,499 flat fee · attorney-supervised" — drop the ".00".

### **Below the cards**

**Currently: **"Not ready yet? Start with a free Islamic will at freemuslimwill.org."

Not ready yet? Start with the free Islamic will.

Link to /free-islamic-will directly (W1.5).

**Currently: **"View all five plans →"

Compare all plans →

No counts in link text — they go stale.

### **W2.6  ****The giving section**

**Currently: **Heading "We're the waqf guys," followed by: "You choose your own charitable bequests from a neutral, alphabetical list — we deliberately don't recommend one. As proof: attorney Leonard McDaniel serves as treasurer of Jabal Foundation's board and personally oversees its finances. Leonard receives zero compensation for this, as do all of Jabal Foundation's board members. See more. 5% of every GoodTree Trust purchase is donated to Jabal Foundation's Legacy Waqf the same day you buy."

Replace the heading and the whole paragraph:

Giving back

In your plan, any charitable gifts are your own choice. Our list of Islamic charities is alphabetical and is not a recommendation.

For every Guided Trust purchased, McDaniel Estate Planning donates $75 of its own funds to Jabal Foundation's Legacy Waqf, which supports orphan development and ongoing meal distribution. The donation is made by the Firm and is not part of your fee. Leonard McDaniel serves without compensation as secretary of Jabal Foundation's board.

Keep the two links, relabelled "See Jabal's public filings" (the ProPublica link) and "Learn more about Jabal."

### **W2.7  ****"****The Endowment Movement****"**** section**

Becomes a short teaser. The full description moves to an interior page on the firm site (W6), which matters for advertising-filing purposes as well as clarity.

- Keep the heading "From ad hoc fundraising to lasting endowment." and the first paragraph ("The American Muslim community has funded its institutions…").

- Delete the second paragraph and all three cards (Sadaqah jariyah, Afterfund partnership, From estate plan to endowment).

Replace them with:

The Family Waqf Plan: we draft the legal framework for your family waqf, built into your estate plan and designed for ongoing sadaqah jariyah.

Button "Learn about the Family Waqf Plan" currently opens the booking page. Point it to the new Family Waqf Plan page (W6).

### **W2.8  ****Attorney section**

**Currently: **"For the last five years, he has focused on probate and estate planning — helping Muslim families protect their wealth through thoughtful legal work grounded in classical fiqh and Texas and California law."

Since 2022, he has focused on estate planning for Muslim families — helping them protect their wealth through thoughtful legal work grounded in classical fiqh and Texas and California law.

**Currently: **Timeline: "2017 — UH Law, top of class"

2017 — UH Law Center, JD

The first paragraph (conversion story, UCLA, JD 2017) stays — it is MLP's personal story and will not be repeated on MEP. Point "View full profile at McDanielEstatePlanning.com" at the new attorney page (W4.3), not the MEP homepage.

### **W2.9  ****Community section**

**Currently: **Heading "Trusted by families and imams across Texas.", a hard-coded "13 five-star Google reviews", broken g.page/r/review links, and four quoted testimonials.

- Remove all four testimonials. None has a written release.

- Heading becomes "What clients say."

- Replace the count and quotes with the live reviews block (W5).

### **W2.10  ****FAQ**

**Currently: **"What is probate and why should I avoid it?"

What is probate, and why do families plan around it?

I could not see the collapsed answers. Check each against W7. The answer to "Do you serve families outside Texas and California?" must say we serve Texas and California only, with no "coming soon." Mark up the block as FAQPage (W9.4).

### **W2.11  ****Closing call to action**

**Currently: **"…it costs nothing and takes less than ten minutes."

…it costs nothing and takes about ten minutes.

Matches the free-will page, which says "about 10 minutes."

### **W2.12  ****Footer**

**Currently: **"Attorney-led Islamic estate planning for Muslim families across the United States." (v3.0 2.4) and "This site is an educational and self-help resource. Use of this site does not create an attorney-client relationship."

Attorney-led Islamic estate planning for Muslim families in Texas and California. Legal services provided by McDaniel Estate Planning, PLLC.

Licensed in Texas and California. The information on this site is general and is not legal advice. Viewing this site does not create an attorney-client relationship. Legal services are provided only under a written engagement agreement with McDaniel Estate Planning, PLLC.

The current "self-help resource" line contradicts an attorney-supervised trust sold from the same page. Add the full name, address and phone block (W9.5). The footer "Legacy Plan" link points at #products, an anchor that does not exist; point it to the Legacy Plan page on MEP.

# **W3 — Other public pages on muslimlegacyplanning.com**

### **W3.1  ****Free Islamic will landing page (/free-islamic-will, and freemuslimwill.org)**

**Currently: **Meta: "Create your free Islamic will in about 10 minutes. Attorney-informed, shariah-grounded, and the right first step for every Muslim family."

Create a free Islamic will in about ten minutes — for Texas and California residents, with plain-language signing instructions.

**Currently: **"A warm, guided first step toward an estate plan that follows what Allah prescribed — no account needed to begin."

A guided first step toward an estate plan built around the Qur'anic shares — no account needed to begin.

**Currently: **"A will reflecting the Qur'anic distribution for your family"

A will drafted to reflect the Qur'anic shares, based on the family information you provide

**Currently: **"Available now in California and Texas" / "Other states coming soon."

Available for Texas and California.

**Currently: **"…some situations require attorney review. Your information is private and never shared."

…some situations require attorney review. Our privacy notice explains how your information is handled.

"Never shared" is absolute and untrue — intake data reaches service providers. The tool-level notices in v3.0 Section 4 still apply; this is only the landing-page wording.

### **W3.2  ****Guided Trust landing page (/trust)**

Recorded in the app walkthrough. Every instance below is on the public page.

| **Currently** | **Replace with** |
| --- | --- |
| "…for Texas families — Qur'anic inheritance enforced" (hero) | …for Texas families — built around Qur'anic inheritance shares |
| "Qur'anic inheritance, enforced" (feature strip) | Qur'anic shares built in |
| "structured to enforce Qur'anic inheritance shares privately, outside of probate" (What's Included, item 01) | structured to carry out Qur'anic inheritance shares privately, and designed to avoid probate for the assets it holds |
| "You want Islamic shares enforced" (eligibility) | You want your plan built around Islamic inheritance shares |
| "No upsells, no hourly billing" | No hourly billing |
| "Four documents. One flat fee. Nothing extra to buy." | One flat fee. One optional add-on if you need us to find your deed. |

- Add to the eligibility "good fit" list: "You are married and planning together." The app currently supports couples only.

- Replace the Jabal paragraph with the W2.6 giving copy. Remove "treasurer," "personally oversees its finances" and "the same day you buy."

- Every "Good Tree" / "GoodTree" reference renders from the product-name setting (v3.0 2.2–2.3).

### **W3.3  ****Plans, routing quiz and calculator (/plans, /which-plan, /inheritance-calculator)**

I could not review these pages live. Apply W7 to every line and report what you change. Specific requirements:

- /plans lists exactly the services offered on MLP — Free Islamic Will, Guided Trust, Legacy Plan, Family Waqf Plan — and links out to MEP for probate and business succession. No plan counts in headings or links unless accurate.

- Quiz outcomes route only to services we offer. Any outcome for someone outside Texas or California says so plainly, with no "coming soon."

- Calculator results are labelled as estimates based on the information entered.

- Single-person answers in the quiz must not route to the Guided Trust while the app supports couples only.

# **W4 — mcdanielestateplanning.com**

### **W4.1  ****Structure — from one long page to a small firm site**

Today the site is a single page of anchors. The firm site needs real pages so search engines and AI assistants can find and cite each service. Build these, using the existing look:

| **Path** | **Contents** |
| --- | --- |
| / | Homepage: hero, why legal implementation, services overview, short attorney bio, reviews, call to action |
| /attorney | Professional biography and credentials (v3.0 6.6; copy in W4.3) |
| /legacy-plan | The full-service plan |
| /family-waqf-plan | Counsel-approved copy (W6) |
| /probate-estate-administration | Probate and estate administration |
| /business-succession-planning | Business succession and advanced planning |

I will supply body copy for the three practice pages. Until then, build them with the card text from W4.2 so the structure and schema can go live.

### **W4.2  ****Services section — match what the firm actually offers**

Replace the six current cards with five, matching the services I confirmed:

| **Card** | **Copy** |
| --- | --- |
| Islamic Estate Planning Consultations | Keep the current text. |
| Legacy Plan | A full-service plan personally designed by your attorney: a revocable living trust, pour-over wills, powers of attorney and healthcare directives, deed preparation and recording, and a dedicated heba strategy session. From $3,500. |
| Family Waqf Plan | We draft the legal framework for your family waqf, built into your estate plan and designed for ongoing sadaqah jariyah. → links to /family-waqf-plan |
| Probate & Estate Administration | Keep the current text. |
| Business Succession Planning | Succession and estate planning for business owners, and customized planning for blended families and multiple properties. |

The old "Revocable Living Trust Planning," "Islamic Wills" and "Trust Funding & Deed Preparation" cards fold into the Legacy Plan. Add one line beneath the cards:

Prefer to start online? The Guided Trust and the free Islamic will are available at Muslim Legacy Planning.

### **W4.3  ****Attorney — homepage section and the new /attorney page**

**Currently: **The MEP attorney section repeats MLP's text, including "For the last five years, his practice has focused on probate and estate planning," "UH Law, top of class," and "the educational and technology platform."

### **Homepage section — short version**

Leonard McDaniel is an estate planning attorney licensed in Texas and California. He has focused on estate planning for Muslim families since 2022.

Photo, plus a link to /attorney. Timeline: "2017 — UH Law Center, JD · 2021 — Licensed in Texas · 2023 — Licensed in California."

### **/attorney page — full version**

Leonard McDaniel is an estate planning attorney and the founder of McDaniel Estate Planning, PLLC. He is licensed in Texas and California and is a graduate of the University of Houston Law Center. He embraced Islam in 2014 while studying history at UCLA, where he graduated magna cum laude.

Leonard has focused on estate planning for Muslim families since 2022, when he began working at Yaser Ali Law, an Islamic estate planning firm. He continues to study Islamic inheritance law privately.

He built the Muslim Legacy Planning Guided Trust so that more families could put an attorney-supervised plan in place that reflects Islamic inheritance and is structured under the law of the state where they live.

Leonard serves without compensation as secretary of the board of Jabal Foundation.

Do not list Arizona. Do not name any Islamic institution for his study.

### **W4.4  ****Reviews section**

Remove all four testimonials and the hard-coded count. Replace with the live reviews block (W5). Keep the heading "Client Experiences."

### **W4.5  ****"****One Practice, Two Platforms****"**** section**

**Currently: **"Muslim Legacy Planning is our educational and technology platform. It is where Muslim families can create a free Islamic will, build a self-service trust, and access attorney-reviewed estate plans. McDaniel Estate Planning is the licensed law firm that backs all of it."

Muslim Legacy Planning is the Islamic estate-planning service of McDaniel Estate Planning, PLLC. It is where families can create a free Islamic will, build an attorney-guided online trust, and learn about Islamic estate planning. McDaniel Estate Planning is the law firm that provides the legal services.

### **W4.6  ****Closing call to action**

**Currently: **"Plan your estate with confidence — religiously and legally."

Plan your estate thoughtfully — in faith and in law.

The current line reads as an assurance of religious and legal correctness.

### **W4.7  ****Footer**

**Currently: **"A statewide practice serving clients across Texas and California." No address, phone or email anywhere on the site.

Serving clients in Texas and California.

Add the identity block from W9.5. Keep the existing "Attorney Advertising…" disclaimer — it is correct.

### **W4.8  ****Links to MLP**

Use the canonical MLP host in every link (W1.4).

# **W5 — Live Google reviews, both sites**

Replaces the hard-coded "13 five-star Google reviews," the broken links, and the removed testimonials. Supersedes v3.0 2.7 and 2.8: live is now the only option.

### **W5.1  ****How it works**

- Fetch Place Details (rating, total review count, reviews) server-side for Place ID ChIJszQ9uNfRQIYRg3017kJNF8Y, cache for about 24 hours, and render as plain HTML. No Google script loads in the visitor's browser — this keeps the pages fast and consistent with v3.0 Section 1.

- Show the star rating, the live count ("[N] Google reviews"), and the reviews Google returns, in Google's order. Never filter by star rating.

- Attribute as Google requires: reviewer name and time as returned, and a "Reviews from Google" label.

- Two links: "Read all reviews on Google" and "Leave a review" (search.google.com/local/writereview?placeid=ChIJszQ9uNfRQIYRg3017kJNF8Y).

- Place the testimonial disclaimer component beside the block (v3.0 2.8 text).

- If the API fails, show only the "Read all reviews on Google" link. Never fall back to a stored number.

### **W5.2  ****No review markup**

Do not add Review or AggregateRating structured data built from these reviews. Google treats review markup that a business publishes about itself as ineligible, and it can trigger a manual action.

### **W5.3  ****Placement**

MEP: full block in the reviews section. MLP: compact block — rating, count, two most recent reviews, links.

# **W6 — Family Waqf Plan page**

**This copy has been reviewed by ethics counsel. **Use it verbatim. Do not add investment details, fund names, returns, "automatic," "perpetual," "partnership," or any statement that the firm or Afterfund "holds" the assets.

### **W6.1  ****Page: mcdanielestateplanning.com/family-waqf-plan**

An interior page, deliberately — counsel noted interior website pages are treated differently from the homepage for advertising-filing purposes.

Family Waqf Plan

A platform is only the implementation layer. We draft the legal framework for your family waqf — what property is dedicated, which charitable institutions benefit and in what order, and what happens if a beneficiary organization no longer exists.

We then help coordinate implementation. Our standard implementation uses Afterfund, an independent third-party charitable-giving platform that facilitates the investment and distribution of charitable assets. Afterfund is not affiliated with our firm, and we receive no compensation from it.

The result is a family waqf designed for ongoing sadaqah jariyah and continuing charitable benefit across generations.

Optional sentence, which counsel approved, if I confirm it against Afterfund's current materials:

According to Afterfund, charitable assets on its platform are invested using halal-certified investment funds.

Button: "Book a consultation."

### **W6.2  ****Everywhere else**

- MLP homepage: teaser only (W2.7).

- MEP services card: W4.2 text.

- The old phrases — "Afterfund partnership," "perpetual stream," "automatically, for generations," "Every dollar you endow continues to benefit your family and your masjid," "returning proceeds automatically" — must not appear anywhere on either site.

# **W7 — Words and claims never to publish**

Applies to every public page on both sites, including pages not named in this addendum. If you find one of these and the fix is not obvious from this table, ask.

| **Never** | **Instead** |
| --- | --- |
| "Enforce," "enforced" — of Islamic or Qur'anic shares | "Built around" or "designed to follow" the Qur'anic shares |
| "Shariah-compliant" as a promise ("every plan is shariah-compliant") | "Designed around Islamic inheritance principles" |
| "Avoids probate" as an outcome | "Designed to avoid probate for the assets it holds" |
| "Perpetual," "forever," "automatically, for generations" — of the waqf | "Designed for ongoing sadaqah jariyah" |
| "Partner," "partnership" — of Afterfund or any vendor | "Independent platform, not affiliated with our firm" |
| "Most," "every," "all" as unsupported statistics about families or plans | "Many," "some" |
| "Unmatched," "best," "premier," "only," "#1" | Remove |
| "Self-service," "self-guided," "DIY," "automated" | "Attorney-guided online" |
| "Our attorneys," "our legal team," "our lawyers" | "Our firm," or Leonard by name |
| "Across the United States," "nationwide," "other states coming soon" | "Texas and California" |
| "Treasurer," "personally oversees its finances" (Jabal) | "Serves without compensation as secretary of Jabal Foundation's board" |
| "The same day you pay," "was donated," "5% of your fee" | "Will donate $75 of its own funds" |
| "Top of class," "five years" | Remove · "since 2022" |
| "Private and never shared" | Refer to the privacy notice |
| "Nonrefundable," "earned on receipt" | Never (v3.0 13.4) |
| Any quoted testimonial | Live Google reviews only (W5) |
| Any comparison between attorneys based on their religion | Never |
| "Nothing extra to buy," "no upsells" | Mention the optional $35 deed retrieval |

### **W7.1  ****Check it mechanically**

Before calling Phase 1 done, search the rendered HTML of every public page on both hosts for these strings and send me the result. Any hit is either fixed or explained:

enforce · shariah-compliant · avoids it entirely · perpetual · partnership · unmatched · self-service · self-guided · our attorneys · legal team · across the United States · coming soon · treasurer · oversees its finances · same day · top of class · five years · never shared · nonrefundable · earned on receipt · GoodTree · Good Tree · picsum · g.page/r/review

# **W8 — Look and accessibility**

Keep the current design. This is defect-fixing and polish, not a redesign. Do not change layouts beyond what the tickets require.

### **W8.1  ****Let people zoom**

**Currently: **Every page on both sites sets maximum-scale=1 and user-scalable=no in the viewport tag.

That blocks pinch-to-zoom on phones — an accessibility failure, and a real problem for an older audience reading legal text. Remove both values on every page of both sites.

### **W8.2  ****One design system across both sites**

- Same fonts, colours, spacing, button styles and footer pattern on both sites. They are close today; make them identical.

- Prices written one way everywhere: "$1,499," "from $3,500."

- Remove any remaining Good Tree logos or imagery.

### **W8.3  ****Readability**

- Check the light grey body and caption text on the cream background against WCAG AA contrast (4.5:1 for body text). Darken the token if it fails.

- Visible keyboard focus on every link and button.

- Real alt text on every image; no placeholder descriptions.

### **W8.4  ****Mobile pass**

Check every section of both homepages and every new page at 375px width: no sideways scrolling, tap targets at least 44px, nothing cut off. Most traffic arrives from WhatsApp on phones.

### **W8.5  ****Images**

- Hero image on MLP replaced (v3.0 6.2) — I supply it.

- Compressed modern formats with fixed dimensions to prevent layout shift.

- A favicon and a share image for each site (v3.0 6.1).

### **W8.6  ****Error pages**

Branded 404 and 403 pages on both hosts, with navigation back. Both currently render as bare text.

# **W9 — Search and AI retrieval**

v3.0 Sections 6.1–6.7 still apply (link previews, sitemaps, canonicals, schema basics, attorney page, performance). These tickets make them specific to the two-site setup.

### **W9.1  ****Titles and descriptions**

| **Page** | **Title / meta description** |
| --- | --- |
| MLP home | W2.1 |
| MLP free will | "Free Islamic Will for Texas & California │ Muslim Legacy Planning" / W3.1 meta |
| MEP home | Keep the current title and meta — both are accurate |
| MEP /attorney | "Leonard McDaniel, Islamic Estate Planning Attorney │ McDaniel Estate Planning" |
| MEP practice pages | "[Service] │ McDaniel Estate Planning, PLLC — Texas & California"; description from the W4.2 card |

### **W9.2  ****Keep app pages out of search**

Add noindex and a robots.txt disallow for /login, /dashboard, /create-trust/*, /make-your-trust-work/*, /admin/* and payment pages. None of these should ever appear in search results or AI answers.

### **W9.3  ****Headings and answers**

- One H1 per page.

- FAQ questions as question-form headings, each answer opening with a sentence that makes sense on its own. That is the sentence AI assistants lift.

### **W9.4  ****Structured data**

| **Site** | **Markup** |
| --- | --- |
| MEP | LegalService for the firm (name, url, telephone, address, areaServed: Texas and California, founder → Person). Person on /attorney (name, jobTitle, alumniOf University of Houston Law Center, worksFor the firm). Service on each practice page. |
| MLP | Organization and WebSite, with parentOrganization pointing to the MEP LegalService entity. |
| Both | FAQPage on every FAQ block. BreadcrumbList on interior pages. No Review or AggregateRating (W5.2). |

### **W9.5  ****Identical name, address and phone everywhere**

The same block in both footers and in all structured data, character for character:

McDaniel Estate Planning, PLLC · 13100 Wortham Center Drive, 3rd Floor, Houston, TX 77065 · (713) 659-9668 · admin@mcdanielestateplanning.com

Directory records must match too; Sumayya is handling those separately.

### **W9.6  ****sameAs links**

Only to profiles that are verified and ours: the Google Business Profile and, once claimed and corrected, Avvo. Nothing unverified.

### **W9.7  ****Optional — llms.txt**

A plain-text /llms.txt on each site summarising the firm, the services, the licensure and the key URLs. Cheap to add; worth doing if it takes under an hour.

# **W10 — Order and finish line**

| **Step** | **Work** |
| --- | --- |
| 1 | v3.0 Section 1 — tracking inventory, disable, preserve, report. Still first. |
| 2 | All copy tickets: v3.0 Section 2, W2, W3.1–W3.2, W4.2–W4.7, W6. These are fast and fix what is live and wrong. |
| 3 | W1 — host routing, canonical hosts, redirect check. |
| 4 | W5 — live reviews. |
| 5 | W4.1 and W4.3 — the new MEP pages and attorney page. |
| 6 | W8 — accessibility and polish. |
| 7 | W9 plus v3.0 Section 6 — search foundations. |
| 8 | W3.3 — audit plans, quiz and calculator. |
| 9 | v3.0 Sections 3–5 — free-will gating, intake notices, first-party attribution. |

## **Phase 1 is done when**

- The W7.1 string search returns nothing unexplained on either host.

- Pinch-to-zoom works on every page.

- Reviews update themselves, and the count matches the Google profile.

- MEP has the attorney page and four practice pages, each with its own title and markup.

- No app route is served or indexed on MEP, and none is indexed on MLP.

- Every internal link uses the canonical URL.

- Links pasted into WhatsApp show a title, description and image for both sites.

- Lighthouse scores recorded for both homepages (v3.0 6.7).

- I have signed off on the copy.

# **W11 — What I owe you**

| **#** | **Item** |
| --- | --- |
| 1 | Sign-off on every shaded copy block in this addendum. |
| 2 | The MLP hero image. |
| 3 | Body copy for /legacy-plan, /probate-estate-administration and /business-succession-planning. |
| 4 | Whether to include the optional halal-funds sentence on the waqf page (W6.1). |
| 5 | Confirmation that the services restructure on MEP (W4.2) is right. |

## **Not for Abdullah — Leonard****'****s own follow-ups**

- Check whether the revised homepages need filing with the Advertising Review Committee; counsel indicated homepages are treated differently from interior pages.

- Afterfund diligence per counsel's checklist, and the third-party platform clause in the full-service engagement letter.

- Commercial co-venturer contract with Jabal for California, signed by two officers other than Leonard. The new giving copy is more accurate than what is live today, so publish it now and finish the contract in parallel.

- Optional: add live Google review display to the next counsel batch for certainty. I have treated public Google reviews as distinct from testimonials that need a signed release.

*Questions on any ticket come to me before you build around them.*