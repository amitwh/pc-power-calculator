import { Link, useParams } from 'react-router-dom';
import { Card, CardTitle } from '@/components/ui/Card';

export interface Guide {
  slug: string;
  title: string;
  description: string;
  minutes: number;
  updated: string;
  body: React.ReactNode;
}

const rupee = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const GUIDES: Guide[] = [
  {
    slug: 'gaming-pc-power',
    title: 'How much power does a gaming PC actually use?',
    description:
      'Realistic idle, gaming and peak wattage figures by build tier — and what they cost per year on an Indian electricity tariff.',
    minutes: 6,
    updated: 'November 2026',
    body: (
      <>
        <p>
          Ask five forums “how much power does a gaming PC use” and you'll get five answers,
          because people confuse three very different numbers: the <strong>PSU's rated
          wattage</strong>, the build's theoretical <strong>peak draw</strong>, and what it
          actually pulls from the wall while <em>you</em> use it. Only the third one shows up on
          your electricity bill.
        </p>

        <h2>The three numbers that matter</h2>
        <ul>
          <li><strong>Peak draw</strong> — every component running flat-out at once. A mid-range
            build (Ryzen 5 / Core i5 + RTX 4060-class GPU) peaks around 300–400 W; a high-end rig
            (Ryzen 7 X3D / Core i7 K + RTX 4070 Ti–4080 class) around 450–600 W; halo builds
            (i9 / 14900K-class + RTX 4090) can touch 700–800 W.</li>
          <li><strong>Typical gaming draw</strong> — the honest number. GPUs and CPUs rarely hit
            100% simultaneously in games; real-world gaming usually lands at 50–75% of peak.
            This calculator models it as 70% of rated draw.</li>
          <li><strong>Idle / desktop draw</strong> — browsing, office work, video playback.
            A modern desktop idles at 40–80 W at the wall; a laptop, 5–15 W.</li>
        </ul>

        <h2>What that costs per year (India)</h2>
        <p>
          Take a popular mid-range build peaking at ~450 W, drawing ~315 W while gaming, played
          3 hours a day, at a typical ₹8.41/kWh all-in tariff:
        </p>
        <pre className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-8 my-2">{`0.315 kW × 3 h × 365 days ≈ 345 kWh/yr ≈ ${rupee(2900)}/yr`}</pre>
        <p>
          Add 5 hours a day of light desktop use at ~60 W and the total lands near
          455 kWh/yr — roughly {rupee(3800)} a year. <strong>The game time, not the hardware,
          dominates the bill</strong>: a 100 W bigger GPU used 3 h/day adds about
          {` ${rupee(920)}`} a year, but leaving the machine on 24×7 at idle adds more than
          {` ${rupee(2600)}`}. Sleep modes matter more than most upgrades.
        </p>

        <h2>Three habits that actually cut the bill</h2>
        <ol>
          <li><strong>Enable sleep / hibernate</strong> — an idle gaming PC wastes 50–70 W
            around the clock if left on; that's ~{rupee(3000)}/yr for nothing.</li>
          <li><strong>Cap frames or undervolt</strong> — dropping 144 fps caps or a small
            undervolt cuts GPU draw 10–20% with negligible visual loss.</li>
          <li><strong>Right-size the PSU</strong> — PSUs are most efficient at ~50% load;
            a sensibly sized unit (see our{' '}
            <Link to="/guides/psu-sizing" className="text-brand-text underline underline-offset-2">PSU sizing guide</Link>)
            trims 10–30 W at the wall versus an oversized or bargain-bin one.</li>
        </ol>

        <p>
          Want your own numbers? Build your rig in the{' '}
          <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>,
          set your usage hours, and it applies your state's tariff — including slab tiers —
          automatically. The methodology is documented in{' '}
          <Link to="/about" className="text-brand-text underline underline-offset-2">About &amp; methodology</Link>.
        </p>
      </>
    ),
  },
  {
    slug: 'psu-sizing',
    title: 'PSU sizing explained: why we add 35% headroom',
    description:
      'Why the right PSU is bigger than your peak draw: efficiency curves, GPU transient spikes, and ageing — explained simply.',
    minutes: 5,
    updated: 'November 2026',
    body: (
      <>
        <p>
          The internet's classic PSU advice — “add up the wattage and buy that” — produces
          systems that run their power supply at 100% load every gaming session. That's a bad
          place to operate, for four separate reasons. This is why the calculator adds a
          <strong> 35% sizing margin</strong> on top of peak draw when it recommends a PSU.
        </p>

        <h2>1. Efficiency peaks near half load</h2>
        <p>
          A PSU's 80-Plus rating is measured at 20%, 50% and 100% load — and for most units the
          curve peaks around 40–60%. A 450 W build on a 450 W PSU runs at ~100% load, in the
          least efficient region of its curve. The same build on a 650 W Gold unit sits near
          60%… but 550 W would be even closer to the sweet spot. More headroom is not always
          more efficient — <em>right-sized</em> headroom is.
        </p>

        <h2>2. Transient spikes burst far above rated draw</h2>
        <p>
          Modern GPUs can spike to roughly <strong>double their nameplate power for a few
          milliseconds</strong> when loading a level or recovering from a frame-time dip. A PSU
          running near 100% has no reserve for that spike and its protection circuitry may
          trip — the classic “random black screen while gaming, no crash log” complaint. Extra
          capacity absorbs spikes silently.
        </p>

        <h2>3. Capacitors age</h2>
        <p>
          Electrolytic capacitors lose capacity over years, especially with heat. A unit that
          delivered its full rated wattage on day one may deliver measurably less by year five.
          Headroom is what turns “the PSU dies eventually” into “the PSU is replaced on your
          schedule, during a planned upgrade”.
        </p>

        <h2>4. Upgrades shouldn't force a PSU swap</h2>
        <p>
          The GPU you buy in three years will likely draw more. A 35% margin means today's PSU
          almost certainly survives one GPU generation.
        </p>

        <h2>How this calculator models it</h2>
        <p>
          The recommended PSU is: sum of every component's <strong>rated (100%)</strong> draw,
          plus a 35% margin, rounded up to a commonly sold wattage. Running costs use the
          opposite assumption — components average ~70% of rated draw in real use — and the
          wall draw divides by the 80-Plus efficiency curve interpolated at the actual load
          percentage. Both the model and its limits are documented in{' '}
          <Link to="/about" className="text-brand-text underline underline-offset-2">About &amp; methodology</Link>.
        </p>

        <p>
          Rule of thumb to take away: <strong>peak draw × 1.35, then buy a quality tier
          (80-Plus Bronze minimum, Gold preferred) at or above that number</strong>. If you're
          unsure what your peak is, let the{' '}
          <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>{' '}
          add it up — it knows the ratings of 2,200+ parts, including the exact GPU on your
          shortlist.
        </p>
      </>
    ),
  },
  {
    slug: 'india-tariff',
    title: 'Understanding your electricity bill in India (and where your PC fits in it)',
    description:
      'Slab tariffs, fixed charges and electricity duty — how Indian billing actually works, and what a PC really adds to it.',
    minutes: 6,
    updated: 'November 2026',
    body: (
      <>
        <p>
          Indian homes don't pay one flat rate per unit (kWh). Almost every state's distributor
          bills residential customers on a <strong>telescopic slab</strong> structure, and once
          you understand it, you can see exactly where a PC's consumption lands on your bill —
          often it's cheaper than people fear, because a PC adds <em>marginal</em> units at the
          top of the slab, not at the average rate.
        </p>

        <h2>The anatomy of a typical bill</h2>
        <ul>
          <li><strong>Energy charges (slabs)</strong> — e.g. 0–100 units at one rate,
            101–300 at a higher rate, 301–500 higher still, above that the highest. Rates vary
            by state and by consumer category; urban residential slabs commonly run from
            ~₹3–5/kWh in the first slab to ~₹9–12/kWh at the top.</li>
          <li><strong>Fixed / demand charge</strong> — a per-kW or per-month amount based on
            your sanctioned load, not your usage.</li>
          <li><strong>Electricity duty &amp; taxes</strong> — commonly around 5–20% on top;
            this calculator uses an 8% average duty assumption when a state's all-in rate
            isn't published.</li>
          <li><strong>Fuel adjustment</strong> — a small surcharge/rebate that tracks fuel
            costs, changed every few months.</li>
        </ul>

        <h2>Why your PC's marginal cost is the top-slab rate</h2>
        <p>
          If your household already consumes 280 units a month, every unit your PC adds is
          billed at the <em>301–500 slab</em> rate — not your bill's average ₹/kWh. A gaming PC
          used 3 h/day at ~315 W adds about 29 units a month. At a ~₹9/kWh top slab with duty,
          that's roughly {rupee(280)}/month — about {rupee(3400)}/yr, which matches what the
          {' '}<Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>{' '}
          will show you once your state and usage are set.
        </p>

        <h2>State tariffs differ a lot</h2>
        <p>
          The calculator ships rates for Indian states sourced from public utility/regulator
          publications (see{' '}
          <Link to="/data" className="text-brand-text underline underline-offset-2">Data freshness</Link>{' '}
          for exactly what changed when) and applies slab logic monthly, the way your
          distributor does. It auto-detects your state from your connection, and you can
          override both the state and the exact ₹/kWh from your bill — the override is the
          most accurate path, because concessions (farm, BPL, EV rates) and meter categories
          are too varied to model universally.
        </p>

        <h2>Four honest ways to spend less</h2>
        <ol>
          <li><strong>Stay under the slab boundary</strong> — if your household sits just
            above 200 or 500 units, a PC's 25–30 units can tip the whole bill into the next
            slab. Sleep modes and monitor-off timers genuinely help here.</li>
          <li><strong>Shift bulk work to off-peak</strong> — relevant mainly if you're on a
            TOU (time-of-day) tariff; large downloads, renders and AI training runs are
            schedule-flexible.</li>
          <li><strong>Efficiency-rated PSU</strong> — an 80-Plus Gold unit wastes less as
            heat; see{' '}
            <Link to="/guides/psu-sizing" className="text-brand-text underline underline-offset-2">PSU sizing explained</Link>.</li>
          <li><strong>Right-size the machine</strong> — a 450 W-class build does 90% of what
            an 800 W-class build does for most people, at half the running cost; the{' '}
            <Link to="/suggestions" className="text-brand-text underline underline-offset-2">suggestions page</Link>{' '}
            helps you compare candidates.</li>
        </ol>

        <p className="text-xs text-gray-500">
          Slab structures and duty percentages change with regulatory orders; verify the exact
          figures with your distributor's latest tariff card. This guide is general
          information, not billing advice.
        </p>
      </>
    ),
  },
];

function GuideArticle({ slug }: { slug: string }) {
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto grid gap-3">
        <h1 className="font-display text-2xl font-bold">Guide not found</h1>
        <p className="text-sm">
          That guide doesn't exist. See all{' '}
          <Link to="/guides" className="text-brand-text underline underline-offset-2">guides</Link>.
        </p>
      </div>
    );
  }
  return (
    <article className="p-4 md:p-8 max-w-3xl mx-auto grid gap-3 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-5 [&_p]:my-2">
      <h1 className="font-display text-2xl font-bold">{guide.title}</h1>
      <p className="text-sm text-gray-500">
        {guide.minutes} min read · Updated {guide.updated}
      </p>
      <div className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:my-2 [&_strong]:text-gray-900 dark:[&_strong]:text-gray-50">
        {guide.body}
      </div>
      <p className="text-xs text-gray-500 border-t border-gray-200 dark:border-gray-800 pt-3">
        Figures are estimates for information only — verify specs with manufacturers and your
        utility's tariff card. See our{' '}
        <Link to="/about" className="underline underline-offset-2">methodology</Link> and{' '}
        <Link to="/privacy" className="underline underline-offset-2">privacy policy</Link>.
      </p>
    </article>
  );
}

/** Guides hub (`/guides`) and article view (`/guides/:slug`). */
export default function Guides() {
  const { slug } = useParams();
  if (slug) return <GuideArticle slug={slug} />;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto grid gap-3">
      <h1 className="font-display text-2xl font-bold">Guides &amp; explainers</h1>
      <p className="text-sm text-gray-500">
        Short, practical reads on PC power draw, PSU sizing and electricity billing — written
        to match the calculator's model.
      </p>
      {GUIDES.map((g) => (
        <Card key={g.slug}>
          <CardTitle>
            <Link to={`/guides/${g.slug}`} className="hover:text-brand-dark">
              {g.title}
            </Link>
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">{g.description}</p>
          <p className="text-xs text-gray-500 mt-1">{g.minutes} min read · Updated {g.updated}</p>
        </Card>
      ))}
    </div>
  );
}
