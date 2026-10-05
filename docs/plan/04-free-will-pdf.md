# 04: Free-will PDF from Templates v2 (AB B6.8, D1, D3)

Read `00-overview.md` and `docs/specs/will-templates-v2.md` in full, including the affidavit appendix.

## Approach
- Generate the PDF directly with **pdfmake**. Check the installed version's docs for the server-side API: the 0.2.x `PdfPrinter` differs from 0.3. Use pdf-lib (already installed) to merge.
- Two documents, merged into one file:
  1. **Will**: will text → Appendix A → Execution → Attestation → (TX) self-proving affidavit. The footer reads `Page X of Y` on every page, counting the Will pages only.
  2. **Sheets**: the signing-instructions sheet and the limitations sheet, with no page numbers. Their headings already say "not part of your Will".
- Embed a serif TTF with Latin Extended coverage (for example Noto Serif, OFL) from `static/fonts/`. Load it the way `renderWill.ts` loads static files today, and cache it in memory. Test with names containing `ā`, `ʿ` and `é`.
- Put the generation date only in the PDF metadata (`creationDate`). No date appears in the body.

## Files
- New `src/lib/server/documents/willPdf/`:
  - `context.ts`: maps answers to TPL merge fields. Adapt `buildWillContext.ts`.
  - `definition.ts`: pure `buildWillDefinition(ctx)` and `buildSheetsDefinition(ctx)`, returning pdfmake doc definitions.
  - `render.ts`: renders both, merges them, returns `{ buffer, filename: islamic-will-{name}-{id}.pdf }`.
- Text lives in `definition.ts` as constants copied verbatim from TPL Part 1 (CA) and Part 2 (TX).
- Never print `[IF …]`, `{{…}}` or the grey instruction lines.

## Merge-field rules (TPL)
- `marital_status_display`: one of Married, Single, Widowed, Divorced. The other options never reach here, because task 02 stops them.
- `children_names_joined`: "A, B, and C". With no children, print the ELSE branch.
- Parents: `{{name}} (living|deceased)`.
- `executor_n` and `guardian_n`: `Full Name, my {relationship}`. Executor 3 is conditional. 2 executors are required, and 2 guardians when there are minor children (D2).
- Wasiyyah:
  - The table appears only when gifts exist. Otherwise print `I make no wasiyyah gifts.` Never print an empty table.
  - EIN is blank for persons. The Notes column is blank (D3).
- Appendix A: one row per heir who is actually entitled, with name, relationship, fraction and approximate % to 2 decimals.
  - Call `assertSharesSumToOne(heirs)` first. It is a runtime guard in `willPdf/context.ts`: if the shares don't sum to exactly 1, throw and generate nothing.
  - No blank rows. Zero-share heirs are omitted.
- Section numbers come from code, in order. No county appears anywhere, except as a blank line in the TX affidavit.
- CA has **no** notary affidavit.

## Wiring
- Replace the `renderFreeWill` usage in `src/routes/free-islamic-will/+page.server.ts` with the new renderer.
- Rename `saveGeneratedWillDocx` to `saveGeneratedWillFile` with content type `application/pdf`.
- Email (`freeWillReadyV2.ts`):
  - Attach the PDF.
  - Remove `DRAFT_MARKER` and the Texas step list. The sheets are inside the PDF.
  - Keep the V3 §3.4 wrapper sentence.
  - Update `freeWillReadyV2.test.ts`.
- Completion screen: show the download and the wrapper sentence. Remove the old Texas steps component from the free will only.
- `src/lib/free-will/signing.ts` stays for the trust funding pour-over card (Phase 2). Comment that the free will no longer uses it.
- Delete from the free-will path:
  - `applyDraftWatermark`
  - `DRAFT_MARKER`
  - `scripts/build-will-template.mjs`
  - `static/templates/*freewill*.docx`
  - the v1 and v2 docx branches in `renderWill.ts`
  - `npm run build:will-template`

  First confirm the trust renderer (`renderJointTrust`) does not import any of these.

## Tests
- `definition.test.ts`: for both states, using the v11 fixture from `renderWill.test.ts` and a no-children, no-wasiyyah fixture, the flattened text:
  - contains no `{{`, `[IF`, `County County` or `DRAFT`
  - has sequential section numbers 1..18 (TX: plus 19)
  - contains `I make no wasiyyah gifts.` when there are no gifts
  - has no dates
  - CA contains no `Notary Public`
  - TX contains the affidavit
- `render.test.ts`:
  - the buffer starts with `%PDF`
  - the merged page count = will pages + sheet pages
  - the metadata has a creation date

## Done when
A TX will and a CA will both download as PDFs that match TPL, and all tests pass.
