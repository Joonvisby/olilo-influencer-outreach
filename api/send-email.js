// api/send-email.js — send an outreach email to a creator via Resend.
// Admin-only. This endpoint ONLY sends the email; the caller logs the contact
// separately via /api/contact, mirroring the "Mark Contacted" flow.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
