**McDANIEL ESTATE PLANNING, PLLC**

**Appendix A Deliverables**

Copy, facts and decisions owed to the developer under the build specification

| **Field** | **Detail** |
| --- | --- |
| For | Abdullah, with Leonard's review |
| Date | 1 October 2026 |
| Closes | Appendix A items 2 (biography), 4 (execution instructions), 9 (fee language / Schedule A), 10 (charity copy) |
| Also adds | Payment routing by state, from the multi-state trust account brief |
| Status | Texas items final subject to Leonard's sign-off. California items marked DRAFT need attorney verification before use. |

**Copy in shaded boxes is approved language once Leonard signs off. **Same rule as the spec: use exactly as written, change the layout rather than the words.

# **1. Schedule A — Scope of the Flat Fee**

Attaches to the Limited-Scope App Engagement immediately after counsel's fee clause. Built from what the app, the generated documents and the closing letter actually deliver, as observed end to end on 30 September and 1 October 2026.

**Do not hard-code the price. **Fees are adjustable per matter from the admin dashboard. Schedule A refers to "the Flat Fee stated in this Agreement," and the agreement renders the amount actually charged on that matter.

## **1.1 Texas — Schedule A text**

SCHEDULE A — SCOPE OF THE FLAT FEE

The Flat Fee stated in this Agreement covers the following services and no others.

### **Included**

| **#** | **Service** |
| --- | --- |
| 1 | Attorney-supervised preparation of a joint revocable living trust for both spouses, using the information you provide through the guided interview. |
| 2 | A pour-over will for each spouse. |
| 3 | A certification of trust. |
| 4 | An acknowledgment recording your Islamic ownership election. |
| 5 | Calculation of Islamic inheritance shares from the family information you provide, applied under the school of jurisprudence you select. |
| 6 | Limited attorney review of your information and documents for eligibility, internal consistency, and obvious input errors. |
| 7 | One deed conveying your primary residence to your trust, if you own a home in Texas. |
| 8 | Recording of that deed with the county clerk. County recording fees for this one deed are paid by the Firm and included in the Flat Fee. |
| 9 | Coordination of one notarization session for your trust, certification of trust, ownership acknowledgment and deed. |
| 10 | Written instructions for signing your pour-over wills. |
| 11 | Written guidance on applying for or preserving your Texas residence homestead exemption. |
| 12 | Access to the Make Your Trust Work funding dashboard. |
| 13 | A printed legacy binder shipped to the address you provide. |
| 14 | A closing letter summarising your remaining action items. |

### **Not included**

| **#** | **Excluded unless separately agreed in writing** |
| --- | --- |
| 1 | Tax planning, and any financial or investment advice. |
| 2 | Review of beneficiary designations on retirement accounts, life insurance, annuities or payable-on-death accounts. |
| 3 | Retitling or funding any asset other than the one primary residence deed in item 7. You are responsible for retitling accounts and updating designations. |
| 4 | Analysis of whether specific property is community or separate property. |
| 5 | Business, entity or succession planning. |
| 6 | Any real property other than one primary residence in Texas. |
| 7 | Filing the homestead exemption application on your behalf. |
| 8 | Supplying witnesses or a notary for signing your pour-over wills. Your wills must be signed in person as described in the signing instructions. |
| 9 | Probate, post-death trust administration, or representation of any trustee, executor, spouse, heir or beneficiary. |
| 10 | Amendments or restatements after your documents are delivered. |
| 11 | Storing your original signed documents. |
| 12 | Monitoring changes in your family, assets or the law after this engagement ends. |

### **Optional, at additional cost**

| **Service** | **Fee** |
| --- | --- |
| House deed retrieval — the Firm locates and obtains a copy of your existing deed from county records. Any county copy charge is paid by the Firm and included in this fee. | $35 |

## **1.2 Three things this schedule changes in the product**

- The landing page promise "Nothing extra to buy" must go, or be qualified, because the $35 add-on exists. Suggested replacement: "One flat fee. One optional add-on if you need us to find your deed."

- Item 8 says recording fees are paid by the Firm and included. That matters: under the California analysis below, a separately itemised recording cost would be a client cost advance that cannot go to operating. Keeping recording inside the flat fee avoids the problem in every state.

- The same logic applies to the $35 add-on — it is defined as a service fee with the county charge absorbed, not a pass-through cost.

## **1.3 California variant — DRAFT, needs verification**

**Do not use the Texas schedule for California clients. **Items 7, 8 and 11 are Texas-specific. Items needing California equivalents before launch:

- Deed recording with the county recorder, including the Preliminary Change of Ownership Report that accompanies the deed

- Confirmation that the transfer to a revocable trust is excluded from reassessment and from documentary transfer tax, and the wording that states this to the client

- Texas homestead guidance replaced with California homeowners' exemption guidance, or removed from the California package

- "Texas" replaced throughout, including "one primary residence in Texas"

- California pour-over will signing instructions per section 4

# **2. Fee handling by state**

From the multi-state trust account brief dated 1 October 2026. The conclusion that matters for the build: California can launch now without a California trust account, but the payment flow has to route differently by jurisdiction.

| **State** | **Advance flat fee goes to** |
| --- | --- |
| Texas | Confirm current practice — see 2.2 |
| California | Texas operating account |
| Illinois | Texas operating account |
| Michigan | Trust until earned |
| New York | Texas operating account |
| New Jersey | NJ Attorney Business Account |

## **2.1 California clause — goes in the signed engagement agreement**

**It must be inside the document the client signs. **California has said a disclosure placed elsewhere — on a payment page, or in a separate unsigned notice — does not satisfy the rule for fees over $1,000.

Advance Flat Fee; Deposit to Operating Account. The legal fee stated in this Agreement is a flat fee for the services described in this Agreement and may be paid before those services are completed. Client understands that Client has the right to require that an advance flat fee be deposited into a client trust account and remain there until earned. Client instead expressly agrees that the Firm may deposit the advance flat fee into the Firm's operating account upon receipt. Client further understands that, if the representation terminates or the services for which the fee was paid are not completed, Client remains entitled to a refund of any portion of the fee that has not been earned.

By electronically signing this Agreement, Client expressly agrees to the foregoing arrangement.

## **2.2 Build tickets arising**

### **F1  ****Jurisdiction-aware payment routing**

The account a fee lands in must depend on the client's state. California fees route to operating. Texas fees route according to 2.3. Drive this from the jurisdiction field in spec section 7.3, never from a hard-coded account.

### **F2  ****The engagement agreement must be a signed writing**

- Add explicit electronic-signature language at the acceptance point — the current checkbox-and-date flow should state that clicking constitutes the client's electronic signature

- Insert the 2.1 clause into the California version of the agreement only

- Both the client and the Firm execute it

### **F3  ****Deliver a copy of the signed agreement**

Automatically email the client a PDF of the executed agreement on acceptance and store it on the matter. California requires the client be given a signed copy, and no copy-delivery step was observed in the walkthrough.

### **F4  ****No bundled cost advances**

Never collect a separate recording, filing or third-party cost amount into the same payment as the legal fee. Schedule A item 8 and the $35 add-on are both structured to avoid this. If any future add-on is a genuine pass-through cost, stop and ask before building it.

### **F5  ****Remove ****"****nonrefundable****"**** and ****"****earned on receipt****"**** everywhere**

Already in spec 13.4. Restated because the trust account brief independently confirms it creates risk in California and Michigan.

## **2.3 One question back to Leonard**

**Where does a Texas client****'****s $1,499 land today — IOLTA or operating? **Counsel's earlier instruction to stop transferring "an unearned client advance" to charity implies Texas fees are being treated as unearned until earned. If so, Texas fees belong in the IOLTA and move to operating as earned, which is the opposite of the California routing. Abdullah cannot build F1 without this answer.

# **3. Charitable giving — decisions and replacement copy**

## **3.1 Decisions made**

| **Question** | **Decision** |
| --- | --- |
| What is the 5% calculated on? | The list price. Fixed at $75 per Guided Trust purchased, regardless of discount or the amount actually charged. |
| Where does the money come from? | The Firm's operating account. Firm money, not client money. |
| Pause California promotion? | No. |

Funding the donation from operating resolves counsel's core objection, which was that a same-day transfer moved an unearned client advance out of trust. The donation is now the Firm's own gift of a fixed amount, and the copy below says exactly that.

## **3.2 Replacement copy**

### **Landing page — giving section**

For every Guided Trust purchased, McDaniel Estate Planning donates $75 of its own funds to Jabal Foundation's Legacy Waqf, which supports orphan development and ongoing meal distribution. The donation is made by the Firm and is not part of your fee. Leonard McDaniel serves without compensation as secretary of Jabal Foundation's board.

### **Payment screen — beneath the fee**

With your purchase, McDaniel Estate Planning will donate $75 of its own funds to Jabal Foundation's Legacy Waqf. This does not come from or add to your fee. Leonard McDaniel serves without compensation as secretary of Jabal Foundation's board.

### **Confirmation message after payment**

Thank you. McDaniel Estate Planning will donate $75 of its own funds to Jabal Foundation's Legacy Waqf in connection with your purchase. Leonard McDaniel serves without compensation as secretary of the foundation's board.

"Will donate" rather than "has donated," so the statement stays true however the transfer is timed.

### **Charitable bequest picker — beside the Jabal Foundation entry**

Leonard McDaniel, your attorney, serves without compensation as secretary of this organization's board. Including it is entirely your choice and has no effect on your plan, your fee, or our work for you.

### **Charitable bequest picker — shown again if Jabal is selected, before confirming**

You have selected Jabal Foundation, where your attorney serves as an unpaid board secretary. Please confirm this gift reflects your own wishes.

This needs an explicit confirm control, recorded with a timestamp — the same pattern as the heba acknowledgment.

### **Charitable bequest picker — section heading**

Remove "a few well-regarded Islamic charities you may want to consider." Replace with:

Some Islamic charities in Texas. Listing an organization here is not a recommendation. You may also add any U.S. charity by its legal name and EIN, or leave no charitable gift.

*Compare against counsel**'**s disclosure template before publishing, and use counsel**'**s wording wherever the two differ.*

## **3.3 Build changes**

- Replace the computed donation amount with a single fixed configuration value of $75. The current screen calculates 5% of the actual fee, which displayed $0.05 on a $1.00 test sale and $74.95 at list price.

- Remove "the same day you pay" and "was donated" from all three screens.

- Remove "treasurer" and "personally oversees its finances" everywhere.

- Add the two picker disclosures and the recorded confirmation.

## **3.4 One compliance item that remains**

**California commercial co-venturer. **Promoting "every purchase supports Jabal" to California consumers still requires a written contract with Jabal signed by two of its officers, transfers at least every 90 days, and an accounting. Not pausing is your call; the contract is still needed before the California giving copy goes live. Since you are Jabal's secretary, the two officer signatures on Jabal's side should be officers other than you.

# **4. Will signing instructions**

**Yes — the audit answered this. **The closing letter already contains correct Texas will-signing instructions: in person, two witnesses who are not beneficiaries, and explicitly not an online notary for the will or the self-proving affidavit. The text below formalises that position for spec ticket 3.4 (the free will) and for the pour-over will signing card in the funding module, so all three say the same thing.

Your four earlier questions, as the closing letter already answers them: a self-proving affidavit is included with every will; holographic wills are not offered as an option; witnesses must be at least 14 and receive nothing under the will; and clients arrange will signing themselves, in person, while the Firm coordinates notarization of the trust documents only.

## **4.1 Texas — final, subject to sign-off**

How to sign your will in Texas

1. Sign in person. Your will cannot be signed through an online notary or a video session.

2. Have two witnesses with you at the same time. Each must be at least 14 years old.

3. Choose witnesses who receive nothing under your will.

4. Sign your will in front of both witnesses. Each witness then signs in front of you.

5. Sign the self-proving affidavit at the end of your will in front of a notary who is physically present, with both witnesses also signing before the notary. This allows your will to be accepted without your witnesses having to appear in court.

6. Notarization alone is not a substitute for the two witnesses.

7. Do not write on or change your will after signing.

8. Keep the signed original somewhere safe that your executor can reach. A copy is not a substitute for the original.

## **4.2 California — DRAFT, needs your verification**

**Drafted from the Probate Code requirements as I understand them. **You are California-licensed and should verify each line before it is used.

How to sign your will in California

1. Sign in person, with two witnesses present at the same time.

2. Your witnesses must understand that the document they are witnessing is your will.

3. Choose witnesses who receive nothing under your will. A gift to a witness can be presumed to have been obtained improperly.

4. Sign in front of both witnesses. Each witness then signs.

5. California does not require a notary for a will. The witnesses' signed declaration in the attestation clause allows your will to be proved without your witnesses testifying.

6. Do not write on or change your will after signing.

7. Keep the signed original somewhere safe that your executor can reach.

# **5. Attorney biography**

## **5.1 Verified facts**

| **Fact** | **Detail** |
| --- | --- |
| Name | Leonard McDaniel, JD |
| Law school | University of Houston Law Center |
| Active admissions | Texas, 2021 · California, 2023 |
| Inactive admission | Arizona, 2021 |
| Estate planning focus | Since 2022, beginning at Yaser Ali Law, an Islamic estate planning firm |
| Islamic inheritance study | Ongoing private study under a senior student. No institutional credential. Not completed. |
| Firm | Founder, McDaniel Estate Planning, PLLC |
| Board role | Unpaid secretary, Jabal Foundation |

## **5.2 Remove from the current biography**

| **Current claim** | **Why it goes** |
| --- | --- |
| "Five years" focused on probate and estate planning | Focus began in 2022. That is about four years, not five. Replace with "since 2022," which stays accurate as time passes. |
| "Top of class" | Top half of the class is not top of class. Remove entirely — it was the right instinct. |
| Darul Qasim, or any named Islamic institution | Informal study under a senior student is not affiliation with or a credential from the institution. Naming it would overstate the relationship. |
| Superlatives about another firm, such as "premier" | Not needed, and a laudatory claim about another firm in your own advertising is avoidable risk. |

**Arizona. **Leave it out of marketing copy. Listing an inactive admission beside active ones invites the impression you can practise there. If the formal attorney profile lists admissions comprehensively, show it as "Arizona (inactive)."

**Correction to my earlier notes. **I described the unclaimed Avvo record showing an Arizona attorney as contamination from someone else's profile. Your 2021 Arizona admission makes it likely that record is yours. Claim it and update it rather than disputing it. Sumayya's directory task should treat it that way.

## **5.3 Draft copy**

### **Short — for the byline on every content page**

Leonard McDaniel is an estate planning attorney licensed in Texas and California. He has focused on estate planning for Muslim families since 2022.

### **Long — for the attorney profile page**

Leonard McDaniel is an estate planning attorney and the founder of McDaniel Estate Planning, PLLC. He is licensed in Texas and California and is a graduate of the University of Houston Law Center.

Leonard has focused on estate planning for Muslim families since 2022, when he began working at Yaser Ali Law, an Islamic estate planning firm. He continues to study Islamic inheritance law privately.

He built the Muslim Legacy Planning Guided Trust so that more families could put an attorney-supervised plan in place that reflects Islamic inheritance and is structured under the law of the state where they live.

Leonard serves without compensation as secretary of the board of Jabal Foundation.

*Naming Yaser Ali Law is optional. It is accurate and adds credibility; drop it if you would rather not name another firm in your own marketing.*

# **6. Still open**

| **#** | **Item** |
| --- | --- |
| 1 | Where Texas fees land today — IOLTA or operating (section 2.3). Blocks build ticket F1. |
| 2 | Sign-off on Schedule A, the Texas will instructions, the charity copy and the biography. |
| 3 | Verify the California will instructions and the California Schedule A items. |
| 4 | Commercial co-venturer contract with Jabal, signed by two Jabal officers other than Leonard, before California giving copy goes live. |
| 5 | Check the charity copy against counsel's disclosure template. |
| 6 | Michigan rule change — recheck before Michigan launch. |
| 7 | New Jersey business and trust accounts — open before New Jersey launch. |