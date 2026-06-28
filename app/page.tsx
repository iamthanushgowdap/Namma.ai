import type { Metadata } from 'next'
import LandingClient from '@/components/landing-client'

export const metadata: Metadata = {
  title: 'AutoEngage: Automate Instagram DMs & Comments | AI-Powered Responses',
  description:
    'Auto-reply to Instagram comments & DMs in seconds. Use Follow-Gate to grow followers automatically. Increase engagement, save time, and scale customer conversations with AutoEngage. Try free today.',
  openGraph: {
    title: 'AutoEngage: Automate Instagram DMs & Comments',
    description:
      'Auto-reply to Instagram comments & DMs in seconds. Use Follow-Gate to grow followers automatically.',
    images: [{ url: '/AutoEngageai_logo.png' }],
  },
}

export default function Page() {
  return <LandingClient />
}
