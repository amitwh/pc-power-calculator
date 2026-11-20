import { Link, useParams } from 'react-router-dom';
import { Card, CardTitle } from '@/components/ui/Card';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/lib/analytics/adsense';

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
  {
    slug: 'running-pc-24-7',
    title: 'What it actually costs to leave a PC on 24/7',
    description:
      'The always-on idle draw, what it costs across Indian tariff slabs, and when sleep is the better answer.',
    minutes: 8,
    updated: 'November 2026',
    body: (
      <>
        <p>
          The question is not really “what does a gaming PC draw”. It is “what does the
          machine draw while nobody is using it”, because that is where the hours go. The
          calculator derives that idle figure from the parts instead of assuming one wattage
          for every desktop.
        </p>

        <h2>Where the idle number comes from</h2>
        <p>
          Each component is modelled at zero utilisation — the app scales every part from
          its idle floor up to its rated watts. For CPUs the floor is 15% of rated TDP; for
          GPUs it is 10%. A 65 W
          Ryzen 5 7600 idles at <strong>9.75 W</strong> in the model and a 165 W Radeon RX
          7600 at <strong>16.5 W</strong>. The rest of the machine adds its own floors —
          chipset, memory, storage, fans — and the PSU adds its conversion loss on top.
        </p>
        <p>
          Add them up and the reference build — Ryzen 5 7600, Radeon RX 7600, 32 GB
          DDR5-5600, 1 TB NVMe, B650 board, Wraith Stealth cooler, Gold 550 W PSU — sits at
          <strong> 44.6 W</strong> at the wall. A workstation with a Ryzen 9 7900X, RTX 4090,
          64 GB DDR5, 1 TB NVMe, B650 board, 360 mm AIO and 1000 W Titanium PSU lands at
          <strong> 99.6 W</strong>. That is close enough to 50 W and 100 W to use as round
          examples below. The CPU's own figures are on its{' '}
          <Link to="/parts/cpu-amd-ryzen-5-7600" className="text-brand-text underline underline-offset-2">Ryzen 5 7600 page</Link>.
        </p>

        <h2>A month of idle at 50 W and 100 W</h2>
        <p>
          Run the arithmetic first: 50 W × 24 h × 30.44 days = <strong>36.5 kWh</strong> a
          month; 100 W doubles that to <strong>73.1 kWh</strong>. What those units cost
          depends on where your household already sits in the slab structure. On
          Maharashtra's domestic slabs (₹5.67 / ₹9.90 / ₹11.00 per kWh plus 8% duty):
        </p>
        <ul>
          <li>Household already at 50 kWh/month: the 50 W machine adds about {rupee(224)}
            a month; the 100 W machine about {rupee(553)}, because part of its consumption
            crosses into the second slab.</li>
          <li>At 100 kWh/month: {rupee(391)} and {rupee(781)}.</li>
          <li>At 250 kWh/month: {rupee(391)} and {rupee(809)}.</li>
          <li>At 400 kWh/month: {rupee(434)} and {rupee(868)}.</li>
        </ul>
        <p>
          The pattern is the point. For a household already above 100 units, each added kWh
          is billed at ₹9.90 plus duty — <strong>₹10.69 marginal</strong>. Above 300 units
          it is ₹11.00 plus duty, or <strong>₹11.88</strong>. The marginal rate, not the
          bill's average, is what an always-on PC costs.
        </p>
        <p>
          The calculator's headline bills the build's own units through the slabs from zero,
          so 24/7 idle on the 44.6 W build reads {rupee(199)}/month (about
          {` ${rupee(2394)}`}/year) — a first-slab view. If your home is already past the
          first slab, enter your top-slab all-in rate in the manual ₹/kWh override for the
          honest marginal number. The full structure is on the{' '}
          <Link to="/cost/in/mh" className="text-brand-text underline underline-offset-2">Maharashtra tariff page</Link>.
        </p>

        <h2>The idle-hours control</h2>
        <p>
          The schedule editor has a row labelled <strong>“On but idle (desktop /
          browsing)”</strong>. That slider sets <strong>idle_hours_per_day</strong>; it
          shares the 24-hour budget with your scheduled workloads, and monitors are excluded
          from the idle row because they sleep. Take the reference build at 3 hours of 1440p
          gaming plus 21 idle hours:
        </p>
        <ul>
          <li>Gaming: 224.7 W, 246 kWh/year, {rupee(1508)}.</li>
          <li>Idle: 44.6 W, 342 kWh/year, {rupee(2095)}.</li>
          <li>Total: 588 kWh, {rupee(3602)}/year.</li>
        </ul>
        <p>
          Set the idle slider to zero — the machine sleeps when you are not using it — and
          the total falls to {rupee(1508)}. <strong>Sleeping saves {rupee(2095)} a
          year</strong>, more than the gaming itself, because the machine is on for 21 hours
          longer than it is working. The only reason to keep it awake is a job that has to
          run: downloads, a remote session, a server.
        </p>

        <h2>When 24/7 is the right answer</h2>
        <p>
          A home server is a different machine from a desktop left on. The calculator has
          three server profiles, and on the same reference build they cost:
        </p>
        <ul>
          <li><strong>Server (idle)</strong> — a NAS sitting ready: 48.3 W, 423 kWh/year, {rupee(2591)}.</li>
          <li><strong>Server (light)</strong> — Plex streaming, light VMs: 79.2 W, 694 kWh/year, {rupee(4251)}.</li>
          <li><strong>Server (heavy)</strong> — transcoding, heavy VMs: 179.6 W, 1,574 kWh/year, {rupee(11349)}.</li>
        </ul>
        <p>
          For a NAS that must always be available, {rupee(2591)} a year is the rent. At
          heavy-server money, a low-power box or a scheduled window starts to pay for
          itself. The rule is simple: 24/7 is legitimate when the service is the point, not
          when the machine is just awake.
        </p>
        <p>
          Outside India the arithmetic changes currency, not shape. The bundled California
          schedule is a flat $0.32/kWh with no separate tax line; the same 36.5 kWh month
          costs <strong>$11.69</strong>. See the{' '}
          <Link to="/cost/us/ca" className="text-brand-text underline underline-offset-2">California page</Link>{' '}
          for the full example table.
        </p>
        <p>
          To price your own idle hours, <Link to="/" className="text-brand-text underline underline-offset-2">open the calculator</Link>,
          build the machine, and move the idle slider before you touch anything else.
        </p>
      </>
    ),
  },
  {
    slug: 'local-ai-power',
    title: 'What local AI and LLM workloads draw from the wall',
    description:
      'Inference vs training power, why VRAM-bound decoding is not the same as a gaming load, and what a 24/7 inference box costs.',
    minutes: 8,
    updated: 'November 2026',
    body: (
      <>
        <p>
          A local model server is a PC with an unusual duty cycle. The wattage is not
          exotic; the uptime is. The calculator has two AI profiles that make the
          difference explicit.
        </p>

        <h2>Two profiles, two duty cycles</h2>
        <ul>
          <li><strong>LLM inference</strong> — GPU at 95%, CPU at 30%, RAM at 80%, storage
            at 10%. Token generation keeps the card busy but rarely pins every SM at
            100%.</li>
          <li><strong>Model training</strong> — GPU at 99%, CPU at 40%, RAM at 70%, storage at
            20%. A training step is closer to a sustained full-card load.</li>
        </ul>
        <p>
          On the GPU the model is linear: 10% of TDP at idle, rising to full TDP at 100%
          utilisation. An RTX 4090 (450 W) is 45.0 W at idle, <strong>429.8 W</strong> at
          95% and <strong>445.9 W</strong> at 99% — 16 W between inference and training on
          the card. The rest of the system widens that a little: the full build moves from
          542.7 W to 575.6 W. The headline is that the two profiles differ far less than
          people expect once the machine is already on.
        </p>

        <h2>Why decoding is not a gaming load</h2>
        <p>
          The model does not simulate memory controllers. It scales each part from its idle
          floor to its TDP using the workload's utilisation percentage. A decode loop can
          report 95% GPU utilisation while spending much of each cycle waiting on memory, so
          the real board power often sits below the 429.8 W the model assigns. Treat that
          number as the top of the range for the profile, not a meter reading.
        </p>
        <p>
          Frame-limited games have the same issue in reverse: the game may draw less than
          the 95% GPU utilisation in the gaming profile assumes. The model's answer is only
          as good as the utilisation you give it, which is why the profiles are named rather
          than guessed.
        </p>

        <h2>What a 24/7 inference box costs</h2>
        <p>
          Reference build: Ryzen 9 7900X, RTX 4090, 64 GB DDR5-5600, 1 TB NVMe, B650
          board, 360 mm AIO, 1000 W Titanium PSU. On the inference profile around the clock, in
          Maharashtra:
        </p>
        <ul>
          <li>Wall draw: <strong>542.7 W</strong>.</li>
          <li>Energy: <strong>4,758 kWh/year</strong>.</li>
          <li>Cost: <strong>{rupee(46763)}/year</strong>, about {rupee(3897)} a month.</li>
        </ul>
        <p>
          The same build on training for 24 hours a day is 575.6 W and {rupee(50188)} a
          year — about 7% more, not double. If training is a four-hour batch and the box
          idles for the other twenty, the year is 1,568 kWh and {rupee(11286)}:
          {` ${rupee(6052)}`} for the training hours and {` ${rupee(5234)}`} for idle.
          Idle is almost as expensive as the work.
        </p>
        <p>
          That is the practical case for scheduling heavy jobs and sleeping the box between
          them. The{' '}
          <Link to="/cost/in/mh" className="text-brand-text underline underline-offset-2">Maharashtra tariff page</Link>{' '}
          shows the slab walk behind those numbers.
        </p>

        <h2>PSU headroom, even at “only” 543 W</h2>
        <p>
          The calculator sizes the PSU from peak component draw, not from the workload's
          average. This build peaks at 647 W of component draw, so the recommendation is
          <strong> 1,000 W</strong> — 647 × 1.35, rounded up to a sold size. A 650 W unit
          would be near its limit before any transient.
        </p>
        <p>
          Transients are the reason. TDP is a sustained power target; a card can burst well
          above it for milliseconds when a step loads or a kernel launches. The PSU guide
          uses a rule of thumb of roughly double rated power for a few milliseconds — an
          outside-the-model industry figure, not something the calculator computes. Extra
          capacity absorbs it. Read{' '}
          <Link to="/guides/psu-sizing" className="text-brand-text underline underline-offset-2">PSU sizing explained</Link>{' '}
          for the full argument.
        </p>

        <h2>The cheaper box</h2>
        <p>
          A smaller box with a Ryzen 5 7600, 16 GB RTX 4060 Ti, 32 GB DDR5-5600, 1 TB
          NVMe and a Gold 550 W PSU draws <strong>216.9 W</strong> on the same 24/7
          inference profile, uses 1,901 kWh/year and costs
          <strong> {rupee(14844)}</strong> — {rupee(31919)} a year less.
        </p>
        <p>
          That is not a recommendation to buy the smaller card. VRAM capacity decides which
          models you can load at all, and the calculator does not measure tokens per second.
          What it does say is that the rent on a 24/7 box is dominated by uptime and by the
          card's idle-to-load spread, so size the GPU for the model you need and then decide
          how many hours a day it should be awake. The{' '}
          <Link to="/parts/gpu-nvidia-rtx-4090" className="text-brand-text underline underline-offset-2">RTX 4090 page</Link>{' '}
          and the{' '}
          <Link to="/parts/gpu-nvidia-rtx-4060-ti" className="text-brand-text underline underline-offset-2">RTX 4060 Ti page</Link>{' '}
          carry the per-part figures.
        </p>
      </>
    ),
  },
  {
    slug: 'cutting-pc-power',
    title: 'Frame caps, undervolting and sleep: what actually cuts your bill',
    description:
      'The three changes that move the number most, ranked, with what each is worth on an Indian tariff.',
    minutes: 7,
    updated: 'November 2026',
    body: (
      <>
        <p>
          Three changes do most of the work, and the largest one happens when you are not
          using the machine. All the figures below come from the same reference build:
          Ryzen 5 7600, Radeon RX 7600, 32 GB DDR5, 1 TB NVMe, Wraith Stealth cooler,
          Gold 550 W PSU, 3 hours of 1440p gaming a day and 21 idle hours. On
          Maharashtra's slabs it costs
          {` ${rupee(3602)}`} a year before any of them.
        </p>

        <h2>1. Sleep: {rupee(2095)} a year</h2>
        <p>
          The idle row is 44.6 W for 21 hours a day — 342 kWh a year, {rupee(2095)}. The
          gaming row is 224.7 W for 3 hours — 246 kWh, {rupee(1508)}. The machine spends
          most of its life doing nothing and most of its bill proving it: idle is 58% of the
          total.
        </p>
        <p>
          Set the idle-hours slider to zero and the year falls to {rupee(1508)}. Sleeping
          saves <strong>{rupee(2095)}</strong> — almost seven times the {rupee(310)} a 15%
          undervolt is worth, and more than seven times the {rupee(275)} from a mild frame
          cap. The model treats a sleeping machine as zero watts; a real PSU still
          draws a watt or two in standby, which is inside the noise of this estimate.
          Monitors are already excluded from the idle row because they sleep.
        </p>
        <p>
          The exception is a machine with a job: downloads, remote access, a NAS. That case
          is covered in{' '}
          <Link to="/guides/running-pc-24-7" className="text-brand-text underline underline-offset-2">what it actually costs to leave a PC on 24/7</Link>.
        </p>

        <h2>2. Undervolting: {rupee(310)} a year at 15%</h2>
        <p>
          The calculator does not model voltage/frequency curves. It gives you a TDP
          override instead: the <strong>“Rated watts per unit”</strong> box next to each
          part. Enter the wattage you actually observe and the model uses it everywhere —
          idle floor included, because the floor is a fraction of TDP.
        </p>
        <p>
          Take 15% off the RX 7600's 165 W, to 140 W. The gaming row falls from 224.7 W at
          the wall to <strong>198.6 W</strong>; gaming costs {rupee(1333)} instead of
          {` ${rupee(1508)}`}, and the year falls from {rupee(3602)} to {rupee(3292)}.
          A 20% cut to 132 W gets the gaming row to 189.9 W and the year to {rupee(3189)},
          saving {rupee(413)}.
        </p>
        <p>
          Typical undervolting results land in the 5–15% power-reduction range at the same
          clock — a range from outside the model, not a guarantee for your card. Too
          aggressive a curve crashes games, and stability is the constraint that matters
          more than the last few watts.
        </p>

        <h2>3. Frame caps: {rupee(275)} a year at a mild cap</h2>
        <p>
          The GPU model is a straight line from idle to TDP: idle + (TDP − idle) ×
          utilisation. For the RX 7600 that is 16.5 W at idle, 157.6 W at 95% and 90.8 W at
          50%. A frame cap lowers the utilisation the model sees, so cap from 95% to 70% and
          the gaming row falls from 224.7 W to <strong>183.7 W</strong>: {rupee(1233)} for
          the gaming hours and {rupee(3327)} for the year, a saving of {rupee(275)}.
        </p>
        <p>
          Cap harder, to 50%, and the gaming row is 150.8 W, the year {rupee(3106)}, and the
          saving {rupee(496)}. The shape is worth remembering: GPU component draw drops 42%
          between 95% and 50% utilisation, but system wall draw and cost drop by about a
          third (224.7 → 150.8 W, {rupee(1508)} → {rupee(1012)}), because the idle floor and
          the rest of the machine do not move.
        </p>
        <p>
          A cap only saves power if the GPU was working harder than the frame rate needed.
          In a CPU-bound game it does nothing. The model cannot inspect your game; the
          utilisation comes from the workload profile, which is why the{' '}
          <Link to="/parts/gpu-amd-rx-7600" className="text-brand-text underline underline-offset-2">Radeon RX 7600 page</Link>{' '}
          shows the part's modelled idle and full-load figures rather than a game-specific
          one.
        </p>

        <h2>What none of this changes</h2>
        <p>
          The hardware is already paid for. Sleep, undervolting and frame caps change the
          running cost only; they do not make the card cheaper, and they do not improve
          performance. On this build the ranking is {rupee(2095)} for sleep,
          {` ${rupee(310)}`} for a 15% undervolt and {rupee(275)} for a mild frame cap. The
          two in-game changes stack with each other and with sleep: the cap lowers the
          utilisation, the undervolt lowers the TDP that utilisation scales toward, and
          sleep removes the idle hours entirely.
        </p>
        <p>
          These are model estimates, not meter readings. Your PSU's efficiency curve,
          monitor brightness and actual frame pacing move them. To price your build,{' '}
          <Link to="/" className="text-brand-text underline underline-offset-2">open the calculator</Link>{' '}
          and use the{' '}
          <Link to="/cost/in/mh" className="text-brand-text underline underline-offset-2">Maharashtra tariff page</Link>{' '}
          to check the slab walk.
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
      {/* Below the answer, above the disclaimer — never between a reader and
          the numbers they came for. Renders nothing until an ad unit is set. */}
      <AdSlot slot={AD_SLOTS.guideInline} />
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
