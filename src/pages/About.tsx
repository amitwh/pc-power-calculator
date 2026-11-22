import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Briefcase,
  ChartSpline,
  Database,
  FileType2,
  FolderGit2,
  Gauge,
  HardDrive,
  Mail,
  MessageCircle,
  Phone,
  Play,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Brand-coloured *text* on a card surface.
 *
 * Why: the brand's bright orange (#ff6b47) scores 3.3:1 on the app's gray-900
 * dark card — enough for a glyph, which only needs 3:1, but a label needs
 * 4.5:1. Orange-300 is the same warm family lifted until it clears AA on
 * gray-900 — the same lift the guides hub uses for its brand text.
 */
const BRAND_TEXT = 'text-brand-text dark:text-orange-300';

/** The rule between two sections. */
const RULE = 'mt-10 border-t border-gray-200 pt-6 dark:border-gray-800';

/** A section heading — the same rhythm the guides hub and the help page use. */
const HEADING = 'font-display text-lg font-bold';

/** Body copy. */
const BODY = 'text-sm leading-relaxed text-gray-600 dark:text-gray-300';

/** An inline link inside a paragraph. */
const LINK = 'font-semibold text-brand-text underline underline-offset-2 dark:text-orange-300';

/** A tinted panel: the built-by tile, the formula, the data sources. */
const TILE = 'rounded-12 bg-gray-50 p-4 dark:bg-gray-800/50';

/** A small label above a panel's content. */
const EYEBROW = 'text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400';

/** One of the three promises the hero states up front. */
interface Value {
  icon: LucideIcon;
  title: string;
  body: string;
}

const VALUES: Value[] = [
  {
    icon: HardDrive,
    title: 'Local-first',
    body: 'Builds stay in your browser — nothing is uploaded.',
  },
  {
    icon: Gauge,
    title: '80 PLUS',
    body: 'PSU efficiency curves modelled at real load.',
  },
  {
    icon: Database,
    title: 'Public data',
    body: 'Manufacturer specs and utility tariffs, listed below.',
  },
];

/** One of the free tools, and the links out of its card. */
interface ToolLink {
  label: string;
  href: string;
}

interface Tool {
  name: string;
  icon: LucideIcon;
  /**
   * The icon tile's colour.
   *
   * Why these three: they are the app's own badge colours (slate, violet and
   * cyan), which already carry their own AA-checked light and dark text
   * colours — so a new tile cannot introduce a failing contrast pair.
   */
  tile: string;
  /** The tool's name links here: its source repository. */
  repo: string;
  /** What the tool is. */
  what: string;
  /** Why it costs the reader nothing. */
  whyFree: string;
  /** The card's own links. */
  links: ToolLink[];
}

const TOOLS: Tool[] = [
  {
    name: 'GitHub Desktop for Linux',
    // Why not the lucide `Github` glyph: lucide dropped its brand icons, so
    // the nearest honest mark is a git folder.
    icon: FolderGit2,
    tile: 'bg-slate-100 text-slate-800 dark:bg-slate-500/25 dark:text-slate-300',
    repo: 'https://github.com/amitwh/GitHubDesktopLinux',
    what: "GitHub Desktop is GitHub's own open-source Git GUI. It ships for Windows and macOS; this fork is the maintained Linux build. The current release, 3.6.7-fork1, publishes a .deb, an AppImage, a .snap and a Flatpak, with the Linux icon and the x-github-desktop-auth deep link wired up — and the same release carries the Windows .exe and .msi installers.",
    whyFree:
      'GitHub Desktop is MIT-licensed and the fork keeps that licence, so the source stays open and the binaries cost nothing to download. There is no account, no telemetry and no paywall — a Git client is infrastructure, and infrastructure should be free.',
    links: [
      { label: 'Source', href: 'https://github.com/amitwh/GitHubDesktopLinux' },
      { label: 'Releases', href: 'https://github.com/amitwh/GitHubDesktopLinux-releases' },
    ],
  },
  {
    name: 'CurveStudio',
    icon: ChartSpline,
    tile: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300',
    repo: 'https://github.com/amitwh/ConcreteInfo_CurveStudio',
    what: 'An open-source alternative to CurveExpert. Give it experimental data and it fits every applicable model, ranks the fits from best to worst, and reports the statistics you need to judge one — R², adjusted R², RMSE, AICc, BIC, cross-validation error, parameter standard errors, confidence and prediction bands, residual diagnostics. 190+ models, including concrete and civil-engineering ones, plus your own equations parsed into a restricted expression tree. A native desktop app for Windows and Linux and a browser app share one engine, and its validation against the twelve NIST reference problems is published with the source.',
    whyFree:
      "CurveExpert's commercial licence is one a student or a small laboratory cannot justify, and closed software cannot be checked. AGPL means the source is public, the desktop app and the web app are free, and a lab can audit exactly how a fit was produced. A fit that does not converge is reported as failed, never quietly replaced by a plausible-looking result.",
    links: [
      { label: 'Source', href: 'https://github.com/amitwh/ConcreteInfo_CurveStudio' },
      { label: 'Open the app', href: 'https://curvestudio.concreteinfo.co.in' },
    ],
  },
  {
    name: 'Markdown Converter',
    icon: FileType2,
    tile: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300',
    repo: 'https://github.com/amitwh/markdown-converter',
    what: 'A cross-platform Markdown editor and document converter powered by Pandoc, built with Electron 45 and Node 24, with no proprietary dependencies. Live preview while you write, then export to PDF, Word, HTML, EPUB and LaTeX. It also carries a visual flowchart editor — a maxGraph canvas with a connector tool, exporting SVG, PNG and VSDX — a PDF toolkit (merge, split, rotate, delete, reorder, watermark, encrypt), find-and-replace with a live match counter, and an ASCII art studio. The current release, 4.14.1, ships a .deb, an AppImage, a macOS .dmg and a Windows .exe.',
    whyFree:
      'Pandoc, the engine underneath, is free and open source, and so is everything wrapped around it. No account, no usage limits, no telemetry, no proprietary dependencies. A document tool that sits on your machine all day should not cost anything to own.',
    links: [
      { label: 'Source', href: 'https://github.com/amitwh/markdown-converter' },
      { label: 'Releases', href: 'https://github.com/amitwh/markdown-converter/releases' },
    ],
  },
];

/**
 * One section: a rule, a heading, then the content.
 *
 * Why the rule stays: it is what tells the reader that the page has moved on
 * from the previous section, and it is the same divider the guides hub and
 * the help page use.
 */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={RULE}>
      <h2 className={HEADING}>{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * An outbound link that opens in a new tab.
 *
 * Why `noopener noreferrer`: the new tab must not be able to reach back into
 * this page through `window.opener`, and the referrer is not something an
 * outbound link to a third party needs.
 */
function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      {/* The hero. The page now carries card grids rather than a single column
          of prose, so it opens on the guides hub's wide, blob-washed panel
          instead of the old narrow rule-and-paragraph stack. */}
      <section className="relative overflow-hidden rounded-16 border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900 md:p-10">
        {/* A soft brand wash bleeding in from the corner. Decorative, so it
            stays out of the accessibility tree. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
        />
        <div className="relative">
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${BRAND_TEXT}`}>
            Who we are &amp; how it works
          </p>
          {/* Visible page title. Layout already renders the route's single h1
              (visually hidden), so this stays a styled paragraph to keep
              exactly one h1 in the accessibility tree — the same convention
              the home page, the guides hub and the help page use. */}
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 md:text-4xl">
            About &amp; methodology
          </p>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300 md:mt-3">
            Who makes it, why it is free, how the estimate is built, where to check our figures — and
            the free tools ConcreteInfo builds alongside it.
          </p>

          {/* The three promises, as cards. The <dt> and <dd> stay direct
              children of their grouping <div> — the pattern HTML allows
              inside a <dl>, and the one axe's definition-list rule accepts.
              Why the tighter mobile margin: the cards stack into a single
              column on a phone, and the old 24px gap pushed the first card
              off the first screen. */}
          <dl className="mt-4 grid gap-3 sm:grid-cols-3 md:mt-6">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="rounded-12 border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50"
                >
                  <dt className="flex items-center gap-2 font-display text-sm font-bold">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 ${BRAND_TEXT}`}
                    >
                      <Icon aria-hidden className="h-4 w-4" />
                    </span>
                    {value.title}
                  </dt>
                  <dd className="mt-2 text-sm text-gray-600 dark:text-gray-300">{value.body}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      <Section title="Why this exists">
        <div className="max-w-3xl space-y-3">
          <p className={BODY}>
            I built PC Power Calculator because the cost of running a computer is invisible when you
            buy it. Comparing two graphics cards takes seconds; working out what either will add to
            your electricity bill usually means a spreadsheet, a guess at your tariff and a hunt
            through the manual for wattages.
          </p>
          <p className={BODY}>
            This calculator puts the answer in one place: real component specifications, the way
            you actually use the machine, and the tariff where you live. Open it, add your parts, and
            get a number you can question, check and share — without an account.
          </p>
        </div>

        <div className={`${TILE} mt-4 max-w-3xl`}>
          <p className={EYEBROW}>Built by</p>
          <p className="mt-1 font-display text-sm font-bold">Amit Haridas · ConcreteInfo</p>
          <p className={`mt-1 ${BODY}`}>
            PC Power Calculator is an independent project by Amit Haridas, built at{' '}
            <ExternalLink href="https://www.concreteinfo.in" className={LINK}>
              ConcreteInfo
            </ExternalLink>
            , which makes practical software for construction and engineering teams. The same idea
            applies here: clear numbers, sources you can check, and no sales pitch.
          </p>
        </div>
      </Section>

      <Section title="Why it is free">
        <div className="max-w-3xl space-y-3">
          <p className={BODY}>
            The answer should not depend on whether you can afford a subscription. This site is
            built as static pages with its component and tariff data bundled at build time, so
            serving it costs very little and there is no per-user cost to recover.
          </p>
          <p className={BODY}>
            There are no accounts, no paywall, and builds never leave your browser. If advertising
            is ever switched on, it will be clearly labelled, consent-gated, and never placed
            between you and the result.
          </p>
          <p className={BODY}>
            Being free is what lets a first-time builder, a student, a small office or someone
            running a home server use the same numbers as a professional — and that is the point.
          </p>
        </div>
      </Section>

      <Section title="How we calculate">
        <div className={`${TILE} max-w-3xl`}>
          <p className={EYEBROW}>The formula</p>
          <div className="mt-2 space-y-2">
            <p className={BODY}>Per-component power at a workload is computed as:</p>
            <pre className="overflow-x-auto font-numeric text-xs sm:text-sm">
              P(w) = P_idle + (P_tdp − P_idle) × util(w)
            </pre>
            <p className={BODY}>
              PSU efficiency is interpolated from the 80+ curve for the rating tier and load
              percentage. Wall draw = component sum ÷ efficiency.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Data sources">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className={TILE}>
            <dt className="font-display text-sm font-bold">Component specs</dt>
            <dd className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Manufacturer pages, TechPowerUp database
            </dd>
          </div>
          <div className={TILE}>
            <dt className="font-display text-sm font-bold">Electricity tariffs</dt>
            <dd className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Public utility regulators (CEA, EIA, Ofgem, Eurostat)
            </dd>
          </div>
          <div className={TILE}>
            <dt className="font-display text-sm font-bold">FX rates</dt>
            <dd className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Bundled snapshot (refreshed as part of the data-freshness workflow)
            </dd>
          </div>
          <div className={TILE}>
            <dt className="font-display text-sm font-bold">Benchmarks</dt>
            <dd className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              TechPowerUp, Gamers Nexus, Blender Open Data, PassMark, WhatToMine
            </dd>
          </div>
        </dl>
      </Section>

      {/* The company and the tools it publishes. The same rule that makes the
          calculator free — a working tool, published with its sources, that
          costs the reader nothing — applies to these. */}
      <Section title="More from ConcreteInfo">
        <p className={`max-w-3xl ${BODY}`}>
          ConcreteInfo builds software and training for construction and engineering teams. These
          are the tools that are free to take and use.
        </p>

        {/* The three tools. One column on a phone, two on a tablet, three on a
            desktop. */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.name}
                className="flex flex-col rounded-12 border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tool.tile}`}
                >
                  <Icon aria-hidden className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-display text-base font-bold">
                  <ExternalLink href={tool.repo} className="hover:underline">
                    {tool.name}
                    <ArrowUpRight aria-hidden className="ml-1 inline h-3.5 w-3.5" />
                  </ExternalLink>
                </h3>
                <p className={`mt-2 ${BODY}`}>{tool.what}</p>
                {/* Why it is free, set apart: this is the point the card is
                    making, so it gets its own tinted panel and its own label. */}
                <div className="mt-4 rounded-12 bg-brand/5 p-4 dark:bg-brand/10">
                  <p className={`text-[11px] font-semibold uppercase tracking-wide ${BRAND_TEXT}`}>
                    Why it&rsquo;s free for everyone
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {tool.whyFree}
                  </p>
                </div>
                {/* mt-auto keeps the links on one line across all three cards,
                    whatever the length of the paragraphs above them. */}
                <div className="mt-auto flex flex-wrap gap-x-5 gap-y-1 pt-4">
                  {tool.links.map((link) => (
                    <ExternalLink
                      key={link.href}
                      href={link.href}
                      className={`inline-flex min-h-11 items-center gap-1 text-sm font-semibold ${BRAND_TEXT} hover:underline`}
                    >
                      {link.label}
                      <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                    </ExternalLink>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* The directory holds the full catalogue — licences, download links
            and the long descriptions — so the About page stays the short
            version and points at it. */}
        <p className={`mt-5 max-w-3xl ${BODY}`}>
          The full directory, with every licence and download link, is on the{' '}
          <Link to="/open-source" className={LINK}>
            open-source page
          </Link>
          .
        </p>

        {/* The company card. */}
        <div className="mt-5 rounded-16 border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg font-bold">ConcreteInfo</p>
              <p className={`mt-1 text-sm ${BODY}`}>
                From Information To Insight · Your Partner In Performance Excellence
              </p>
            </div>
            <ExternalLink
              href="https://www.concreteinfo.in"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-8 bg-brand-dark px-4 text-sm font-semibold text-white hover:bg-brand"
            >
              concreteinfo.in
              <ArrowUpRight aria-hidden className="h-4 w-4" />
            </ExternalLink>
          </div>

          <p className={`mt-4 max-w-3xl ${BODY}`}>
            ConcreteInfo is a construction-quality consulting and training firm, founded in 2018 in
            Pune. It builds quality-management systems, runs audits, supports mix design and RMC
            plants, trains site and laboratory staff, formulates specialty materials and writes the
            software that carries the paperwork — CMDApp and CAMS2 — along with the digital QA/QC
            workflows around them. PC Power Calculator is the same idea applied somewhere else: a
            working tool, published with its sources, free for anyone who wants it.
          </p>

          {/* The social row. Each button carries a visible label, so the link
              reads without the glyph. */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <ExternalLink
              href="https://www.linkedin.com/company/concreteinfo"
              className="inline-flex min-h-11 items-center gap-2 rounded-12 border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700 hover:border-brand/40 hover:bg-brand/5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Briefcase aria-hidden className="h-4 w-4" />
              LinkedIn
            </ExternalLink>
            <ExternalLink
              href="https://www.youtube.com/@concreteinfo6736"
              className="inline-flex min-h-11 items-center gap-2 rounded-12 border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700 hover:border-brand/40 hover:bg-brand/5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Play aria-hidden className="h-4 w-4" />
              YouTube
            </ExternalLink>
            <ExternalLink
              href="https://wa.me/919930954848?text=Hello%20ConcreteInfo%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services"
              className="inline-flex min-h-11 items-center gap-2 rounded-12 border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700 hover:border-brand/40 hover:bg-brand/5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <MessageCircle aria-hidden className="h-4 w-4" />
              WhatsApp
            </ExternalLink>
          </div>

          {/* The direct contacts. */}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <a href="mailto:amit@concreteinfo.in" className={LINK}>
              <Mail aria-hidden className="mr-1.5 inline h-3.5 w-3.5" />
              amit@concreteinfo.in
            </a>
            <a href="mailto:services@concreteinfo.in" className={LINK}>
              <Mail aria-hidden className="mr-1.5 inline h-3.5 w-3.5" />
              services@concreteinfo.in
            </a>
            <a href="tel:+919930954848" className={LINK}>
              <Phone aria-hidden className="mr-1.5 inline h-3.5 w-3.5" />
              +91 9930954848
            </a>
          </div>
        </div>

        <p className={`mt-5 max-w-3xl ${BODY}`}>
          The rule is the same on both sides of this page: the numbers should be free, and the
          tools should be free. Take whichever of them you need.
        </p>
      </Section>

      <Section title="Disclaimer">
        <div className={`${TILE} max-w-3xl`}>
          <p className={EYEBROW}>Estimates only</p>
          <p className={`mt-2 ${BODY}`}>
            All figures on this site — power draw, energy use, running cost, PSU sizing — are{' '}
            <strong>estimates for information only</strong> and are not professional, electrical or
            financial advice. Spec values are compiled from public sources and may be incomplete,
            rounded or out of date; always verify against the manufacturer's datasheet before
            purchase. For electrical work, UPS/inverter sizing or wiring decisions, consult a
            qualified electrician. Tariff and FX data change frequently — your actual electricity
            bill is always the ground truth. The service is provided “as is”, without warranty of any
            kind.
          </p>
        </div>
      </Section>

      <Section title="Trademarks">
        <p className={`max-w-3xl ${BODY}`}>
          All product names, logos, brands and trademarks (Intel, AMD, NVIDIA, Corsair, and every
          other manufacturer mentioned) are the property of their respective owners. They are used
          on this site solely to identify hardware components. PC Power Calculator is an
          independent project and is <strong>not affiliated with, sponsored, or endorsed by</strong>{' '}
          any hardware manufacturer or utility.
        </p>
      </Section>

      <Section title="Privacy">
        <p className={`max-w-3xl ${BODY}`}>
          Builds live only in your browser's local storage — nothing is uploaded. Details on
          analytics, ads and your choices:{' '}
          <Link to="/privacy" className={LINK}>
            Privacy policy
          </Link>
          .
        </p>
      </Section>

      <Section title="Contribute">
        <p className={`max-w-3xl ${BODY}`}>
          Corrections and additions are welcome through{' '}
          <Link className={LINK} to="/suggest">
            the suggestions form
          </Link>{' '}
          — especially new countries, states and components.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link
            to="/suggest"
            className="bg-brand-dark text-white hover:bg-brand rounded-8 min-h-11 px-4 inline-flex items-center text-sm font-semibold"
          >
            Suggest a component
          </Link>
          <Link
            to="/feedback"
            className={`text-sm font-semibold hover:underline ${BRAND_TEXT}`}
          >
            Send feedback
          </Link>
          <Link to="/" className={`text-sm font-semibold hover:underline ${BRAND_TEXT}`}>
            Back to the calculator
          </Link>
        </div>
      </Section>
    </div>
  );
}
