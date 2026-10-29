# Catalog authoring instructions (read fully before writing anything)

You are expanding the hardware catalog of a PC power calculator to cover **every
majorly-sold consumer/enthusiast/workstation/server part from 2000 through 2026**.

## Step 1 — Read the existing data first

Read `src/data/components.json` in this repo. You must **ONLY ADD entries that do
not already exist**. Duplicate detection is by normalized
`(category, brand, model)` — "GeForce RTX 4070" vs "GeForce RTX 4070 " vs
"geforce rtx 4070" are the same. Also read `src/types/component.ts` for the type.

## Step 2 — Write exactly one JSON file

Write a **raw JSON array** (no wrapper object, no comments, no trailing commas,
UTF-8) to the file path given to you. Every entry:

```json
{
  "id": "cpu-intel-core-2-duo-e6600",
  "category": "cpu",
  "brand": "Intel",
  "model": "Core 2 Duo E6600",
  "releaseYear": 2006,
  "tdp_w": 65,
  "specs": { "cores": 2, "threads": 2, "socket": "LGA775" },
  "source": "intel.com",
  "addedAt": "2026-10-29"
}
```

Field rules:
- `id`: unique, kebab-case, prefix by category using the EXISTING conventions:
  `cpu-`, `gpu-`, `storage-`, `ram-`, `mb-` (motherboard), `psu-`, `cooler-`,
  `monitor-`, `addon-` (add_in_card), `optical-`, `ups-`, `peripheral-`.
  Prefix pattern: `<prefix><brand-kebab>-<model-kebab>`, e.g. `gpu-nvidia-geforce-fx-5900`.
- `category`: one of `cpu | gpu | ram | storage | motherboard | psu | cooler |
  fan | monitor | add_in_card | optical_drive | ups | peripheral`.
- `brand`: canonical display name (Intel, AMD, NVIDIA, ATI (pre-2006 ATI cards),
  Samsung, Seagate, WD, Corsair, ...).
- `model`: display name exactly as commonly written (e.g. "Core i7-2600K",
  "GeForce 8800 GT", "Radeon HD 4870", "Athlon 64 3200+").
- `releaseYear`: market launch year, 2000–2026 inclusive.
- `tdp_w`: number (Watts) or `null`. See per-category guidance. This is the
  part's power draw (NOT cooler capacity — coolers use `specs.tdp_rating_w`).
- `specs`: object, keys depend on category (below). Only include keys you know.
- `source`: short provenance, e.g. "intel.com", "ark.intel.com", "techpowerup",
  "vendor-spec", or "estimate" when you are not confident in the number.
  Prefer "estimate" over a wrong confident value.
- `addedAt`: always `"2026-10-29"`.

## Per-category spec keys and TDP guidance

### cpu
- specs: `{ cores, threads, socket, igpu? (true|false), tdp_mode? }`.
  Match existing entries' style. Socket values like "LGA775", "AM3+", "LGA1700",
  "AM5", "FP7", "BGA2049", "Socket 478", "Socket 939", "SP5", "TR5".
- tdp_w: the processor's TDP / default envelope as documented (Intel: processor
  base TDP, e.g. 65/88/125; K-chips: their rated base power e.g. 125;
  Alder Lake+ K: 125; laptop chips: their documented TDP, e.g. 15/28/45/55).
- Cover both desktop AND the mobile/server lines assigned to you.

### gpu
- specs: `{ vram_gb, vram_type, length_mm? }`; for iGPU entries use
  `{ vram_gb: 0, vram_type: "shared" }`.
- tdp_w: total board power (TBP) for discrete cards (e.g. 8800 GT = 105,
  GTX 260 = 182, HD 4870 = 130, RTX 4090 = 450). For iGPUs: the GPU's typical
  added package power estimate (e.g. Intel GMA 950 = 5, UHD 770 = 15, Radeon
  780M ≈ 25), source "estimate" is fine.
- Keep `length_mm` only when you are confident; omit otherwise.

### ram
- specs: `{ capacity_gb, generation, speed_mt_s, sticks, voltage? }`.
  generations: "DDR" (2000–2006), "DDR2", "DDR3", "DDR4", "DDR5".
  tdp_w: per-module draw estimate (DDR=6, DDR2=4, DDR3=4, DDR4=3-5, DDR5=5-8;
  higher for overclocked/high-capacity kits). Use whole numbers.
  Prefer era-authentic generic part families (e.g. "Corsair XMS DDR-400 512MB",
  "Kingston ValueRAM DDR2-800 2GB", "Crucial Ballistix DDR3-1600 8GB") plus
  representative enthusiast kits per era (Corsair Dominator/G.Skill Trident...).

### storage
- specs: `{ type: "IDE-HDD"|"HDD"|"SATA-SSD"|"NVMe", capacity_gb, rpm?,
  read_mbps?, write_mbps?, form_factor? }`.
  "IDE-HDD" = parallel ATA drives (2000–2008), "HDD" = SATA spinning disks.
- tdp_w: typical active draw: IDE HDD 8-13 (3.5"), 5-6 (2.5"); SATA HDD 6-10;
  SATA SSD 2-4; NVMe 5-8 (large/high-end up to 10-12; PCIe 4/5 Gen5 up to 11).

### motherboard
- specs: `{ socket, chipset, form_factor, ram_type, max_ram_gb?, sata_ports?,
  m2_slots?, pcie_version? }`. Include era-appropriate fields only.
- `chipset` MUST match a key in `power_profiles.json` ->
  `motherboardChipsetPowerW` (the app models board draw from it). For boards
  whose exact chipset is unknown, use the GENERIC chipset keys instead of
  inventing one: `generic-modern` (2017+, 8 W), `generic-modern-itx` (7 W),
  `generic-2010s` (11 W), `generic-2010s-itx` (10 W), `generic-2000s` (15 W),
  `generic-hedt` (18 W), `generic-server` (20 W).
- tdp_w: typical board idle-ish base draw the app models via chipset table —
  set `tdp_w` to a reasonable estimate: 2000s boards 10-20 (more chips on
  board), 2010s 7-12, modern 6-12, HEDT/server 15-25.

### psu
- specs: `{ wattage_w, efficiency, modular? }` where efficiency is one of
  `"none"|"80-plus"|"Bronze"|"Silver"|"Gold"|"Platinum"|"Titanium"` (capitalized
  award name, "none" for pre-80+ generic units). tdp_w: 0 (PSUs don't add to
  component draw).
- Cover era-authentic generic units (e.g. "Generic ATX 350W (2003)", source
  "estimate") and popular branded lines across eras (Antec/Seasonic/Corsair
  TX/RM, be quiet!, EVGA G2, Super Flower).

### cooler
- specs: `{ type: "air"|"aio", fan_count, tdp_rating_w }` (tdp_rating_w =
  cooling capacity, e.g. NH-D15 = 220). tdp_w = fan+pump draw: air 2-6 by fan
  count, AIO 8-18 (pump + 2-3 fans). Stock coolers: brand "Generic",
  e.g. "Intel LGA775 Stock Cooler", "AMD Wraith Stealth".

### fan
- Individual case fans (the build also has a bulk case-fan count slider).
  specs: `{ type: "case-fan", size_mm, control: "dc"|"pwm",
  lighting: "none"|"rgb"|"argb" }`. tdp_w = typical draw: 80mm 1.2,
  92mm 1.5, 120mm DC 1.8 / PWM 2.5 / high-RPM 4.5 / RGB or ARGB 3,
  140mm DC 2.2 / PWM 3 / ARGB 3.5, 200mm RGB 3.

### monitor
- specs: `{ type: "CRT"|"LCD", size_in, resolution, refresh_hz, panel_w,
  panel_type? }`. panel_w = typical draw in W. CRTs 2000-2006: 17" = 70,
  19" = 80, 21" = 100-120. Early LCD 15" = 25, 17" = 30, 19" = 35.
  Modern era monitors: use real spec numbers (consumer 24" IPS ≈ 15-25,
  27" 1440p ≈ 30-40, 32" 4K ≈ 40-60, OLED 27" ≈ 40-50).

### add_in_card
- specs: `{ interface: "PCI"|"PCIe-x1"|..., function: "sound-card"|"nic"|
  "wifi"|"modem"|"tv-tuner"|"usb-card"|"firewire-card"|"raid-card"|"capture-card" }`.
  tdp_w: realistic draw (56k modem 3, basic NIC 2, WiFi card 2-4, Sound Blaster
  Live 5, Audigy 6, Xonar 5, TV tuner 6-10, USB3 card 4, RAID card 10-20).

### optical_drive
- specs: `{ type: "cd-rw"|"dvd"|"dvd-rw"|"blu-ray"|"blu-rw" }`. tdp_w:
  CD-RW 10, DVD-ROM 10, DVD±RW 8-12, Blu-ray reader 12, writer 15-20.

### ups
- specs: `{ capacity_va, capacity_w }`. tdp_w: 0.

### peripheral
- specs: `{ type: "keyboard"|"mouse"|"webcam"|"speakers"|"headset"|"printer"|
  "scanner"|"gamepad"|"joystick"|"drawing-tablet"|"external-hdd"|"docking-station" }`
  plus `watts` where helpful. tdp_w = typical draw (keyboard 2-3, mouse 1-2,
  webcam 2-5, 2.0 speakers 6, 5.1 set 30-45, headset 2, inkjet printer standby
  5/active 20, laser printer idle 10, gamepad 2, external HDD 5-9).

## Accuracy rules

- Prefer correctness over volume: if you are not confident about a specific
  SKU's wattage, either omit it or set your best figure with `source: "estimate"`.
- Real, well-known values are expected to be exact from memory (e.g. Pentium 4
  3.0E = 89W, Athlon 64 3200+ = 89W (ClawHammer), 8800 GT = 105W, GTX 260 = 182W).
- Do not invent SKUs that never existed. When in doubt, cover fewer SKUs but
  canonical ones. Aim for the milestone SKUs that enthusiasts actually search for.
- Every entry's releaseYear must be within your assigned window.

## Final check before finishing

1. `python3 -c "import json,sys; json.load(open('<yourfile>'))"` passes (or
   equivalent JSON validation).
2. No entry duplicates an existing (category, brand, model) from components.json.
3. Report the number of entries you wrote.
