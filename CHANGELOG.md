# Olilo Influencer Platform — Changelog

One entry per update. Most recent at the top.

Format per entry:
- **Date** — what changed, in which file/component, and why (if known)

---

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
