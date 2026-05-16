# Olilo Intake Form — Form Specification

**Form name:** "You're in — let's get your Olilo kit to you"  
**Purpose:** Collect creator shipping address, agreement, and affiliate opt-in after outreach is accepted  
**Implementation:** Custom-built HTML form at `web/index.html`, deployed to Vercel, served at **`https://kit.olilosweet.com/`**  
**Submits to:** `/api/intake` (Vercel serverless function in `api/intake.js`)  
**V1 scope:** US shipping only  
**Last updated:** 2026-05-16

> **Not Tally, not Typeform.** This is a custom-built form on the brand's own domain — full control over branding, hosting, and the data flow. Any third-party form references in this document have been removed.

---

## BRAND SETTINGS

The form's actual styling lives in `web/colors_and_type.css` and the inline `<style>` block at the top of `web/index.html`. Don't take the colors below as authoritative — read the CSS.

Reference palette (for the form-spec intent, not the source of truth):
- Background: Warm off-white
- Accent: Deep terracotta or warm olive (aligned with brand site)
- Text: Near-black

**Tone:** Warm, celebratory, founder-voice. This form is the moment a creator goes from "interested" to "it's happening." Make it feel good.

---

## FORM FIELDS (in order)

### Screen 1: Welcome Screen

**Type:** Welcome screen  
**Headline:** "Hey [Name] — you're in! 🎉"  
**Body text:** "We're so excited to send you Olilo. This form takes about 2 minutes. Just drop your shipping address, a quick agreement, and let us know if you want to earn commission on sales you drive. That's it."  
**Button label:** "Let's do it →"

**Personalization note:** The [Name] in the headline can be pre-filled by appending `?name=FirstName` to the form URL (e.g. `https://kit.olilosweet.com/?name=Steph`). The intake form's JS should read this query param and inject it into the headline. If not pre-filled, use a generic headline: "You're in — let's get your kit to you!"

**Loom video:** A 15-second founder intro video (Joon + Rich) should be embedded prominently on this welcome screen — above or right under the headline. It plays automatically (muted) when the page loads. Loom embed URL: `https://www.loom.com/embed/120d2a2af19e404fb34c216b935e60f6`

---

### Field 1: Name Confirmation

**Type:** Short text  
**Question:** "First, confirm your name for the shipping label:"  
**Placeholder:** "Your full name"  
**Pre-fill:** If the form is opened with `?name=FirstName` in the URL, pre-fill this field.  
**Required:** Yes  
**Validation:** None beyond required

---

### Field 2: Instagram Handle

**Type:** Short text  
**Question:** "Your Instagram handle:"  
**Placeholder:** "@yourhandle"  
**Pre-fill:** Pre-fill from Airtable if possible.  
**Required:** Yes (unless creator is TikTok-only — handle with logic in Field 3)  
**Helper text:** "This helps us tag you when we share your content (with your permission, of course)."

---

### Field 3: TikTok Handle

**Type:** Short text  
**Question:** "TikTok handle (optional):"  
**Placeholder:** "@yourhandle"  
**Required:** No  
**Helper text:** "Leave blank if you're not on TikTok."

---

### Field 4: Shipping Street Address

**Type:** Short text  
**Question:** "Street address:"  
**Placeholder:** "123 Main St, Apt 4B"  
**Required:** Yes  
**Helper text:** "US addresses only for now. If you're outside the US, just reply to our email and we'll figure it out."

---

### Field 5: City

**Type:** Short text  
**Question:** "City:"  
**Placeholder:** "Los Angeles"  
**Required:** Yes

---

### Field 6: State

**Type:** Dropdown  
**Question:** "State:"  
**Options:** All 50 US states + DC (rendered as a `<select>` in `web/index.html`)  
**Required:** Yes

---

### Field 7: ZIP Code

**Type:** Short text  
**Question:** "ZIP code:"  
**Placeholder:** "90210"  
**Required:** Yes  
**Validation:** Numbers only, 5 digits (or 9 with hyphen for ZIP+4)

---

### Field 8: Country (Hidden / Locked)

**Type:** Hidden field or statement  
**Value:** United States (locked for V1)  
**Display:** Show as a statement: "We're shipping to the US only in this first round." — no input needed.  
**Required:** N/A

---

### Field 9: Content Agreement Checkbox

**Type:** Legal / Checkbox  
**Statement:** "I agree to create at least one post featuring Olilo within 30 days of receiving my kit. The post can be a Reel, TikTok, Story, or carousel — your creative call. No script required, just your honest take."  
**Checkbox label:** "I agree"  
**Required:** Yes — form cannot be submitted without this checked.  
**Note:** This is a soft content agreement, not a legal contract. Consult Joon about whether a more formal agreement is needed before V2.

---

### Field 9b: FTC Disclosure Checkbox

**Type:** Legal / Checkbox  
**Statement:** "I understand that this product is being gifted to me and that any content I create featuring Olilo must be disclosed as #gifted or #ad in accordance with FTC guidelines."  
**Checkbox label:** "Understood"  
**Required:** Yes — form cannot be submitted without this checked.

---

### Field 10: Affiliate Opt-In

**Type:** Multiple choice (single select)  
**Question:** "One more thing — would you like to earn commission on sales you drive?"  
**Options:**
- "Yes, sign me up for the affiliate program"
- "Not right now, but maybe later"

**Required:** Yes (both options are valid — just need a choice)  
**Helper text:** "If you opt in, we'll email you a custom link and coupon code. Commission is 10% on every sale through your link. No minimums, no requirements."

---

### Field 11: Content Ideas (Optional)

**Type:** Long text  
**Question:** "What would you make with Olilo? (totally optional — just helps us send the right recipe cards)"  
**Placeholder:** "Thinking a coffee recipe, maybe a yogurt bowl..."  
**Required:** No  
**Character limit:** 500

---

### Screen 2: Thank You Screen

**Type:** Ending screen  
**Headline:** "You're all set!"  
**Body text:** "Your Olilo kit will be on its way within 1–2 business days, and you should have it in 5–7 business days total. We'll email you the tracking number as soon as it ships. We genuinely can't wait to see what you create."  
**Button:** Optional — "Follow us on Instagram @olilosweet" (link to IG)

---

## FORM → AIRTABLE FIELD MAPPING

| Form Field | Airtable Table | Airtable Field | Notes |
|---|---|---|---|
| Name Confirmation | Creators | Name | Update existing record (match by handle) |
| Instagram Handle | Creators | Instagram Handle | Confirm match |
| TikTok Handle | Creators | TikTok Handle | Update if provided |
| Street + City + State + ZIP | Creators | Shipping Address | Combine into formatted string |
| Agreement Checkbox | Creators | Notes | Log "Agreement accepted on [date]" |
| Affiliate Opt-In (Yes) | Creators | Notes + Status | Flag for affiliate setup; add to "Needs Affiliate Link" view |
| Content Ideas | Creators | Notes | Append "Content ideas from form: [text]" |
| Form submission date | Creators | Status | Set to "Deal Agreed" |
| Form submission date | Shipments | Request Date | Manually trigger fulfillment script |

**Matching logic:** Implemented in `api/intake.js` — when a form submission POSTs to the Vercel endpoint, the handler looks for an existing Creators record where Instagram Handle OR Name matches. If found, it updates the record. If not found (Tier 3 self-apply), it creates a new record.

---

## DATA FLOW

```
Browser (kit.olilosweet.com → web/index.html)
   │  fetch POST /api/intake with JSON body:
   │  { name, email, phone, instagram_handle, tiktok_handle,
   │    shipping_address, affiliate_opt_in }
   ▼
Vercel serverless (api/intake.js)
   │  - Searches Creators by IG handle (with/without @) OR name
   │  - Found  → PATCH the existing record (Status → "Replied")
   │  - Not found → POST a new Creators record
   │  - Sends a Resend notification email to NOTIFY_EMAIL
   ▼
Airtable (Creators table)
```

The browser-side form schema (which fields, validations, copy) is whatever's in `web/index.html`. The server-side contract is fixed by `api/intake.js` — change the form's `name=` attributes carefully because they must match the keys the handler destructures from `req.body`.

---

## NOTES FOR SETUP

- **Live URL:** `https://kit.olilosweet.com/` — this is what gets pasted into DM/Email drafts in place of the legacy `[INTAKE LINK]` placeholder (which has been removed from current drafts).
- **URL parameters for personalization:** `kit.olilosweet.com/?name=Steph&handle=stephgrassodietitian` — the form JS reads these on load and pre-fills the matching fields. When generating per-creator URLs (in a Claude Code session), URL-encode the values.
- **Mobile optimization:** Preview on mobile before launching — most creators will fill this out on their phones.
- **Backup notification:** `RESEND_API_KEY` + `NOTIFY_EMAIL` env vars in Vercel ensure Joon/Rich get an email on every submission as a safety net in case Airtable writes fail.
- **Loom video embed:** A 15-second founder intro video should be embedded prominently on the welcome screen of `web/index.html`. Loom embed URL: `https://www.loom.com/embed/120d2a2af19e404fb34c216b935e60f6`
