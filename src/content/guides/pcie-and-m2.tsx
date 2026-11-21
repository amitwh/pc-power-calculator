/**
 * "PCIe and M.2 explained: generations, lanes and why the slot is not the speed"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { M2FormFactorFigure, PcieGenerationFigure } from '@/components/guides/Figures';
import type { Guide } from './types';

export const pcieAndM2: Guide = {
  slug: 'pcie-and-m2',
  title: 'PCIe and M.2 explained: generations, lanes and why the slot is not the speed',
  description:
    'What a PCIe generation and a lane count mean, the real bandwidth of each generation, and how M.2 slots share lanes with your graphics card.',
  minutes: 8,
  updated: 'November 2026',
  category: 'hardware',
  tags: ['pcie', 'pcie 5.0', 'm.2', 'lanes', 'nvme', 'bandwidth', 'lane sharing'],
  body: (
    <>
      <p>
        PCI Express is the highway system the whole PC shares: the graphics card, the NVMe
        drive, the network card and the expansion slots all travel over it. A{' '}
        <strong>generation</strong> is the speed limit on that road, and a <strong>lane</strong>{' '}
        is how many lanes of it you have been given. The two numbers are independent of each
        other, and that is where most of the confusion starts.
      </p>

      <h2>What the generation numbers actually mean</h2>
      <p>
        Each generation roughly doubles the transfer rate per lane. The rate is quoted in{' '}
        <strong>GT/s</strong> — gigatransfers per second, one transfer per lane per clock — and
        that is the <em>raw</em> link rate. The usable number is a little lower, because the
        link has to protect the data it carries on the way:
      </p>

      <div className="my-3 overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th scope="col">Generation</th>
              <th scope="col">Raw rate per lane</th>
              <th scope="col">After encoding, per lane</th>
              <th scope="col">An x16 slot, each way</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">PCIe 3.0</th>
              <td><code>8 GT/s</code></td>
              <td>≈985 MB/s</td>
              <td>≈15.8 GB/s</td>
            </tr>
            <tr>
              <th scope="row">PCIe 4.0</th>
              <td><code>16 GT/s</code></td>
              <td>≈1,969 MB/s</td>
              <td>≈31.5 GB/s</td>
            </tr>
            <tr>
              <th scope="row">PCIe 5.0</th>
              <td><code>32 GT/s</code></td>
              <td>≈3,938 MB/s</td>
              <td>≈63 GB/s</td>
            </tr>
            <tr>
              <th scope="row">PCIe 6.0</th>
              <td><code>64 GT/s</code></td>
              <td>≈7,877 MB/s</td>
              <td>≈126 GB/s</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        PCIe 3.0 through 5.0 use <code>128b/130b</code> encoding, which adds roughly 1.5% of
        overhead so that the receiver can tell whether a bit arrived correctly. PCIe 6.0
        changes the encoding itself: it uses <strong>PAM4</strong>, which carries more bits per
        symbol, wrapped in <strong>FLIT</strong> framing with forward error correction. A
        link is <strong>full duplex</strong>, so those x16 figures are what it moves in each
        direction at the same time — not the total across both.
      </p>
      <PcieGenerationFigure />
      <p>
        Notice that the generation never changes the size of the slot. A PCIe 5.0 x16 slot is
        physically identical to a PCIe 3.0 x16 slot; only the electronics behind it changed.
        That is also why a graphics card rarely cares about the generation — a modern card is
        limited by its own memory bandwidth long before the slot runs out, which is why a
        Gen 5 slot rarely changes a gaming frame rate.
      </p>

      <h2>Lanes: the width of the road</h2>
      <p>
        A <strong>lane</strong> is one independent serial link between exactly two devices.
        Slots are described by how many lanes they carry — x1, x4, x8, x16 — and the two
        ends negotiate the largest number they both support. A card that is x8 in an x16 slot
        runs at x8, and the other eight lanes simply go unused.
      </p>
      <p>
        The common trap is a slot that looks like x16 but is not wired as x16. Plenty of
        boards offer a physical x16 slot that is electrically only <strong>x4</strong>, which
        is fine for a network card and useless for anything that actually needs the
        bandwidth. This is the other half of the “why is my NVMe slow” question — the drive
        may be Gen 4, but if it is in a slot that shares lanes with the graphics card, it may
        be running at a fraction of that.
      </p>

      <h2>M.2: a shape, not a speed</h2>
      <p>
        M.2 is a physical module standard for a compact card — the form factor most NVMe
        drives use. Every M.2 module is 22 mm wide, and the four-digit code gives the size in
        millimetres: <code>2230</code> is 22 × 30 mm, <code>2242</code> is 22 × 42 mm,{' '}
        <code>2260</code> is 22 × 60 mm and <code>2280</code> is 22 × 80 mm. The length is a
        size, nothing more.
      </p>
      <M2FormFactorFigure />
      <p>
        What the slot actually does is decided by the <strong>key</strong> — the notch cut
        into the connector edge:
      </p>
      <ul>
        <li><strong>M key</strong> — up to four PCIe lanes. This is what a modern NVMe drive
          wants.</li>
        <li><strong>B key</strong> — two PCIe lanes.</li>
        <li><strong>B+M key</strong> — two lanes plus a SATA connection on the same module.</li>
      </ul>
      <p>
        The key is a physical limit, and it works one way: an M-key drive will not fit into a
        B-key slot, but a B-key or B+M drive does slide into an M-key socket — it just gets
        two lanes and no SATA connection. The <strong>protocol</strong> is a separate
        question: a drive
        marked NVMe speaks PCIe over the M.2 connector, while a drive marked SATA speaks the
        older SATA protocol over the same shape. M.2 tells you the shape and the key; the
        label tells you the protocol and the speed.
      </p>

      <h2>Lane sharing: the board has a fixed budget</h2>
      <p>
        The CPU has a fixed number of lanes, and it hands them out. A typical modern
        processor offers sixteen lanes for the graphics card, four for the first M.2 slot and
        four more for a second one — and those lanes come out of the same pool. Everything
        else on the board is fed by the chipset instead.
      </p>
      <p>
        This is why <strong>adding a second M.2 drive can slow down your graphics card</strong>.
        If the second M.2 slot is fed by the chipset, nothing is lost. If it shares the
        CPU's lanes with the x16 slot, a four-lane drive can drop the graphics slot from x16
        to x8, and an x8 card is not exactly x16. The board's manual has a lane table that
        says which case you are in, and it is the only reliable source — the physical layout
        of the board tells you nothing.
      </p>

      <h2>Old parts in new slots</h2>
      <p>
        PCIe is backwards compatible, and the link always settles on the lower of the two
        ends. A Gen 5 card in a Gen 4 slot runs at Gen 4 speed. A Gen 3 SSD in a Gen 5 slot
        runs at Gen 3 speed, with the rest of the slot's bandwidth unused. An x8 card in an
        x16 slot runs at x8. Nothing breaks and nothing warns you; the part simply does not
        get to use everything it brought with it.
      </p>

      <p>
        None of this decides what the machine costs to run. A bus is not a power consumer, and
        a Gen 5 slot is not where the watts come from — though a Gen 5 drive does draw a
        little more than a Gen 4 drive of the same size, so the newest link is not
        automatically the cheapest one to run. The{' '}
        <Link to="/guides/storage-explained" className="text-brand-text underline underline-offset-2">
          storage guide
        </Link>{' '}
        has the drive numbers, the{' '}
        <Link to="/guides/gpu-explained" className="text-brand-text underline underline-offset-2">
          GPU guide
        </Link>{' '}
        has the card numbers, and the{' '}
        <Link to="/guides/what-each-component-draws" className="text-brand-text underline underline-offset-2">
          guide to what each component draws
        </Link>{' '}
        puts them on one page. Add the parts you own to the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>{' '}
        and it works out the wall draw and the bill.
      </p>
    </>
  ),
};
