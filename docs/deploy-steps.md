# Deploy Steps — Olilo Influencer Platform

Last updated: 2026-05-17

## What the next deploy ships (already merged to `main`)

- **v10 humanized DM pattern** — `agents/alice-prompt.md` (reference doc, no runtime effect)
- **`intake.js`** — the Product field now writes `OLILO Sweet Fiber Syrup` (corrected casing)
- **Contacted By tracking** — stamped on every contact, shown as a column on
  `/admin`, and the Joon/Rich filter row now filters by who contacted

---

## Step 1 — Airtable Product rename  (DO THIS FIRST, before deploying)

`intake.js` now writes the Product value `OLILO Sweet Fiber Syrup`. That exact
option must exist in Airtable, or new Shipments records will fail to save.

In the Airtable base (`appubVom4JyZ3mCEL`):
1. Open the **Shipments** table.
2. Click the **Product** field header → Edit field.
3. Rename the option `Olilo Sweet Fiber Syrup` → `OLILO Sweet Fiber Syrup`.
4. Delete the junk options: Laptop, Monitor, Keyboard, Mouse, Printer, Tablet.
5. Save.

---

## Step 2 — Deploy to Vercel

```
cd "/Users/joony/Documents/ClaudeCode_365/Influencer Platform for Olilo"
npx vercel --prod --token <your Vercel deploy token>
```

The deploy token is recorded in `seeding-platform-build-log.md` (Olilo Obsidian
vault), or just use a logged-in `vercel` CLI without `--token`.

---

## Step 3 — Verify after deploy

- Open <https://olilo-kit.vercel.app/admin>
- Confirm the **Contacted By** column appears in the creators table.
- Click the **Contacted** tab, then the **Joon** filter → Benji Xavier,
  Josiah Varghese, and Emma should appear.
- Mark a test creator as Contacted → confirm `Contacted By` fills on their row.
