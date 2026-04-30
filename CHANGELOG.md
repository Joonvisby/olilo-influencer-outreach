# Olilo Influencer Platform — Changelog

One entry per update. Most recent at the top.

Format per entry:
- **Date** — what changed, in which file/component, and why (if known)

---

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
