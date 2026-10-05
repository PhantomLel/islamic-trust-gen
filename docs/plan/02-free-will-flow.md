# 02: Free will flow (AB B6.1–B6.7, D4, D13)

Read `00-overview.md` and `docs/specs/addendum-b.md` §B6 first.

Main files:
- `src/routes/free-islamic-will/+page.svelte` and `+page.server.ts`
- `src/lib/free-will/{config,logic,acknowledgment}.ts`
- `src/lib/server/freeWill.ts`
- `src/lib/components/{OutOfStateExit,IntakePrivacyNotice}.svelte`
- the admin free-wills views

Start by extracting the phase logic into a pure `src/lib/free-will/flow.ts`, so the new order is unit-testable. Keep the Svelte component thin.

## 1. Kill switch (AB B6)
- Setting `free_will_enabled`, default `true`, stored through `settings.ts`.
- Admin toggle at the top of the admin Free Wills tab. It is a form action that sets the setting.
- When off:
  - The landing content still renders.
  - The tool area shows `The free Islamic will is temporarily unavailable.` (TODO(Leonard): confirm wording) plus the consultation booking link.
  - All free-will form actions return 503.
- Test: actions refuse when the setting is off.

## 2. Counsel notice first (AB B6.1)
- New first phase `notice`, before `state`. Show the B6.1 text verbatim and an `I understand` button.
- On click, store `{ version: 'fw-notice-2026-10-03', acceptedAt: ISO }` in local state and localStorage.
- Server: save it to `free_will.acknowledgmentData` and `acknowledgmentAcceptedAt`. Reuse these columns; the old checkbox shape is replaced.
- The server refuses to save without this version.
- Bump `STORAGE_KEY` to `free-will:v2` so old in-progress sessions restart at the notice.

## 3. Remove the old acknowledgment step (AB B6.2, D13)
- Delete the `acknowledge` phase, both checkboxes, `selfHelpDisclaimerCopy`, the community-property checkbox copy and their gating.
- Update `isAcknowledgmentComplete` and `assertAcknowledgmentComplete` to check only the B6.1 record. Update their tests.
- Grep user-facing free-will text for absolute "no attorney-client relationship" statements and remove them: page, email, document context.

## 4. No attorney review anywhere (AB B6.3)
- Replace `legalMode` and `legalModeDisclaimers` with the constant `'self-help'`. In admin, display the mode as `Self-help`.
- Remove any review-queue, status-change or comment actions for free wills in admin. Admin views are read-only.
- Replace the copy `A clear note of anything in your situation worth attorney review` with `A note of situations this tool does not handle`.
- Remove any other wording that implies review.

## 5. Order after the state question (AB B6.6)
- The flow is: notice → state → (out-of-state exit, unchanged from V3 §3.1–3.2) → **warning screen** with the B6.6 text verbatim and a Continue button → county → the remaining questions.

## 6. Notice where personal info starts (AB B6.4, D12)
- Remove `IntakePrivacyNotice` from the free will only; the trust app keeps it.
- On the `full_legal_name` step, show `We protect your information and use it as described in our Privacy Policy.` as plain text with no link (D12).

## 7. Copy changes (AB B6.5)
Apply every row of the B6.5 table, verbatim:
- the landing page bullet
- any `exact Qur'anic share` wording
- the address help text (`never share it`)
- the county help text
- the wasiyyah intro
- the review-note line

Grep these places for leftovers:
- `src/lib/free-will/config.ts`
- `src/routes/free-islamic-will/+page.svelte`
- `WillWasiyyahInput.svelte`
- `heir-explainer.ts`

## 8. Marital status (AB B6.7)
- Options, in this order:
  - `Married`
  - `Married, separated but not divorced`
  - `Registered domestic partnership` (only when the state is CA)
  - `Single`
  - `Widowed`
  - `Divorced`
- Separated, or domestic partnership → phase `not_handled`:
  - Render `willFlagBoundaryCopy` (V3 §4.5) and a `Book a consultation` button.
  - Generate no will.
  - The server refuses to save these answers.

## 9. Hanafi only (AB B6.7)
- Remove any school or madhhab question from the free will. The trust app keeps its own.
- The calculator call always uses Hanafi.

## 10. Undistributed estate stops (AB B6.7)
- Add `isEstateFullyDistributed(result)` to `src/lib/free-will/logic.ts`. It returns false when `dhawulArhamNeeded`, or when the heirs' shares sum ≠ 1.
- After the heirs step, if it returns false → `not_handled`, the same as §8.
- The server enforces the same check.

## 11. Executors and guardians (D2)
- Require executor 1 and executor 2; executor 3 stays optional.
- When there are minor children, require guardian 1 and guardian 2.
- Update `rep-validation.ts`, the validation messages and the existing C1 tests.

## 12. No account step (D4)
- Replace the `account` phase with a `delivery` form:
  - name and email
  - `emailPurposeNotice`
  - the unchecked marketing opt-in (`marketingConsentLabel`)
- Change `savePending` to:
  - save the row with `userId` null (as now),
  - generate the document (task 04 swaps the renderer),
  - email it,
  - return `{ willId, willDownload }`.
- Signed-in users still use `saveAuthed`. Remove the magic-link and Google buttons from the free will. Keep `claimPendingFreeWills` for old rows.
- Remove the `returning` phase. "Edit my answers" restores from localStorage only.

## Tests
- `flow.test.ts`:
  - The notice comes before the state question.
  - The warning screen comes right after an in-state answer.
  - Separated, CA domestic partnership, and wife-only all reach `not_handled`.
  - Texas has no domestic-partnership option.
- Server action tests:
  - No notice record → 400.
  - Not-handled answers → 400.
  - Switch off → 503.

## Done when
The B6 finish-line items, except PDF output, are true. No checkbox gate remains in the free will.
