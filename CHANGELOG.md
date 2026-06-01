# Olilo Influencer Platform — Changelog

One entry per update. Most recent at the top.

Format per entry:
- **Date** — what changed, in which file/component, and why (if known)

---

## 2026-06-01 — Intake form now captures off-list submitters instead of dropping them
- **Why** — When someone filled the intake form but wasn't on the outreach list, `api/intake.js` wrote nothing to Airtable (email notification only), so real inbound creators like @esthefoodie and @Carla.craves vanished from the admin page and kit queue. Per Joon: non-list submitters should still be added and set Active.
- `api/intake.js` — Restructured the match branches so both paths resolve a `recordId`. Matched creators still PATCH to `Replied` + update the Outreach Log. The no-match branch now POSTs a new Creators (confirmed) record (`tblbBNgHxp6YNOJOQ`) with `Status: Active` (`typecast: true`) carrying Name/Email/Phone/Instagram/TikTok/Shipping/Affiliate. The Shipments kit-queue row (`tblGdJUGUXxFwHkKX`, `Preparing`) is now created once for both paths off `recordId`. Notification email copy for new creators changed from a red "no record was created" warning to a green "added as Active + queued" confirmation.
- `scripts/add-dropped-intake.mjs` — One-off backfill of intake submitters dropped before this fix, deduped against the Creators table first:
  - @esthefoodie (Esther Song → `recZrrNeh8N1PdvMa`) and @Carla.craves (Carla Luna → `recfSRuPOFD1gTI1k`) — real contact info, created Active + a Shipments row each.
  - @AmandaCiprich and @downshiftology — real creators, but their forms carried placeholder contact info (Joon's email + a test address). Found already in the Creators list under their real handles (@t1d.nutritionist `recZnP4fMuTQvW4WV` / Not Contacted; @downshiftology `recHQLAYf4WgSZ7R1` / Contacted). Set both to **Active**; no kit queued (no real shipping address yet).
  - Excluded as tests: @olilo_seoul (Rich/Olilo's own), @2322, @no123, @Joonyg.

## 2026-05-27 — Track per-channel outreach (Email + DM) and split the Contacted action into Revert / Contact
- **Why** — There was no way to see *how* a creator was contacted, and creators with an email address should get both an email *and* a DM. Previously any one contact flipped a creator to "Contacted" with a single `↩ Not Contacted` revert button, so a half-finished outreach (email sent, DM still owed) looked done.
- `api/creators.js` — After loading creators, fetch the Outreach Log (`tblwAnhjZ010eEIu6`, paginated) and derive per-creator channel state: `Channel = Email` → email, anything else (Instagram/TikTok DM) → dm, keeping the latest date per channel. Attached to each record as `r.channels = { email, dm }`. No Airtable schema change — the log already records every send, and `api/uncontact.js` already wipes it on revert.
- `web/admin.html` — Contacted column now shows `✓ by Email` / `✓ by DM` badges with per-channel dates (green when done, greyed + `—` when pending). Email badge is hidden for creators with no address on file. New helpers: `dateLabelShort`, `channelInfo`, `channelBadge`, `contactedChannels`, `outstandingChannel`; `timelineCell` now takes the record. Action column: while a channel is still owed it shows `↩ Revert` + a `Contact` button that opens the modal pre-set to the outstanding channel (via `data-channel` → `pendingRecord.channel` → `modal-channel`); once both Email (if applicable) and DM are sent it collapses to `↩ Revert` only. `applyContactedLocally(channel)` stamps `r.channels` so badges update without a reload; revert clears them.
- `web/kanban.html` — Contacted cards show `✓ Email` / `✓ DM` (green) vs pending (greyed) in place of the single "Contacted today" timestamp, via new `channelBadges(r)` in `cardHTML`.
- Behavior decisions (per Joon): no-email creators are fully contacted after one DM (no Email badge); badges always show both channels with the done one highlighted; dates are tracked per channel. Email still auto-sends via Resend; DM stays manual copy-paste + confirm; Status still flips to Contacted on the first channel.
- `web/admin.html` — Added an at-a-glance email marker in the Handles column (table + mobile cards) for *every* row, not just Contacted ones: green `✉ Email` (mailto link, address in tooltip) when an address is on file, greyed `✉ No email` otherwise. New `emailTag(f)` helper + `.email-tag` styles.

## 2026-05-26 — Reverting a creator to "Not Contacted" now clears their Outreach Log rows
- **Why** — `api/contact.js` creates an Outreach Log row (`tblwAnhjZ010eEIu6`) every time a creator is marked Contacted, but reverting only reset the creator's Status on the Creators table — the log row was orphaned. Re-contacting then created a second row, so the Outreach Log accumulated duplicate entries per creator.
- `api/uncontact.js` — New admin-only endpoint (inverse of `contact.js`). Given a `recordId`, lists the Outreach Log, matches rows whose `Creator` link includes that record ID (matched on record ID via `includes()`, not a name-based formula), and deletes them in batches of 10. Returns `{ ok, deleted }`.
- `web/admin.html` — New `clearOutreachLog(recordId)` helper (calls `/api/uncontact` with the admin token). Both revert paths — the `↩ Not Contacted` button (`.btn-revert`) and the `✕ Release` button (`.btn-unclaim`) — now call it after the status reset succeeds, so the log row goes away with the revert.
- Note: this fixes new reverts going forward. Existing stale rows already in the Outreach Log are not touched automatically.

## 2026-05-22 — Quick-add: paste a handle on admin → Creators (Manual) → auto-enrich → auto-copy to Confirmed
- **Why** — Joon/Rich discover already-vetted creators while researching on Instagram and want to capture them from the admin page without leaving it. These are human-vetted (unlike the AI-scouted "not confirmed" flow), so they get their own lane and skip the Approved gate.
- Airtable schema — Built out the **"Creators (Manual)"** table (`tbldVttdjmkcKEQ5z`, previously 6 fields) to mirror Confirmed: cloned 31 data fields from confirmed + added `Enrichment Status` and `Fill Method` from the not-confirmed table (33 fields created via the Metadata API). Excluded the computed (`Creator Insights`), attachment (`Profile Image`), linked-record, and junk (`_TempTestField`, `Nurture Actions`) fields, matching what the promotion script actually copies.
- `api/add-manual.js` — New admin-only endpoint. Takes `{ handle, addedBy }`, normalizes the handle, **dedups against confirmed + both staging tables** (409 if already present), then creates a Pending row in Creators (Manual) with `Fill Method = Manual`, `Assigned To` = Joon/Rich, `Source = Manual`. Verified end-to-end against the live base.
- `web/admin.html` — Quick-add bar above the stats row: handle input + Joon/Rich selector (defaults to the "I'm" identity) + Add button, with inline success/duplicate feedback. Enter submits.
- `.claude/skills/scout-creators/SKILL.md` — Skill now enriches Pending rows in **both** staging tables. Documents the loop usage (`/loop 5m /scout-creators`) for hands-free pickup, and that Manual rows auto-promote on `Enrichment Status = Done` with no Approved step.
- `scripts/manual-to-confirmed.airtable.js` — New Airtable automation script (paste into a "Run a script" action): trigger = Creators (Manual) where `Enrichment Status` is `Done`; MOVES the row into Confirmed (copy then delete), idempotent. Must be wired once in the Airtable UI.
- **Pipeline:** paste handle (pick Joon/Rich) → Manual [Pending] → `/scout-creators` enriches (run on a loop during a work session) → Airtable automation copies to Confirmed → appears on the admin list. Note: enrichment runs in a Claude Code session, not the website — pasted rows sit safely in Pending until a session picks them up.
- Follow-up: Joon trimmed Creators (Manual) to 34 fields (deleted the `Assignee`/`Attachments`/`Attachment Summary` placeholders **and** `Status`/`Notes`). Updated `scripts/manual-to-confirmed.airtable.js` to drop `Status` and `Notes` from the copy list so the automation doesn't throw on missing fields; new confirmed rows start with an empty Status (= "Not Contacted").

## 2026-05-22 — Reverted nurturing checklist; nurture badge shows the claim date
- Reverted the Follow/Comment/Like checklist (the same-day "Option B") per Joon — per-action gating wasn't wanted. Removed the chips/handlers/CSS from `web/admin.html`, the `Nurture Actions` field from `api/update-creator.js` and `api/creators.js`, and the action progress from `web/kanban.html`. "Ready to DM" is once again a pure 2-day timer. (The orphaned `Nurture Actions` Airtable field can't be removed via API — delete it in the Airtable UI if desired.)
- `web/admin.html` / `web/kanban.html` — Nurturing rows now show `🌱 <claim date>` (e.g. `🌱 May 22`) instead of `Day N / 2` during the warm-up; still flips to `✓ Ready to DM` after `NURTURE_DAYS` (2).

## 2026-05-22 — Category filter shows per-category counts (data-driven)
- `web/admin.html` — The Category dropdown is now built from live data instead of a hardcoded 7-item list: every category that has active creators, sorted by count descending, each labeled with its count (e.g. `Healthy Recipe (69)`), and `All Categories (N)` on top. New `buildCategoryOptions()`, called from `render()` (skipped while the dropdown is focused so it doesn't disrupt an open menu). Counts respect the active/archived scope. This also surfaced ~13 categories that the old fixed list omitted — most notably `Blood Sugar` (28 creators), which is a distinct tag from the previously-listed `Blood Sugar & Metabolic` (12) and was unreachable via the filter before.

## 2026-05-22 — Nurturing stage: warm up creators before the cold DM
- **Why** — Cold DMs to creators with no prior interaction land in Instagram's spam/requests folder. The fix is a 1–2 day warm-up (follow, like, comment) so the eventual DM hits the primary inbox. Joon and Rich both work the admin page, so they also need to see *who is nurturing whom* and not double up.
- Airtable schema — Added a `Nurturing` option to the `Status` single-select (between Not Contacted and Contacted, via the typecast workaround — the Metadata API can't add select choices) and created a new `Nurturing Started` date field (`fldOC6iKJDD65Lz0Q`). The existing `Contacted By` field is reused as the **owner**, set the moment a creator is claimed, so the existing Joon/Rich assignee filter immediately shows nurturing ownership. No new owner field.
- `api/update-creator.js` — Added `Nurturing` to `VALID_STATUSES`, `Nurturing Started` to `ALLOWED_FIELDS`, and `typecast: true` to the PATCH so the new status option resolves on write.
- `api/creators.js` — Added `Nurturing Started` to the fetched field list (the endpoint whitelists fields).
- `web/admin.html` — New `Nurturing` filter tab + status badge. "Not Contacted" rows now show a primary **🌱 Nurture** (claim) button plus a secondary **Contact** (skip-the-warmup) button. Claiming sets status → Nurturing, `Contacted By` → the current user, and `Nurturing Started` → today. Nurturing rows show a **🌱 Day N / 2 → ✓ Ready to DM** badge (threshold `NURTURE_DAYS = 2`), a **Contact** button, and a **✕** release-back-to-Not-Contacted button. New "I'm Joon / Rich" identity picker (stored in `localStorage` as `olilo-me`) attributes claims and pre-fills the contact modal's "Sent by". The "Contacted By" column header is relabeled **Owner**. Stats bar gains a nurturing count. Added a 30s auto-refresh (paused while a modal is open, the search box is focused, or the tab is hidden) so the two of them see each other's claims without manual reload.
- `web/kanban.html` — Added a `Nurturing` column (with accent color) and a nurture-aware timestamp label so nurturing creators don't vanish from the board.

## 2026-05-17 — scout-creators: Loom founder video in the email draft
- `.claude/skills/scout-creators/SKILL.md` — The outreach email must now include the fixed founder intro Loom video (`https://www.loom.com/share/120d2a2af19e404fb34c216b935e60f6`), placed right after the OLILO description, same video already used in the DM. Added as step 3 of the email's required elements.

## 2026-05-17 — Drop trailing periods from fact-card titles
- `web/index.html` — Removed the trailing period from the four fact-card headlines: "Flows like honey", "Tastes like sugar", "Rooted in Korea", "Made in USA".

## 2026-05-17 — Fix awkward wrap on the 7g fact-card subtext
- `web/index.html` — The "Prebiotic fiber per serving (1 tbsp)" label was wrapping mid-parenthetical ("(1" / "tbsp)"). Added an explicit `<br>` before "(1 tbsp)" and a non-breaking space inside it so it always breaks cleanly into two lines.

## 2026-05-17 — Add subtext to the honey/taste/Korea/USA fact cards
- `web/index.html` — The four fact cards in the intake-page fact grid now carry a `fact-label` subtext line, matching the Cold Soluble / Heat Stable cards: "Flows like honey." → Smooth, easy pour; "Tastes like sugar." → No weird aftertaste; "Rooted in Korea." → Pantry staple in Korea; "Made in USA." → Upgraded for US consumers. Cards switched from vertically-centered flex to the default stacked layout; the flag emoji + headline now sit in an inner flex row so the subtext stacks below.

## 2026-05-17 — Add "Here's our story" link to the intake page
- `web/index.html` — After the story paragraph ("We made something better than sugar...") on the kit.olilosweet.com intake page, added a "Here's our story →" link to `https://olilosweet.com/our-story/` (opens in a new tab). Added a `.story-text a` style rule in the brand orange.

## 2026-05-17 — Link the OLILO logo to olilosweet.com
- `web/index.html` — The OLILO logo in the top bar (kit.olilosweet.com intake page) is now wrapped in an `<a href="https://olilosweet.com/">` so clicking it goes to the main site. Matches the existing footer/header logo links in `apply.html`. Added a `.topbar a` rule (`display: block; line-height: 0`) to keep the layout unchanged.

## 2026-05-17 — Send outreach emails from the admin contact modal
- `api/send-email.js` — New admin-only endpoint (requires `x-admin-token`) that sends an outreach email via Resend, `from` `OLILO <hello@olilosweet.com>` with matching `reply_to`. Sends only — the caller logs the contact separately via `/api/contact`.
- `web/admin.html` — The contact modal now actually sends email. When the channel is `Email`, the confirm button becomes `Send Email`: it shows the recipient address (from the creator's `Email` field), lets Joon/Rich edit the subject and body, sends via `/api/send-email`, then logs the contact (status → Contacted + Outreach Log) just like Mark Contacted. The button is disabled with a hint when no email address is on file. DM/TikTok channels are unchanged — still log-only.

## 2026-05-17 — scout-creators: capture email + draft outreach email
- `.claude/skills/scout-creators/SKILL.md` — The skill now also captures the creator's public contact `Email` during research (verified addresses only, never guessed) and writes an `Email Draft`. New "outreach email" section codifies the tier-based pattern from `agents/alice-prompt.md`: Tier 1 = 4-6 sentences with a `Joon` / `Co-founder, OLILO` sign-off, Tier 2 = 3-4 sentences, Tier 3 = 2-3 sentences, both with the `The OLILO Team` sign-off. Procedure, rules, and final-report instructions updated to cover both drafts.

## 2026-05-17 — Approved → Confirmed automation script
- `scripts/approved-to-confirmed.airtable.js` — Script for an Airtable "Run a script" automation action that MOVES an approved "Creators (not confirmed)" row into "Creators (confirmed)": copies the 32 fields shared by both tables, then deletes the staging row. The delete only runs after the copy succeeds, so a failed copy never loses the row. Skips Approved/Fill Method/Enrichment Status, attachments, and linked-record fields. Idempotent — if a confirmed row with the same Instagram Handle already exists it neither copies nor deletes, leaving the staging row for manual reconciliation. The automation itself must be wired up in the Airtable UI (no API for automations); setup steps are in the file header.

## 2026-05-17 — scout-creators: mandatory confirmed-roster dedup
- `.claude/skills/scout-creators/SKILL.md` — Added a "Step 0" that loads the full "Creators (confirmed)" table and builds a normalized handle/name dedup index before any research. `find` candidates are filtered against it before web research, per-row procedure checks it first, and the Rules section now requires it. Prevents the skill from re-researching or re-adding creators already on the live campaign list.

## 2026-05-16 — Allow DM Draft edits via update-creator endpoint
- `api/update-creator.js` — Added `DM Draft` to `ALLOWED_FIELDS` so the authenticated admin endpoint can write the DM Draft field. Enables batch updates of DM copy without exposing Airtable credentials locally.

## 2026-05-16 — DM sending account: founders' personal IG
- `agents/alice-prompt.md` — Added a `Sending account` note to the DM section: DMs go out from the founders' personal Instagram accounts (Joon's, Rich's), not the Olilo brand account. Rationale: the copy is first-person founder voice, and a new low-follower brand account sending at volume risks Instagram spam flags. Documents the future switch to the official Olilo account once it has grown enough credibility, with a reminder to review the DM voice at that point.

## 2026-05-16 — Manual revert: Contacted → Not Contacted
- `web/admin.html` — Creators with status `Contacted` now show a `↩ Not Contacted` button (table + mobile card) that reverts them. Confirms first, then PATCHes Airtable and clears the `Last Contacted At` date so the row reads as genuinely un-contacted. New `setStatus()` helper and `.btn-revert` style.
- `api/update-creator.js` — Added `Status` and `Last Contacted At` to `ALLOWED_FIELDS`, plus a `VALID_STATUSES` allowlist that rejects unknown status values. Revert goes through this authenticated endpoint (requires admin token), same as Archive.
- Note: reverting does not delete the Outreach Log row created when the creator was marked Contacted — that history stays.

## 2026-05-16 — Founder video link in DM drafts (v9 pattern)
- `agents/alice-prompt.md` — DM drafts now include the founder video Loom link `https://www.loom.com/share/120d2a2af19e404fb34c216b935e60f6` directly in the body, right after the identity line, framed with "Made you a quick video 👇". Instagram renders it as a preview card (founders' faces + "OLILO SWEET FIBER SYRUP - FOR YOU" title), which drives clicks and applications.
- Reversed the old rule: a screenshot proved Instagram **does** generate a preview thumbnail for Loom URLs, so the prior "do not include the Loom URL — no preview payoff" guidance was wrong and is removed.
- New ordering rule: the Loom link must come **before** the kit link, because Instagram renders the preview card for the *first* link in the message — we want that card to be the video, not the intake page.
- Updated: DM structure (v8 → v9 pattern), the founder-video note, hard formatting rules, and quality checks. Added a `Founder video link` constant to the ABOUT OLILO section. One video for all creators.
- Standardized the DM identity line to `Joon here, I co-founded OLILO with Rich.` (was `Joon here, co-founder of OLILO.`) — names both founders, matching the two faces in the video preview card. Also fixed a leftover inconsistent line that read `Joon here — I co-founded Olilo with Rich.` (em dash, lowercase brand name).

## 2026-05-08 — Public creator self-apply form
- New separation between **outbound** (Joon/Rich source the creator → existing `/api/intake` confirmation flow) and **inbound** (random applicants from `olilosweet.com/contact-us/`). Two endpoints, two destinations, zero crossover. Creators table stays a kit-fulfillment system; applicants live in a new Applications table until reviewed.
- **Airtable schema (via Meta API):**
  - New table **Applications** (`tblY0ZCn5aqCnwUbz`) — 16 fields: Name, Application Date, Email, Country, Primary Platform, Instagram Handle, TikTok Handle, YouTube Channel, Audience Size, Category, Content Link, Why Olilo, Decision (Pending/Approved/Rejected), Decision Notes, Linked Creator, Reviewed By.
  - New `Source` field on Creators — single-select Sourced/Self-Apply. Stamps how a creator entered the pipeline.
- `api/apply.js` — New POST endpoint. Validates required fields + at-least-one-handle, dup-checks Creators by IG handle and email (if matched, no Applications row written and a ⚠️ warning email goes out instead), otherwise creates an Applications row with Decision=Pending. Resend notification to joon@adaptive.kitchen + rich@adaptive.kitchen on every submission.
- `web/apply.html` — Public creator application form. 10 fields (Name, Email, Country, Primary Platform, IG/TikTok/YouTube, Audience Size, Content Link, Why Olilo). Same brand styling as `web/index.html` (cream bg, day-blue card, sweet-orange accents, neo-brutalist borders/shadows). Client-side validation: email format, URL format on content/yt, at least one handle filled, why-olilo min 10 chars / max 500.
- `airtable/schema.md` — Documented Applications table and Source field.
- Env: `AIRTABLE_APPLICATIONS_TABLE_ID` (defaults to `tblY0ZCn5aqCnwUbz` in code if unset, but should be set in Vercel for cleanliness).

## 2026-05-07 — Workflow diagram (Excalidraw)
- `scripts/generate-workflow-excalidraw.mjs` — Programmatic generator for the workflow scene (rectangles + bound text + arrows). Easier to maintain than hand-rolled JSON; rerun to regenerate.
- `docs/olilo-workflow.excalidraw` — Three stacked sections: (1) System Architecture — visitor/admin/Tally → form/UI → API → Airtable + n8n; (2) Seeding Pipeline — 9-step linear flow from sourcing creators to affiliate active; (3) Outreach Status Flow — the 8 Status values as a state machine with Declined/No Response branches off Contacted. Drag-drop into excalidraw.com to view/edit. (Distinct from the older `olilo-workflow-blueprint.excalidraw` from April.)

## 2026-05-06 — Intake form: Terms + Privacy fineprint under submit
- `web/index.html` — Added a fineprint line under the submit button: "By sending, you agree to OLILO's Terms and Privacy Policy." Links to `https://olilosweet.com/terms-of-use/` and `https://olilosweet.com/privacy-policy-2/` (open in new tab). No checkbox — interest-gauging form, not a full commitment.
- Added `.fineprint a` and `.legal-note` styles for underlined dark-on-cream links with sweet-orange hover.

## 2026-05-06 — Intake form copy tweak (kit.olilosweet.com)
- `web/index.html` — Lede now says "a bottle of OLILO Sweet Fiber Syrup" (added the brand name). Story paragraph trimmed: removed "It took two years to get it right." Final copy: "We made something better than sugar. We want you to taste it first. Just pour it on something you like and tell us what you think."

## 2026-05-06 — Revert test outreach (clear Status + Outreach Log)
- `scripts/revert-test-contacts.mjs` — One-off: reset every Creator whose Status was not "Not Contacted" back to "Not Contacted" and cleared `Last Contacted At`; deleted every row in the Outreach Log table.
- Reverted 10 creators (8 Contacted, 2 Replied). Deleted 10 Outreach Log rows. Pipeline is now clean for the real outreach push.

## 2026-05-04 — Import Experts (RL26) list, all assigned to Rich
- `scripts/import-experts-rl26.mjs` — Reusable importer that POSTs CSV rows to the Creators table with typecast=true (handles multi-select and percent fields). Ran successfully: 57/57 records created in 6 batches.
- `airtable/experts-rl26-import.csv` — 57 unique creators imported from "Experts (RL26)" tab of the source Google Sheet (1odba-k...). All rows: Assigned To = Rich, Status = Not Contacted, Date Added = 2026-05-04, Commission Rate = 10%.
- Tier mapped by audience size (Mega→1, Macro→2, Micro→3). Categories assigned per creator from existing Airtable options (Gut Health / Blood Sugar / Clean Eating / Healthy Recipe), multi-select where genuinely applicable. Source's "Nutrition Expert" label dropped — categorized by actual content focus instead.
- Source had 67 rows; deduped 10 repeats (Jessie Inchauspé, Dr. Amy Shah, Dr. Mindy Pelz, Tallene Hacatoryan, Kylie Sakaida, Rachael DeVaux x2, Dr. Peter Attia x1). Kept Casey Means @caseymeansmd and @drcaseyskitchen as separate rows (likely same person, two accounts) — flagged in Notes for verification.
- Source size discrepancies flagged: Peter Attia listed 900K and 1.5M in different rows (kept first, 900K=Macro). Lily Soutter size = N/A (Audience Size and Tier left blank).

## 2026-05-06 — Custom domain kit.olilosweet.com live; switch all intake URLs over
- Added `kit.olilosweet.com` as custom domain on Vercel project (A record `76.76.21.21` in AWS Lightsail DNS zone). SSL provisioned by Vercel via Let's Encrypt.
- `web/admin.html` — Both `INTAKE_URL` constants (modal draft substitution + Copy Intake Link button) updated from `https://olilo-kit.vercel.app` → `https://kit.olilosweet.com`. DM/email drafts now produce branded URLs.
- `docs/team-briefing.md` — All references to `olilo-seeding.vercel.app` and the broken `olilosweet.com/kit` redirect replaced with `https://kit.olilosweet.com`. Removed the "Known Issues: olilosweet.com/kit is not working" section since it's resolved.
- The old `https://olilo-kit.vercel.app` URL still resolves (Vercel keeps it as an alias), so any DMs already sent with that URL continue to work.

## 2026-05-06 — Reuse gate passcode 07170 as admin token (no double prompt)
- Changed Vercel `ADMIN_TOKEN` (Production + Development) to `07170` — same as the existing site password gate.
- `web/admin.html` — On gate success (and on already-authed sessions), now also stores `07170` in localStorage as `olilo-admin-token`. This eliminates the second prompt when clicking Archive: typing 07170 once at the gate is enough.
- Tradeoff: archive permission is now equivalent to gate access. Acceptable for a 2-person team where the gate already protects the action.

## 2026-05-06 — Kanban becomes read-only; cards show stage timestamp
- `web/kanban.html` — Removed the Contact button on cards and the entire Mark-as-Contacted modal (markup, CSS, JS). Kanban is now a pipeline-overview view; all outreach actions live in `/admin`.
- Added a small timestamp on each card: "Added Xd ago" for Not Contacted; "Contacted Xd ago" (or Today/Yesterday) for everything else. Uses existing `Date Added` and `Last Contacted At` fields.
- `api/creators.js` — Now also fetches `Date Added` (was previously dropped from the response).

## 2026-05-06 — Archive button moved into Mark-as-Contacted modal; intake link → copy button
- `web/admin.html` — Removed inline ✕ Archive button from row Actions column. Added an "Archive" button inside the modal (left-aligned in modal-actions). Removes Archive from the row UI for non-Not-Contacted statuses; archive now only reachable via the contact decision flow. Unarchive button still inline on Archived-tab rows.
- `web/admin.html` — Added `archived` count to the stats bar after `★ affiliate`.
- `web/admin.html` — Replaced "↗ Intake form link" anchor (which pointed to broken `olilosweet.com/kit`) with a "Copy intake link" button that copies `https://olilo-kit.vercel.app` to clipboard. Both Archive button and Copy intake link use the dark `--olilo-black` color for clearer hierarchy.

## 2026-05-06 — Archive creators from admin UI
- Added `Archived` checkbox field on the Creators table (Airtable Meta API).
- New `api/update-creator.js` Vercel function — PATCHes a record's allowed fields (currently just `Archived`). Gated by `x-admin-token` header compared to `ADMIN_TOKEN` env var. Anything else is rejected with 401/400.
- `web/admin.html` — Active/Archived tab toggle (default Active). Each row gets an ✕ Archive button (or Unarchive in the Archived view). One-time prompt for admin token, cached in localStorage. Stats now count active creators only. Confirmation dialog before archiving.
- `web/kanban.html` — Pipeline filters out `Archived === true` so archived creators never appear in the kanban.
- `api/creators.js` — Now requests the `Archived` field so the UI can branch on it.
- `airtable/schema.md` — Documented the new field.
- **Action required from Joon:** Add `ADMIN_TOKEN=<random_string>` to Vercel env (Production + Preview) and `.env.local`, then redeploy. Suggested: `openssl rand -hex 16`.

## 2026-05-06 — Move list-source attribution from Assigned To → List by
- Airtable Creators: moved all 56 records that had `Assigned To = Rich` (the imported Experts list) into the existing `List by` multi-select field with value `Rich`. Cleared `Assigned To` on those records so outreach ownership can be assigned separately later.
- `airtable/schema.md` — Documented `List by` field and clarified Assigned To = outreach owner vs. List by = list sourcer.
- Downstream impact (NOT yet changed): the "Contacted by" filter on `web/admin.html:863` and `web/kanban.html:554` filters by `Assigned To`. Those tabs will now show 0 records under Rich until outreach is reassigned. If you want the filter to show List-by-Rich instead, that's a separate code change.

## 2026-05-04 — Resolve Casey Means duplicate (Airtable Creators)
- Verified via web search: @caseymeansmd and @drcaseyskitchen are the same person (Casey Means MD, author of "Good Energy", current U.S. Surgeon General nominee). Kitchen account = recipe-focused secondary at 843K.
- Deleted @drcaseyskitchen record. Updated @caseymeansmd: Audience Size Macro→Mega, Outreach Tier 2→1, added "Healthy Recipe" to Category, Notes flagged kitchen account, Good Energy book, and SG nominee/MAHA brand-fit caveat.

## 2026-04-30 — Match List View button style to admin's Pipeline button (kanban.html)
Added .btn-list-view class mirroring admin's btn-kanban-mobile — inline-flex pill, outlined, with ≡ icon.

## 2026-04-30 — Show List View button on mobile (kanban.html)
Removed `nav-hide-mobile` from the List View nav link so it's visible on all screen sizes.

## 2026-04-29 — Contacted by filter tabs

- `web/admin.html` + `web/kanban.html` — Added "Contacted by" filter tabs (All | Joon | Rich); filters on Assigned To field; stacks with status, tier, and category filters

## 2026-04-29

- Created this changelog to track all future updates to the system.

## 2026-04-29 — Category taxonomy update + filter UI

### Airtable — Creator re-tagging (via API) ✅
- 22 creators → Healthy Recipe (from Clean Eating, Breakfast & Yogurt Bowl, Fitness & Wellness)
- 10 creators → Asian Food (from Asian-American Diaspora)
- 3 creators → Baking & Dessert (@minimalistbaker, @halfbakedharvest, @theconsciousplantkitchen)
- 1 creator → Beverage (@bites.by.jordan)
- Not in Airtable (add manually if needed): Macyn Aune, Ina Garten (@inagarten), Ting Dalton (@cookeatworld)

### Airtable — Field option changes (via API — typecast workaround) ✅
- "Coffee" → "Beverage": all 14 records updated
- "Blood Sugar" → "Blood Sugar & Metabolic": all 12 records updated
- Added "Asian Food" and "Baking & Dessert" as new choices
- ⚠️ Manual cleanup still needed in Airtable UI: delete empty ghost choices (Coffee, Blood Sugar, Clean Eating, Breakfast & Yogurt Bowl, Asian-American Diaspora, Fitness, Wellness) and delete accidentally created _TempTestField column

### `api/creators.js`
- Added `&fields[]=Category` to Airtable query string so Category is returned in all creator fetches

### `web/admin.html`
- Added `.category-select` CSS class (pill-shaped, styled to match tier tabs; `.active` variant inverts to black/cream when a category is selected)
- Added `<select id="category-select">` in toolbar, after tier tabs row — options: All Categories + 7 categories
- Added `activeCategory = 'all'` state variable
- Added `matchCategory` filter in `render()` — handles Airtable multiple-select (array) and single-value formats
- Stacks with existing `matchStatus` and `matchTier` filters

### `web/kanban.html`
- Same category dropdown added to `tier-toolbar` div
- Same `activeCategory` state, `matchCategory` filter applied inside `COLUMNS.forEach` loop
- Filters all 6 columns simultaneously

---

## 2026-04-08 — Initial system build

### Airtable (`airtable/schema.md`)
- Defined 4 tables: Creators, Outreach Log, Shipments, Posts
- Defined 7 views on the Creators table (Pipeline Kanban, My Creators, Needs Follow-Up, Awaiting Post, Affiliate Active, Top Performers, Inbound Queue)
- Set Status field options: Not Contacted → Contacted → Replied → Deal Agreed → Shipped → Delivered → Content Posted → Affiliate Active → Declined → No Response

### n8n Workflows (`n8n/workflows-spec.md`)
- Workflow 1: Research Trigger — Apify scrape → Scout agent → Creator Brief saved to Airtable
- Workflow 2: Draft Trigger — Alice agent → Email Draft + DM Draft saved to Airtable + Gmail notification
- Workflow 3: Email Send — Gmail send + Outreach Log entry created
- Workflow 4: Email Tracking — Streak webhook → Airtable Outreach Log updates
- Workflow 5: Reply Detected — Status update + Gmail notification to Joon + Rich
- Workflow 6: Follow-Up Reminder — Daily 8 AM check for No Reply creators → Gmail digest
- Workflow 7: Form Submission — Typeform webhook → Airtable update → Workflow 8 trigger
- Workflow 7b: Seeding Form Submission — HTML form webhook → mirrors Workflow 7
- Workflow 8: WWEX Shipment — WWEX API create shipment → Shipments table entry
- Workflow 9: Tracking Update — WWEX tracking webhook → Shipments + Creator status updates
- Workflow 10: Delivery Confirmed — Status update + Alice check-in draft + Gmail notification
- Workflow 11: Content Posted — Notification to Joon + Rich

### Agents
- `agents/scout-prompt.md` — Scout agent: researches creators using Apify data, outputs Creator Brief
- `agents/alice-prompt.md` — Alice agent: writes Email Draft + DM Draft from Creator Brief

### API (`api/`)
- `api/contact.js` — Contact form handler
- `api/creators.js` — Creator data endpoint
- `api/export.js` — Data export endpoint
- `api/intake.js` — Intake form handler
- `api/status.js` — Status endpoint

### Web (`web/`)
- `web/index.html` — Public-facing landing page
- `web/admin.html` — Internal admin interface
- `web/kanban.html` — Kanban board view
- `web/colors_and_type.css` — Brand colors and typography

### Scripts
- `scripts/generate-email-drafts.mjs` — Local script for generating email drafts

### Docs
- `docs/setup-guide.md` — Full system setup guide
- `docs/team-briefing.md` — Team briefing document
- `docs/olilo-workflow-blueprint.excalidraw` — Visual workflow diagram

### Config
- `vercel.json` — Vercel deployment config
- `.env.example` — Environment variable reference
