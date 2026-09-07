import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Terms and Conditions — ${APP_NAME}`,
};

const LAST_UPDATED = "September 7, 2026";

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">
          Terms and Conditions
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-text-secondary">
          <section>
            <p>
              Please read these Terms and Conditions (&ldquo;Terms&rdquo;)
              carefully before using {APP_NAME}. By creating an account or
              using {APP_NAME} in any way, you agree to be bound by these
              Terms. If you do not agree, do not use the service.
            </p>
          </section>

          <Section title="1. The service">
            <p>
              {APP_NAME} is an open-source expense-splitting application
              provided &ldquo;as is&rdquo; to help you and your groups track
              shared expenses and settle balances. It is offered free of
              charge.
            </p>
          </Section>

          <Section title="2. Accounts">
            <p>
              You sign in using Google authentication. You are responsible
              for maintaining the security of the Google account used to
              access {APP_NAME} and for all activity that occurs under your
              account. You must provide accurate information and notify us
              if you become aware of unauthorized use of your account.
            </p>
          </Section>

          <Section title="3. Acceptable use">
            <p>You agree not to use {APP_NAME} to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Violate any applicable law or regulation</li>
              <li>
                Upload or share content that is unlawful, defamatory, or
                infringes on the rights of others
              </li>
              <li>
                Attempt to gain unauthorized access to other users&apos;
                accounts, groups, or data
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                service
              </li>
              <li>
                Use the service to store or transmit malicious code
              </li>
            </ul>
          </Section>

          <Section title="4. Your content and data">
            <p>
              You retain ownership of the groups, expenses, and other content
              you create in {APP_NAME}. You are solely responsible for the
              accuracy of the financial information you enter — {APP_NAME} is
              a tracking and calculation tool, not a payment processor, and
              does not move money between users. Actual settlement of debts
              happens outside the app between the people involved.
            </p>
            <p>
              If you create a public share link for a group, you are
              responsible for who you share that link with, and for revoking
              it when appropriate.
            </p>
          </Section>

          <Section title="5. Virtual members">
            <p>
              {APP_NAME} allows you to add &ldquo;virtual&rdquo; members who
              do not have an account. By adding a virtual member, you
              represent that you have the right to include that
              person&apos;s name and, if provided, email address for the
              purpose of tracking shared expenses within your group.
            </p>
          </Section>

          <Section title="6. Availability and no warranty">
            <p>
              {APP_NAME} is provided on an &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; basis, without warranties of any kind, express
              or implied, including but not limited to accuracy,
              reliability, or fitness for a particular purpose. We do not
              guarantee that the service will be uninterrupted, error-free,
              or that calculations will be free of defects.
            </p>
          </Section>

          <Section title="7. Limitation of liability">
            <p>
              To the fullest extent permitted by law, {APP_NAME}, its
              maintainers, and contributors shall not be liable for any
              indirect, incidental, special, or consequential damages,
              including loss of data or financial loss, arising from your use
              of, or inability to use, the service — including any dispute
              between you and another user over shared expenses or
              settlements.
            </p>
          </Section>

          <Section title="8. Termination">
            <p>
              You may stop using {APP_NAME} and delete your account at any
              time. We reserve the right to suspend or terminate access to
              the service for any account that violates these Terms.
            </p>
          </Section>

          <Section title="9. Open source">
            <p>
              {APP_NAME} is open-source software. Its source code is made
              available under the license included in the{" "}
              <a
                href="https://github.com/Pakeetharan/splitfree"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                GitHub repository
              </a>
              , separate from these Terms which govern your use of the hosted
              service.
            </p>
          </Section>

          <Section title="10. Changes to these terms">
            <p>
              We may update these Terms from time to time. Continued use of
              {" " + APP_NAME} after changes take effect constitutes
              acceptance of the revised Terms. Material changes will be
              reflected by updating the &ldquo;Last updated&rdquo; date
              above.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For questions about these Terms, please open an issue on the{" "}
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

          <section>
            <p>
              See also our{" "}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
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
