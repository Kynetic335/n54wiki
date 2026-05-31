import { readableStageDiffs, type DiffReviewStatus } from './readableStageDiffs'
import {
  getParameterById,
  parameterCategories,
  type ParameterCategory,
  type RomId,
  type SourceReference,
  type StageId,
} from './tuningParameters'

export type RecipeFuelId = '91' | '93' | 'e20' | 'e30' | 'e40' | 'e40-e50' | 'e50' | 'e50-e60' | 'e85'

export type RecipeChange = {
  parameterId?: string
  mapName?: string
  category?: ParameterCategory
  stock: string
  tuned: string
  why: string
  changedCellCount?: number
  totalCellCount?: number
  units?: string | null
  reviewStatus?: DiffReviewStatus
  reviewReason?: string
}

export type CalibrationRecipe = {
  rom: RomId
  stage: StageId
  fuel: RecipeFuelId
  title: string
  hardwareAssumptions: string[]
  calibrationIntent: string
  changes: RecipeChange[]
  datasetStatus?: 'CURATED_SCAFFOLD' | 'READABLE_DIFF'
  changedParameterCount?: number
  logsToVerify?: string[]
  failureSigns?: string[]
  sourceReferences?: SourceReference[]
}

const stageLabels: Record<StageId, string> = {
  'stage-1': 'Stage 1',
  'stage-2': 'Stage 2',
  'stage-3': 'Stage 3',
  'hybrid-base': 'Hybrid Base',
}

const stockTurboAssumptions = [
  'MSD80/MSD81 N54 with healthy stock turbochargers.',
  'No active boost leaks, misfires, fuel-pressure faults, VANOS faults, or unresolved shadow faults.',
  'Fresh one-step-colder plugs gapped for the requested load, healthy coils, known injector index/health, and clean oil-control behavior.',
  'Logs reviewed before increasing load, timing, or limiter headroom.',
]

const localDiffSource: SourceReference = {
  source: 'Local BIN/XDF Diff',
  locator: 'Readable stock-to-tuned diff summary',
  note: 'App-safe derived data only; private binaries, XDF addresses, checksums, paths, and patch bytes are not exposed.',
}

const n54GuideSource: SourceReference = {
  source: 'N54 Tuning Guide',
  locator: 'Stage, logging, boost, fueling, ignition, and safety workflow sections',
  note: 'Summarized into original recipe teaching language.',
}

const spreadsheetSource: SourceReference = {
  source: 'N5X Tuning Spreadsheet',
  locator: 'N5X map category worksheets',
  note: 'Used for map naming and category normalization.',
}

const readableDiffRecipes: CalibrationRecipe[] = readableStageDiffs.map((diff) => ({
  rom: diff.rom,
  stage: diff.stage,
  fuel: diff.fuel,
  title: `${diff.rom} ${stageLabels[diff.stage]} ${diff.fuel.toUpperCase()} Readable Diff`,
  datasetStatus: diff.datasetStatus,
  changedParameterCount: diff.changedParameterCount,
  logsToVerify: ['Boost target vs actual', 'WGDC base vs after PID', 'Throttle angle', 'Lambda requested vs actual', 'HPFP pressure', 'Timing corrections'],
  failureSigns: ['Throttle closure under WOT', 'WGDC pegged with low boost', 'Lambda actual missing target', 'HPFP pressure drop', 'Multi-cylinder timing correction'],
  sourceReferences: [localDiffSource, spreadsheetSource],
  hardwareAssumptions: [
    'Derived from a local stock BIN to tuned BIN comparison through the matching legacy XDF.',
    'App-safe dataset only: no BIN bytes, XDF addresses, checksums, private paths, or patch data are exposed.',
    'Items marked NEEDS_REVIEW are semantic/toggle/diagnostic/intervention tables that require calibrator validation before being taught as strategy.',
  ],
  calibrationIntent:
    `${diff.rom} ${stageLabels[diff.stage]} ${diff.fuel.toUpperCase()} readable diff lists every XDF-defined map that changed from stock in the currently readable source set.`,
  changes: diff.changedParameters.map((parameter) => ({
    mapName: parameter.mapName,
    category: parameter.category,
    stock: parameter.stockSummary,
    tuned: parameter.tunedSummary,
    why: parameter.changeType,
    changedCellCount: parameter.changedCellCount,
    totalCellCount: parameter.totalCellCount,
    units: parameter.units,
    reviewStatus: parameter.reviewStatus,
    reviewReason: parameter.reviewReason,
  })),
}))

const stageChangeTemplates: Record<'stage-1' | 'stage-2' | 'stage-3', RecipeChange[]> = {
  'stage-1': [
    {
      parameterId: 'boost-target',
      stock: 'Stock load/boost curve with conservative midrange request.',
      tuned: 'Moderate midrange request increase with a stock-turbo taper up top.',
      why: 'Stage 1 93 uses the efficient part of the stock twins without forcing high-RPM shaft speed or excessive charge temperature.',
    },
    {
      parameterId: 'base-wgdc',
      stock: 'Factory feed-forward duty intended for stock torque request.',
      tuned: 'Small spool and steady-state corrections matched to the new target.',
      why: 'Base duty is aligned so PID correction does not have to carry the entire boost increase.',
    },
    {
      parameterId: 'lambda-target',
      stock: 'Factory WOT enrichment profile.',
      tuned: 'Slightly richer high-load target where cylinder pressure and turbine heat increase.',
      why: 'The tune adds torque while preserving knock and exhaust-temperature margin on pump fuel.',
    },
    {
      parameterId: 'ignition-main',
      stock: 'Factory timing curve for stock load.',
      tuned: 'Conservative 93-octane timing at the raised load cells.',
      why: 'Timing follows the new load request and leaves room for IAT and fuel-quality variation.',
    },
    {
      parameterId: 'load-limiters',
      stock: 'Factory load ceiling near stock request.',
      tuned: 'Limiter headroom raised slightly above the tuned request.',
      why: 'Prevents false closure while keeping a defined ceiling above the intended target.',
    },
  ],
  'stage-2': [
    {
      parameterId: 'boost-target',
      stock: 'Stock load/boost curve.',
      tuned: 'Higher midrange target with controlled taper for downpipes and improved airflow.',
      why: 'Stage 2 assumes reduced exhaust backpressure, so the stock twins can support more torque without the same turbine pressure penalty.',
    },
    {
      parameterId: 'wgdc-ceiling',
      stock: 'Factory maximum wastegate authority.',
      tuned: 'Selective ceiling increase where logs show healthy boost control headroom is needed.',
      why: 'The ceiling gives the controller enough authority for the new target without globally maxing wastegate duty.',
    },
    {
      parameterId: 'lambda-target',
      stock: 'Factory WOT enrichment.',
      tuned: 'Richer peak-torque enrichment with stable top-end target.',
      why: 'More boost and airflow require stronger combustion-temperature and knock margin on 93.',
    },
    {
      parameterId: 'ignition-main',
      stock: 'Factory spark table.',
      tuned: 'Load-corrected pump-gas timing with conservative peak-torque advance.',
      why: 'More cylinder pressure demands less aggressive timing than a lower-load cell would suggest.',
    },
    {
      parameterId: 'gear-load-limits',
      stock: 'Factory gear torque shaping.',
      tuned: 'Low-gear torque kept slightly softer than upper gears.',
      why: 'Stage 2 torque can overwhelm street tires and drivetrain mounts if all limits are opened at once.',
    },
    {
      parameterId: 'fuel-pressure-protection',
      stock: 'Factory fuel-pressure intervention behavior.',
      tuned: 'Protection retained with no broad weakening.',
      why: 'Stage 2 pump gas should not need protection relaxed; a pressure drop is a mechanical readiness issue.',
    },
  ],
  'stage-3': [
    {
      parameterId: 'boost-target',
      stock: 'Stock load/boost curve.',
      tuned: 'Aggressive stock-turbo request with clear high-RPM taper.',
      why: 'Stage 3 is the upper stock-turbo strategy: strong midrange, then taper to keep shaft speed and charge heat under control.',
    },
    {
      parameterId: 'base-wgdc',
      stock: 'Factory WGDC base table.',
      tuned: 'Reworked base duty through spool and peak-torque cells.',
      why: 'At this airflow level the boost controller needs accurate feed-forward to avoid oscillation or throttle intervention.',
    },
    {
      parameterId: 'boost-ceiling',
      stock: 'Factory pressure ceiling close to stock boost behavior.',
      tuned: 'Ceiling raised only enough to sit above the expected tuned pressure trace.',
      why: 'Stage 3 needs protection headroom, but ceiling maps must still catch true overboost.',
    },
    {
      parameterId: 'lambda-target',
      stock: 'Factory WOT enrichment.',
      tuned: 'Richest pump-gas profile of the stock-turbo stages.',
      why: 'The stock twins generate significant heat at Stage 3 load; enrichment protects knock and exhaust-temperature margin.',
    },
    {
      parameterId: 'ignition-main',
      stock: 'Factory spark table.',
      tuned: 'Conservative 93 timing with strong correction review requirement.',
      why: 'Stock turbos at high load leave limited pump-gas knock margin, so timing is validated by logs rather than assumed.',
    },
    {
      parameterId: 'throttle-load-protection',
      stock: 'Factory torque/load monitoring envelope.',
      tuned: 'Torque model and protection headroom aligned to the Stage 3 load curve.',
      why: 'Avoids unwanted closure while preserving intervention for real overboost or load overshoot.',
    },
  ],
}

export const recipes: CalibrationRecipe[] = (['I8A0S', 'IJE0S'] as RomId[]).flatMap((rom) =>
  (['stage-2', 'stage-3'] as const).map((stage) => ({
    rom,
    stage,
    fuel: '93' as const,
    title: `${rom} ${stageLabels[stage]} 93 Stock Turbo`,
    datasetStatus: 'CURATED_SCAFFOLD' as const,
    logsToVerify: ['Boost target vs actual', 'WGDC after PID', 'Lambda requested vs actual', 'HPFP pressure', 'Timing corrections'],
    failureSigns: ['Throttle closure', 'Boost oscillation', 'Lean lambda', 'Fuel pressure sag', 'Timing corrections across cylinders'],
    sourceReferences: [n54GuideSource, spreadsheetSource],
    hardwareAssumptions: [
      ...stockTurboAssumptions,
      'Free-flowing downpipes and upgraded intercooler assumed before this recipe is validated.',
    ],
    calibrationIntent:
      `${stageLabels[stage]} 93 keeps the stock twins inside a log-validated pump-gas window: raise load where the hardware is efficient, taper where heat rises, and preserve safety logic.`,
    changes: stageChangeTemplates[stage],
  })),
)

export const hybridRecipeScaffold: CalibrationRecipe[] = (['I8A0S', 'IJE0S'] as RomId[]).flatMap((rom) =>
  (['93', 'e50', 'e85'] as const).map((fuel) => ({
    rom,
    stage: 'hybrid-base' as const,
    fuel,
    title: `${rom} Hybrid Base ${fuel.toUpperCase()}`,
    datasetStatus: 'CURATED_SCAFFOLD' as const,
    logsToVerify: ['Boost target vs actual', 'WGDC after PID', 'Lambda requested vs actual', 'HPFP pressure', 'LPFP pressure', 'Timing corrections', 'IAT'],
    failureSigns: ['Overboost', 'WGDC oscillation', 'Lean lambda', 'Fuel pressure drop', 'Compressor surge', 'Timing correction under spool'],
    sourceReferences: [n54GuideSource, spreadsheetSource],
    hardwareAssumptions: [
      'Stock-frame hybrid turbochargers with verified wastegate control and N20/MAP-sensor scaling where required.',
      'Upgraded intercooler, downpipes, charge pipe, and fuel system matched to fuel blend.',
      'Base tune only: first revision should target controlled boost, conservative timing, and clean fuel pressure before power is increased.',
    ],
    calibrationIntent:
      'Hybrid base tuning starts by lowering risk: reshape boost and WGDC for larger compressors, keep timing conservative, verify fuel pressure, then iterate from logs.',
    changes: [
      {
        parameterId: 'boost-target',
        stock: 'Stock-turbo load profile.',
        tuned: 'Lower initial hybrid request than final power target, with smooth ramp and conservative top-end.',
        why: 'Hybrid compressors move more air at lower duty; the base file should prove control before chasing peak boost.',
      },
      {
        parameterId: 'base-wgdc',
        stock: 'Stock turbo feed-forward.',
        tuned: 'Rebased for hybrid wastegate flow and actuator behavior.',
        why: 'Stock WGDC shape can overshoot or oscillate on hybrids because turbo response and flow are no longer stock.',
      },
      {
        parameterId: 'lambda-target',
        stock: 'Factory WOT enrichment.',
        tuned: 'Fuel-specific conservative enrichment.',
        why: 'The base file protects fuel pressure and combustion temperature while the real airflow model is validated.',
      },
      {
        parameterId: 'ignition-main',
        stock: 'Factory timing at stock load.',
        tuned: 'Conservative timing in the new load cells.',
        why: 'Hybrid airflow changes cylinder pressure quickly; timing should be earned through clean logs.',
      },
      {
        parameterId: 'load-limiters',
        stock: 'Stock load ceiling.',
        tuned: 'Raised only to the base-tune request plus safety margin.',
        why: 'The first hybrid file should not open every limiter; it should define a controlled validation window.',
      },
    ],
  })),
)

const requestedFuelScaffoldCombos = (['I8A0S', 'IJE0S'] as RomId[]).flatMap((rom) =>
  (['stage-1', 'stage-2', 'stage-3'] as const).flatMap((stage) =>
    (['e30', 'e50', 'e85'] as const).map((fuel) => ({ rom, stage, fuel })),
  ),
)

const requestedFuelScaffoldRecipes: CalibrationRecipe[] = requestedFuelScaffoldCombos.map(({ rom, stage, fuel }) => ({
  rom,
  stage,
  fuel,
  title: `${rom} ${stageLabels[stage]} ${fuel.toUpperCase()} Stock Turbo`,
  datasetStatus: 'CURATED_SCAFFOLD',
  hardwareAssumptions: [
    ...stockTurboAssumptions,
    'Fuel system must be validated for the requested ethanol content before increasing load or timing.',
    'This page is a teaching scaffold until a matching stock-vs-tuned BIN diff is available.',
  ],
  calibrationIntent:
    `${rom} ${stageLabels[stage]} ${fuel.toUpperCase()} is reserved for a real BIN/XDF diff. The page teaches the workflow without inventing exact tuned values.`,
  logsToVerify: ['Ethanol content active or confirmed fixed blend', 'Lambda requested vs actual', 'HPFP pressure', 'LPFP pressure', 'Timing corrections', 'Boost target vs actual'],
  failureSigns: ['Ethanol content mismatch', 'Rail pressure drop', 'Lean lambda', 'Timing corrections', 'Throttle closure', 'WGDC at ceiling'],
  sourceReferences: [n54GuideSource, spreadsheetSource],
  changes: [
    {
      mapName: 'Load Target 1',
      category: 'Boost Control',
      stock: 'Awaiting real BIN diff',
      tuned: 'Awaiting real BIN diff',
      why: 'Ethanol recipes normally reshape load around fuel-system and knock-margin limits, but exact values must come from the actual ROM/fuel BIN diff.',
      reviewStatus: 'NEEDS_REVIEW',
      reviewReason: 'No matching readable tuned BIN diff has been promoted for this exact ROM/stage/fuel page.',
    },
    {
      mapName: 'Fuel Main / Lambda Target',
      category: 'Fueling',
      stock: 'Awaiting real BIN diff',
      tuned: 'Awaiting real BIN diff',
      why: 'Fuel and lambda strategy must match ethanol content, pressure margin, and bank behavior. Exact values are intentionally not invented.',
      reviewStatus: 'NEEDS_REVIEW',
      reviewReason: 'Requires exact stock-vs-tuned BIN comparison before publishing values.',
    },
    {
      mapName: 'Timing Main',
      category: 'Ignition',
      stock: 'Awaiting real BIN diff',
      tuned: 'Awaiting real BIN diff',
      why: 'Timing must be earned from logs and fuel quality. Ethanol does not justify copying timing values from another car.',
      reviewStatus: 'NEEDS_REVIEW',
      reviewReason: 'Requires logs and exact BIN diff before exact tuned profile is documented.',
    },
  ],
}))

const hasReadableDiff = (recipe: CalibrationRecipe) =>
  readableDiffRecipes.some(
    (readable) =>
      readable.rom === recipe.rom &&
      readable.stage === recipe.stage &&
      readable.fuel === recipe.fuel,
  )

export const allRecipes = [
  ...readableDiffRecipes,
  ...recipes.filter((recipe) => !hasReadableDiff(recipe)),
  ...requestedFuelScaffoldRecipes.filter((recipe) => !hasReadableDiff(recipe)),
  ...hybridRecipeScaffold,
]

export const getRecipe = (rom: string, stage: string, fuel: string): CalibrationRecipe | undefined =>
  allRecipes.find(
    (recipe) =>
      recipe.rom.toLowerCase() === rom.toLowerCase() &&
      recipe.stage === stage &&
      recipe.fuel.toLowerCase() === fuel.toLowerCase(),
  )

export const getChangesByCategory = (recipe: CalibrationRecipe): Record<ParameterCategory, RecipeChange[]> => {
  const grouped: Record<ParameterCategory, RecipeChange[]> = {
    'Boost Control': [],
    Fueling: [],
    Ignition: [],
    VANOS: [],
    'Safety & Protections': [],
    'Drivability & Misc': [],
    'MHD+': [],
  }

  for (const change of recipe.changes) {
    if (change.category) {
      grouped[change.category].push(change)
      continue
    }

    const parameter = change.parameterId ? getParameterById(change.parameterId) : undefined
    if (parameter) grouped[parameter.category].push(change)
  }

  return grouped
}

export const getRecipePath = (recipe: CalibrationRecipe) =>
  `/recipes/${recipe.rom.toLowerCase()}/${recipe.stage}/${recipe.fuel.toLowerCase()}`

export const formatStage = (stage: StageId) => stageLabels[stage]
