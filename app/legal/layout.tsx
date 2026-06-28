import Link from 'next/link'

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b border-zinc-200 dark:border-white/[0.06] bg-white/85 dark:bg-zinc-950/85"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo + Brand */}
          <Link href="/" className="flex items-center overflow-hidden" style={{ height: '64px' }}>
            <img
              src="/AutoEngage_logo.png"
              alt="AutoEngage"
              style={{ height: '130px', width: 'auto', marginTop: '-33px', marginBottom: '-33px', marginLeft: '-10px' }}
            />
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-6 text-sm text-zinc-550 dark:text-zinc-400">
            <Link href="/legal/privacy" className="hidden sm:inline hover:text-zinc-900 dark:hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hidden sm:inline hover:text-zinc-900 dark:hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/legal/refund" className="hidden sm:inline hover:text-zinc-900 dark:hover:text-white transition-colors">
              Refunds
            </Link>
            <Link
              href="/"
              className="ml-2 px-4 py-1.5 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-80"
              style={{
                background: 'linear-gradient(135deg, #B41DE6 0%, #0052cc 100%)',
              }}
            >
              Back to app
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <main className="flex-1 legal-page">{children}</main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-200 dark:border-white/[0.06] mt-24 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            {/* Brand */}
            <div>
              <Link href="/" className="flex items-center mb-3" style={{ overflow: 'hidden', height: '52px' }}>
                <img
                  src="/AutoEngage_logo.png"
                  alt="AutoEngage"
                  style={{ height: '130px', width: 'auto', marginTop: '-39px', marginBottom: '-39px', marginLeft: '-10px' }}
                />
              </Link>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Instagram DM &amp; comment automation platform. Operated by Thanush Gowda P, India.
              </p>
            </div>

            {/* Legal links */}
            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-400 uppercase tracking-widest mb-3">
                Legal
              </p>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/legal/privacy"
                    className="text-sm text-zinc-550 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/terms"
                    className="text-sm text-zinc-550 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/refund"
                    className="text-sm text-zinc-550 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Refund &amp; Cancellation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/deletion"
                    className="text-sm text-zinc-550 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Data Deletion
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-400 uppercase tracking-widest mb-3">
                Contact
              </p>
              <a
                href="mailto:contact@autoengage.in"
                className="text-sm text-zinc-550 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                contact@autoengage.in
              </a>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-zinc-200 dark:border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">
              &copy; {new Date().getFullYear()} AutoEngage. All rights reserved.
            </p>
            <p className="text-xs text-zinc-650">
              Governed by Indian law &middot; Karnataka jurisdiction
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
