/**
 * "Storage explained: hard disks, SATA SSDs and NVMe — and why the fast one costs so little power"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { StorageSpeedFigure } from '@/components/guides/Figures';
import { HardDrive } from 'lucide-react';
import type { Guide } from './types';

export const storageExplained: Guide = {
  slug: 'storage-explained',
  title: 'Storage explained: hard disks, SATA SSDs and NVMe — and why the fast one costs so little power',
  description:
    'How hard disks, SATA SSDs and NVMe drives differ in speed, power and endurance, and why the fastest drive in the build is often the cheapest to run.',
  minutes: 7,
  updated: 'November 2026',
  category: 'hardware',
  icon: HardDrive,
  tags: ['ssd', 'nvme', 'hdd', 'sata', 'storage', 'tbw', 'endurance', 'thermal throttling'],
  body: (
    <>
      <p>
        Storage is where most people's understanding stops at “SSD good, hard disk bad”.
        The interesting part is the opposite of what people expect: the fastest drive in
        the machine is usually also the cheapest to leave running, and the slow one is
        the one that keeps charging you.
      </p>

      <h2>Three kinds of drive</h2>
      <ul>
        <li><strong>Mechanical hard disk (HDD)</strong> — spinning platters and a moving
          head. Roughly 150 MB/s sequential, and around 100–200 random reads per
          second. The random figure is why a hard disk feels slow long before its
          transfer rate gives it away.</li>
        <li><strong>SATA SSD</strong> — flash memory behind a SATA link. Around
          550 MB/s sequential, and here the link is the limit rather than the flash —
          the same drive in a SATA III enclosure would go no faster.</li>
        <li><strong>NVMe over PCIe</strong> — flash behind the PCI Express bus. Roughly
          3,500 MB/s on PCIe 3.0 x4, about 7,000 MB/s on PCIe 4.0 x4, and around
          14,000 MB/s on PCIe 5.0 x4.</li>
      </ul>
      <StorageSpeedFigure />

      <h2>Power: the surprise is in the idle draw</h2>
      <p>
        A hard disk draws roughly <strong>5 W</strong> just sitting there and around
        9–12 W while it spins up. A SATA SSD runs in the 5–8 W range, and an NVMe drive
        typically 7–11 W. So the drive that is nearly a hundred times faster than a hard
        disk is not the expensive one to leave switched on — the spinning disk's idle
        draw is the direct price of its moving parts.
      </p>
      <p>
        In an always-on machine this is the line people forget. Ten hard disks is around
        50 W of idle draw, which is a permanent tax that grows with every drive you add.
        The{' '}
        <Link to="/guides/running-pc-24-7" className="text-brand-text underline underline-offset-2">
          guide to running a PC 24/7
        </Link>{' '}
        works through the idle-hours arithmetic, and the{' '}
        <Link to="/guides/what-each-component-draws" className="text-brand-text underline underline-offset-2">
          guide to what each component draws
        </Link>{' '}
        has the per-part figures.
      </p>

      <h2>Endurance is a write budget, not a lifespan</h2>
      <p>
        Flash wears out because writing to it wears it out, so drives are rated in{' '}
        <strong>TBW</strong> — terabytes written. A 1 TB consumer drive is commonly
        rated somewhere in the 300–600 TBW range, which sounds alarming until you do the
        arithmetic. A machine writing 20 GB a day uses about 7.3 TB a year, so a 300 TBW
        drive has a working life measured in decades at that rate. A machine writing
        hundreds of gigabytes a day — a build cache, a database, a torrent box — is a
        different story, and that is where the endurance rating genuinely decides what
        you can buy.
      </p>
      <p>
        The same reasoning is the argument for a separate, spinning backup disk. It does
        not wear out, it does not need to be connected, and it does not sit there eating
        watts while you are not using it.
      </p>

      <h2>Thermal throttling: the drive slows itself to survive</h2>
      <p>
        Flash and its controller run hot under sustained writes. Left alone, the drive
        slows itself down to protect the flash, and you see it as a benchmark that starts
        fast and then falls away. A PCIe 5.0 drive can visibly lose a large part of its
        speed within minutes without a heatsink, which is why the fastest drives ship
        with, or recommend, a small one.
      </p>
      <p>
        Throttling is a power story as well as a speed one: the controller is still
        working, so the drive is still drawing power while it is slower. A hot, fast
        drive in a case with no airflow is a small heater.
      </p>

      <h2>Which drive for which job</h2>
      <ul>
        <li><strong>Operating system and the games you are playing now</strong> — NVMe.
          Load times and patch installs are where the speed is actually felt.</li>
        <li><strong>A large library of older games</strong> — SATA SSDs are perfectly
          fine. Nothing that runs on a modern graphics card is limited by 550 MB/s.</li>
        <li><strong>Bulk storage and backups</strong> — spinning disks, and
          disconnected when they are not being used.</li>
      </ul>
      <p>
        Storage is one of the few choices in a build that can be changed later without
        replacing anything else, which makes it worth getting right early — and worth
        remembering that the second drive is usually the one to spend the money on.
      </p>

      <p>
        Add the drives to the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>{' '}
        and it prices the build part by part, then converts component draw to wall draw
        through the supply's efficiency curve. If you are trying to work out what the
        machine should be doing while it sits there doing nothing, the{' '}
        <Link to="/guides/cutting-pc-power" className="text-brand-text underline underline-offset-2">
          guide to cutting PC power
        </Link>{' '}
        lists the levers, and storage is one of the quiet ones.
      </p>
    </>
  ),
};
