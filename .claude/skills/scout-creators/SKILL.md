---
name: scout-creators
description: Research and fully fill influencer rows in the Olilo Creators
  Airtable table — verify the Instagram handle, follower
  count, audience size, outreach tier, category, capture a public contact
  email, write a Why Olilo note, AND draft both the v10 personalized outreach
  DM and the tiered outreach email. Use when new creators need to be found or
  filled in for the influencer outreach pipeline.
---

# Scout Creators — research + outreach drafting for the Creators table

You research influencers and fill their full data — INCLUDING the v10 outreach
DM and the outreach email — into the single **"Creators"** table of the Olilo
Influencer CRM. This skill enriches rows whose `Status` is **`New`**, added
either by the admin quick-add box (`Source = Manual`) or by this skill's `find`
flow (`Source = AI Scout`).

## How to use

Run it as a slash command inside a Claude Code session opened in this project
(`Influencer Platform for Olilo`). It runs on demand — you type the command:

- **`/scout-creators`** (no args) — enriches every row in the **"Creators"**
  table whose `Status` is `New` and that has an Instagram handle or link. Use
  this after handles are added via the admin quick-add box (which lands them as
  `New`). To keep these picked up hands-free, run it on a loop:
  `/loop 5m /scout-creators`.
- **`/scout-creators @somehandle`** — adds and fills that one creator.
- **`/scout-creators find 15 gut-health creators`** — sources candidates (web
  research and/or Apify hashtag scraping), verifies each handle with
  `scripts/apify-ig.mjs` BEFORE adding (drops sub-1K, private, and non-US
  accounts up front), adds a `New` row for each survivor (`Source = AI Scout`),
  then fills them.

Typical flow: handles land as `New` (quick-add or `find`) -> run
`/scout-creators` -> AI-scouted rows become `Needs Review` for you to approve in
the admin Review tab; manually-added rows go straight onto the live list.

## Setup
- Airtable base `appubVom4JyZ3mCEL`; token `AIRTABLE_TOKEN` in `.env.production`.
- Single table: **"Creators"** (`tblbBNgHxp6YNOJOQ`). The no-arg run scans it for
  rows with `Status = New` and enriches each with the procedure below.
- **Apify is the verification backbone** (`APIFY_TOKEN` in `.env.production`).
  Run `node scripts/apify-ig.mjs <handle> [handle ...]` to get **real** profile
  data per handle (one JSON line each): `followers`, `posts`, `verified`,
  `private`, `email` (from bio), `bio`. Use this for follower count and email —
  never trust web-search snippets for those. Actor: `apify/instagram-scraper`.
- Canonical DM + email pattern reference: `agents/alice-prompt.md` (v10).

## Step 0 — load the roster (always, before any research)
Before researching, finding, or adding ANY creator, pull the full **"Creators"**
table (`tblbBNgHxp6YNOJOQ`) and build a dedup index:
- Page through ALL records.
- For every record already on the list (any `Status` other than `New`,
  `Enriching`, or `Failed`), capture **Instagram Handle** and **Name**,
  normalized for matching: lowercase, strip a leading `@`, strip whitespace.
- Keep this index in memory for the whole run.

This roster is the source of truth for "who we already have." A `New` row whose
handle (or unambiguous name) matches the index is a duplicate — mark it `Failed`
(see the Procedure), never re-research it. When `/scout-creators find ...`
generates candidates, filter them against this index BEFORE any web research, so
no effort is spent on creators already on the list.

In the final report, list any candidates skipped as already-on-the-list dupes.

## Procedure — for each creator row
1. Check the creator against the Step 0 dedup index. If they match an existing
   live creator by handle or name, set `Status` = `Failed`, note "Already in
   Creators" in `Why Olilo`, skip research and the DM.
2. Set `Status` = `Enriching`.
3. **Verify with Apify FIRST**: `node scripts/apify-ig.mjs <handle>`. This
   confirms the account is real, public, and active, and returns the exact
   follower count and bio email. Then web-search for context (what they are
   known for). If the confirmed handle matches the dedup index, treat it as a
   duplicate per step 1. If Apify shows the account private or not found, go to
   step 6.
4. Fill the research fields:
   - **Instagram Handle** — corrected if wrong; always store with a leading `@`.
   - **Instagram Link** — `https://instagram.com/<handle>`.
   - **Audience Size** — from the *Apify* follower count, bucketed:
     `Nano 1K–10K` / `Micro 10K–100K` / `Macro 100K–1M` / `Mega 1M+`.
   - **Outreach Tier** — by follower count: 1M+ -> `Tier 1`; 100K-1M -> `Tier 2`;
     under 100K -> `Tier 3`.
   - **Category** — best fit from the table's options (Beverage, Gut Health,
     Blood Sugar & Metabolic, Korean Food, Asian Food, Healthy Recipe,
     Baking & Dessert).
   - **Why Olilo** — 1-2 plain, specific sentences on what the creator is
     genuinely known for (signature content, a cookbook, a series). This is the
     raw material for the DM hook.
   - **Email** — prefer the `email` Apify pulled from the bio (a real, verified
     address). If Apify returns none, check the website about/contact page or
     link-in-bio. Store only a real, verified address; if none is public, leave
     it empty. NEVER guess, infer, or construct an email.
   - **Source** — leave as-is (`Manual` for quick-adds, `AI Scout` for `find`);
     it decides where the row lands in step 7.
5. Write the **DM Draft** and the **Email Draft** (see the two sections below).
6. Set `Status` = `Failed` (explain why in `Why Olilo`, skip the DM + Email) if
   Apify shows any of: follower count under 1,000; the account is private or not
   found; or the audience is clearly non-US (bio language/location indicates
   another country) — OLILO seeds physical kits in the US, so non-US creators
   are a poor fit. Note non-US ones as "revive if you want international."
7. Otherwise set the row live by `Source`:
   - `Source = AI Scout` -> `Status` = `Needs Review` (waits for Joon/Rich to
     approve in the admin Review tab).
   - `Source = Manual` or `Inbound` (already human-vetted) -> `Status` =
     `Not Contacted` (straight onto the live outreach list).

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

## The outreach email — write into the `Email Draft` field

Always write an Email Draft, even when no email address was found — it is ready
for whenever an address surfaces. Format the field as:

  Subject: <short, specific subject line>
  <blank line>
  <email body>
  <blank line>
  <sign-off>

Length, tone, and sign-off depend on **Outreach Tier**:
- **Tier 1 (4-6 sentences)** — warm and specific, reads handwritten. Open with
  one real, specific thing from the `Why Olilo` note. Sign-off, two lines:
  `Joon` / `Co-founder, OLILO | olilosweet.com`.
- **Tier 2 (3-4 sentences)** — direct and friendly, lightly personalized to the
  creator's category. Sign-off, two lines:
  `The OLILO Team` / `hello@olilosweet.com | olilosweet.com`.
- **Tier 3 (2-3 sentences)** — concise, one specific connection to their
  content, no pressure. Same Team sign-off as Tier 2.

Every email must include, in plain order:
1. A genuine, specific opener — what the creator is known for and why it caught
   our eye. Not "I love your content".
2. What OLILO is, in one plain sentence (Sweet Fiber Syrup: 7g prebiotic fiber
   per serving, no sugar spike, no weird aftertaste).
3. The founder intro video, right after the OLILO sentence — the fixed Loom
   link `https://www.loom.com/share/120d2a2af19e404fb34c216b935e60f6`, phrased
   e.g. "Here's a quick 15-second hello from our founders, Joon and Rich: <link>".
4. Why it specifically fits this creator, tied to their actual content.
5. The intake link `https://kit.olilosweet.com/`.
6. A soft CTA, e.g. "if it sounds like a fit, here's where to grab your kit" or
   "happy to answer anything, just reply here". Not "Would you be interested?".

Email copy rules: brand is always `OLILO`; NO em dashes (commas only); at most
one exclamation point in the whole email; never sound like a PR pitch or mass
email; same banned phrases as the DM. Do not frame OLILO as doing the creator a
favor.

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
  index — creators already on the Creators list are skipped, not re-done.
- For batches over ~15 creators, fan research out across parallel subagents
  (~15 each) and apply results here.
- When done, report: count filled (Done), count Failed and why, and how many
  got a verified `Email` address (vs. left empty because none was public).

## What happens next (not this skill's job)
Everything is in the one **"Creators"** table; promotion is just a `Status` change:
- **AI-scouted** rows finish at `Needs Review`. Joon or Rich open the **Review**
  tab on `/admin` and click **Approve**, which sets `Status` = `Not Contacted` —
  the creator is now on the live outreach list.
- **Manually-added** rows (quick-add) are already human-vetted, so this skill
  sets them straight to `Not Contacted`. No review step, no copy automation.

The existing platform handles sending; Joon sends each DM manually via Instagram.
