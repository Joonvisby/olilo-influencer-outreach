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

## Rules

- **Always update `CHANGELOG.md`** before reporting a task done
- Airtable field changes go through the API (typecast workaround) — don't rename fields manually in Airtable UI
- Vercel deployment is live — test locally before pushing
- **Creator import rule:** When importing a new list (e.g., from Google Sheets), every row must have `DM Draft` populated *before* it lands in Airtable. The import is not complete until every row has a DM. Use `agents/alice-prompt.md` to generate them.
- **No n8n.** Automation runs through Claude Code sessions or one-off scripts. Do not add references to n8n, webhooks, or scheduled workflows.
