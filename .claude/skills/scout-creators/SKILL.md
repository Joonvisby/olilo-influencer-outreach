---
name: scout-creators
description: Research and fully fill influencer rows in the Olilo "Creators
  (not confirmed)" Airtable table — verify the Instagram handle, follower
  count, audience size, outreach tier, category, write a Why Olilo note, AND
  draft the v10 personalized outreach DM. Use when new creators need to be
  found or filled in for the influencer outreach pipeline.
---

# Scout Creators — research + DM drafting for the not-confirmed table

You research influencers and fill their full data — INCLUDING the v10 outreach
DM — into the **"Creators (not confirmed)"** table of the Olilo Influencer CRM.

## How to use

Run it as a slash command inside a Claude Code session opened in this project
(`Influencer Platform for Olilo`). It runs on demand — you type the command:

- **`/scout-creators`** (no args) — enriches every row in "Creators (not
  confirmed)" where `Enrichment Status` is `Pending`/empty and an Instagram
  handle or link exists. Use this after you or Rich drop in new rows with just
  a handle or link.
- **`/scout-creators @somehandle`** — adds and fills that one creator.
- **`/scout-creators find 15 gut-health creators`** — researches and finds
  matching creators, adds a row for each, then fills them.

Typical flow: paste handles or links into the "Creators (not confirmed)" table
-> run `/scout-creators` -> review the filled rows -> tick `Approved` on the
keepers.

## Setup
- Airtable base `appubVom4JyZ3mCEL`; token `AIRTABLE_TOKEN` in `.env.production`.
- Resolve the "Creators (not confirmed)" table ID via the Airtable meta API by
  table name — do not hardcode an ID.
- Canonical DM pattern reference: `agents/alice-prompt.md` (v10).

## Step 0 — load the confirmed roster (always, before any research)
Before researching, finding, or adding ANY creator, pull the full
**"Creators (confirmed)"** table (`tblbBNgHxp6YNOJOQ`) and build a dedup index:
- Resolve the table ID via the meta API by name; page through ALL records.
- For every confirmed record, capture **Instagram Handle** and **Name**,
  normalized for matching: lowercase, strip a leading `@`, strip whitespace.
- Keep this index in memory for the whole run.

This roster is the source of truth for "who we already have." A creator that
matches the index by handle (or unambiguously by name) is a duplicate — never
research them, never add a row, never draft a DM for them. When `/scout-creators
find ...` generates candidates, filter them against this index BEFORE doing any
web research, so no effort is spent on creators already confirmed. Also skip
anyone already present in "Creators (not confirmed)".

In the final report, list any candidates skipped as already-confirmed dupes.

## Procedure — for each creator row
1. Check the creator against the Step 0 dedup index. If they match a confirmed
   creator by handle or name, set `Enrichment Status` = `Failed`, note "Already
   in Creators (confirmed)" in `Why Olilo`, skip research and the DM.
2. Set `Enrichment Status` = `Researching`.
3. Web-search the creator. Confirm their REAL current Instagram account. If the
   confirmed handle turns out to match the dedup index, treat it as a duplicate
   per step 1.
4. Fill the research fields:
   - **Instagram Handle** — corrected if wrong; always store with a leading `@`.
   - **Instagram Link** — `https://instagram.com/<handle>`.
   - **Audience Size** — from the *Instagram* follower count, bucketed:
     `Nano 1K–10K` / `Micro 10K–100K` / `Macro 100K–1M` / `Mega 1M+`.
   - **Outreach Tier** — by follower count: 1M+ -> `Tier 1`; 100K-1M -> `Tier 2`;
     under 100K -> `Tier 3`.
   - **Category** — best fit from the table's options (Beverage, Gut Health,
     Blood Sugar & Metabolic, Korean Food, Asian Food, Healthy Recipe,
     Baking & Dessert).
   - **Why Olilo** — 1-2 plain, specific sentences on what the creator is
     genuinely known for (signature content, a cookbook, a series). This is the
     raw material for the DM hook.
   - **Fill Method** — set to `AI Agent` for rows this skill created; leave the
     existing value for manually-added rows.
5. Write the **DM Draft** (see the DM section below).
6. If follower count is under 1,000, or the account cannot be confirmed:
   set `Enrichment Status` = `Failed`, explain why in `Why Olilo`, and
   skip the DM.
7. Otherwise set `Enrichment Status` = `Done`.

## The v10 DM — write into the `DM Draft` field

Write exactly this shape. Everything is fixed EXCEPT the greeting name and `[HOOK]`:

  Hey [Name], Joon here, co-founder of OLILO. Here's a quick 15-sec hello from
  me and Rich: https://www.loom.com/share/120d2a2af19e404fb34c216b935e60f6
  We've been big fans of [HOOK], which is why you came to mind. We're launching
  OLILO Sweet Fiber Syrup soon: 7g of prebiotic fiber per serving, no sugar
  spike, and no weird aftertaste. We're hand-picking a few creators to try it
  before we launch, so you can tell us what you think. Grab yours here:
  https://kit.olilosweet.com/

(The DM is one continuous line — no line breaks.)

**Writing the [HOOK]** — fills "We've been big fans of ___":
- Build it from the `Why Olilo` note. ONE real idea, said the way a person would
  say it out loud. Conversational.
- Do NOT fact-stack — no stacked qualifiers. Bad: "your foolproof Korean
  comfort-food recipes made with easy-to-find ingredients". Good: "your Korean
  comfort food, that bossam reel especially".
- Drop blurb-words: "content", "recipes built around", "as a registered
  dietitian".
- The bridge `, which is why you came to mind` always follows the hook (fixed).

**Greeting / name handling:**
- Doctors -> `Hey Dr. [LastName],`
- Brand-name accounts (no clear person) -> `Hey team,`
- A known person -> first name.

## Rules
- Never fabricate research. If web search cannot confirm something, mark
  `Failed` and say so — do not guess.
- Follower count is the creator's **Instagram** count specifically — not
  TikTok/YouTube, which are often far larger and would mis-tier them.
- DM copy rules: brand is always `OLILO` (all caps); NO em dashes anywhere
  (commas only); keep the product line and CTA verbatim; banned phrases —
  synergy, authentic, resonate, collab, "I love your content", "I came across",
  "clean eating", "zero sugar", "guilt-free", and any diet-culture language.
- Never research or add a creator without first checking the Step 0 dedup
  index — creators already in "Creators (confirmed)" are skipped, not re-done.
- For batches over ~15 creators, fan research out across parallel subagents
  (~15 each) and apply results here.
- When done, report: count filled (Done), count Failed and why.

## What happens next (not this skill's job)
Joon or Rich review each filled row — research and the drafted DM — and tick
`Approved`. An Airtable automation copies approved rows into "Creators
(confirmed)". The existing platform handles sending; Joon sends each DM
manually via Instagram.
