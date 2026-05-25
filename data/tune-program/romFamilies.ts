import type { RomFamily } from '@/types/tune-program'

// ─── ROM Family Registry ───────────────────────────────────────────────────────
// Each entry represents a selectable ROM family in the Tune Program UI.
//
// hasPrivateSources: true if stock originals, OTS BINs, or XDFs were found in
// _private_tuning_sources/ during private inventory (2026-05-24).
//
// NOT INCLUDED HERE: INA0S — retained in tune file registry for legacy
// compatibility but not exposed as a ROM selector in v1 UI.
// Add INA0S here when ready to actively support it.
// ─────────────────────────────────────────────────────────────────────────────

export const romFamilies: RomFamily[] = [
  {
    romId: 'I8A0S',
    displayName: 'I8A0S',
    description:
      'Most common N54 ROM. Found on the majority of 6-speed manual 135i, 335i, 535i, and Z4 35i (2007–2010). MSD80 DME.',
    vehicleApplications: [
      '2007–2010 BMW 135i (MT)',
      '2007–2010 BMW 335i (MT)',
      '2007–2010 BMW 535i (MT)',
      '2009–2010 BMW Z4 35i (MT)',
      '2011 BMW 1M Coupé',
    ],
    supportedStages: ['stage1', 'stage1plus', 'stage2', 'stage2plus', 'stage3', 'hybrid-base'],
    // Active fuels with confirmed OTS source file coverage (v90 + Hybrid Twins + Flex Fuel)
    supportedFuels: ['91', '93', 'E30', 'E40', 'E50'],
    hasPrivateSources: true,
    notes:
      'Private inventory (2026-05-24): stock original BIN, MapSwitchBase BIN, OTS v90 BINs (stage 1/1+/2/2+ × 91/93/95/ACN91_CAD94/E30/E50), Flex Fuel OTS v6.0 (stage 2/3), Hybrid Twins V12 (TD03-H + N20), current XDF + Legacy XDF. Most complete source coverage of all ROM families.',
  },
  {
    romId: 'IJE0S',
    displayName: 'IJE0S',
    description:
      'Common on N54 cars with the ZF 6HP automatic transmission. Found on AT variants of 335i and 535i (2007–2010). MSD80 DME.',
    vehicleApplications: [
      '2007–2010 BMW 135i (AT)',
      '2007–2010 BMW 335i (AT)',
      '2007–2010 BMW 535i (AT)',
      '2009–2010 BMW Z4 35i (AT)',
    ],
    supportedStages: ['stage1', 'stage1plus', 'stage2', 'stage2plus', 'stage3', 'hybrid-base'],
    supportedFuels: ['91', '93', 'E30', 'E40', 'E50'],
    hasPrivateSources: true,
    notes:
      'Private inventory (2026-05-24): stock original BIN, MapSwitchBase BIN, OTS v90 BINs (stage 1/1+/2/2+ × all fuels), Flex Fuel OTS v6.0 (stage 2/3), Hybrid Twins V12 (TD03-H + N20), current XDF + Legacy XDF. XHP TCU tune strongly recommended for AT cars at Stage 2 and above.',
  },
  {
    romId: 'IKM0S',
    displayName: 'IKM0S',
    description:
      'Less common N54 ROM. Found on specific regional or late-production N54 vehicles. XDFs and OTS source files confirmed in private inventory — no Flex Fuel or Hybrid Twins variants found.',
    vehicleApplications: [
      'Select late-production N54 vehicles (region/market specific)',
      'Confirm your ROM version in MHD before selecting this family',
    ],
    // OTS v90 source files confirmed for these stages only (no stage3/hybrid-base flex fuel variants)
    supportedStages: ['stage1', 'stage1plus', 'stage2', 'stage2plus'],
    supportedFuels: ['91', '93', 'E30', 'E40', 'E50'],
    hasPrivateSources: true,
    notes:
      'Private inventory (2026-05-24): stock original BIN (IKM0S_original.bin + ikm0s_original.bin), MapSwitchBase BIN, OTS v90 BINs (stage 1/1+/2/2+ × 91/93/95/ACN91_CAD94/E30/E50), current XDF (IKM0S.xdf) + Legacy XDF. No Flex Fuel OTS or Hybrid Twins variants found for IKM0S. Stage 3 and hybrid-base not yet supported for this ROM.',
  },
]

export const getRomFamilyById = (id: string): RomFamily | undefined =>
  romFamilies.find((r) => r.romId === id)
