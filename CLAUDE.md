# Olilo Influencer Platform

Airtable-backed CRM + public intake form for influencer seeding. Tracks ~145 creators.

**Status:** Active build. Admin UI live. Intake form deployed on Vercel. Backend API in progress.

---

## Tech stack

| Layer | Tech |
| --- | --- |
| CRM | Airtable (base: Olilo Influencer CRM) |
| Admin UI | `web/admin.html`, `web/kanban.html` — vanilla HTML/JS, served via Vercel |
| Intake form | `web/` — Vercel-hosted public form |
| Backend API | `api/` — Vercel serverless functions |
| Automation | `n8n/` — workflow automations |
| Scripts | `scripts/` — one-off Airtable ops (Python) |

## Key files

- `web/admin.html` — main admin view (filter tabs, status, tier, category, "contacted by")
- `web/kanban.html` — kanban view
- `CHANGELOG.md` — update log, one entry per change (most recent first)

## Rules

- **Always update `CHANGELOG.md`** before reporting a task done
- Airtable field changes go through the API (typecast workaround) — don't rename fields manually in Airtable UI
- Vercel deployment is live — test locally before pushing
