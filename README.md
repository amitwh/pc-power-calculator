# PC Power Calculator

> A global, open-source calculator for estimating the **power consumption** and **electricity cost** of a personal computer — in any local currency.

Pick your components, set the workload, and see how much power your PC draws and what it costs to run. Compare configurations side by side and get suggestions on power-vs-performance trade-offs.

**Status:** 🛠️ *Design in progress* — see the [Design notes](#design-notes) below for what's settled and what's still open. The tech stack and full feature set will be locked in once the design is approved.

---

## ✨ Features (planned)

- 🧩 **Component selection** — CPU (socket/TDP), GPU, RAM (per stick), storage (HDD/SSD/NVMe), PSU, monitors, and common peripherals (fans, RGB, AIO pump, etc.).
- ⚡ **Power calculation** — sum of component TDPs, adjusted by a per-workload utilization factor (idle, browsing, office, gaming, rendering, mining, etc.).
- 🌍 **Localised cost** — country- and where available state/region-aware electricity tariff; result shown in the local currency with a manual override.
- ⏱️ **Time horizon** — daily, monthly, yearly cost projections based on a usage schedule (hours/day at each load).
- 🔄 **Compare builds** — side-by-side comparison of 2–N configurations: cost, kWh, carbon-equivalent (where available).
- 💡 **Suggestions** — flag configurations where a different part gives comparable performance at lower power (e.g., a 65 W CPU vs. a 125 W CPU for the same workload).

---

## 📦 Data sources

- **Component TDPs / specs:** curated JSON bundled with the app (covers ~300 popular parts). Last-updated date shown in the UI.
- **Electricity tariffs:** bundled JSON for major countries, with a free public API used as a fallback when a user's country isn't bundled.
- **FX rates:** free public FX-rate API, refreshed on a daily cadence (or bundled snapshot if the API is unavailable).
- **Manual override:** the user can always type their own rate and currency — their actual bill is the ground truth.

---

## 🚀 Getting started

This section will be filled in once the tech stack is finalised. Expected commands will be something like:

```bash
# install
npm install        # or pnpm / yarn / uv / etc.

# run dev
npm run dev

# build for production
npm run build
```

---

## 🧭 Design notes

Decisions confirmed so far (more to come):

| Question | Decision |
| --- | --- |
| **Scope** | Stateless calculator — no accounts, no saved builds, no backend, no database in v1. |
| **Data sources** | Bundled curated JSON for components + bundled JSON for tariffs + free public APIs for fallback rates and FX, with manual override always available. |
| **License** | TBD — to be added once the tech stack and contribution policy are finalised. |

Open questions still being explored:

- Tech stack (frontend framework, build tool, hosting).
- Comparison feature depth (cost-only vs. include workload-specific performance benchmarks).
- How to handle tax/VAT/surcharges in tariff calculations.

A formal design document will land in `docs/superpowers/specs/` once the open questions are resolved.

---

## 🤝 Contributing

Contributions are welcome once the design is finalised and the contribution guidelines are published. In the meantime, please open an issue to discuss ideas before sending a PR.

---

## 📄 License

License TBD.
