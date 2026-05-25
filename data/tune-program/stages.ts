import type { Stage } from '@/types/tune-program'

export const stages: Stage[] = [
  {
    id: 'stage1',
    label: 'Stage 1',
    description:
      'Software-only tune on stock hardware. Optimized boost, ignition, and fueling for stock turbos. Best starting point for unmodified cars.',
    turboCompatibility: ['stock'],
    fuelCompatibility: ['91', '93', 'E30'],
    requiredMods: [],
    recommendedMods: [
      'Fresh OEM-spec spark plugs (NGK LZKAR7A-11 or equivalent)',
      'Charge pipe inspection — no soft boots',
      'HPFP health check (no degraded cam follower)',
      'Battery in good health (12.5V+ resting)',
    ],
  },
  {
    id: 'stage1plus',
    label: 'Stage 1+',
    description:
      'Stage 1 with additional intake and charge cooling support. Optimized for cars with intake and intercooler upgrades. Still stock turbo.',
    turboCompatibility: ['stock'],
    fuelCompatibility: ['91', '93', 'E30', 'E40'],
    requiredMods: [
      'Upgraded intake (VRSF, Burger Motorsports, or equivalent)',
    ],
    recommendedMods: [
      'VRSF or Mishimoto FMIC',
      'Silicone charge pipes with couplers',
      'Boost leak test passed',
      'NGK R7437-9 or equivalent performance plugs',
    ],
  },
  {
    id: 'stage2',
    label: 'Stage 2',
    description:
      'High-flow exhaust and intake combination. Requires upgraded downpipes. Significant power gains on stock turbos with proper hardware.',
    turboCompatibility: ['stock', 'upgraded-stock-frame'],
    fuelCompatibility: ['91', '93', 'E30', 'E40'],
    requiredMods: [
      'Upgraded intake',
      'Catless or high-flow catted downpipes',
    ],
    recommendedMods: [
      'Front mount intercooler',
      'Silicone charge pipes',
      'Boost leak test passed',
      'HPFP tested and healthy',
      'Performance spark plugs gapped to spec',
    ],
  },
  {
    id: 'stage2plus',
    label: 'Stage 2+',
    description:
      'Pushing stock frame turbos toward their limits. Requires full bolt-on package. Ethanol fuels strongly recommended for maximum reliability.',
    turboCompatibility: ['stock', 'upgraded-stock-frame'],
    fuelCompatibility: ['91', '93', 'E30', 'E40', 'E50'],
    requiredMods: [
      'Upgraded intake',
      'Catless or high-flow catted downpipes',
      'Front mount intercooler',
      'Silicone charge pipes',
    ],
    recommendedMods: [
      'Upgraded HPFP internals (Fuel-It Stage 2+)',
      'Upgraded LPFP (Fuel-It or equivalent)',
      'Walbro 450 or dual pump setup for E50',
      'Port injection consideration for E50 targets',
      'Water-methanol injection for sustained pulls',
    ],
  },
  {
    id: 'stage3',
    label: 'Stage 3',
    description:
      'Upgraded stock-frame or oversized turbos only. Full bolt-on hardware required. Ethanol strongly recommended. Requires tuner review before export.',
    turboCompatibility: ['upgraded-stock-frame'],
    fuelCompatibility: ['91', '93', 'E30', 'E40', 'E50'],
    requiredMods: [
      'Upgraded stock-frame turbos (Precision, Garrett, or equivalent drop-ins)',
      'Upgraded intake manifold or throttle body',
      'Catless downpipes',
      'Front mount intercooler',
      'Fuel system upgrade (HPFP + LPFP)',
    ],
    recommendedMods: [
      'E30–E50 ethanol blend',
      'Port injection support',
      'Upgraded charge piping',
      'Cooling system service (thermostat, water pump)',
      'Drivetrain inspection',
    ],
  },
  {
    id: 'hybrid-base',
    label: 'Hybrid Turbo Base Tune',
    description:
      'Base calibration for hybrid turbo setups. This is NOT a final tune — it is a starting point for tuner-guided calibration on hybrid turbos. Requires professional log review.',
    turboCompatibility: ['hybrid'],
    fuelCompatibility: ['E30', 'E40', 'E50'],
    requiredMods: [
      'Hybrid turbo kit installed (Vargas, Pure, EFR, or equivalent)',
      'Full fuel system upgrade',
      'Front mount intercooler',
      'Catless downpipes',
    ],
    recommendedMods: [
      'Flex fuel sensor + tune',
      'Upgraded MAP sensor (4-bar or 3-bar)',
      'Port injection for E50+ targets',
      'Upgraded charge cooling',
      'Professional dyno session recommended',
    ],
  },
]

export const getStageById = (id: string): Stage | undefined =>
  stages.find((s) => s.id === id)
