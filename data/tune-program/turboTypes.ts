import type { TurboType } from '@/types/tune-program'

export const turboTypes: TurboType[] = [
  {
    id: 'stock',
    label: 'Stock Turbo',
    description:
      'OEM N54 twin turbos (IHI RHF4 or RHF5). Supports Stage 1 through Stage 3 on full bolt-on builds. Well-documented power ceiling around 450–480whp on E fuels at Stage 3.',
    stageCompatibility: ['stage1', 'stage1plus', 'stage2', 'stage3'],
  },
  {
    id: 'upgraded-stock-frame',
    label: 'Upgraded Stock-Frame',
    description:
      'Larger compressor/turbine wheels in the stock frame housing. Examples: Precision PT4036, Vargas drop-in, Garrett G25 drop-in. Used as base calibration at Stage 3.',
    stageCompatibility: ['stage2', 'stage3'],
  },
  {
    id: 'hybrid',
    label: 'Hybrid Turbo',
    description:
      'Purpose-built hybrid turbos (Vargas VTT, Pure Turbos, EFR, GTX drop-ins). These require a dedicated base calibration and professional tuner-guided log review. Export provides a starting base file only.',
    stageCompatibility: ['hybrid-base'],
  },
]

// NOT SUPPORTED in this version:
// - Single turbo conversion
// - Port injection primary tuning
// These will be added in a future release.

export const getTurboTypeById = (id: string): TurboType | undefined =>
  turboTypes.find((t) => t.id === id)
