import type { RomFamily } from '@/types/tune-program'

// ─── ROM Family Registry ───────────────────────────────────────────────────────
// Each entry represents a selectable ROM family in the Tune Program UI.
//
// Updated 2026-05-26: v12 source maps. Descriptions corrected per owner spec.
// hasPrivateSources: true if stock originals, OTS BINs, or XDFs confirmed in
// _private_tuning_sources/ during private inventory.
// ─────────────────────────────────────────────────────────────────────────────

export const romFamilies: RomFamily[] = [
  {
    romId: 'I8A0S',
    displayName: 'I8A0S',
    description:
      'Most common MSD80 ROM for 2007–2010 E-series N54 cars. Common on 135i, 335i, 535i, and Z4 35i. Verify in MHD before use.',
    vehicleApplications: [
      '2007–2010 BMW 135i',
      '2007–2010 BMW 335i',
      '2007–2010 BMW 535i',
      '2009–2010 BMW Z4 35i',
      '2011 BMW 1M Coupé',
    ],
    supportedStages: ['stage1plus', 'stage2', 'stage3', 'hybrid-base'],
    supportedFuels: ['91', '93', 'E50'],
    hasPrivateSources: true,
    notes:
      'Private inventory: stock original BIN, v12 OTS maps (stage 1+/2/3 × 91/93/E50), ' +
      'Hybrid Twins V12 (TD03-H + N20). Stock SHA-256: c53ff0d4da3aafb0aee93b2a4df165b4f98229752b2bc2ea694a2699bc396b38. ' +
      'Stage 1 (basic): no v12 source — not available in current program. ' +
      'All packages READY (26 packages validated, 0 stock-byte mismatches).',
  },
  {
    romId: 'IJE0S',
    displayName: 'IJE0S',
    description:
      'Common MSD81 automatic-transmission ROM for later E-series N54 cars. Often found on 6HP automatic 135i/335i/535i. Verify in MHD before use.',
    vehicleApplications: [
      '2007–2010 BMW 135i (automatic)',
      '2007–2010 BMW 335i (automatic)',
      '2007–2010 BMW 535i (automatic)',
      '2009–2010 BMW Z4 35i (automatic)',
    ],
    supportedStages: ['stage1plus', 'stage2', 'stage3', 'hybrid-base'],
    supportedFuels: ['91', '93', 'E50'],
    hasPrivateSources: true,
    notes:
      'Private inventory: stock original BIN, v12 OTS maps, Hybrid Twins V12. ' +
      'Stock SHA-256: 25adcdcc54f698154315f50731db033c5aa48136e93b20a4de8e9e87cba59c18. ' +
      'ALL IJE0S packages: READY (owner-accepted V90 packages, OWNER_ACCEPT 2026-06-08; ' +
      '14 IDENT + 2 CHECKSUM regions stripped). Review BIN only. ' +
      'XHP TCU tune strongly recommended for AT cars at Stage 2 and above.',
  },
  {
    romId: 'IKM0S',
    displayName: 'IKM0S',
    description:
      'Less common MSD81 ROM used on some regional or later-production N54 cars. Verify first before selecting.',
    vehicleApplications: [
      'Select late-production N54 vehicles (region/market specific)',
      'Confirm your ROM version in MHD before selecting this family',
    ],
    supportedStages: ['stage1', 'stage1plus', 'stage2', 'stage3'],
    supportedFuels: ['91', '93', 'E30', 'E50'],
    hasPrivateSources: true,
    notes:
      'Private inventory: stock original BIN, OTS v90 BINs, current XDF. ' +
      'No v12 NEW MAPS series exists for IKM0S — packages built from verified v90 OTS ' +
      '(2026-06-09): Stage 1/1+/2/3 × 91/93/E30/E50 (16 READY). v90 "stage 2+" mapped ' +
      'to stage3. All regions XDF-evidenced; flag byte 0x0470B2 excluded. 95/ACN91 fuels ' +
      'held (future). No Flex Fuel or Hybrid Twins variants; hybrid-base not supported.',
  },
  {
    romId: 'INA0S',
    displayName: 'INA0S',
    description:
      'Later MSD81 ROM used on late E-series N54 applications including 2010+ 135i/335i and some 535i. Verify in MHD before use.',
    vehicleApplications: [
      '2010–2011 BMW 135i',
      '2010–2011 BMW 335i',
      '2010 BMW 535i',
      'Some late-production N54 models — verify in MHD',
    ],
    supportedStages: ['stage1plus', 'stage2', 'stage3', 'hybrid-base'],
    supportedFuels: ['91', '93', 'E50'],
    hasPrivateSources: true,
    notes:
      'Private inventory: stock original BIN (identical SHA confirmed), v12 OTS maps ' +
      '(stage 1+/2/3 × 91/93/E50), Hybrid Twins V12 (TD03-H + N20). ' +
      'Stock SHA-256: 66296babb3f4060ecc9cb8f40faa982651a790c255361a39cd653f448db3f8e0. ' +
      'Stage 1 (basic): no v12 source — not available in current program. ' +
      'All packages READY (13 packages validated, 0 stock-byte mismatches).',
  },
]

export const getRomFamilyById = (id: string): RomFamily | undefined =>
  romFamilies.find((r) => r.romId === id)
