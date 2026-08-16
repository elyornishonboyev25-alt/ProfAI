import { env, isProduction } from '../config/env.js'

export type AuthCodePurpose = 'REGISTER' | 'RESET_PASSWORD'

type DeliveryResult = {
  developmentCode?: string
}

function emailCopy(purpose: AuthCodePurpose, code: string) {
  const isRegistration = purpose === 'REGISTER'
  const title = isRegistration ? 'Confirm your ProfAI account' : 'Reset your ProfAI password'
  const lead = isRegistration
    ? 'Use this verification code to finish creating your ProfAI account.'
    : 'Use this verification code to choose a new ProfAI password.'

  return {
    subject: `${code} is your ProfAI verification code`,
    text: `${title}\n\n${lead}\n\nVerification code: ${code}\n\nThis code expires in 10 minutes. If you did not request it, you can ignore this email.`,
    html: `<!doctype html>
      <html lang="en">
        <body style="margin:0;background:#f3f7ff;font-family:Inter,Arial,sans-serif;color:#0f172a">
          <div style="max-width:560px;margin:0 auto;padding:36px 18px">
            <div style="overflow:hidden;border:1px solid #dbeafe;border-radius:28px;background:#ffffff;box-shadow:0 22px 60px rgba(37,99,235,.12)">
              <div style="height:5px;background:linear-gradient(90deg,#2563eb,#ef3333,#c5162e)"></div>
              <div style="padding:34px">
                <div style="display:inline-block;border-radius:12px;background:#eff6ff;padding:8px 12px;font-size:12px;font-weight:800;letter-spacing:.12em;color:#1d4ed8">PROFAI SECURITY</div>
                <h1 style="margin:22px 0 8px;font-size:28px;line-height:1.15">${title}</h1>
                <p style="margin:0;color:#64748b;font-size:15px;line-height:1.7">${lead}</p>
                <div style="margin:26px 0;border:1px solid #bfdbfe;border-radius:20px;background:#f8fbff;padding:22px;text-align:center">
                  <div style="font-size:12px;font-weight:800;letter-spacing:.16em;color:#64748b">VERIFICATION CODE</div>
                  <div style="margin-top:10px;font-size:38px;font-weight:900;letter-spacing:.22em;color:#1d4ed8">${code}</div>
                </div>
                <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6">This code expires in 10 minutes and can be used only once. Never share it with anyone.</p>
              </div>
            </div>
          </div>
        </body>
      </html>`,
  }
}

export async function sendAuthCode(email: string, code: string, purpose: AuthCodePurpose): Promise<DeliveryResult> {
  if (!env.RESEND_API_KEY.trim()) {
    if (isProduction) {
      throw new Error('Email delivery is not configured.')
    }

    // Local development remains testable without an email provider. The route
    // returns this value only outside production and never stores it in plain text.
    return { developmentCode: code }
  }

  const copy = emailCopy(purpose, code)
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.AUTH_EMAIL_FROM,
      to: [email],
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
    }),
  })

  if (!response.ok) {
    throw new Error(`Email provider rejected the request (${response.status}).`)
  }

  return {}
}
