import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { GA4_ENABLED } from '@/lib/analytics/gtag';
import { ADS_ENABLED } from '@/lib/analytics/adsense';

const UPDATED = '5 November 2026';

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
          PC Power Calculator runs entirely in your browser. Your builds are stored only in your
          browser's local storage — there are no accounts and no server-side storage. We ask before
          enabling analytics, and ads (when enabled) are served only after you opt in, in a
          non-personalized form. Do-Not-Track / Global-Privacy-Control signals are respected.
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
        {GA4_ENABLED ? (
          <p className={BODY}>
            We use Google Analytics 4, gated by Consent Mode v2: it stays fully denied until you
            press “Allow analytics” in the banner, your IP is anonymized, and you can withdraw
            consent any time via the “Manage analytics” link. If you declined, no analytics data
            is collected.
          </p>
        ) : (
          <p className={BODY}>Analytics is currently disabled for this deployment.</p>
        )}
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">Advertising</h2>
        {ADS_ENABLED ? (
          <>
            <p className={BODY}>
              This site shows ads via Google AdSense, but only after you opt in via the consent
              banner. Ads are requested in a <strong>non-personalized</strong> form by default.
            </p>
            <p className={BODY}>
              Third-party vendors, including Google, use cookies to serve ads based on a user's
              prior visits to this or other websites. Google's use of advertising cookies enables
              it and its partners to serve ads based on your visits. You can opt out of
              personalized advertising at{' '}
              <a className={LINK} href="https://adssettings.google.com" rel="noopener noreferrer" target="_blank">Google Ads Settings</a>{' '}
              or via{' '}
              <a className={LINK} href="https://www.aboutads.info" rel="noopener noreferrer" target="_blank">aboutads.info</a>.
            </p>
          </>
        ) : (
          <p className={BODY}>
            Advertising is currently disabled for this deployment. If it is enabled later, this
            section will describe exactly what is loaded, and ads will still only run after your
            explicit opt-in — see the archived policy text above on any ad-enabled deployment.
          </p>
        )}
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">What we never do</h2>
        <ul className={LIST}>
          <li>No accounts, no sign-ups, no server-side profiles.</li>
          <li>No selling or renting of data — there is no data of yours to sell.</li>
          <li>No fingerprinting, no cross-site tracking of our own.</li>
          <li>No ignoring of DNT / Global Privacy Control signals.</li>
        </ul>
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">Your choices &amp; rights</h2>
        <ul className={LIST}>
          <li>Withdraw consent: the “Privacy” link (bottom corner) reopens the banner; declining erases the flag and stops all optional scripts.</li>
          <li>Erase everything: clear site data in your browser, or the “Delete” action per build in the app.</li>
          <li>Under India's DPDP Act and GDPR (EU/UK), you may ask what data relates to you — since all user data stays in your own browser, you are already in control of it.</li>
        </ul>
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">Contact</h2>
        <p className={BODY}>
          Questions about this policy:{' '}
          <a className={LINK} href="https://github.com/amitwh/pc-power-calculator">github.com/amitwh/pc-power-calculator</a>.
        </p>
      </section>

      <p className="mt-4 text-xs text-gray-500">
        Related: <Link className="underline underline-offset-2" to="/about">About & methodology</Link>
      </p>
    </div>
  );
}
