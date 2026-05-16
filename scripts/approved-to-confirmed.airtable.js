/**
 * Airtable Automation script — "Approved -> Creators (confirmed)"
 *
 * This is NOT a Node script. Paste it into the "Run a script" action of an
 * Airtable automation (Airtable cannot be configured via its API, so the
 * automation must be wired up once in the Airtable UI — see setup steps below).
 *
 * Trigger:  "When a record matches conditions"
 *           Table = Creators (not confirmed), Where Approved is checked.
 * Action:   "Run a script", with one input variable:
 *           recordId  ->  (trigger step) Airtable record ID
 *
 * Behaviour: MOVES the approved row — copies it into "Creators (confirmed)",
 * then deletes it from "Creators (not confirmed)". The delete only runs after
 * the copy succeeds (createRecordAsync throws on failure and stops the script),
 * so a failed copy never loses the row. Idempotent — if a confirmed row with
 * the same Instagram Handle already exists, it neither copies nor deletes, and
 * logs so the duplicate can be reconciled by hand.
 */
let { recordId } = input.config();

let src = base.getTable("Creators (not confirmed)");
let dst = base.getTable("Creators (confirmed)");

// Fields present in BOTH tables that should carry over. Deliberately excludes
// Approved / Fill Method / Enrichment Status (not in confirmed), Profile Image
// (attachment), Creator Insights (computed), and all linked-record fields.
let FIELDS = [
  "Name", "Instagram Link", "Category", "Instagram Handle", "TikTok Handle",
  "Platform(s)", "Audience Size", "Outreach Tier", "Why Olilo", "Email",
  "Status", "Assigned To", "Creator Brief", "Email Draft", "DM Draft",
  "Shipping Address", "Affiliate Code", "Affiliate Link", "Commission Rate",
  "Total Conversions", "Total Revenue", "Notes", "Date Added", "Priority Tag",
  "Handle Verified", "Outreach Method", "Affiliate Interest", "Phone",
  "Last Contacted At", "List by", "Archived", "Source",
];

let query = await src.selectRecordsAsync({ fields: [...FIELDS, "Approved"] });
let record = query.getRecord(recordId);

if (!record) {
  console.log(`Record ${recordId} not found — nothing to do.`);
} else if (!record.getCellValue("Approved")) {
  console.log("Approved is not checked — skipping.");
} else {
  let handle = (record.getCellValue("Instagram Handle") || "").trim();

  // Idempotency guard: do not create a duplicate in confirmed.
  let dstQuery = await dst.selectRecordsAsync({ fields: ["Instagram Handle"] });
  let dup = dstQuery.records.find(r =>
    (r.getCellValue("Instagram Handle") || "").trim().toLowerCase() ===
    handle.toLowerCase()
  );

  if (dup && handle) {
    // Already in confirmed — do NOT delete the staging row, so differing
    // field edits are never lost silently. Reconcile by hand.
    console.log(`${handle} is already in Creators (confirmed) — left in staging for manual review, not moved.`);
  } else {
    let newFields = {};
    for (let f of FIELDS) {
      let v = record.getCellValue(f);
      if (v !== null && v !== undefined && v !== "") newFields[f] = v;
    }
    // Copy first. If this throws, the script stops here and the row stays put.
    let newId = await dst.createRecordAsync(newFields);
    // Copy succeeded — now remove the row from staging to complete the move.
    await src.deleteRecordAsync(recordId);
    console.log(`Moved "${record.getCellValue("Name")}" into Creators (confirmed) (${newId}) and removed it from staging.`);
  }
}
