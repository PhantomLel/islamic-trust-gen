# 13: Simplify the content portal (D5, D6, AB B2 categories and caveats)

Read `00-overview.md`, V3 §7–8 and AB B2.

The portal at `/admin/content/**` already exists. This task removes roles and 2FA, collapses the statuses, and seeds data.

## 1. One role (D5)
- `src/lib/content/permissions.ts`: `can(role, action)` is true only when `rolesOf(role)` includes `admin`. Delete:
  - `content_author` and `content_publisher`
  - `isContentStaffRole`
  - `CONTENT_SESSION_IDLE_MS`
  - `contentSessionIdleExpired`
  - `contentSessionPathAllowed`
  - `CONTENT_ROLES` in `types.ts`
- `src/lib/server/content/guard.ts`: `requireContentStaff` becomes an admin check. Drop the `allowWithout2fa` option.
- `src/lib/server/auth.ts`: remove the `twoFactor` plugin and the session-create hook that shortens content-staff sessions.
- `src/hooks.server.ts`: remove the idle-expiry and staff-path checks.
- Delete these routes and their links:
  - `src/routes/login/staff/**`
  - `src/routes/admin/content/security/**`
  - `src/routes/admin/content/team/**`
- In `src/routes/login/+page.server.ts` and `src/routes/signup/+page.server.ts`, remove the content-staff branches.
- Rewrite `permissions.test.ts`:
  - admin can do everything
  - client and null can do nothing

## 2. Statuses (D6)
- `CONTENT_STATUSES` = `draft | published | unpublished`. A scheduled item is `draft` with `scheduledPublishAt` set.
- In `src/lib/server/content/pages.ts` and the video equivalent:
  - Delete `submitForReview` and `submitVideoForReview`, and the `submit` actions and buttons.
  - `schedulePage` keeps the status as `draft`.
  - The cron in `publishDuePages` is unchanged.
- The audit log stays.

## 3. Migration: `drizzle/0009_single_admin_and_content.sql` (idempotent)
- `UPDATE "user" SET role = 'admin' WHERE role LIKE '%content_author%' OR role LIKE '%content_publisher%';`
- `UPDATE content_page SET status = 'draft' WHERE status = 'in_review';` and the same for `video_page`.
- `DROP TABLE IF EXISTS two_factor;` and `ALTER TABLE "user" DROP COLUMN IF EXISTS two_factor_enabled;`
  - Remove the matching tables and columns from `auth.schema.ts`.
  - Remove the `two_factor` statements from `0008` only if they would break a fresh apply. Otherwise leave history alone.
- Seed the 10 AB B2 categories in the given order, with slugs (e.g. `islamic-inheritance-basics`). Use `ON CONFLICT (slug) DO NOTHING`.

## 4. Jurisdiction caveats (AB B2, V3 8.5)
In the caveat logic used by `ContentPage.svelte`:
- `TX` → the V3 8.5 default.
- `CA` → the AB B2 California text.
- `GENERAL` → the AB B2 General text. This is new: General pages now render a caveat.
- `BOTH` → the TX default.
- A per-page override still wins.
- Put the three texts in `src/lib/content/caveats.ts` and test each branch.

## 5. Report
List the admin accounts that were converted (by email domain only, never full addresses).

## Done when
- No 2FA code, staff login or content roles remain (`grep -ri "content_author\|twoFactor\|login/staff" src` → nothing).
- An admin can create, publish, schedule and unpublish an answer page.
- Tests pass.
