# OLILO Seeding Platform — Team Briefing

**For:** Joon, Rich (and anyone else who needs to run outreach)
**Last updated:** 2026-04-26

---

## What Is This

The OLILO Seeding Platform is the internal tool for managing the entire influencer seeding campaign — from finding a creator to shipping their kit to tracking whether they posted.

139 creators are already loaded with personalized outreach drafts. Your job is to work through the list, contact creators, track who replied, and coordinate kit shipments once a creator agrees.

Everything runs through two pages: **Admin** (list + actions) and **Kanban** (visual pipeline). You do not need to touch Airtable directly — the platform syncs everything automatically.

---

## Quick Reference

| What | URL / Value |
|---|---|
| Intake form (for creators) | `https://kit.olilosweet.com` |
| Admin page | `https://kit.olilosweet.com/admin` |
| Kanban pipeline | `https://kit.olilosweet.com/kanban` |
| Admin password | `07170` |
| Creator link in DMs | `https://kit.olilosweet.com` |
| Kit CSV export | `https://kit.olilosweet.com/api/export` |
| Notify email (form submissions) | `joon@adaptive.kitchen` |

---

## The Pipeline — How a Creator Moves Through It

```
Not Contacted → Contacted → Replied → Shipped → Delivered → Content Posted
```

1. **Not Contacted** — Creator is loaded and ready. Drafts are written. No outreach yet.
2. **Contacted** — You sent the DM or email. Platform logs the date and channel.
3. **Replied** — Creator filled out the intake form OR replied positively. Address is captured.
4. **Shipped** — Kit is on its way.
5. **Delivered** — Kit arrived.
6. **Content Posted** — Creator published content featuring OLILO.

---

## Daily Workflow

### Step 1 — Open Admin or Kanban
Go to `https://kit.olilosweet.com/admin` → enter password `07170`.

Use **Admin** for working through a list. Use **Kanban** for a visual overview of the pipeline.

### Step 2 — Filter to "Not Contacted"
Click the **Not Contacted** tab. These are your targets for today.

Use the **Assigned To** field in Airtable to split the list between Joon and Rich (this shows in the "My Creators" view in Airtable if you set up the filter).

### Step 3 — Contact a Creator
Click the **Contact** button next to a creator's name.

A modal opens. Choose your channel:
- **Instagram DM** — the personalized DM draft loads automatically. Copy it, go to their IG, send it.
- **Email** — the Subject Line and Email body load separately. Copy each, open Gmail, send from your personal `@olilosweet.com` account.
- **TikTok DM** — same as Instagram DM.

Select **Sent By** (Joon or Rich), then click **Confirm**.

The platform logs the outreach and moves the creator to **Contacted** automatically.

### Step 4 — Track follow-ups
In the Admin list, a **⚑ flag** appears next to any creator who has been Contacted for 5+ days with no reply. That's your follow-up signal.

### Step 5 — When a creator replies or submits the form
If they fill out the intake form (`https://kit.olilosweet.com`), the platform automatically:
- Updates their status to **Replied**
- Captures their shipping address
- Creates a Shipments record
- Sends a notification to Joon

You can also manually update the Status dropdown inline (any row in Admin) if a creator replies via DM or email instead of the form.

### Step 6 — Export kit queue for shipping
When you're ready to ship a batch, go to:
`https://kit.olilosweet.com/api/export`

This downloads a CSV of all creators with Status = **Replied** (Preparing). Use this to generate shipping labels.

After shipping, update each creator's status to **Shipped** via the inline dropdown in Admin.

---

## The Intake Form (What Creators See)

When you send a DM, the link you share is `https://kit.olilosweet.com`.

The form asks for:
- Name, Email, Phone
- Instagram handle, TikTok handle (optional)
- Shipping address
- Affiliate interest checkbox ("I'd love to earn commission too")

When they submit, Joon gets an email notification. The platform handles everything else automatically.

---

## The DM Drafts

Every creator has a personalized DM draft pre-written. The opening hook is specific to their content — it references what they actually post about.

**How to send:**
1. Click Contact → Instagram DM
2. Copy the draft
3. Go to their Instagram profile, click Message
4. Paste and send

**The intake link in drafts** shows as `[INTAKE LINK]` in the system and displays as `https://kit.olilosweet.com` when you copy it.

---

## The Email Drafts

Every creator also has a personalized email draft. Subject line and body are stored separately.

**Format:**
- Subject line is shown separately — copy it into Gmail's subject field
- Body opens with a personalized hook, then founder story, then CTA
- Signed: "Warmly, Joon Yang & Rich Lim, Co-founders, OLILO"

**Voice:** These are written as personal founder outreach — not marketing copy. They should feel like Joon or Rich actually typed them.

⚠️ **Email drafts are pending a copy audit.** They were just generated and haven't been reviewed yet. Use DMs first while the audit runs.

---

## Tiers (Who Gets What Treatment)

| Tier | Creators | Approach |
|---|---|---|
| **Tier 1** (#1–20) | Top 20 — gut health RDs, mega coffee creators, Korean-American | Personal DM or email from Joon or Rich directly. High-touch. |
| **Tier 2** (#21–60) | Direct outreach via email, light personalization | Standard email draft |
| **Tier 3** (#61–150) | Volume play | Kit + brief note. TikTok Open Plan for self-apply. |

Start with Tier 1. These are the highest-priority relationships.

---

## Known Issues — Fix in Progress

### Email drafts pending copy audit
The email drafts were generated on 2026-04-27 and haven't been reviewed yet. Use DMs as your primary outreach channel while the audit is in progress. Once the audit is done, email drafts will be cleared for use.

---

## What's Next

In priority order:

1. **Alice copy audit** — email drafts reviewed and cleared (in progress)
2. **Start Tier 1 outreach** — Joon + Rich begin personal DMs to the top 20
3. **Kit shipping setup** — confirm WWEX or shipping method before first kit needs to go out
4. **Track content** — once kits are delivered, log posts in the Posts table in Airtable

---

## If Something Breaks

- **Platform not loading:** Check `vercel.app` status. If Airtable is down, the admin page will show empty — wait and refresh.
- **Intake form submissions not showing:** Check Airtable → Creators table, filter by Status = Replied. Also check Airtable → Shipments table.
- **Notification email not arriving:** Check `joon@adaptive.kitchen` inbox + spam. The Resend service sends from `noreply@olilosweet.com`.
- **Status not updating after clicking Confirm:** Refresh the page and check Airtable directly. If the record updated in Airtable but not in the platform, it's a display issue — refresh fixes it.

For anything else: open a Claude Code session in the project folder at `/Users/joony/Documents/ClaudeCode_365/Influencer Platform for Olilo` and describe the issue.
