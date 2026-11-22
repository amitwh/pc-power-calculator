import type { LucideIcon } from 'lucide-react';
import { Building2, ChartSpline, FileType2, FolderGit2, Zap } from 'lucide-react';

/**
 * One link on a project card.
 *
 * Why two shapes: an outbound link opens in a new tab, an in-site link opens
 * in the same one. The card renders whichever one is set, so a link can never
 * open a new tab by accident — or fail to, because the rule was forgotten.
 * The union makes the pair exhaustive: a link must have one or the other.
 */
export type ProjectLink =
  | { label: string; href: string }
  | { label: string; to: string };

/** A direct contact: an email address or a phone number. */
export interface ProjectContact {
  label: string;
  /** A `mailto:` or `tel:` address. */
  href: string;
}

export interface OpenSourceProject {
  /** A stable key — the React list key and the dropdown's filter handle. */
  id: string;
  name: string;
  /**
   * The project's primary address: its repository, or the company's site.
   *
   * Why it is separate from `links`: the nav dropdown links the whole row to
   * this one URL, and it must be the same URL every time — the first entry of
   * `links` happening to be the right one would be a coincidence, not a rule.
   */
  href: string;
  icon: LucideIcon;
  /**
   * Tailwind classes for the icon tile.
   *
   * Why these hues: they are the same tile colours the About page's tool cards
   * use (slate, violet, cyan), which already carry their own AA-checked light
   * and dark text colours — so a new tile cannot introduce a failing contrast
   * pair.
   */
  tile: string;
  /** The licence and the implementation language, on one muted line. */
  meta?: string;
  /** One line, for the nav dropdown. */
  short: string;
  /** What the project is. */
  what: string;
  /** Why it costs the reader nothing. */
  whyFree: string;
  /** The project's own links. */
  links: ProjectLink[];
  /** Direct contacts — the company card only. */
  contacts?: ProjectContact[];
  /**
   * Whether the card spans the full width of the grid.
   *
   * Why: the company card carries a row of social links and a row of direct
   * contacts, and both need the room a half-width column cannot give them.
   */
  wide?: boolean;
}

/**
 * The open-source registry.
 *
 * Why: the directory page and the nav dropdown describe the same projects,
 * so the names, the licences, the links and the one-line summaries live here
 * once. The order below is the display order on both.
 */
export const OPEN_SOURCE_PROJECTS: OpenSourceProject[] = [
  {
    id: 'pc-power-calculator',
    name: 'PC Power Calculator',
    href: 'https://github.com/amitwh/pc-power-calculator',
    icon: Zap,
    tile: 'bg-brand/10 text-brand-text dark:bg-brand/15 dark:text-orange-300',
    meta: 'MIT · TypeScript',
    short: 'A PC power and electricity cost calculator that runs entirely in your browser.',
    what: 'A PC power and electricity cost calculator. Pick a CPU, a graphics card and the rest of the build, say how you use the machine and which tariff you pay, and it gives you the watts at the wall, the kilowatt-hours a year and what that costs. The build stays in your browser, the component and tariff data is bundled at build time, and the whole thing is static pages served from a CDN.',
    whyFree:
      'A calculator that tells you what your machine costs to run should not be behind an account, and the data it uses is public anyway. There is nothing to unlock, nothing to pay for, and nothing that leaves your browser.',
    links: [
      { label: 'Source', href: 'https://github.com/amitwh/pc-power-calculator' },
      { label: 'Open the calculator', to: '/' },
    ],
  },
  {
    id: 'github-desktop-linux',
    name: 'GitHub Desktop for Linux',
    href: 'https://github.com/amitwh/GitHubDesktopLinux',
    icon: FolderGit2,
    // Why not the lucide `Github` glyph: lucide dropped its brand icons, so
    // the nearest honest mark is a git folder.
    tile: 'bg-slate-100 text-slate-800 dark:bg-slate-500/25 dark:text-slate-300',
    meta: 'MIT · TypeScript',
    short: "The maintained Linux build of GitHub's own open-source Git GUI.",
    what: "GitHub Desktop is GitHub's own open-source Git GUI. It ships for Windows and macOS; this fork is the maintained Linux build. The current release, 3.6.7-fork1, publishes a .deb, an AppImage, a .snap and a Flatpak, with the Linux icon and the x-github-desktop-auth deep-link protocol wired up.",
    whyFree:
      'GitHub Desktop is MIT-licensed and the fork keeps that licence: the source stays open, the binaries cost nothing, and there is no account, no telemetry and no paywall. A Git client is infrastructure, and infrastructure should be free.',
    links: [
      { label: 'Source', href: 'https://github.com/amitwh/GitHubDesktopLinux' },
      { label: 'Releases', href: 'https://github.com/amitwh/GitHubDesktopLinux-releases' },
    ],
  },
  {
    id: 'curvestudio',
    name: 'CurveStudio',
    href: 'https://github.com/amitwh/ConcreteInfo_CurveStudio',
    icon: ChartSpline,
    tile: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300',
    meta: 'AGPL-3.0 · Python/TypeScript',
    short: 'Curve fitting with 190+ models — an open-source alternative to CurveExpert.',
    what: 'An open-source alternative to CurveExpert. Give it experimental data and it fits every applicable model, ranks the fits from best to worst, and reports the statistics you need to judge one — R², adjusted R², RMSE, AICc, BIC, cross-validation error, parameter standard errors, confidence and prediction bands, and residual diagnostics. 190+ models, including concrete and civil-engineering ones, plus your own equations parsed into a restricted expression tree — never eval. A native offline desktop app for Windows and Linux and a browser app share one engine, and the numerical validation against the twelve NIST reference problems is published with the source.',
    whyFree:
      "CurveExpert's commercial licence is one a student or a small laboratory cannot justify, and closed software cannot be checked. AGPL keeps the source public and lets a lab audit exactly how a fit was produced. A fit that does not converge is reported as failed, never replaced by a plausible-looking result.",
    links: [
      { label: 'Source', href: 'https://github.com/amitwh/ConcreteInfo_CurveStudio' },
      { label: 'Open the app', href: 'https://curvestudio.concreteinfo.cloud' },
    ],
  },
  {
    id: 'markdown-converter',
    name: 'Markdown Converter',
    href: 'https://github.com/amitwh/markdown-converter',
    icon: FileType2,
    tile: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300',
    meta: 'MIT · JavaScript',
    short: 'A Pandoc-powered Markdown editor, document converter and flowchart tool.',
    what: 'A cross-platform Markdown editor and document converter powered by Pandoc, built with Electron 45 and Node 24, with no proprietary dependencies. Live preview while you write, then export to PDF, Word, HTML, EPUB and LaTeX. It also carries a visual flowchart editor — a maxGraph canvas with a connector tool, exporting SVG, PNG and VSDX — a PDF toolkit (merge, split, rotate, delete, reorder, watermark, encrypt), find-and-replace with a live match counter, and an ASCII art studio. The current release, 4.14.1, ships a .deb, an AppImage, a macOS .dmg and a Windows .exe.',
    whyFree:
      'Pandoc, the engine underneath, is free and open source, and so is everything wrapped around it — no account, no usage limits, no telemetry. A document tool that sits on your machine all day should not cost anything to own.',
    links: [
      { label: 'Source', href: 'https://github.com/amitwh/markdown-converter' },
      { label: 'Releases', href: 'https://github.com/amitwh/markdown-converter/releases' },
    ],
  },
  {
    id: 'concreteinfo',
    name: 'ConcreteInfo',
    href: 'https://www.concreteinfo.in',
    icon: Building2,
    tile: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
    meta: 'Consulting & training · Founded 2018, Pune',
    short: 'Construction-quality consulting and training, from Information To Insight.',
    what: 'A construction-quality consulting and training firm, founded in 2018 in Pune. Quality-management systems, audits, mix design and RMC-plant support, staff training, specialty material formulation, digital QA/QC workflows, and custom software — CMDApp and CAMS2. From Information To Insight.',
    whyFree:
      'The same rule applies here and there: the numbers should be free and the tools should be free. The site, the calculator and the open-source projects beside it are all published on that basis.',
    links: [
      { label: 'concreteinfo.in', href: 'https://www.concreteinfo.in' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/company/concreteinfo' },
      { label: 'YouTube', href: 'https://www.youtube.com/@concreteinfo6736' },
      {
        label: 'WhatsApp',
        href: 'https://wa.me/919930954848?text=Hello%20ConcreteInfo%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services',
      },
    ],
    contacts: [
      { label: 'amit@concreteinfo.in', href: 'mailto:amit@concreteinfo.in' },
      { label: 'services@concreteinfo.in', href: 'mailto:services@concreteinfo.in' },
      { label: '+91 9930954848', href: 'tel:+919930954848' },
    ],
    wide: true,
  },
];

/**
 * The projects the nav dropdown lists.
 *
 * Why the calculator is missing: the reader is already using it, so the
 * dropdown lists the four projects they came here for.
 */
export const OPEN_SOURCE_NAV_PROJECTS: OpenSourceProject[] = OPEN_SOURCE_PROJECTS.filter(
  (project) => project.id !== 'pc-power-calculator',
);
