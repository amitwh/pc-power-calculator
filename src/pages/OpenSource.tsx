import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, Phone } from 'lucide-react';
import { OPEN_SOURCE_PROJECTS } from '@/content/openSource';
import type { ProjectLink } from '@/content/openSource';

/**
 * Brand-coloured *text* on a card surface.
 *
 * Why: the brand's bright orange (#ff6b47) scores 3.3:1 on the app's gray-900
 * dark card — enough for a glyph, which only needs 3:1, but a label needs
 * 4.5:1. Orange-300 is the same warm family lifted until it clears AA on
 * gray-900 — the same lift the guides hub and the About page use.
 */
const BRAND_TEXT = 'text-brand-text dark:text-orange-300';

/** Body copy. */
const BODY = 'text-sm leading-relaxed text-gray-600 dark:text-gray-300';

/**
 * One link on a project card.
 *
 * Why an outbound link opens in a new tab: the reader is on a directory page
 * and wants to come back to it, so the project opens beside the directory
 * rather than replacing it. `noopener noreferrer` stops the new tab reaching
 * back through `window.opener` and keeps the referrer off a third party's
 * server.
 */
function CardLink({ link }: { link: ProjectLink }) {
  const className = `inline-flex min-h-11 items-center gap-1 text-sm font-semibold ${BRAND_TEXT} hover:underline`;

  if ('to' in link) {
    // Why no arrow on an in-site link: the arrow means "this leaves the
    // page", and an internal route does not.
    return (
      <Link to={link.to} className={className}>
        {link.label}
      </Link>
    );
  }

  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
      {link.label}
      <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
    </a>
  );
}

/**
 * The open-source directory.
 *
 * Why the visible title is a paragraph and not a heading: `Layout` already
 * renders the route's single (visually hidden) h1, so the page keeps exactly
 * one h1 in the accessibility tree. The hero title follows the guides hub,
 * the help page and the home page, which use the same convention.
 */
export default function OpenSource() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 md:px-8">
      {/* The hero. A directory page wants a wide canvas, so it sits in the
          app's 1240px measure rather than the 768px reading measure — at 768px
          there is room for exactly one column and five projects become an
          endless scroll. */}
      <section className="relative overflow-hidden rounded-16 border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900 md:p-10">
        {/* A soft brand wash bleeding in from the corner. Decorative, so it
            stays out of the accessibility tree. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
        />
        <div className="relative">
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${BRAND_TEXT}`}>
            Open source
          </p>
          {/* Visible page title. Layout already renders the route's single h1
              (visually hidden), so this stays a styled paragraph to keep
              exactly one h1 in the accessibility tree. */}
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 md:text-4xl">
            The open-source directory
          </p>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300 md:mt-3">
            Every project ConcreteInfo publishes under an open-source licence — what it is, what it
            costs to use, and where to get the source or the binaries.
          </p>
        </div>
      </section>

      {/* The catalogue. The project names are the page's h2s: Layout already
          renders the route's single sr-only h1, so the page keeps one h1 and
          each project is a top-level section below it. */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {OPEN_SOURCE_PROJECTS.map((project) => {
          const Icon = project.icon;
          return (
            <article
              key={project.id}
              className={`flex flex-col rounded-12 border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900 ${
                project.wide ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${project.tile}`}
                >
                  <Icon aria-hidden className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-base font-bold">{project.name}</h2>
                  {/* The licence and the language. It is the first thing a
                      reader checks on an open-source project, so it sits
                      directly under the name.
                      Why gray-300 on the dark card: gray-400 is #b0b0b0 there
                      — 4.35:1, just under the 4.5:1 that 12px text needs. */}
                  {project.meta && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-300">{project.meta}</p>
                  )}
                </div>
              </div>

              <p className={`mt-3 ${BODY}`}>{project.what}</p>

              {/* Why it is free, set apart: this is the point the card is
                  making, so it gets its own tinted panel and its own label —
                  the same treatment the About page's tool cards give it. */}
              <div className="mt-4 rounded-12 bg-brand/5 p-4 dark:bg-brand/10">
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${BRAND_TEXT}`}>
                  Why it&rsquo;s free for everyone
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {project.whyFree}
                </p>
              </div>

              {/* mt-auto keeps the links on one line across all the cards,
                  whatever the length of the paragraphs above them. */}
              <div className="mt-auto flex flex-wrap gap-x-5 gap-y-1 pt-4">
                {project.links.map((link) => (
                  <CardLink key={link.label} link={link} />
                ))}
              </div>

              {/* The direct contacts. They are not outbound links, so they
                  open in the same tab — a mail client and a dialer are not
                  somewhere a new tab would help. */}
              {project.contacts && (
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-gray-100 pt-4 text-sm dark:border-gray-800">
                  {project.contacts.map((contact) => (
                    <a
                      key={contact.href}
                      href={contact.href}
                      className={`inline-flex min-h-11 items-center ${BRAND_TEXT} hover:underline`}
                    >
                      {contact.href.startsWith('mailto:') ? (
                        <Mail aria-hidden className="mr-1.5 inline h-3.5 w-3.5" />
                      ) : (
                        <Phone aria-hidden className="mr-1.5 inline h-3.5 w-3.5" />
                      )}
                      {contact.label}
                    </a>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* The closing line. Plain, and no closer than the facts. The rule runs
          the full width of the page and the text sits in a reading column —
          the same shape the About page's sections use. */}
      <section className="mt-10 border-t border-gray-200 pt-6 dark:border-gray-800">
        <p className="max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          They are separate projects with separate licences, and each one is maintained on its own
          terms. Take whichever is useful, read the source before you rely on it, and carry on.
        </p>
      </section>
    </div>
  );
}
