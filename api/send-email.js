// api/send-email.js — send an outreach email to a creator via Resend.
// Admin-only. This endpoint ONLY sends the email; the caller logs the contact
// separately via /api/contact, mirroring the "Mark Contacted" flow.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Brand tokens (mirror web/colors_and_type.css).
const BRAND = { orange: '#FB4408', ink: '#331B0A', cream: '#F7F2E0', blue: '#BAEBF7' };
const LOGO_URL = 'https://kit.olilosweet.com/assets/olilo-logo.png';
const FONT = "'Barlow Semi Condensed','Arial Narrow',Arial,sans-serif";

// The two fixed OLILO links every outreach email carries. Instead of a bare
// URL they get readable anchor text inline.
const LOOM_RE = /^https?:\/\/(?:www\.)?loom\.com\/share\/[A-Za-z0-9]+$/;
const KIT_RE = /^https?:\/\/kit\.olilosweet\.com\/?$/;

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

// Turn URLs, email addresses, and bare domains in the body into inline links.
// The Loom intro and kit links get friendly anchor text; everything else keeps
// its own text. Trailing punctuation is left outside the link.
function linkify(text, orange) {
  const a = (href, label) =>
    `<a href="${href}" style="color:${orange};text-decoration:underline;">${label}</a>`;
  const RE = /(https?:\/\/[^\s<]+)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|(\b(?:[\w-]+\.)+[A-Za-z]{2,}\b)/g;
  return text.replace(RE, (m, url, email) => {
    const trail = (m.match(/[.,;:!?]+$/) || [''])[0];
    const core = m.slice(0, m.length - trail.length);
    if (url) {
      let label = core;
      if (LOOM_RE.test(core)) label = 'watch the video here';
      else if (KIT_RE.test(core)) label = 'grab your kit here';
      return a(core, label) + trail;
    }
    if (email) return a('mailto:' + core, core) + trail;
    return a('https://' + core, core) + trail;
  });
}

// Wrap a plain-text body in the branded OLILO HTML shell. Clean and minimal:
// white card, hairline rules, no heavy borders. Email-safe table layout with
// inline styles. Blank lines split paragraphs; URLs become inline links.
export function renderEmailHtml(body) {
  const { orange, ink, cream, blue } = BRAND;
  const paragraphs = escapeHtml(String(body).trim())
    .split(/\n\s*\n/)
    .map(block => {
      const html = linkify(block, orange).split('\n').join('<br>');
      return `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${ink};">${html}</p>`;
    })
    .join('');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>OLILO</title></head>
<body style="margin:0;padding:0;background:${cream};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${cream};">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#FFFFFF;border:1px solid rgba(51,27,10,0.10);">
<tr><td align="center" style="padding:30px 44px;background:${blue};">
<img src="${LOGO_URL}" alt="OLILO" width="132" style="display:block;border:0;width:132px;height:auto;"></td></tr>
<tr><td style="padding:34px 44px 36px;font-family:${FONT};">${paragraphs}</td></tr>
</table></td></tr></table></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminToken = req.headers['x-admin-token'];
  if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { to, subject, body } = req.body || {};
  if (!to || !EMAIL_RE.test(String(to).trim())) {
    return res.status(400).json({ error: 'Missing or invalid recipient email' });
  }
  if (!subject || !String(subject).trim()) {
    return res.status(400).json({ error: 'Missing subject' });
  }
  if (!body || !String(body).trim()) {
    return res.status(400).json({ error: 'Missing email body' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return res.status(500).json({ error: 'Email service not configured' });

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'OLILO <hello@olilosweet.com>',
        reply_to: 'hello@olilosweet.com',
        to: [String(to).trim()],
        subject: String(subject).trim(),
        text: String(body).trim(),
        html: renderEmailHtml(body),
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error('send-email resend error:', data);
      return res.status(502).json({ error: data?.message || 'Email send failed' });
    }
    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error('send-email error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
