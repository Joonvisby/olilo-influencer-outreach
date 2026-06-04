# Olilo Influencer Platform

Airtable-backed CRM + public intake form for influencer seeding. Tracks ~195 creators.

**Status:** Active build. Admin UI live. Intake form deployed on Vercel.

---

## Tech stack

| Layer | Tech |
| --- | --- |
| CRM | Airtable (base: Olilo Influencer CRM) |
| Admin UI | `web/admin.html`, `web/kanban.html` — vanilla HTML/JS, served via Vercel |
| Intake form | `web/` — Vercel-hosted public form |
| Backend API | `api/` — Vercel serverless functions |
| Outreach copy | Generated via `agents/alice-prompt.md` (run in Claude Code or via Anthropic API) and written directly into Airtable |
| Scripts | `scripts/` — one-off Airtable ops (Python) |

## Key files

- `web/admin.html` — main admin view (filter tabs, status, tier, category, "contacted by")
- `web/kanban.html` — kanban view
- `agents/alice-prompt.md` — outreach copywriting system prompt (DMs + emails)
- `CHANGELOG.md` — update log, one entry per change (most recent first)

## Pipeline (single table)

As of 2026-06-04 every creator lives in **one** table — `Creators` (`tblbBNgHxp6YNOJOQ`,
shown in Airtable as "Creators (confirmed)"). There are no more staging tables and no
copy automations. A creator's place in the funnel is just the **`Status`** field:

`New → Enriching → Needs Review → Not Contacted → Nurturing → Contacted → Replied → Shipped/Delivered → Content Posted`
plus `Failed` (parked) and `Declined / No Response`.

- **Entry:** admin quick-add → `Status=New, Source=Manual`; `/scout-creators find` →
  `New, Source=AI Scout`; intake form for an off-list person → `Not Contacted, Source=Inbound`.
- **Enrichment:** `/scout-creators` fills `New` rows in place, then sets `Needs Review`
  (AI-scouted, awaiting approval in the admin **Review** tab) or `Not Contacted` (manual).
- **`Source=Inbound`** flags creators who came via the kit link (not on the outreach list);
  shown as a 🔗 Inbound badge on `/admin`.
- `api/creators.js` hides `New`/`Enriching`/`Failed` from all views; the Review tab is the
  only place `Needs Review` rows appear.
- The friendly stage names in `docs/Creator Pipeline - How It Works.excalidraw` map to these
  `Status` values (e.g. "Ready" = `Not Contacted`, "Kit Sent" = `Shipped`/`Delivered`,
  "Posted" = `Content Posted`).

## Rules

- **Always update `CHANGELOG.md`** before reporting a task done
- Airtable field changes go through the API (typecast workaround) — don't rename fields manually in Airtable UI
- Vercel deployment is live — test locally before pushing
- **Creator import rule:** When importing a new list (e.g., from Google Sheets), every row must have `DM Draft` populated *before* it lands in Airtable. The import is not complete until every row has a DM. Use `agents/alice-prompt.md` to generate them.
- **No n8n.** Automation runs through Claude Code sessions or one-off scripts. Do not add references to n8n, webhooks, or scheduled workflows.
