import type { Metadata } from 'next'
import LandingClient from '@/components/landing-client'

export const metadata: Metadata = {
  title: 'Namma.ai: Automate Instagram DMs & Comments | AI-Powered Responses',
  description:
    'Auto-reply to Instagram comments & DMs in seconds. Use Follow-Gate to grow followers automatically. Increase engagement, save time, and scale customer conversations with Namma.ai. Try free today.',
  openGraph: {
    title: 'Namma.ai: Automate Instagram DMs & Comments',
    description:
      'Auto-reply to Instagram comments & DMs in seconds. Use Follow-Gate to grow followers automatically.',
    images: [{ url: '/Nammaai_logo.png' }],
  },
}

export default function Page() {
  return <LandingClient />
}
