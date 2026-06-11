type SendEmailInput = {
  to: string
  subject: string
  html: string
}

export async function sendEmailWithResend(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) return false

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    console.error('Resend error:', response.status, body)
    return false
  }

  return true
}

export function getAppBaseUrl(): string {
  return (process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3001').replace(/\/$/, '')
}

export function logDevEmail(to: string, subject: string, url: string): void {
  console.log('\n--- Email (dev / sin SMTP) ---')
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log(`Link: ${url}`)
  console.log('Configura RESEND_API_KEY + EMAIL_FROM para envío real.')
  console.log('--------------------------------\n')
}
