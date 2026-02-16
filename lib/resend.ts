import { Resend } from 'resend'

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

let _resend: Resend | null = null
export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    if (!_resend) _resend = getResend()
    return (_resend as any)[prop]
  },
})

const FROM = 'Cloud Employee Portal <noreply@resend.dev>'

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  return resend.emails.send({ from: FROM, to, subject, html, text })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: 'Reset your password – Cloud Employee Portal',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a></p>
        <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  })
}
