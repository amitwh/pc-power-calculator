import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';

const UPDATED = '21 November 2026';

/** Separator between prose sections: a rule, not a card. */
const SECTION = 'border-t border-gray-200 dark:border-gray-800 pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0';
const BODY = 'mt-2 text-sm leading-relaxed';
const LIST = 'mt-2 text-sm leading-relaxed list-disc pl-5 space-y-1';
const LINK = 'text-brand-text underline underline-offset-2';

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <PageHeader title="Privacy Policy" lede={`Last updated: ${UPDATED}`} />

      <section className={SECTION}>
        <h2 className="text-base font-semibold">Short version</h2>
        <p className={BODY}>
          PC Power Calculator runs in your browser: your builds live only in local storage, and
          there are no accounts or server-side build storage. Analytics (Google Analytics 4,
          delivered through Google Tag Manager) loads only after you allow it. Advertising is not
          enabled today; if Google AdSense is enabled in future it will be consent-gated and
          non-personalized by default. The suggestion and feedback forms are the one exception to
          “nothing leaves your browser” — the details you submit are emailed to ConcreteInfo.
          Do-Not-Track / Global-Privacy-Control signals are respected.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">What we store (and where)</h2>
        <ul className={LIST}>
          <li><strong>Your builds</strong> (components, quantities, schedules, location/tariff overrides) — browser local storage on your device only. Never uploaded.</li>
          <li><strong>Your consent choice</strong> — a single local-storage flag (<code>pc-power-consent</code>).</li>
          <li>Clearing your browser's site data erases everything instantly.</li>
        </ul>
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">Forms and email</h2>
        <p className={BODY}>
          When you submit the suggestion or feedback form, the details you enter — the type,
          subject, category, rated watts, source URL, message and any optional email address — are
          sent by email to ConcreteInfo so we can review them. They are not stored by the app, in a
          database or in analytics. The message is delivered through Hostinger's mail service and
          kept in our mailbox for as long as needed to act on it. If you give an email address, we
          use it only to reply and never publish it. Please do not include sensitive personal
          information.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">Location &amp; tariff detection</h2>
        <p className={BODY}>
          To pre-fill your electricity tariff, the app asks a public IP-geo service
          (ipapi.co / ipwho.is / ip-api.com) for your <strong>country and region only</strong> —
          never GPS or precise location. You can override both the location and the tariff rate
          manually, in which case no lookup is needed.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">Analytics</h2>
        <p className={BODY}>
          We use Google Analytics 4 (GA4) to understand which pages and calculators are used and
          where the site is slow. It is delivered through Google Tag Manager and governed by
          Consent Mode v2: no analytics cookies or identifiers are set until you press “Allow
          analytics” in the banner. IP anonymization is enabled. You can change your choice at any
          time with the “Manage analytics” link; if you decline, analytics does not run.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">Advertising</h2>
        <p className={BODY}>
          Advertising is not enabled today. We may enable Google AdSense in the future to cover
          hosting costs. If we do, ads will load only after you opt in through the consent banner,
          will be requested in a <strong>non-personalized</strong> form by default, and this section
          will be updated before any ad code is switched on.
        </p>
        <p className={BODY}>
          On an ad-enabled deployment, third-party vendors including Google may use cookies to
          serve ads based on prior visits to this and other sites. You would be able to opt out via{' '}
          <a className={LINK} href="https://adssettings.google.com" rel="noopener noreferrer" target="_blank">Google Ads Settings</a>{' '}
          or{' '}
          <a className={LINK} href="https://www.aboutads.info" rel="noopener noreferrer" target="_blank">aboutads.info</a>.
          Ads would never be placed between you and the answer.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">What we never do</h2>
        <ul className={LIST}>
          <li>No accounts, no sign-ups, no server-side build profiles.</li>
          <li>No selling or renting of data.</li>
          <li>No fingerprinting, no cross-site tracking of our own.</li>
          <li>No ignoring of DNT / Global Privacy Control signals.</li>
        </ul>
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">Your choices &amp; rights</h2>
        <ul className={LIST}>
          <li>Withdraw consent: the “Privacy” link (bottom corner) reopens the banner; declining erases the flag and stops all optional scripts.</li>
          <li>Erase everything: clear site data in your browser, or the “Delete” action per build in the app.</li>
          <li>Form submissions: email us through the <Link className={LINK} to="/feedback">feedback form</Link> to ask that a suggestion or feedback email be deleted.</li>
          <li>Under India's DPDP Act and GDPR (EU/UK), you may ask what data relates to you. Builds stay in your browser; the only personal data we may hold is a form email you chose to send.</li>
        </ul>
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">Contact</h2>
        <p className={BODY}>
          Questions, corrections, data requests or general feedback:{' '}
          <Link className={LINK} to="/suggest">use the suggestions form</Link> or{' '}
          <Link className={LINK} to="/feedback">send feedback</Link>. PC Power Calculator is
          operated by Amit Haridas at{' '}
          <a className={LINK} href="https://www.concreteinfo.in" target="_blank" rel="noopener noreferrer">
            ConcreteInfo
          </a>
          .
        </p>
      </section>

      <p className="mt-4 text-xs text-gray-500">
        Related: <Link className="underline underline-offset-2" to="/about">About & methodology</Link>
      </p>
    </div>
  );
}
