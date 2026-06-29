import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Deletion Instructions | AutoEngage',
  description: 'Instructions on how to request the deletion of your personal data and unlink your Instagram account from AutoEngage.',
}

export default function DataDeletionPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white mb-6">
        Data Deletion Instructions
      </h1>
      
      <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">
        At AutoEngage, we value your privacy and are committed to protecting your personal data. AutoEngage uses Meta Graph APIs (Facebook Login) to authenticate and connect your Instagram Business accounts for messaging and comment automation. If you wish to delete your account data, revoke our access, or delete your linked profiles, you can easily do so by following the instructions below.
      </p>

      <div className="space-y-8">
        
        {/* Section 1 */}
        <section className="glass-panel border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Method 1: Revoke Access via Facebook / Instagram (Recommended)
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4">
            You can remove the AutoEngage integration directly from your Meta settings. This instantly revokes all permissions and prevents our platform from receiving future events.
          </p>
          <ol className="list-decimal list-inside text-xs sm:text-sm text-zinc-650 dark:text-zinc-400 space-y-2">
            <li>Log into your Facebook account associated with the Instagram Business page.</li>
            <li>Go to <strong>Settings & Privacy</strong> &gt; <strong>Settings</strong>.</li>
            <li>In the left-hand menu, click on <strong>Apps and Websites</strong>.</li>
            <li>Find <strong>AutoEngage</strong> in the list of active applications.</li>
            <li>Click the <strong>Remove</strong> button next to the AutoEngage entry.</li>
            <li>Confirm the removal. Once confirmed, Meta will notify our servers to deactivate your connection.</li>
          </ol>
        </section>

        {/* Section 2 */}
        <section className="glass-panel border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Method 2: Request Complete Data Deletion via Dashboard
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4">
            If you wish to completely wipe your account, user profile, billing history, and connected Instagram logs from our databases:
          </p>
          <ol className="list-decimal list-inside text-xs sm:text-sm text-zinc-650 dark:text-zinc-400 space-y-2">
            <li>Log into your AutoEngage dashboard at <a href="https://autoengage.in/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">autoengage.in/login</a>.</li>
            <li>Navigate to the <strong>Settings</strong> page.</li>
            <li>Scroll down to the <strong>Danger Zone</strong>.</li>
            <li>Click <strong>Delete Account</strong> and confirm your password.</li>
            <li>All your personal data, tokens, automation rules, conversation histories, and database rows will be deleted immediately and permanently. This action cannot be undone.</li>
          </ol>
        </section>

        {/* Section 3 */}
        <section className="glass-panel border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Method 3: Submit a Deletion Request via Email
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-3">
            If you are unable to access your account or prefer to have our support team delete your data manually, you can send an email request.
          </p>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-3">
            Please write to us at <a href="mailto:support.autoengage@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">support.autoengage@gmail.com</a> with the subject line <strong>&quot;Data Deletion Request&quot;</strong>.
          </p>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
            Our compliance officer will verify your ownership of the email account and process the deletion of all database records within 24–48 hours, sending you a final confirmation email.
          </p>
        </section>

      </div>
    </article>
  )
}
