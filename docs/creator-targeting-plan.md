# OLILO Creator Targeting Plan

How we decide *who* to seed and *how* we find them. This is a **gifting/seeding**
program (free kit, not paid), so the bar is: creators who will **cover OLILO for a
free sample** — nano/micro who already do gifting, not macro who want a check.

OLILO = Sweet Fiber Syrup: 7g prebiotic fiber per serving, no sugar spike, no weird
aftertaste, 7g sugar per serving. Used in coffee, matcha, lattes, smoothies, oatmeal,
baking, desserts. Hooks: drink sweetener · prebiotic fiber/gut health · no sugar spike.

## Who we go after — 4 segments (ranked by fit × likelihood to cover)
1. **Product / snack / grocery-finds reviewers** (e.g. @carla.craves, @snacklikeachamp) —
   trying new products *is* their content; highest inclination to cover; gifting-friendly. **Top.**
2. **Home drink creators** (matcha / coffee / lattes / smoothies) — OLILO is a drink
   sweetener, so the demo is effortless. (e.g. @butterbeready.)
3. **Low-sugar / gut-health / blood-sugar creators** — our message (prebiotic fiber,
   no spike) lands as substance, not just a freebie. Adds credibility.
4. **Healthy recipe creators** (breakfast bowls, baking, desserts) — cook with the syrup.

## Criteria
**MUST-HAVE (hard filters, Apify-verified):**
- 1,000–100,000 followers (nano–micro). **1,000 is a firm floor.**
- US-based (kit ships in US; Amazon US launch).
- Public + active (posted in ~last 30 days).
- Content genuinely food / drink / better-for-you (not beauty/fashion/lifestyle).

**Inclination signals ("will they cover us"):**
- Bio invites collabs — collab email, "PR friendly", "UGC", media-kit link.
- Recent posts show brand work — `#ad` / `#gifted` / `#partner`, tagging brands.
- Format = "new finds" / product reviews.
- Healthy engagement for their size (engaged comments > raw follower count at nano).

**Bonus / highest fit:**
- Already posts about adjacent better-for-you brands (Olipop, Poppi, Lakanto, monk
  fruit, matcha brands, prebiotic/fiber, protein) — they cover our exact category.

**🚩 Red flags (auto-skip):**
- Founder of a competing food/CPG brand.
- Hardcore "zero sugar" / keto-absolutist or diet-culture ("guilt-free") accounts —
  OLILO has 7g sugar, so it is a mismatch and a criticism risk.
- Non-US, private, dormant, or bot-looking (bad follower/following ratio).
- Macro/mega who only do paid.

## How we find them — ranked by signal (revised after testing 2026-06-05)
1. **Joon/Rich seed handles (highest quality):** creators you already admire or have
   seen. Feed 5–10, then find look-alikes around them. Beats any cold method.
2. **Brand TAGGED-feed mining:** scrape who *tagged* an adjacent brand (@olipop,
   @poppi, @lakanto) in their own posts — those are real creators featuring the
   product. (NOT the brand hashtag — see learnings.)
3. **Niche creator hashtags + hard filter:** #snackreview #matchatok #foodreview
   #homebarista. Low yield but real (this is where @snacklikeachamp and
   @tampafoodiess came from). Always apply the must-haves.

### What we learned (2026-06-05, ~4 Apify rounds)
- **Brand HASHTAGS surface brands, not creators.** #olipop/#poppi/#lakanto/#monkfruit
  returned ~100 accounts that were the brands themselves + competitor brands + non-US.
  Zero creator fits. Use brand *tagged-feeds* instead.
- **Cold hashtag mining is low-yield here.** 4 rounds netted only 3 good creators
  (@butterbeready, @snacklikeachamp, @tampafoodiess). The strict criteria + the fact
  that ideal small drink creators are often sub-1K means volume is thin.
- **The on-target matcha/latte creators keep landing sub-1K** (e.g. @drinksby_anna 85,
  @ninysmatcha 642). With the 1,000 floor held, hashtags rarely clear the bar.
- **Implication:** lead with seed handles + brand tagged-feeds, not cold hashtags.

## Process
Discover → `node scripts/apify-ig.mjs` to verify each (real followers, email, bio) →
score against the criteria → **ranked shortlist for Joon/Rich to approve** → approved
ones added as `Status = New`, `Source = AI Scout`, enriched by the scout-creators
skill, then surfaced in the admin **Review** tab.
