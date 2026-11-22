import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock,
  Cpu,
  Lightbulb,
  MapPin,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * The brand's orange is too light to read on the gray-900 dark card, so the
 * dark tone is lifted to orange-300 — the same lift the guides hub uses for
 * its brand text.
 */
const BRAND_TEXT = 'text-brand-text dark:text-orange-300';

/** The rule between two sections. */
const RULE = 'mt-10 border-t border-gray-200 pt-6 dark:border-gray-800';

/** A section heading, matching the About page's rhythm. */
const HEADING = 'font-display text-lg font-bold';

/** Body copy. */
const BODY = 'text-sm leading-relaxed text-gray-600 dark:text-gray-300';

/** An inline link inside a paragraph. */
const LINK = 'font-semibold text-brand-text underline underline-offset-2 dark:text-orange-300';

/** One screenshot: the file, its intrinsic size, and what the reader sees. */
interface Shot {
  src: string;
  /** Describes what the reader is looking at — not "screenshot". */
  alt: string;
  /** One line under the image. */
  caption: string;
  /** Intrinsic pixel size, so the layout does not shift while the image loads. */
  width: number;
  height: number;
}

/**
 * A screenshot in a frame.
 *
 * Why the width/height attributes: without them the browser reserves no space
 * for the image and the page jumps as each picture arrives. The values are the
 * files' real pixel sizes, so the reserved box matches the rendered one.
 */
function Figure({ shot }: { shot: Shot }) {
  return (
    <figure className="mt-5 rounded-12 border border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-900">
      <img
        src={shot.src}
        alt={shot.alt}
        loading="lazy"
        decoding="async"
        width={shot.width}
        height={shot.height}
        // Why the cap: the frame is wider than 960px, and one capture — the
        // tariff page, which is a narrow reading-width page — is only 960px
        // wide. Left at `w-full` it would be stretched by a fifth and the text
        // in it would go soft. Capping every figure at 960px renders the wide
        // captures downscaled (always crisp) and the narrow one 1:1.
        className="mx-auto h-auto w-full max-w-[960px]"
      />
      <figcaption className="mt-2 px-1 text-xs text-gray-600 dark:text-gray-400">
        {shot.caption}
      </figcaption>
    </figure>
  );
}

/** A quick-start step: number, icon, title and one sentence. */
interface Step {
  title: string;
  body: string;
  icon: LucideIcon;
}

const STEPS: Step[] = [
  {
    title: 'Add your parts',
    body: 'Search 2,200+ CPUs, GPUs, PSUs and other parts. Start with the CPU and the GPU — between them they set most of your draw.',
    icon: Cpu,
  },
  {
    title: 'Say how you use it',
    body: "Set hours per day for gaming, office and browsing. The rest of the day counts as 'on, but idle'.",
    icon: Clock,
  },
  {
    title: 'Pick your tariff',
    body: "Choose your country and state. The rate comes from the utility's own tariff, not a guess.",
    icon: MapPin,
  },
];

/** One walkthrough section: a heading, prose, a picture and a link onward. */
interface Walkthrough {
  title: string;
  paragraphs: string[];
  shot?: Shot;
  /** The live page this section is about. */
  to: string;
  linkLabel: string;
}

const WALKTHROUGHS: Walkthrough[] = [
  {
    title: 'Add your parts',
    paragraphs: [
      "Open the calculator and press 'Add a part'. Type into the box — 'rtx 4070' is enough — and the picker returns the matching components from the catalogue. Every result carries its rated wattage, so you can see what a part costs you in power before you commit to it.",
      'The list on the left is your build; the watt figure on the right is that part’s rated draw. Click the watt field beside the name to override it when the manufacturer figure is wrong, and the calculation uses your number instead of the catalogue’s.',
      "'Advanced' opens what the catalogue cannot give you: CPU and GPU overclock percentages, the case fan count, and a custom device row where you type the wattage yourself. UPS units, optical drives and extra monitors come from the same picker — filter by category to reach them.",
    ],
    shot: {
      src: '/help/add-part.png',
      alt: "The 'Add a part' picker open, the search box holding 'rtx 4070', with five matching graphics cards listed below it and the rated wattage of each one.",
      caption: "The part picker searching 'rtx 4070' — five matching cards, each with its rated wattage.",
      width: 1280,
      height: 860,
    },
    to: '/',
    linkLabel: 'Open the calculator',
  },
  {
    title: 'Read the answer',
    paragraphs: [
      'The yearly cost is the headline. Under it sit the per-month and per-day figures and the year’s total energy in kWh, so you do not have to derive them yourself.',
      "'Where the power goes' splits the draw between your parts and colours each slice to match the row it came from. 'How accurate is this?' shows the model's idle, full-load and daily-average draw next to the 80 PLUS curve that turns component watts into wall watts — the loss you pay for in every unit.",
      "'Share this estimate' gives you a link to the build. PDF and HTML export the whole thing as a report.",
    ],
    shot: {
      src: '/help/calculator.png',
      alt: 'The calculator with a full build: the yearly cost at the top, the list of parts with their wattages, the use-case sliders and the tariff card.',
      caption: 'The calculator — yearly cost at the top, then the parts list, the use-case sliders and the tariff card.',
      width: 1280,
      height: 860,
    },
    to: '/',
    linkLabel: 'Open the calculator',
  },
  {
    title: 'Set your location and tariff',
    paragraphs: [
      "'Change location or rate' in the tariff card sets your country and your state. The rate is read from the tariff table bundled with the app — a slab schedule from the utility, with the local taxes applied — and you can override it with your own rate if your bill says otherwise.",
      'Every country and state in that table has a page of its own: the slab rates, the duty, and a worked example of what a 150 W, 350 W or 600 W PC costs at four hours a day.',
    ],
    shot: {
      src: '/help/tariff.png',
      alt: 'The Maharashtra electricity cost page: the slab rate table, the electricity duty row, and a worked example of what a PC costs at four hours a day.',
      caption: 'The Maharashtra tariff page — slab rates, electricity duty and a worked 4 h/day example.',
      width: 960,
      height: 860,
    },
    to: '/cost/in/mh',
    linkLabel: 'Open the Maharashtra tariff page',
  },
  {
    title: 'Compare two saved builds',
    paragraphs: [
      'The calculator keeps every build you make. Name one from the pencil icon in the top bar so you can tell it apart later, then open Compare and pick one as System A and one as System B.',
      'The verdict says which of the two is cheaper and by how much, in rupees per year and per month. Under it the bars are drawn to scale, row by row — energy per year, cost per year, peak draw at the wall — so the gap is something you can see, not only a number you are told.',
    ],
    shot: {
      src: '/help/compare.png',
      alt: 'The compare page with two saved systems: a verdict saying which one is cheaper, and the to-scale bars for energy, cost and peak draw below it.',
      caption: 'Two saved systems — the verdict above, then the to-scale bars for energy, cost and peak draw.',
      width: 1280,
      height: 860,
    },
    to: '/compare',
    linkLabel: 'Open the compare page',
  },
  {
    title: 'Read the guides',
    paragraphs: [
      'There are 26 explainers, split across power and electricity, hardware deep-dives and electricity billing. They cover PSU sizing and efficiency, power factor, what each component actually draws, the CPU and its caches, the FPU and the NPU, the GPU and its VRAM, RAM, storage, PCIe and M.2, cooling — and how an Indian electricity bill is built.',
      'Search by topic, or filter by category to narrow the list.',
    ],
    shot: {
      src: '/help/guides.png',
      alt: 'The guides hub: the hero panel, a search box, the category filter pills, and four guide cards in a row.',
      caption: 'The guides hub — search, category filters, and four cards to a row.',
      width: 1280,
      height: 860,
    },
    to: '/guides',
    linkLabel: 'Open the guides',
  },
  {
    title: 'Get a number you can trust',
    paragraphs: [
      'Everything here is a model built from rated specifications. That is fine for most cards, but a factory-overclocked card, or one running with a non-standard power limit, will read low — the catalogue knows the rated TDP, not what your card actually does.',
      "So measure it. The 'How accurate is this?' panel takes your own idle and full-load readings, and a daily average if you have one, and sets the estimate against them. Use your numbers where the gap matters.",
      'Two ground rules: this is an estimate and not electrical advice, and your utility’s tariff card is the authority on what you actually pay.',
    ],
    to: '/about',
    linkLabel: 'Read how the estimate is built',
  },
];

/** A question and its answer. The answer may carry links. */
interface FaqItem {
  question: string;
  answer: ReactNode;
}

const FAQ: FaqItem[] = [
  {
    question: 'Is my build uploaded anywhere?',
    answer:
      'No. Builds live in your browser’s local storage and nothing is sent to a server. Clearing your browser data clears them too, so export a PDF or copy a share link if you want to keep one.',
  },
  {
    question: 'Why doesn’t this match my meter?',
    answer: (
      <>
        Because this is a model, not a measurement. Enter your idle and full-load readings from a
        smart plug or a wall meter in the &lsquo;How accurate is this?&rsquo; panel, and the estimate
        is set against your numbers.
      </>
    ),
  },
  {
    question: 'Which countries are supported?',
    answer: (
      <>
        Open the location picker on the calculator and the country list is there. The tariff table is
        bundled with the app at build time — there is no call to a utility — so you always see the
        rates that shipped with the version you are running.{' '}
        <Link className={LINK} to="/">
          Open the calculator
        </Link>
      </>
    ),
  },
  {
    question: 'Can I use it offline?',
    answer:
      'Yes. Install it from your browser’s install prompt and it runs as an app, with the pages you have visited kept for offline. On a deep link with no connection, the service worker serves an offline fallback page instead of an error.',
  },
  {
    question: 'How often is the data refreshed?',
    answer: (
      <>
        The data page lists the last change for every dataset — component specs, tariffs and the
        exchange-rate snapshot — and where each one comes from.{' '}
        <Link className={LINK} to="/data">
          Open the data page
        </Link>
      </>
    ),
  },
  {
    question: 'How do I report a wrong number?',
    answer: (
      <>
        Use the suggestions form for a missing component or a tariff that has changed, and the
        feedback form for anything else — a wrong figure, a bug, or a feature you want.{' '}
        <Link className={LINK} to="/suggest">
          Suggest a component
        </Link>{' '}
        or{' '}
        <Link className={LINK} to="/feedback">
          send feedback
        </Link>
        .
      </>
    ),
  },
  {
    question: 'Can I use a different currency?',
    answer:
      'Yes. The tariff card has a currency picker next to the rate. It follows your location by default; set it to whatever your bill is in and every figure on the page follows it.',
  },
];

/** A closing card: where to go when the guide has not answered it. */
interface EscapeHatch {
  to: string;
  title: string;
  body: string;
  icon: LucideIcon;
}

const ESCAPE_HATCHES: EscapeHatch[] = [
  {
    to: '/suggest',
    title: 'Suggest a component',
    body: 'A part that is missing, or a tariff that has changed.',
    icon: Lightbulb,
  },
  {
    to: '/feedback',
    title: 'Send feedback',
    body: 'A wrong figure, a bug, or a feature you want.',
    icon: MessageSquare,
  },
  {
    to: '/about',
    title: 'How it is calculated',
    body: 'The model, its sources and its limits.',
    icon: BookOpen,
  },
  {
    to: '/privacy',
    title: 'What is stored',
    body: 'What the site keeps in your browser, and what it does not.',
    icon: ShieldCheck,
  },
];

/**
 * The user guide.
 *
 * Why the visible title is a paragraph and not a heading: `Layout` already
 * renders the route's single (visually hidden) h1, so the page keeps exactly
 * one h1 in the accessibility tree. The hero title follows the guides hub and
 * the home page, which use the same convention.
 */
export default function Help() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 md:px-8">
      {/* The hero. A guide page wants the weight of the guides hub, so it opens
          on the same wide, blob-washed panel. */}
      <section className="relative overflow-hidden rounded-16 border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900 md:p-10">
        {/* A soft brand wash bleeding in from the corner. Decorative, so it
            stays out of the accessibility tree. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
        />
        <div className="relative">
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${BRAND_TEXT}`}>
            User guide
          </p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 md:text-4xl">
            Help
          </p>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300 md:mt-3">
            Add your parts, tell it how you use the machine, pick your tariff — then read the number
            and check where it came from.
          </p>
        </div>
      </section>

      {/* Quick start. Three steps, in the order a first-time visitor works in
          them: what it is, when you use it, what power costs. */}
      <section className="mt-8">
        <h2 className={HEADING}>Quick start</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="rounded-12 border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 ${BRAND_TEXT}`}
                  >
                    <Icon aria-hidden className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-base font-bold">{step.title}</h3>
                <p className={`mt-1.5 ${BODY}`}>{step.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* The walkthroughs. Each one is a heading, two or three paragraphs, the
          picture of the page it describes, and a link to that page. */}
      {WALKTHROUGHS.map((section) => (
        <section key={section.title} className={RULE}>
          <h2 className={HEADING}>{section.title}</h2>
          <div className="mt-3 max-w-3xl space-y-3">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className={BODY}>
                {paragraph}
              </p>
            ))}
          </div>
          {section.shot && <Figure shot={section.shot} />}
          <p className="mt-4">
            <Link
              to={section.to}
              className={`inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold ${BRAND_TEXT} hover:underline`}
            >
              {section.linkLabel}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </p>
        </section>
      ))}

      {/* The FAQ. Native <details> keeps it scannable and works without any
          script — each answer is one paragraph. */}
      <section className={RULE}>
        <h2 className={HEADING}>Questions</h2>
        <div className="mt-4 max-w-3xl space-y-2">
          {FAQ.map((item) => (
            <details
              key={item.question}
              className="group rounded-12 border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
            >
              {/* The question is an h3 so the FAQ reads as a list of headings
                  to a screen reader and to a search engine, while the
                  <details> keeps the page scannable. */}
              <summary className="flex cursor-pointer list-none items-start gap-2 [&::-webkit-details-marker]:hidden">
                <ChevronRight
                  aria-hidden
                  className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90 dark:text-gray-500"
                />
                <h3 className="font-display text-sm font-semibold">{item.question}</h3>
              </summary>
              <div className={`mt-2 pl-6 ${BODY}`}>{item.answer}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Where to go when the guide has not answered the question. */}
      <section className={RULE}>
        <h2 className={HEADING}>Still stuck?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ESCAPE_HATCHES.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.to}
                to={card.to}
                className="rounded-12 border border-gray-200 bg-white p-4 shadow-card transition-colors hover:border-brand/40 dark:border-gray-800 dark:bg-gray-900"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 ${BRAND_TEXT}`}
                >
                  <Icon aria-hidden className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-display text-sm font-bold">{card.title}</h3>
                <p className={`mt-1 text-xs ${BODY}`}>{card.body}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
