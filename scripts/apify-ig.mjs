// Verify Instagram profiles via Apify for the scout-creators skill.
// Pulls real profile data (follower count, bio email, verified/private, post count)
// instead of relying on web-search snippets.
//
// Usage:  node scripts/apify-ig.mjs handle1 [handle2 ...]
// Output: one JSON object per line:
//   { username, fullName, followers, posts, verified, private, email, bio }
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.production", import.meta.url), "utf8")
    .split("\n").filter(l => l.includes("=")).map(l => {
      const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);
const TOKEN = env.APIFY_TOKEN;
if (!TOKEN) { console.error("APIFY_TOKEN missing from .env.production"); process.exit(1); }

const handles = process.argv.slice(2).map(h => h.replace(/^@/, "").trim()).filter(Boolean);
if (!handles.length) { console.error("usage: node scripts/apify-ig.mjs <handle> [handle ...]"); process.exit(1); }

const input = {
  directUrls: handles.map(h => `https://www.instagram.com/${h}/`),
  resultsType: "details",
  resultsLimit: 1,
};
const r = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${TOKEN}`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
});
if (!r.ok) { console.error("Apify HTTP", r.status, (await r.text()).slice(0, 300)); process.exit(1); }
const items = await r.json();
for (const it of items) {
  const email = it.businessEmail || it.publicEmail ||
    (it.biography && (it.biography.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/) || [])[0]) || "";
  console.log(JSON.stringify({
    username: it.username, fullName: it.fullName || "",
    followers: it.followersCount ?? null, posts: it.postsCount ?? null,
    verified: !!it.verified, private: !!it.private, email,
    bio: (it.biography || "").replace(/\n/g, " "),
  }));
}
