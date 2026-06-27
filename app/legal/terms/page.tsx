import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Namma.ai',
  description:
    'Read the Terms of Service for Namma.ai, governing your use of our Instagram automation platform. Managed under Karnataka jurisdiction, India.',
}

const sections = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'service-desc', label: '2. Description of Service' },
  { id: 'user-responsibilities', label: '3. User Responsibilities & Instagram Compliance' },
  { id: 'billing-subscriptions', label: '4. Subscriptions, Payments & Cancellation' },
  { id: 'referral-wallet', label: '5. Refer & Earn Program & Wallet Balances' },
  { id: 'prohibited-uses', label: '6. Prohibited Activities' },
  { id: 'intellectual-property', label: '7. Intellectual Property' },
  { id: 'termination', label: '8. Account Termination' },
  { id: 'disclaimer', label: '9. Disclaimer of Warranties' },
  { id: 'limitation-liability', label: '10. Limitation of Liability' },
  { id: 'governing-law', label: '11. Governing Law & Jurisdiction' },
  { id: 'contact', label: '12. Contact Information' },
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

export default function TermsPage() {
  return (
    <article className="max-w-4xl mx-auto px-6 py-16">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-12">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">
          Legal
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">Terms of Service</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-base max-w-2xl leading-relaxed">
          Please read these terms carefully before using Namma.ai. By accessing or using the platform,
          you agree to be bound by these terms.
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-650">
          <span>Last updated: June 24, 2025</span>
          <span>&middot;</span>
          <span>Effective: June 24, 2025</span>
        </div>
      </div>

      {/* ── Table of contents ───────────────────────────────────────────────── */}
      <nav
        className="rounded-2xl border border-zinc-200 dark:border-white/[0.07] p-6 mb-10 bg-zinc-50/50 dark:bg-zinc-950/25"
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
        <SectionCard id="acceptance" title="01. Acceptance of Terms">
          <p>
            Welcome to Namma.ai (&quot;the Service&quot;), an Instagram DM and comment automation platform
            operated by <strong className="text-foreground font-semibold">Thanush Gowda P</strong>, residing in Karnataka, India.
          </p>
          <p>
            By registering for an account, connecting an Instagram account, or using Namma.ai in any manner,
            you agree to these Terms of Service, all applicable laws, and our Privacy Policy. If you are
            entering into these terms on behalf of a company or legal entity, you represent that you have the
            authority to bind such entity.
          </p>
        </SectionCard>

        <SectionCard id="service-desc" title="02. Description of Service">
          <p>
            Namma.ai is a cloud-based software service (SaaS) that provides tools for automating replies,
            broadcasts, and workflows on connected Instagram accounts. Features include:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Auto-replies to comments left on your Instagram posts.</li>
            <li>Direct message (DM) responses initiated by custom keywords or triggers.</li>
            <li>A unified message inbox and analytics dashboard.</li>
            <li>
              <strong>Follow-Gate Automation</strong> — conditionally deliver content to followers only via an interactive DM verification card.
            </li>
          </ul>
          <p>
            We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time,
            including the availability of features, databases, or content, with or without notice.
          </p>
        </SectionCard>

        <SectionCard id="user-responsibilities" title="03. User Responsibilities & Instagram Compliance">
          <p>
            To use Namma.ai, you must connect a valid, authorized Instagram Professional (Business or Creator)
            account. You agree that:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You own or are an authorized administrator of the connected Instagram account.</li>
            <li>
              You will comply with the <strong className="text-foreground font-semibold">Meta Terms of Service</strong>,{' '}
              <strong className="text-foreground font-semibold">Instagram Community Guidelines</strong>, and Meta Platform
              Policies.
            </li>
            <li>
              Namma.ai is built using the official Meta Graph API. We are not responsible for any changes,
              restrictions, or blocks imposed on your account by Meta for violation of their platform rules.
            </li>
            <li>You are solely responsible for maintaining the confidentiality of your account credentials.</li>
          </ul>
          <p className="mt-3 p-4 rounded-xl border border-purple-500/20 text-xs leading-relaxed" style={{ background: 'rgba(180,29,230,0.04)' }}>
            <strong className="text-foreground font-semibold">Follow-Gate Automation:</strong>{' '}
            The Follow-Gate feature checks Instagram follower relationships in real-time via the Meta Graph API to conditionally deliver content to followers only. Users acknowledge that this feature is intended to incentivize organic following and must not be used to deceive, spam, or violate Meta&apos;s Platform Policies. Namma.ai is not responsible for API availability or accuracy of follower relationship data returned by the Instagram Graph API.
          </p>
        </SectionCard>

        <SectionCard id="billing-subscriptions" title="04. Subscriptions, Payments & Cancellation">
          <p>
            We offer both free and paid subscription tiers. Fees are payable in advance on a recurring monthly
            or annual basis:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Billing & Invoices:</strong> Payments are processed securely via{' '}
              <strong className="text-foreground font-semibold">Razorpay</strong>.
            </li>
            <li>
              <strong>Automatic Renewal:</strong> Paid plans auto-renew at the end of each billing period
              unless cancelled before the renewal date.
            </li>
            <li>
              <strong>Cancellation:</strong> You can cancel your subscription at any time through the Billing
              dashboard or by contacting us at{' '}
              <a href="mailto:contact@namma.ai" className="underline hover:text-foreground">
                contact@namma.ai
              </a>
              . Upon cancellation, you will continue to have access to paid features until the end of your
              billing cycle.
            </li>
            <li>
              <strong>Refunds:</strong> Refund requests are governed by our{' '}
              <Link href="/legal/refund" className="underline hover:text-foreground">
                Refund Policy
              </Link>
              .
            </li>
          </ul>
        </SectionCard>

        <SectionCard id="referral-wallet" title="05. Refer & Earn Program & Wallet Balances">
          <p>
            Namma.ai offers a Referral Program allowing users to earn wallet credits by referring new users:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Commissions:</strong> Referrers earn a 10% commission of the paid amount when a referred user makes a paid subscription purchase. Commissions are credited to the referrer's withdrawable cash balance.
            </li>
            <li>
              <strong>Discounts:</strong> Referred users receive a 15% discount on their first paid subscription purchase when signing up with a valid referral code.
            </li>
            <li>
              <strong>Wallet Balance Usage:</strong> Wallet balances can be used to purchase Namma.ai subscriptions. Payments made using wallet balances receive an additional 10% discount on the plan price.
            </li>
            <li>
              <strong>Withdrawals & Transfers:</strong> Withdrawals to a bank account are permitted once the withdrawable balance reaches a minimum of ₹500, subject to verification of at least 2 converted referrals, compliance checks, and applicable TDS deductions (3% or 6% based on total limits). Users may also transfer promo credits to peer wallets.
            </li>
            <li>
              <strong>Anti-Abuse & Fraud Policy:</strong> Self-referrals, creating duplicate accounts, or using identical payment instruments (hashing checks) to exploit referral credits is strictly prohibited. Namma.ai reserves the right to freeze wallets, forfeit balances, and terminate accounts found engaging in fraudulent referral behavior.
            </li>
          </ul>
        </SectionCard>

        <SectionCard id="prohibited-uses" title="06. Prohibited Activities">
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Send spam, bulk messages, unsolicited promotional content, or engage in phishing.</li>
            <li>Distribute content that is illegal, defamatory, offensive, harassing, or violates any third-party intellectual property rights.</li>
            <li>Impersonate any person or entity or misrepresent your affiliation.</li>
            <li>Attempt to bypass, reverse engineer, or hack any security, rate-limits, or billing mechanisms of Namma.ai.</li>
            <li>Violate the Digital Personal Data Protection Act (DPDP), 2023 or any other consumer privacy regulations by collecting sensitive information via automated replies without consent.</li>
          </ul>
        </SectionCard>

        <SectionCard id="intellectual-property" title="07. Intellectual Property">
          <p>
            All intellectual property rights in the Service (including layout, design, logos, graphics, software
            code, and databases) belong to Thanush Gowda P or our licensors.
          </p>
          <p>
            You retain all rights to the comments, templates, and message logs processed on your connected
            accounts. You grant us a limited license to process and display this content solely to provide the
            Service to you.
          </p>
        </SectionCard>

        <SectionCard id="termination" title="08. Account Termination">
          <p>
            We reserve the right to suspend or terminate your access to Namma.ai, without prior notice or
            liability, if you violate these terms or fail to pay subscription fees when due.
          </p>
          <p>
            Upon termination, your right to use the Service will cease immediately, and all associated access
            tokens will be revoked and deleted from our databases.
          </p>
        </SectionCard>

        <SectionCard id="disclaimer" title="09. Disclaimer of Warranties">
          <p className="uppercase font-mono text-xs">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
            EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE,
            SECURE, OR THAT MESSAGES WILL BE DELIVERED WITHOUT DELAYS INDUCED BY THIRD-PARTY PLATFORMS LIKE INSTAGRAM.
          </p>
        </SectionCard>

        <SectionCard id="limitation-liability" title="10. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable Indian law, Thanush Gowda P and Namma.ai shall not be liable for
            any indirect, incidental, special, consequential, or punitive damages, or any loss of profits,
            revenues, data, use, goodwill, or other intangible losses resulting from:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your use or inability to use the Service.</li>
            <li>Any actions, suspensions, or blocks placed on your Instagram accounts by Meta.</li>
            <li>Any unauthorized access to, or use of, your account or database credentials.</li>
          </ul>
          <p>
            Our total liability for any claim arising out of these terms shall not exceed the amount paid by you
            to us for the Service during the 3 months prior to the claim.
          </p>
        </SectionCard>

        <SectionCard id="governing-law" title="11. Governing Law & Jurisdiction">
          <p>
            These Terms of Service and any disputes arising out of them shall be governed by and construed in
            accordance with the laws of <strong className="text-foreground font-semibold">India</strong>.
          </p>
          <p>
            You agree that any legal action or proceeding arising out of or related to these terms shall be
            subject to the exclusive jurisdiction of the courts located in <strong className="text-foreground font-semibold">Bengaluru, Karnataka, India</strong>.
          </p>
        </SectionCard>

        <SectionCard id="contact" title="12. Contact Information">
          <p>If you have any questions or feedback about these Terms of Service, please contact us:</p>
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
        <Link href="/legal/refund" className="hover:text-foreground transition-colors">
          Refund Policy →
        </Link>
      </div>
    </article>
  )
}
