import type { Addon } from '@/types/tune-program'

// Add-ons are display/intake options only.
// They do not change which tune file is selected in v1.
// Future: map to specific add-on tune file variants.

export const addons: Addon[] = [
  {
    id: 'xhp-tcu',
    label: 'XHP / TCU Tune',
    description:
      'Transmission Control Unit tune for ZF 6HP (automatic) transmissions. Improves shift speed, shift firmness, and torque limits. Not applicable to manual transmission cars. Separate purchase — not included in base tune package.',
    displayOnly: true,
  },
  {
    id: 'flex-fuel',
    label: 'Flex Fuel Sensor',
    description:
      'Inline ethanol content sensor allowing the DME to read actual ethanol percentage. Enables dynamic calibration across E0–E85 blends. Requires a flex fuel tune file — not the same as fixed E30/E40/E50 files.',
    displayOnly: true,
  },
  {
    id: 'upgraded-map-sensor',
    label: 'Upgraded MAP Sensor',
    description:
      'Required for Stage 3 and hybrid turbo setups that exceed the OEM 3-bar MAP sensor range. Bosch 4-bar or AEM 3.5-bar are common choices. Must be registered in the tune file.',
    displayOnly: true,
  },
  {
    id: 'hybrid-turbo-setup',
    label: 'Hybrid Turbo Setup',
    description:
      'Indicates the vehicle has a hybrid turbo kit installed. This changes the base tune selection to a hybrid-specific calibration. Requires full hardware details in the intake form.',
    displayOnly: true,
  },
]

export const getAddonById = (id: string): Addon | undefined =>
  addons.find((a) => a.id === id)
