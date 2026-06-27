import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Namma.ai',
  description:
    'Learn how Namma.ai collects, uses, and protects your personal data in accordance with the Information Technology Act 2000 and the Digital Personal Data Protection Act 2023.',
}

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'data-collected', label: 'Data We Collect' },
  { id: 'how-we-use', label: 'How We Use Your Data' },
  { id: 'data-storage', label: 'Data Storage & Security' },
  { id: 'third-parties', label: 'Third-Party Services' },
  { id: 'your-rights', label: 'Your Rights' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'children', label: "Children's Privacy" },
  { id: 'changes', label: 'Changes to This Policy' },
  { id: 'contact', label: 'Contact Us' },
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

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-2.5 border-b border-zinc-200 dark:border-white/[0.05] last:border-0">
      <span className="text-zinc-800 dark:text-zinc-300 font-medium w-48 shrink-0">{label}</span>
      <span className="text-zinc-600 dark:text-zinc-400">{value}</span>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <article className="max-w-4xl mx-auto px-6 py-16">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-12">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">
          Legal
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">Privacy Policy</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-base max-w-2xl leading-relaxed">
          This policy explains what personal data Namma.ai collects, why we collect it, and how we
          protect it. We are committed to transparency and to complying with Indian data protection
          law.
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
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* ── Sections ─────────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        <SectionCard id="overview" title="01. Overview">
          <p>
            Namma.ai (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is an Instagram automation
            platform operated by <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">Thanush Gowda P</strong>, an individual
            proprietor based in India. Our registered contact address for data-related matters is{' '}
            <a href="mailto:contact@namma.ai" className="underline hover:text-zinc-900 dark:hover:text-white">
              contact@namma.ai
            </a>
            .
          </p>
          <p>
            By creating an account or using any feature of Namma.ai, you agree to the collection
            and use of your information as described in this Privacy Policy. This policy is
            governed by the{' '}
            <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">
              Information Technology Act, 2000 (IT Act)
            </strong>{' '}
            and the{' '}
            <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">
              Digital Personal Data Protection Act, 2023 (DPDP Act)
            </strong>
            .
          </p>
        </SectionCard>

        <SectionCard id="data-collected" title="02. Data We Collect">
          <p>We collect only the data necessary to provide our automation services:</p>
          <div className="mt-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] overflow-hidden">
            <div className="px-4 py-3 text-xs font-semibold text-zinc-650 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-100/50 dark:bg-zinc-900/50">
              Data Categories
            </div>
            <div className="px-4 py-1">
              <DataRow
                label="Account information"
                value="Your name, email address, and account password (hashed)."
              />
              <DataRow
                label="Instagram account data"
                value="Instagram username, page ID, and OAuth access tokens obtained through the official Meta Graph API when you connect your account."
              />
              <DataRow
                label="Message & comment content"
                value="DMs and comments that pass through automations you create. This data is processed in transit to apply your configured rules; we do not store raw message bodies beyond what is needed to display logs in your dashboard."
              />
              <DataRow
                label="Automation configuration"
                value="Keywords, triggers, response templates, and workflow rules that you define."
              />
              <DataRow
                label="Payment information"
                value="Subscription plan and billing status. Card details and bank information are handled exclusively by Razorpay and are never transmitted to or stored on our servers."
              />
              <DataRow
                label="Referral & Wallet data"
                value="Your unique referral code, records of referred users, ledger transactions (commissions earned, withdrawals, peer transfers, and subscription purchases), and wallet balance statements."
              />
              <DataRow
                label="Anti-abuse payment hashes"
                value="Irreversible cryptographic hashes of your payment source fingerprint (provided by Razorpay) to identify and prevent self-referral and duplicate-referral abuse on shared payment instruments."
              />
              <DataRow
                label="Usage data"
                value="Pages visited, feature interactions, timestamps, and browser/device type — used solely for improving the product."
              />
              <DataRow
                label="Log data"
                value="IP address, request timestamps, and error logs retained for up to 90 days for security and debugging purposes."
              />
            </div>
          </div>

          <div className="mt-8 border-t border-zinc-200 dark:border-white/[0.06] pt-6">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-3 uppercase tracking-wider">
              Meta Platform Permission Scopes & Justification
            </h3>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed mb-4">
              To operate Instagram automations via official Meta Graph APIs, Namma.ai requests the following granular permissions during the Facebook OAuth connection flow. Here is why they are required and how they are used:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs border border-zinc-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-white/[0.06]">
                    <th className="p-3 font-semibold">Permission Scope</th>
                    <th className="p-3 font-semibold">Data Accessed</th>
                    <th className="p-3 font-semibold">Justification / How We Use It</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.06] text-zinc-650 dark:text-zinc-400">
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                    <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">instagram_basic</td>
                    <td className="p-3">Instagram username, profile info, media list, and permalinks.</td>
                    <td className="p-3">To identify connected professional profiles and let you select specific posts to attach keyword triggers.</td>
                  </tr>
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                    <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">instagram_manage_messages</td>
                    <td className="p-3">Direct message text, postback payloads, and sender scoped IDs.</td>
                    <td className="p-3">To receive webhook events for new DMs, parse triggers/payloads (including Follow-Gate checks), and deliver automatic responses in the DM window.</td>
                  </tr>
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                    <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">instagram_manage_comments</td>
                    <td className="p-3">Public comment content, commenter scoped IDs, and comment permalinks.</td>
                    <td className="p-3">To receive real-time webhook updates when a user comments on your media, detect matching keywords, and reply to comments.</td>
                  </tr>
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                    <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">pages_show_list</td>
                    <td className="p-3">List of Facebook Pages managed by the logged-in user.</td>
                    <td className="p-3">To let you choose which Facebook Page is linked to your target Instagram Professional Account during the onboarding wizard.</td>
                  </tr>
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                    <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">pages_read_engagement</td>
                    <td className="p-3">Page parameters, access tokens, and connection statuses.</td>
                    <td className="p-3">To verify the linked page configuration and metadata before establishing real-time data sync.</td>
                  </tr>
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                    <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">pages_manage_metadata</td>
                    <td className="p-3">None (subscription action only).</td>
                    <td className="p-3">To register Namma.ai webhook listeners on your Facebook page so comments and DMs can be routed to your workspace instantly.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>

        <SectionCard id="how-we-use" title="03. How We Use Your Data">
          <ul className="space-y-2.5 list-none">
            {[
              'Provide, operate, and maintain the Namma.ai platform and all automation features.',
              'Authenticate your account and connect to your Instagram profile via the Meta Graph API.',
              'Execute the DM reply, comment-reply, keyword-trigger, and broadcast automations you configure.',
              'Process subscription payments and send billing receipts through Razorpay.',
              'Send transactional emails — account activation, password reset, subscription confirmation, and service notices.',
              'Detect abuse, investigate security incidents, and enforce our Terms of Service.',
              'Improve our product through aggregated, anonymised usage analytics.',
              'Comply with applicable Indian law and lawful government requests.',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  className="mt-0.5 h-4 w-4 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #B41DE6, #0052cc)', color: '#fff' }}
                >
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl border border-purple-500/20 p-4" style={{ background: 'rgba(180,29,230,0.04)' }}>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Follow-Gate Feature
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
              When the Follow-Gate feature is enabled on an automation, our system makes a real-time API call to the Instagram Graph API to check whether a commenter is following the connected account. This relationship check is performed in real-time and the result (following / not following) is{' '}
              <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">not stored</strong> in our databases. No follower relationship data is persisted.
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-purple-500/20 p-4" style={{ background: 'rgba(180,29,230,0.04)' }}>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Refer & Earn Wallet Feature
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
              When you participate in our Refer & Earn program, we track ledger transactions (commissions, withdrawals, peer transfers, and purchases) linked to your profile ID to calculate and maintain your active wallet balance. To prevent system abuse (such as self-referrals or creating multiple accounts using the same credit card/UPI ID), we hash and securely check your payment metadata fingerprint.
            </p>
          </div>
          <p className="mt-4 text-zinc-500 text-xs">
            We do not sell, rent, or trade your personal data to any third party for marketing
            purposes.
          </p>
        </SectionCard>

        <SectionCard id="data-storage" title="04. Data Storage & Security">
          <p>
            Your data is stored in{' '}
            <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">Supabase</strong> (PostgreSQL), with infrastructure
            hosted in the European Union (eu-west region) and, in some configurations, the United
            States. Supabase is SOC 2 Type II certified.
          </p>
          <p>
            Instagram OAuth access tokens are stored encrypted at rest using AES-256 encryption.
            All data in transit between your browser, our servers, and third-party APIs is
            protected by TLS 1.2 or higher.
          </p>
          <p>
            Our web application is hosted on <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">Vercel</strong>,
            which employs industry-standard infrastructure security controls. Vercel does not
            process or store your personal data beyond request routing.
          </p>
          <p>
            We retain your account data for as long as your account is active. If you delete your
            account, we purge your personal data within <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">30 days</strong>{' '}
            except where retention is required by law (e.g., payment records under the IT Act may
            be kept for up to 5 years).
          </p>
        </SectionCard>

        <SectionCard id="third-parties" title="05. Third-Party Services">
          <p>
            We work with the following sub-processors and third-party services. Each is bound by
            its own data protection commitments:
          </p>
          <div className="mt-4 space-y-3">
            {[
              {
                name: 'Meta / Instagram',
                role: 'Instagram API access — DMs, comments, and account data. Governed by Meta\'s Data Policy.',
                link: 'https://www.facebook.com/privacy/policy',
              },
              {
                name: 'Razorpay',
                role: 'Payment processing for Indian subscriptions. Razorpay is PCI DSS compliant and an RBI-authorised payment aggregator.',
                link: 'https://razorpay.com/privacy',
              },
              {
                name: 'Supabase',
                role: 'Database and authentication infrastructure. SOC 2 Type II certified.',
                link: 'https://supabase.com/privacy',
              },
              {
                name: 'Vercel',
                role: 'Web application hosting and edge functions. GDPR compliant.',
                link: 'https://vercel.com/legal/privacy-policy',
              },
            ].map((tp) => (
              <div
                key={tp.name}
                className="rounded-xl border border-zinc-200 dark:border-white/[0.06] p-4 bg-zinc-50/50 dark:bg-white/[0.02]"
              >
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">{tp.name}</p>
                <p className="text-zinc-650 dark:text-zinc-400 text-xs leading-relaxed">{tp.role}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-zinc-500 text-xs">
            We do not share your data with any other third parties except when required by a court
            order or statutory authority under Indian law.
          </p>
        </SectionCard>

        <SectionCard id="your-rights" title="06. Your Rights">
          <p>
            Under the <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">DPDP Act 2023</strong> and the{' '}
            <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">IT Act 2000</strong>, you have the following rights
            as a data principal:
          </p>
          <div className="mt-4 space-y-3">
            {[
              {
                right: 'Right to access',
                desc: 'Request a copy of all personal data we hold about you.',
              },
              {
                right: 'Right to correction',
                desc: 'Request correction of inaccurate or incomplete data.',
              },
              {
                right: 'Right to erasure',
                desc: 'Request deletion of your personal data, subject to legal retention obligations.',
              },
              {
                right: 'Right to withdraw consent',
                desc: 'Withdraw your consent to data processing at any time; this will not affect processing done before withdrawal.',
              },
              {
                right: 'Right to grievance redressal',
                desc: 'Lodge a grievance with us and receive a response within 30 days as required by the DPDP Act.',
              },
            ].map((r) => (
              <div key={r.right} className="flex gap-4">
                <div
                  className="shrink-0 w-1.5 h-1.5 mt-2 rounded-full"
                  style={{ background: '#B41DE6' }}
                />
                <div>
                  <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{r.right}: </span>
                  <span>{r.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4">
            To exercise any of these rights, email us at{' '}
            <a href="mailto:contact@namma.ai" className="text-zinc-800 dark:text-zinc-200 underline hover:text-zinc-900 dark:hover:text-white">
              contact@namma.ai
            </a>{' '}
            with the subject line <em>&quot;Data Rights Request&quot;</em>. We will verify your
            identity before processing the request.
          </p>
        </SectionCard>

        <SectionCard id="cookies" title="07. Cookies">
          <p>
            Namma.ai uses the following types of cookies and similar browser storage:
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">Session cookies:</strong> Required to keep you
              logged in during your session. These are deleted when you close your browser.
            </li>
            <li>
              <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">Persistent authentication cookies:</strong> Used to
              remember your login across sessions if you select &quot;Stay signed in&quot;. Expires
              after 30 days.
            </li>
            <li>
              <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">Analytics cookies:</strong> Aggregated, anonymised
              usage data. No cross-site tracking. You may opt out via your browser settings.
            </li>
          </ul>
          <p className="mt-3">
            We do not use third-party advertising cookies or sell cookie data.
          </p>
        </SectionCard>

        <SectionCard id="children" title="08. Children's Privacy">
          <p>
            Namma.ai is not directed at individuals under the age of 18. We do not knowingly
            collect personal data from minors. If you believe a minor has provided us with personal
            data, please contact{' '}
            <a href="mailto:contact@namma.ai" className="underline hover:text-white">
              contact@namma.ai
            </a>{' '}
            and we will delete that data promptly.
          </p>
        </SectionCard>

        <SectionCard id="changes" title="09. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our services,
            legal requirements, or business practices. When we make material changes, we will notify
            you by email (to the address on your account) at least 14 days before the change takes
            effect, and update the &quot;Last updated&quot; date at the top of this page.
          </p>
          <p>
            Your continued use of Namma.ai after any change constitutes acceptance of the updated
            policy.
          </p>
        </SectionCard>

        <SectionCard id="contact" title="10. Contact Us">
          <p>
            For privacy questions, data rights requests, or grievances, please reach out:
          </p>
          <div
            className="mt-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] p-5 bg-zinc-50/50 dark:bg-white/[0.02]"
          >
            <p className="text-zinc-800 dark:text-zinc-250 font-semibold mb-2">Namma.ai Data Controller</p>
            <p>
              <span className="text-zinc-500">Name:</span>{' '}
              <span className="text-zinc-800 dark:text-zinc-300 font-medium">Thanush Gowda P</span>
            </p>
            <p>
              <span className="text-zinc-500">Email:</span>{' '}
              <a href="mailto:contact@namma.ai" className="text-zinc-800 dark:text-zinc-300 underline hover:text-zinc-950 dark:hover:text-white font-medium">
                contact@namma.ai
              </a>
            </p>
            <p>
              <span className="text-zinc-500">Country:</span>{' '}
              <span className="text-zinc-800 dark:text-zinc-300 font-medium">India</span>
            </p>
            <p className="mt-3 text-xs text-zinc-600">
              We aim to respond to all data-related enquiries within 7 business days.
            </p>
          </div>
        </SectionCard>
      </div>

      {/* ── Footer nav ────────────────────────────────────────────────────────── */}
      <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-wrap gap-4 text-sm text-zinc-500">
        <Link href="/legal/terms" className="hover:text-white transition-colors">
          Terms of Service →
        </Link>
        <Link href="/legal/refund" className="hover:text-white transition-colors">
          Refund Policy →
        </Link>
      </div>
    </article>
  )
}
