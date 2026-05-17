# Olilo Influencer Platform — Airtable Schema

**Base name:** Olilo Influencer CRM  
**Last updated:** 2026-04-08  
**Tables:** 4 | **Views:** 7 (on Creators table)

---

## TABLE 1: CREATORS

Master record for every influencer in the pipeline. One row per creator.

| Field Name | Field Type | Options / Notes |
|---|---|---|
| Name | Single line text | Full creator name. Primary field. |
| Instagram Handle | Single line text | Include @ symbol. e.g. @stephgrassodietitian |
| TikTok Handle | Single line text | Include @ symbol. e.g. @stephgrassodietitian |
| Platform(s) | Multiple select | Options: IG, TikTok, YouTube |
| Audience Size | Single select | Options: Nano (1K–10K), Micro (10K–100K), Macro (100K–1M), Mega (1M+) |
| Outreach Tier | Single select | Options: 1, 2, 3 |
| Category | Multiple select | Options: Gut Health, Coffee, Korean Food, Blood Sugar, Healthy Recipe, Breakfast & Yogurt Bowl, Asian-American Diaspora, Clean Eating |
| Why Olilo | Long text | Internal notes on why this creator is a fit. Written by Joon or Rich. |
| Email | Email | Creator's business/contact email. |
| Status | Single select | Options: Not Contacted, Contacted, Replied, Deal Agreed, Shipped, Delivered, Content Posted, Affiliate Active, Declined, No Response |
| Assigned To | Single select | Options: Joon, Rich. Who owns outreach for this creator. |
| List by | Multiple select | Options: Joon, Rich. Who sourced/contributed this creator to the list. Distinct from Assigned To (outreach owner). |
| Creator Brief | Long text | Output from Scout agent. Generated in a Claude Code session and written to Airtable via the API. |
| Email Draft | Long text | Output from Alice agent. Generated in a Claude Code session and written to Airtable via the API. |
| DM Draft | Long text | Output from Alice agent. Must be populated at import time — see "Creator import rule" in `../CLAUDE.md`. |
| Shipping Address | Long text | Populated from intake form submission (`kit.olilosweet.com`). Format: Street, City, State ZIP, Country |
| Affiliate Code | Single line text | WooCommerce coupon code. e.g. STEPH10 |
| Affiliate Link | URL | Full affiliate URL. e.g. https://olilosweet.com/?ref=steph10 |
| Commission Rate | Percent | Default: 10%. Range 0–30%. |
| Total Conversions | Number | Integer. Pulled from WooCommerce affiliate tracking. |
| Total Revenue | Currency | USD. Calculated from affiliate sales. |
| Notes | Long text | Freeform internal notes. |
| Date Added | Date | Date creator was added to the base. |
| Archived | Checkbox | Hides creator from active outreach views (admin list, kanban). Toggle from web/admin.html. |
| Source | Single select | Options: Sourced, Self-Apply, Manual Invite, Manual Add. `Sourced` = outbound, added by Joon/Rich. `Self-Apply` = inbound, promoted from Applications. `Manual Invite` = submitted the kit form (`kit.olilosweet.com`) without being on the outreach list — auto-created by `api/intake.js`. `Manual Add` = entered by hand via the admin "Add creator" button — created by `api/create-creator.js`. |

**Setup note:** Set "Status" as the grouping field for the Pipeline Kanban view. Set a default value of "Not Contacted" for Status and "10%" for Commission Rate.

---

## TABLE 2: OUTREACH LOG

One row per outreach touch. A creator can have many rows here.

| Field Name | Field Type | Options / Notes |
|---|---|---|
| Creator | Link to another record | Links to: Creators table |
| Date | Date | Date outreach was sent or attempted. |
| Channel | Single select | Options: Email, Instagram DM, TikTok DM |
| Message Sent | Long text | Full text of message sent. Copy from Email Draft or DM Draft. |
| Response Text | Long text | Paste or auto-log the reply received. |
| Response Status | Single select | Options: No Reply, Positive, Negative, Negotiating |
| Follow-Up Date | Date | Set manually (suggested: 7 days after no reply). |
| Sent By | Single select | Options: Joon, Rich, Alice |

**Setup note:** Joon and Rich add a row here every time outreach goes out (or use a Claude Code session to batch-log them). One row per touch.

---

## TABLE 3: SHIPMENTS

One row per shipment order. A creator could have multiple (re-orders, etc.).

| Field Name | Field Type | Options / Notes |
|---|---|---|
| Creator | Link to another record | Links to: Creators table |
| Request Date | Date | Date shipment was triggered. Set manually when status flips to Deal Agreed. |
| Product | Single select | Options: Olilo Sweet Fiber Syrup. (Expand as product line grows.) |
| Quantity | Number | Number of units. Default: 1 |
| Shipping Address | Long text | Copied from Creator record at time of order. |
| Carrier | Single select | Options: USPS, UPS, FedEx |
| Tracking Number | Single line text | Paste manually from WWEX, or populate via a one-off script in `scripts/` that hits the WWEX API. |
| Ship Date | Date | Date WWEX confirms shipment. Auto-populated. |
| Delivered Date | Date | Date WWEX confirms delivery. Auto-populated. |
| Status | Single select | Options: Preparing, Shipped, Delivered, Returned |
| Kit Included | Checkbox | Check if recipe cards / inserts were included in the box. |
| Notes | Long text | Any special instructions, address flags, carrier exceptions. |

---

## TABLE 4: POSTS

One row per piece of content posted by a creator featuring Olilo.

| Field Name | Field Type | Options / Notes |
|---|---|---|
| Creator | Link to another record | Links to: Creators table |
| Platform | Single select | Options: Instagram, TikTok |
| Post URL | URL | Direct link to the post or reel. |
| Post Date | Date | Date content was published. |
| Content Type | Single select | Options: Reel, TikTok, Story, Carousel, Static |
| Views/Plays | Number | Integer. |
| Likes | Number | Integer. |
| Comments | Number | Integer. |
| Saves | Number | Integer. |
| Engagement Rate | Formula | Formula: `({Likes}+{Comments}+{Saves})/CREATOR_FOLLOWERS*100` — Note: You'll need a Followers field on the Creator record for this to auto-calculate. Add a Followers [Number] field to the Creators table and reference it via lookup. |
| Affiliate Link Used | Checkbox | Check if creator used their affiliate link in this post. |
| Approved | Checkbox | Check when Joon or Rich has reviewed and approved the content. |
| Notes | Long text | Quality notes, repurposing flags, performance observations. |

**Setup note for Engagement Rate:** In Airtable free tier, formulas can't easily cross-reference linked record fields. Simplest approach: add a "Followers" number field to this table and populate it at time of logging the post. Formula becomes: `ROUND(({Likes}+{Comments}+{Saves})/{Followers}*100, 2)`

---

## TABLE 5: APPLICATIONS

**Table ID:** `tblY0ZCn5aqCnwUbz`

Public self-apply submissions from `olilosweet.com/contact-us/` → `/apply` form. Reviewed by Joon/Rich; approved applicants are promoted to Creators with `Source = Self-Apply`. Rejected stay here as audit trail.

**This table is intentionally separate from Creators.** The Creators table is a kit-fulfillment system — every row is someone we plan to ship to. Applications hold prospects until reviewed, so spam and unvetted submissions never touch the kit pipeline.

| Field Name | Field Type | Options / Notes |
|---|---|---|
| Name | Single line text | Primary field. |
| Application Date | Date | Stamped by `/api/apply` at submission time (ISO YYYY-MM-DD). |
| Email | Email | Applicant's contact email. |
| Country | Single select | Options: US, Canada, UK, Australia, Other. |
| Primary Platform | Single select | Options: IG, TikTok, YouTube, Other. |
| Instagram Handle | Single line text | Stored with `@` prefix. |
| TikTok Handle | Single line text | Stored with `@` prefix. |
| YouTube Channel | URL | Full channel URL. |
| Audience Size | Single select | Options match Creators: Nano 1K–10K, Micro 10K–100K, Macro 100K–1M, Mega 1M+. |
| Category | Multiple select | Same option set as Creators.Category. Joon/Rich tag during review (not asked on the form). |
| Content Link | URL | Applicant's "piece you're proud of" — single content link. |
| Why Olilo | Long text | Applicant's pitch, capped at 500 chars in the form. |
| Decision | Single select | Options: Pending (default), Approved, Rejected. |
| Decision Notes | Long text | Reviewer's reasoning. |
| Linked Creator | Link to another record | Links to: Creators table. Set when promoted to a Creators row. |
| Reviewed By | Single select | Options: Joon, Rich. |

**Promotion flow:** When Decision flips to `Approved`, manually create a Creators row by copying Name, Email, Instagram Handle, TikTok Handle, Category, Audience Size. Set `Status = Not Contacted`, `Source = Self-Apply`, `List by = Self-apply`. Then link the Applications row to the new Creators row via `Linked Creator`.

**Duplicate handling:** `/api/apply` searches Creators by IG handle and email before writing. If a match is found, it does **not** create an Applications row — instead, it sends a ⚠️ warning email to Joon/Rich noting the applicant is already in the CRM (likely they filled out the wrong form).

---

## VIEWS (on Creators Table)

### View 1: Pipeline (Kanban)
- **Type:** Kanban
- **Grouped by:** Status
- **Columns:** Not Contacted → Contacted → Replied → Deal Agreed → Shipped → Delivered → Content Posted → Affiliate Active
- **Card fields shown:** Name, Assigned To, Outreach Tier, Category
- **Hidden:** Creator Brief, Email Draft, DM Draft, Notes

### View 2: My Creators (Grid)
- **Type:** Grid
- **Filter:** Assigned To = [current user — set per person]
- **Sorted by:** Status (ascending), Date Added (descending)
- **Fields shown:** Name, Status, Platform(s), Outreach Tier, Category, Email, Follow-Up Date

### View 3: Needs Follow-Up (Grid)
- **Type:** Grid
- **Filter:** Status = Contacted AND Date Added is before 7 days ago (or use Outreach Log's Follow-Up Date = today)
- **Sorted by:** Date Added (ascending — oldest first)
- **Fields shown:** Name, Assigned To, Email, Date Added, Notes
- **Setup note:** For precise follow-up tracking, filter the Outreach Log table for Follow-Up Date = today instead. Joon/Rich check this view daily.

### View 4: Awaiting Post (Grid)
- **Type:** Grid
- **Filter:** Status = Delivered
- **Fields shown:** Name, Assigned To, Platform(s), Category, Shipping Address, Notes
- **Purpose:** Shows creators who received their kit but haven't posted yet.

### View 5: Affiliate Active (Grid)
- **Type:** Grid
- **Filter:** Status = Affiliate Active
- **Fields shown:** Name, Affiliate Code, Affiliate Link, Commission Rate, Total Conversions, Total Revenue
- **Sorted by:** Total Revenue (descending)

### View 6: Top Performers (Posts Table — Gallery or Grid)
- **Type:** Grid (on Posts table)
- **Sorted by:** Views/Plays (descending)
- **Fields shown:** Creator, Platform, Content Type, Post URL, Views/Plays, Likes, Engagement Rate, Affiliate Link Used, Approved
- **Purpose:** Identify best-performing content for repurposing or boosting.

### View 7: Inbound Queue (Grid)
- **Type:** Grid
- **Filter:** Status = Not Contacted AND Date Added = today (or last 7 days)
- **Purpose:** Catches new self-apply submissions that come in via the apply form at `kit.olilosweet.com/apply` (Tier 3 self-apply flow). `api/apply.js` creates new Creators rows directly when a submission arrives without a matching record.
- **Fields shown:** Name, Instagram Handle, TikTok Handle, Email, Category, Notes (use for "How they found Olilo")

---

## SETUP CHECKLIST

1. Create new Airtable base named "Olilo Influencer CRM"
2. Rename default table to "Creators" and add all fields above
3. Create "Outreach Log" table and add fields
4. Create "Shipments" table and add fields
5. Create "Posts" table and add fields
6. Set up linked record fields between tables (Creators ↔ Outreach Log, Creators ↔ Shipments, Creators ↔ Posts)
7. Create all 7 views
8. Import creators-import-template.csv into the Creators table
9. Note your Airtable Base ID and Personal Access Token — these go into `.env.local` / `.env.production` as `AIRTABLE_BASE_ID` and `AIRTABLE_TOKEN`

**Finding your Base ID:** Open the base in Airtable → look at the URL: `airtable.com/[BASE_ID]/...`  
**API key:** Go to airtable.com/account → Developer Hub → Personal Access Token
