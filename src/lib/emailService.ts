// ==================== EMAIL NOTIFICATION SERVICE ====================
// Uses Supabase Edge Function to send transactional emails via Resend
//
// ============ SETUP CHECKLIST ============
// 1. Sign up at https://resend.com
// 2. Get your API key from Resend dashboard
// 3. In Supabase dashboard → Edge Functions → Create function named "send-email"
// 4. Paste the Edge Function code from /supabase/functions/send-email/index.ts
// 5. In Supabase dashboard → Project Settings → Secrets → Add RESEND_API_KEY
// 6. Deploy the function
//
// ============ TESTING ============
// In browser console, run: testEmail('your@email.com')
// This will log to console whether it succeeded or failed.

import { supabase } from './supabase';

// For testing only — replace with your actual Resend API key
// In production, this should be removed and only the Edge Function used
const RESEND_API_KEY = 're_48eBGQCr_J8WY1xgxZVdvh4uHZebV4QEP'; // <-- PASTE YOUR RESEND KEY HERE FOR TESTING

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  console.log('[EMAIL] Sending to:', payload.to);
  console.log('[EMAIL] Subject:', payload.subject);

  // Try Edge Function first
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: payload,
    });
    if (error) {
      console.error('[EMAIL] Edge Function error:', error);
    } else {
      console.log('[EMAIL] Edge Function success:', data);
      return true;
    }
  } catch (err: unknown) {
    console.error('[EMAIL] Edge Function exception:', err instanceof Error ? err.message : String(err));
  }

  // Fallback: direct Resend API call (only works if RESEND_API_KEY is set above)
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Transfera <onboarding@resend.dev>',
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log('[EMAIL] Direct API success:', data);
        return true;
      }
      console.error('[EMAIL] Direct API error:', data);
    } catch (err: unknown) {
      console.error('[EMAIL] Direct API exception:', err instanceof Error ? err.message : String(err));
    }
  }

  console.log('[EMAIL] All methods failed. Email NOT sent.');
  return false;
}

// ======= TEST EMAIL =======
// Call this from browser console to test: testEmail('your@email.com')
export async function testEmail(toEmail: string): Promise<boolean> {
  console.log('[EMAIL TEST] Sending test email to:', toEmail);
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px;">
      <h1 style="color:#D4A853;">Transfera Test Email</h1>
      <p>If you received this, your email setup is working!</p>
      <p>Time: ${new Date().toLocaleString()}</p>
    </div>
  `;
  return sendEmail({ to: toEmail, subject: 'Transfera Email Test', html });
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

// ========== DEBIT ALERT (money sent) ==========
export function buildDebitAlertHTML(params: {
  senderName: string;
  recipientName: string;
  amount: number;
  currency: string;
  fee: number;
  referenceCode: string;
  date: string;
  transferType: string;
  newBalance: number;
}): string {
  const total = params.amount + params.fee;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Debit Alert - Transfera</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:#0C1222;padding:32px 40px;text-align:center;">
          <div style="width:48px;height:48px;background:#D4A853;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0C1222" stroke-width="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
          </div>
          <h1 style="color:#F5F5F0;font-size:22px;margin:0;">Transfera</h1>
          <p style="color:rgba(245,245,240,0.55);font-size:13px;margin:8px 0 0;">Secure Banking</p>
        </td></tr>
        <tr><td style="background:#fef3c7;padding:16px 40px;text-align:center;">
          <p style="color:#92400e;font-size:14px;font-weight:600;margin:0;text-transform:uppercase;letter-spacing:0.08em;">💸 Money Sent — Debit Alert</p>
        </td></tr>
        <tr><td style="padding:32px 40px 16px;text-align:center;">
          <p style="color:#0C1222;font-size:14px;margin:0;">Amount Debited</p>
          <p style="color:#0C1222;font-size:36px;font-weight:700;margin:8px 0;">${formatCurrency(total, params.currency)}</p>
          ${params.fee > 0 ? `<p style="color:#888;font-size:13px;margin:0;">Transfer: ${formatCurrency(params.amount, params.currency)} + Fee: ${formatCurrency(params.fee, params.currency)}</p>` : ''}
        </td></tr>
        <tr><td style="padding:0 40px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;">
            <tr><td style="padding:14px 0;border-bottom:1px solid #f5f5f5;"><span style="color:#888;font-size:13px;">Recipient</span></td><td align="right" style="padding:14px 0;border-bottom:1px solid #f5f5f5;"><span style="color:#0C1222;font-size:13px;font-weight:500;">${params.recipientName}</span></td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid #f5f5f5;"><span style="color:#888;font-size:13px;">Transfer Type</span></td><td align="right" style="padding:14px 0;border-bottom:1px solid #f5f5f5;"><span style="color:#0C1222;font-size:13px;font-weight:500;">${params.transferType}</span></td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid #f5f5f5;"><span style="color:#888;font-size:13px;">Reference</span></td><td align="right" style="padding:14px 0;border-bottom:1px solid #f5f5f5;"><span style="color:#0C1222;font-size:13px;font-weight:500;font-family:monospace;">${params.referenceCode}</span></td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid #f5f5f5;"><span style="color:#888;font-size:13px;">Date</span></td><td align="right" style="padding:14px 0;border-bottom:1px solid #f5f5f5;"><span style="color:#0C1222;font-size:13px;font-weight:500;">${params.date}</span></td></tr>
            <tr><td style="padding:14px 0;"><span style="color:#888;font-size:13px;">New Balance</span></td><td align="right" style="padding:14px 0;"><span style="color:#065f46;font-size:13px;font-weight:600;font-family:monospace;">${formatCurrency(params.newBalance, params.currency)}</span></td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 40px;background:#f9f9f9;text-align:center;border-top:1px solid #eee;">
          <p style="color:#999;font-size:12px;margin:0;">This is an automated alert from Transfera Banking.</p>
          <p style="color:#999;font-size:12px;margin:4px 0 0;">Questions? Contact support@transfera.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ========== CREDIT ALERT (money received) ==========
export function buildCreditAlertHTML(params: {
  recipientName: string;
  senderName: string;
  amount: number;
  currency: string;
  referenceCode: string;
  date: string;
  newBalance: number;
}): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Credit Alert - Transfera</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:#0C1222;padding:32px 40px;text-align:center;">
          <div style="width:48px;height:48px;background:#D4A853;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0C1222" stroke-width="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
          </div>
          <h1 style="color:#F5F5F0;font-size:22px;margin:0;">Transfera</h1>
          <p style="color:rgba(245,245,240,0.55);font-size:13px;margin:8px 0 0;">Secure Banking</p>
        </td></tr>
        <tr><td style="background:#d1fae5;padding:16px 40px;text-align:center;">
          <p style="color:#065f46;font-size:14px;font-weight:600;margin:0;text-transform:uppercase;letter-spacing:0.08em;">💰 Money Received — Credit Alert</p>
        </td></tr>
        <tr><td style="padding:32px 40px 16px;text-align:center;">
          <p style="color:#0C1222;font-size:14px;margin:0;">Amount Credited</p>
          <p style="color:#0C1222;font-size:36px;font-weight:700;margin:8px 0;">${formatCurrency(params.amount, params.currency)}</p>
        </td></tr>
        <tr><td style="padding:0 40px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;">
            <tr><td style="padding:14px 0;border-bottom:1px solid #f5f5f5;"><span style="color:#888;font-size:13px;">From</span></td><td align="right" style="padding:14px 0;border-bottom:1px solid #f5f5f5;"><span style="color:#0C1222;font-size:13px;font-weight:500;">${params.senderName}</span></td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid #f5f5f5;"><span style="color:#888;font-size:13px;">Reference</span></td><td align="right" style="padding:14px 0;border-bottom:1px solid #f5f5f5;"><span style="color:#0C1222;font-size:13px;font-weight:500;font-family:monospace;">${params.referenceCode}</span></td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid #f5f5f5;"><span style="color:#888;font-size:13px;">Date</span></td><td align="right" style="padding:14px 0;border-bottom:1px solid #f5f5f5;"><span style="color:#0C1222;font-size:13px;font-weight:500;">${params.date}</span></td></tr>
            <tr><td style="padding:14px 0;"><span style="color:#888;font-size:13px;">New Balance</span></td><td align="right" style="padding:14px 0;"><span style="color:#065f46;font-size:13px;font-weight:600;font-family:monospace;">${formatCurrency(params.newBalance, params.currency)}</span></td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 40px;background:#f9f9f9;text-align:center;border-top:1px solid #eee;">
          <p style="color:#999;font-size:12px;margin:0;">This is an automated alert from Transfera Banking.</p>
          <p style="color:#999;font-size:12px;margin:4px 0 0;">Questions? Contact support@transfera.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
