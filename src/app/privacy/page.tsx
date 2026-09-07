import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
};

const LAST_UPDATED = "September 7, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border-primary bg-surface-primary/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.svg"
              alt={APP_NAME}
              className="h-8 w-auto dark:hidden"
            />
            <img
              src="/logo-dark.svg"
              alt={APP_NAME}
              className="hidden h-8 w-auto dark:block"
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-text-muted">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="prose-legal mt-8 space-y-8 text-sm leading-relaxed text-text-secondary">
          <section>
            <p>
              {APP_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is an
              open-source expense-splitting application. This policy explains
              what information we collect when you use {APP_NAME}, how we use
              it, and the choices you have.
            </p>
          </section>

          <Section title="1. Information we collect">
            <SubHeading>Account information</SubHeading>
            <p>
              When you sign in with Google, we receive and store your name,
              email address, and profile picture URL to create and identify
              your account.
            </p>
            <SubHeading>Content you provide</SubHeading>
            <p>
              We store the data you create while using the app: groups,
              members (including &ldquo;virtual&rdquo; members you add
              without an account), expenses, settlements, notes, and related
              metadata such as timestamps and currency.
            </p>
            <SubHeading>Automatically collected information</SubHeading>
            <p>
              We use cookies and local/offline storage in your browser to
              keep you signed in, sync data between devices, and let the app
              function offline. We do not use third-party advertising
              trackers.
            </p>
          </Section>

          <Section title="2. How we use your information">
            <ul className="list-disc space-y-1 pl-5">
              <li>To provide, operate, and maintain {APP_NAME}</li>
              <li>
                To authenticate you and keep your groups and expenses in sync
                across devices
              </li>
              <li>
                To auto-link a virtual member you added to a real account,
                when the email addresses match
              </li>
              <li>
                To generate shareable, read-only links for a group&apos;s
                balances when you choose to create one
              </li>
              <li>To maintain the security and reliability of the service</li>
            </ul>
          </Section>

          <Section title="3. How your information is shared">
            <p>
              We do not sell your personal information. Data within a group
              (expenses, balances, member names) is visible to the other
              members of that group by design. If you generate a public share
              link for a group, anyone with that link can view the
              group&apos;s balances until the link is revoked.
            </p>
            <p>
              We use the following third-party service providers to operate
              {" " + APP_NAME}:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Google</strong> — for authentication (Sign in with
                Google / Google One Tap)
              </li>
              <li>
                <strong>Supabase</strong> — for authentication session
                management
              </li>
              <li>
                <strong>MongoDB</strong> — for storing application data
                (groups, expenses, members, settlements)
              </li>
            </ul>
            <p>
              These providers process data on our behalf and are bound to use
              it only to provide services to us.
            </p>
          </Section>

          <Section title="4. Data retention">
            <p>
              We retain your account and group data for as long as your
              account is active. If you delete a group, expense, or your
              account, the associated data is removed or scheduled for
              deletion from our active systems, subject to reasonable backup
              retention periods.
            </p>
          </Section>

          <Section title="5. Your choices and rights">
            <ul className="list-disc space-y-1 pl-5">
              <li>You can revoke a share link at any time from the app</li>
              <li>You can remove members, expenses, and groups you own</li>
              <li>
                You can request access to, correction of, or deletion of your
                personal data by contacting us
              </li>
              <li>
                You can revoke {APP_NAME}&apos;s access to your Google
                account at any time from your Google account settings
              </li>
            </ul>
          </Section>

          <Section title="6. Security">
            <p>
              We use industry-standard measures, including encrypted
              connections (HTTPS) and provider-managed authentication, to
              protect your information. No method of transmission or storage
              is 100% secure, and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="7. Children's privacy">
            <p>
              {APP_NAME} is not directed to children under 13, and we do not
              knowingly collect personal information from children under 13.
            </p>
          </Section>

          <Section title="8. Changes to this policy">
            <p>
              We may update this policy from time to time. Material changes
              will be reflected by updating the &ldquo;Last updated&rdquo;
              date above.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              {APP_NAME} is open source. For privacy questions, requests, or
              concerns, please open an issue on the{" "}
              <a
                href="https://github.com/Pakeetharan/splitfree"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                GitHub repository
              </a>
              .
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-text-primary">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-3 font-medium text-text-primary">{children}</h3>
  );
}
