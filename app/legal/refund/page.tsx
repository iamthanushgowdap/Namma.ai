import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | Namma.ai',
  description:
    'Read our Refund and Cancellation Policy. Learn about billing cycles, cancellation terms, and Razorpay-processed refund eligibility.',
}

const sections = [
  { id: 'subscriptions', label: '1. Subscription Billing' },
  { id: 'cancellation', label: '2. Cancellation Policy' },
  { id: 'refund-eligibility', label: '3. Refund Eligibility' },
  { id: 'processing', label: '4. Refund Processing & Timelines' },
  { id: 'contact', label: '5. Contact Support' },
]

function SectionCard({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-zinc-200 dark:border-white/[0.07] p-8 bg-zinc-50/50 dark:bg-zinc-900/40 transition-colors duration-150"
    >
      <h2
        className="text-xl font-semibold mb-4 bg-clip-text text-transparent"
        style={{ backgroundImage: 'linear-gradient(135deg, #B41DE6 0%, #0052cc 100%)' }}
      >
        {title}
      </h2>
      <div className="text-zinc-650 dark:text-zinc-400 leading-relaxed space-y-3 text-sm">{children}</div>
    </section>
  )
}

export default function RefundPage() {
  return (
    <article className="max-w-4xl mx-auto px-6 py-16">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-12">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">
          Legal
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">Refund &amp; Cancellation Policy</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-base max-w-2xl leading-relaxed">
          Thank you for using Namma.ai. We strive to provide the best Instagram automation experience. Please read
          our cancellation and refund policy below.
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-650">
          <span>Last updated: June 24, 2025</span>
          <span>&middot;</span>
          <span>Effective: June 24, 2025</span>
        </div>
      </div>

      {/* ── Table of contents ───────────────────────────────────────────────── */}
      <nav
        className="rounded-2xl border border-zinc-200 dark:border-white/[0.07] p-6 mb-10 bg-zinc-50/50 dark:bg-zinc-955/25"
        aria-label="Table of contents"
      >
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-550 dark:text-zinc-500 mb-4">
          Contents
        </p>
        <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors flex items-center gap-2"
              >
                <span
                  className="text-xs font-mono"
                  style={{ color: '#B41DE6' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                {s.label.split('. ')[1]}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* ── Sections ─────────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        <SectionCard id="subscriptions" title="01. Subscription Billing">
          <p>
            Namma.ai offers a Free plan which requires no credit card or payment information.
          </p>
          <p>
            For paid tiers (Starter, Pro, and Agency), we offer monthly and annual subscriptions. All payments
            are processed securely via our payment gateway, <strong className="text-foreground font-semibold">Razorpay</strong>.
            Subscriptions are billed at the beginning of each billing cycle and will automatically renew under
            the same conditions unless cancelled.
          </p>
        </SectionCard>

        <SectionCard id="cancellation" title="02. Cancellation Policy">
          <p>
            You may cancel your subscription at any time. To cancel:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Navigate to the <strong className="text-foreground font-semibold">Billing</strong> section in your dashboard and click <strong className="text-foreground font-semibold">Cancel Subscription</strong>.</li>
            <li>Alternatively, send an email to <a href="mailto:contact@namma.ai" className="underline hover:text-foreground">contact@namma.ai</a> from your registered email address requesting cancellation.</li>
          </ul>
          <p>
            Upon cancellation, your subscription will remain active, and you will continue to have full access to
            all paid features, until the end of your current billing period. No further charges will be made.
          </p>
        </SectionCard>

        <SectionCard id="refund-eligibility" title="03. Refund Eligibility">
          <p>
            As a general rule, all fees paid to Namma.ai are non-refundable. We do not provide prorated refunds
            for partial months or unused limits. However, we offer exceptions under the following conditions:
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-border/40 p-4 bg-muted/20">
              <p className="font-semibold text-foreground mb-1">Technical Issues &amp; Bugs</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                If a technical issue or platform bug completely prevents you from accessing or using the Service,
                and our support team cannot resolve it within 3 business days of being notified, you are eligible for
                a full refund of your current billing period. This request must be made within{' '}
                <strong className="text-foreground font-semibold">7 days</strong> of the subscription payment.
              </p>
            </div>
            <div className="rounded-xl border border-border/40 p-4 bg-muted/20">
              <p className="font-semibold text-foreground mb-1">Accidental Duplicate Charges</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                In the event of a billing error or duplicate charge caused by the payment system, we will issue a
                100% refund for the duplicate transaction upon verification.
              </p>
            </div>
            <div className="rounded-xl border border-border/40 p-4 bg-muted/20">
              <p className="font-semibold text-foreground mb-1">Wallet & Referral Balance Purchases</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Refunds for subscriptions purchased using your referral wallet balance will only be credited back to your promo balance in your Namma.ai wallet. Under no circumstances will wallet-funded purchases be refunded to a credit card, bank account, or as withdrawable cash. Furthermore, if a cash payment is refunded, any associated referral commission earned by your referrer for that transaction will be debited (clawed back) from their wallet balance.
              </p>
            </div>
          </div>
          <p className="mt-4 text-muted-foreground text-xs">
            We do not issue refunds for suspensions or account blocks caused by violations of our Terms of Service or Meta&apos;s Platform Policies.
          </p>
        </SectionCard>

        <SectionCard id="processing" title="04. Refund Processing &amp; Timelines">
          <p>
            Approved refunds will be processed back to the original payment method used on Razorpay.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Refund requests are processed by our billing team within 3 business days of approval.</li>
            <li>
              Once initiated, Razorpay usually takes <strong className="text-foreground font-semibold">5 to 7 business days</strong>
              to credit the refund amount back to your bank account, credit card, or UPI wallet.
            </li>
            <li>
              You will receive an automated email confirmation from Razorpay and Namma.ai once the refund is initiated.
            </li>
          </ul>
        </SectionCard>

        <SectionCard id="contact" title="05. Contact Support">
          <p>
            For cancellation assistance, billing queries, or refund requests, please email us:
          </p>
          <div className="mt-4 rounded-xl border border-border/40 p-5 bg-muted/20">
            <p className="text-foreground font-semibold mb-1">Namma.ai Support</p>
            <p className="text-muted-foreground">
              Email:{' '}
              <a href="mailto:contact@namma.ai" className="underline hover:text-foreground">
                contact@namma.ai
              </a>
            </p>
            <p className="text-muted-foreground">Operator: Thanush Gowda P</p>
          </div>
        </SectionCard>
      </div>

      {/* ── Footer nav ────────────────────────────────────────────────────────── */}
      <div className="mt-12 pt-8 border-t border-border/40 flex flex-wrap gap-4 text-sm text-zinc-500">
        <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
          ← Privacy Policy
        </Link>
        <Link href="/legal/terms" className="hover:text-foreground transition-colors">
          Terms of Service →
        </Link>
      </div>
    </article>
  )
}
