import { teachingExpansionParameters } from './teachingExpansionParameters'

export const parameterCategories = [
  'Boost Control',
  'Fueling',
  'Ignition',
  'VANOS',
  'Safety & Protections',
  'Drivability & Misc',
  'MHD+',
] as const

export type ParameterCategory = (typeof parameterCategories)[number]
export type Difficulty = 'Basic' | 'Intermediate' | 'Advanced' | 'Critical'
export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical'
export type RomId = 'I8A0S' | 'IJE0S' | 'IKM0S' | 'INA0S'
export type StageId = 'stage-1' | 'stage-2' | 'stage-3' | 'hybrid-base'
export type FuelId = '93' | 'e20' | 'e50' | 'e85'

export type TuningParameterExampleValue = {
  rom: RomId
  stage: StageId
  fuel: FuelId
  stock: string | number
  tuned: string | number
  comment: string
}

export type TeachingExample = {
  title: string
  situation: string
  logSymptoms: string[]
  likelyCause: string
  mapsToCheck: string[]
  safeAdjustmentDirection: string
  validationSteps: string[]
  warning: string
}

export type SourceReference = {
  source: 'N54 Tuning Guide' | 'MHD+ Suite Tuning Guide' | 'N5X Tuning Spreadsheet' | 'Local BIN/XDF Diff'
  locator: string
  note: string
}

export type TuningParameter = {
  id: string
  canonicalName: string
  category: ParameterCategory
  whatItDoes: string
  raisingEffect: string
  loweringEffect: string
  whenToTouch: string
  whenNotToTouch: string
  dangerSigns: string
  logChannels: string[]
  relatedMaps: string[]
  relatedWorkflows?: string[]
  teachingExamples?: TeachingExample[]
  sourceReferences?: SourceReference[]
  difficulty: Difficulty
  riskLevel: RiskLevel
  romAliases: {
    I8A0S?: string
    IJE0S?: string
    IKM0S?: string
    INA0S?: string
  }
  appliesTo?: {
    stages: string[]
    fuels: string[]
  }
  exampleValues?: TuningParameterExampleValue[]
}

export const categorySlugs: Record<ParameterCategory, string> = {
  'Boost Control': 'boost-control',
  Fueling: 'fueling',
  Ignition: 'ignition',
  VANOS: 'vanos',
  'Safety & Protections': 'safety-protections',
  'Drivability & Misc': 'drivability-misc',
  'MHD+': 'mhd-plus',
}

export const categoryIntros: Record<ParameterCategory, string> = {
  'Boost Control':
    'Boost control defines the requested load, pressure ceiling, wastegate feed-forward, and the protection layers that keep the small stock twins inside a stable operating window.',
  Fueling:
    'Fueling maps coordinate lambda targets, fuel scalar behavior, fuel-pressure control, and enrichment strategy so torque demand stays supported without masking a weak pump or injector issue.',
  Ignition:
    'Ignition maps set the commanded spark advance and correction behavior. On the N54, timing must follow fuel quality, cylinder pressure, charge temperature, and knock feedback.',
  VANOS:
    'VANOS calibration shapes torque delivery, spool, exhaust energy, and knock sensitivity by changing cam phasing through the usable load and RPM range.',
  'Safety & Protections':
    'Protection maps are the hard boundaries: load, torque, boost, temperature, fuel pressure, and plausibility limits that decide when the DME should reduce output.',
  'Drivability & Misc':
    'Drivability maps refine transient response, pedal behavior, idle, torque intervention, and the small corrections that make a calibration feel finished instead of merely powerful.',
  'MHD+':
    'MHD+ features add modern strategy layers such as map switching, FlexFuel interpolation, custom boost ceilings, custom WGDC control, and antilag safeguards on top of the base MSD80/81 calibration.',
}

export const tuningParameters: TuningParameter[] = [
  {
    id: 'boost-target',
    canonicalName: 'Boost Target / Load Target',
    category: 'Boost Control',
    whatItDoes:
      'Defines the main requested load or pressure profile the MSD80/81 boost controller tries to achieve. It is the starting point for the torque request that drives boost demand.',
    raisingEffect:
      'Raises requested cylinder filling and turbocharger work. More target can increase torque, but only if airflow, fuel, ignition, and wastegate authority can support it.',
    loweringEffect:
      'Reduces torque demand, charge temperature, turbine speed, and fuel-system load. It is often the cleanest way to calm an unstable or heat-soaked setup.',
    whenToTouch:
      'Adjust after the car is mechanically sound and logs show actual boost can follow target without excessive WGDC, throttle closure, fuel pressure drop, or timing instability.',
    whenNotToTouch:
      'Do not raise target to hide boost leaks, tired wastegates, weak fuel pressure, or timing corrections. Fix the limiting condition first.',
    dangerSigns:
      'Actual boost under target with high WGDC, throttle closure near peak torque, timing corrections across multiple cylinders, HPFP rail pressure collapse, or repeated boost plausibility faults.',
    logChannels: ['Boost target', 'Boost actual', 'Load requested', 'Load actual', 'WGDC', 'Throttle angle', 'HPFP pressure', 'Timing corrections'],
    relatedMaps: ['boost-ceiling', 'base-wgdc', 'wgdc-ceiling', 'load-limiters'],
    relatedWorkflows: ['boost-oscillation-fix', 'safe-base-map-workflow'],
    difficulty: 'Intermediate',
    riskLevel: 'High',
    romAliases: {
      I8A0S: 'Load Target / Requested Boost',
      IJE0S: 'Load Target / Requested Boost',
    },
    exampleValues: [
      {
        rom: 'I8A0S',
        stage: 'stage-1',
        fuel: '93',
        stock: 'Stock tapering load request',
        tuned: 'Moderate midrange increase with stock-turbo taper',
        comment: 'Stage 1 adds torque where the stock twins are efficient, then tapers to protect turbine speed and charge temperature.',
      },
    ],
  },
  {
    id: 'base-wgdc',
    canonicalName: 'Base WGDC',
    category: 'Boost Control',
    whatItDoes:
      'Feed-forward wastegate duty table that gives the boost PID controller a starting duty cycle for a given airflow and operating condition.',
    raisingEffect:
      'Closes the wastegates harder before feedback correction. This can improve spool and reduce boost error when the table is genuinely low.',
    loweringEffect:
      'Opens the wastegates more and reduces pre-control authority, often softening spool or correcting overshoot.',
    whenToTouch:
      'Adjust when boost error is repeatable and mechanical checks are complete. Use it to make the controller need less correction, not to force an unhealthy turbo system.',
    whenNotToTouch:
      'Avoid large changes when boost solenoids, vacuum lines, wastegate preload, or charge piping are suspect.',
    dangerSigns:
      'Overshoot after tip-in, oscillating boost, WGDC pegged at ceiling, boost actual repeatedly diverging from target, or throttle closure used to control pressure.',
    logChannels: ['Boost target', 'Boost actual', 'WGDC bank 1', 'WGDC bank 2', 'Throttle angle', 'RPM'],
    relatedMaps: ['wgdc-ceiling', 'spool-wgdc', 'wgdc-pid', 'boost-target'],
    relatedWorkflows: ['boost-oscillation-fix', 'wgdc-pid-diagnosis'],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: {
      I8A0S: 'WGDC (Base)',
      IJE0S: 'WGDC (Base)',
    },
  },
  {
    id: 'wgdc-ceiling',
    canonicalName: 'WGDC Ceiling',
    category: 'Boost Control',
    whatItDoes:
      'Caps maximum wastegate duty so the boost controller cannot command more closure than the calibration allows.',
    raisingEffect:
      'Allows more wastegate closure and more turbo effort when the base table or feedback loop asks for it.',
    loweringEffect:
      'Limits turbo effort and can prevent overspeed, overshoot, or aggressive response during heat soak.',
    whenToTouch:
      'Use when a healthy system needs slightly more authority to follow a realistic target, especially after target and base duty are already calibrated.',
    whenNotToTouch:
      'Do not raise it just because actual boost is low. Low boost with maxed WGDC is usually a mechanical or target-strategy problem.',
    dangerSigns:
      'WGDC at ceiling with low boost, compressor surge, boost overshoot, throttle closure, or high calculated wastegate duty at high RPM on stock turbos.',
    logChannels: ['WGDC', 'Boost target', 'Boost actual', 'Throttle angle', 'IAT', 'RPM'],
    relatedMaps: ['base-wgdc', 'boost-ceiling', 'load-limiters'],
    relatedWorkflows: ['boost-oscillation-fix'],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: {
      I8A0S: 'WGDC Limit / Ceiling',
      IJE0S: 'WGDC Limit / Ceiling',
    },
  },
  {
    id: 'spool-wgdc',
    canonicalName: 'Spool WGDC',
    category: 'Boost Control',
    whatItDoes:
      'Adds duty during spool regions to help the turbos reach target quickly before steady-state boost control takes over.',
    raisingEffect:
      'Can sharpen boost onset and reduce lag, but too much creates overshoot and throttle intervention.',
    loweringEffect:
      'Softens transient boost response and can reduce overshoot, surge, or traction-limited torque spikes.',
    whenToTouch:
      'Adjust after base WGDC is sane and logs show repeatable lag or overshoot during transient spool.',
    whenNotToTouch:
      'Do not tune spool duty around traction loss, cold tires, poor boost control hardware, or inconsistent pedal input.',
    dangerSigns:
      'Boost spike above target, throttle closure immediately after spool, abrupt torque surge, or oscillation as PID correction fights the feed-forward command.',
    logChannels: ['Boost target', 'Boost actual', 'WGDC', 'Throttle angle', 'Pedal position', 'RPM'],
    relatedMaps: ['base-wgdc', 'wgdc-ceiling', 'boost-target'],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: {
      I8A0S: 'WGDC Spool / Precontrol',
      IJE0S: 'WGDC Spool / Precontrol',
    },
  },
  {
    id: 'boost-ceiling',
    canonicalName: 'Boost Ceiling / Overboost Limit',
    category: 'Boost Control',
    whatItDoes:
      'Sets the pressure boundary above which the DME begins boost protection or fault logic.',
    raisingEffect:
      'Prevents normal tuned boost from falsely tripping protection when the target strategy is intentionally higher than stock.',
    loweringEffect:
      'Tightens the safety envelope and may trigger intervention earlier during overshoot.',
    whenToTouch:
      'Raise only enough to clear legitimate tuned targets while preserving a meaningful margin above expected actual boost.',
    whenNotToTouch:
      'Never use ceiling increases to ignore chronic overshoot, bad boost solenoids, or uncontrolled wastegate behavior.',
    dangerSigns:
      '30FE/30FF-style boost plausibility faults, boost actual exceeding target, throttle closure, and repeated high-pressure spikes during gear changes.',
    logChannels: ['Boost target', 'Boost actual', 'Throttle angle', 'Fault codes', 'WGDC'],
    relatedMaps: ['boost-target', 'wgdc-ceiling', 'load-limiters'],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: {
      I8A0S: 'Boost Ceiling / Pressure Limit',
      IJE0S: 'Boost Ceiling / Pressure Limit',
    },
  },
  {
    id: 'gear-load-limits',
    canonicalName: 'Gear-Based Load Limits',
    category: 'Boost Control',
    whatItDoes:
      'Limits requested torque or load by gear to control traction, drivetrain load, and low-gear boost behavior.',
    raisingEffect:
      'Allows more torque in limited gears, often making low gears feel stronger but increasing traction and drivetrain stress.',
    loweringEffect:
      'Reduces torque in selected gears and can make the car easier to manage on street tires or marginal surfaces.',
    whenToTouch:
      'Adjust after the main boost and torque model is stable, especially for Stage 2/3 cars that need low-gear torque management.',
    whenNotToTouch:
      'Do not remove limits wholesale on stock clutches, weak automatics, poor tires, or cars with unresolved boost control issues.',
    dangerSigns:
      'Torque intervention, wheelspin, timing correction from rapid load rise, transmission flare, or throttle closure in low gears.',
    logChannels: ['Gear', 'Load requested', 'Load actual', 'Throttle angle', 'Timing corrections', 'Boost actual'],
    relatedMaps: ['boost-target', 'torque-limiters', 'throttle-load-protection'],
    difficulty: 'Intermediate',
    riskLevel: 'Moderate',
    romAliases: {
      I8A0S: 'Gear Load Limit',
      IJE0S: 'Gear Load Limit',
    },
  },
  {
    id: 'lambda-target',
    canonicalName: 'WOT Lambda Target',
    category: 'Fueling',
    whatItDoes:
      'Commands the enrichment target under high load so combustion temperature, knock margin, and turbine heat stay controlled.',
    raisingEffect:
      'A numerically higher lambda is leaner. It may improve response or fuel economy but reduces knock and exhaust-temperature margin.',
    loweringEffect:
      'A numerically lower lambda is richer. It improves cooling margin but can cost power, foul plugs, and strain fuel delivery if excessive.',
    whenToTouch:
      'Set around fuel type, boost, timing, turbine heat, and HPFP capacity. Ethanol blends can tolerate different targets but still need rail-pressure margin.',
    whenNotToTouch:
      'Do not lean the car out to compensate for weak fuel pressure, injector faults, or persistent timing corrections.',
    dangerSigns:
      'Lean actual lambda, high STFT, rail pressure crash, timing corrections, misfire, or exhaust gas temperature protection behavior.',
    logChannels: ['Lambda target', 'Lambda actual', 'STFT bank 1', 'STFT bank 2', 'HPFP pressure', 'LPFP pressure', 'Timing corrections'],
    relatedMaps: ['fuel-scalar', 'hpfp-pressure-target', 'ignition-main'],
    relatedWorkflows: ['pump-gas-vs-e-blend', 'hpfp-lpfp-pressure-drop'],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: {
      I8A0S: 'Fuel Target / Lambda Target',
      IJE0S: 'Fuel Target / Lambda Target',
    },
  },
  {
    id: 'fuel-scalar',
    canonicalName: 'Fuel Scalar',
    category: 'Fueling',
    whatItDoes:
      'Accounts for fuel energy content and injector mass-flow modeling so commanded fuel mass produces the expected lambda.',
    raisingEffect:
      'Generally adds modeled fuel delivery for ethanol blends or hardware changes, helping trims return closer to center.',
    loweringEffect:
      'Reduces modeled enrichment and can correct overly rich behavior if scalar is too high.',
    whenToTouch:
      'Adjust when changing ethanol content or injector/fueling assumptions and trims show repeatable bias after mechanical health is confirmed.',
    whenNotToTouch:
      'Do not use scalar to hide leaking injectors, wrong ethanol content, failing pumps, or closed-loop trim problems at idle/cruise.',
    dangerSigns:
      'Large positive or negative trims, bank-to-bank imbalance, lambda error, rail pressure drop, or blend mismatch.',
    logChannels: ['STFT bank 1', 'STFT bank 2', 'LTFT bank 1', 'LTFT bank 2', 'Lambda actual', 'Ethanol content', 'HPFP pressure'],
    relatedMaps: ['lambda-target', 'hpfp-pressure-target'],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: {
      I8A0S: 'Fuel Scalar',
      IJE0S: 'Fuel Scalar',
    },
  },
  {
    id: 'hpfp-pressure-target',
    canonicalName: 'HPFP Pressure Target',
    category: 'Fueling',
    whatItDoes:
      'Defines the rail-pressure target the direct-injection system tries to maintain under load and transient demand.',
    raisingEffect:
      'Can improve injector headroom and atomization if the pump can support it, but it also increases pump work.',
    loweringEffect:
      'Reduces pump load but can reduce injection headroom at high fuel mass demand.',
    whenToTouch:
      'Use cautiously when ethanol blend, boost, and injection window require more fuel mass and logs show pressure control remains stable.',
    whenNotToTouch:
      'Do not raise targets on a weak HPFP. If rail pressure cannot follow stock-like targets, the hardware is the problem.',
    dangerSigns:
      'Rail pressure sag under WOT, long crank, lean lambda, misfire at high load, or large rail-pressure oscillation.',
    logChannels: ['HPFP pressure target', 'HPFP pressure actual', 'Lambda actual', 'STFT', 'RPM', 'Load actual'],
    relatedMaps: ['lambda-target', 'fuel-scalar', 'load-limiters'],
    relatedWorkflows: ['hpfp-lpfp-pressure-drop'],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: {
      I8A0S: 'Fuel Pressure Target',
      IJE0S: 'Fuel Pressure Target',
    },
  },
  {
    id: 'ignition-main',
    canonicalName: 'Main Ignition Timing',
    category: 'Ignition',
    whatItDoes:
      'Sets commanded spark advance by load and RPM before correction factors such as IAT, knock, fuel quality, and torque intervention are applied.',
    raisingEffect:
      'Can increase torque and efficiency when knock margin exists. Too much timing creates knock, corrections, and engine risk.',
    loweringEffect:
      'Adds knock safety margin and can stabilize poor fuel or high-IAT operation, but excessive reduction costs power and heat efficiency.',
    whenToTouch:
      'Adjust only with clean logs, known fuel quality, stable lambda, and no fuel-pressure issues. Ethanol permits more timing only when the fuel system supports it.',
    whenNotToTouch:
      'Do not add timing while cylinders are correcting, lambda is lean, plugs are old, or IAT correction is already active.',
    dangerSigns:
      'Repeated corrections on multiple cylinders, timing drop at peak torque, misfire, knock codes, or power falling despite higher boost.',
    logChannels: ['Ignition timing', 'Timing corrections cyl 1-6', 'IAT', 'Lambda actual', 'Boost actual', 'HPFP pressure'],
    relatedMaps: ['iat-timing-correction', 'lambda-target', 'boost-target'],
    relatedWorkflows: ['safe-base-map-workflow', 'turbo-type-workflow'],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: {
      I8A0S: 'Ignition Timing Main',
      IJE0S: 'Ignition Timing Main',
    },
  },
  {
    id: 'iat-timing-correction',
    canonicalName: 'IAT Timing Correction',
    category: 'Ignition',
    whatItDoes:
      'Removes ignition advance as charge temperature rises, protecting the engine from reduced knock margin during heat soak.',
    raisingEffect:
      'Less negative correction retains more timing at high IAT, which may feel stronger but reduces safety margin.',
    loweringEffect:
      'More correction protects against heat but can make the car feel soft after repeated pulls.',
    whenToTouch:
      'Refine only when intercooler performance, fuel quality, and base timing are known. Stock-turbo cars often need this protection intact.',
    whenNotToTouch:
      'Do not flatten IAT correction to chase dyno numbers or mask a heat-soaked intercooler.',
    dangerSigns:
      'Timing corrections as IAT rises, power falling pull-to-pull, high charge temperature, or knock sensitivity after heat soak.',
    logChannels: ['IAT', 'Ignition timing', 'Timing corrections cyl 1-6', 'Boost actual'],
    relatedMaps: ['ignition-main', 'boost-target', 'lambda-target'],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: {
      I8A0S: 'Timing Correction IAT',
      IJE0S: 'Timing Correction IAT',
    },
  },
  {
    id: 'vanos-intake',
    canonicalName: 'Intake VANOS Target',
    category: 'VANOS',
    whatItDoes:
      'Controls intake cam phasing to influence cylinder filling, spool, torque curve shape, and knock tendency.',
    raisingEffect:
      'More advance in the right region can improve low-mid torque and spool. Too much can increase knock sensitivity or reduce high-RPM flow.',
    loweringEffect:
      'Can soften low-end response but improve stability or high-load knock behavior depending on the operating region.',
    whenToTouch:
      'Refine after boost, fuel, and timing are stable. Use small changes and compare spool, torque, and correction behavior.',
    whenNotToTouch:
      'Do not tune VANOS around worn solenoids, cam timing faults, or dirty oil control behavior.',
    dangerSigns:
      'VANOS shadow codes, rough transitions, inconsistent spool, timing corrections after cam changes, or torque dips.',
    logChannels: ['Intake VANOS target', 'Intake VANOS actual', 'Boost actual', 'Timing corrections', 'RPM'],
    relatedMaps: ['vanos-exhaust', 'boost-target', 'ignition-main'],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: {
      I8A0S: 'Intake VANOS',
      IJE0S: 'Intake VANOS',
    },
  },
  {
    id: 'vanos-exhaust',
    canonicalName: 'Exhaust VANOS Target',
    category: 'VANOS',
    whatItDoes:
      'Controls exhaust cam phasing, influencing turbine energy, residual gas, spool, and high-RPM breathing.',
    raisingEffect:
      'Can improve turbine response in some regions, but excessive overlap or residuals can increase knock and exhaust heat.',
    loweringEffect:
      'May reduce residuals and improve high-load stability, at the cost of spool or midrange torque if overdone.',
    whenToTouch:
      'Adjust alongside intake VANOS with careful before/after logs. Hybrid setups may need a different exhaust-energy strategy than stock twins.',
    whenNotToTouch:
      'Do not change broadly without a clear torque, spool, or knock reason.',
    dangerSigns:
      'Slower spool, torque holes, high timing corrections, VANOS control deviation, or rough transition behavior.',
    logChannels: ['Exhaust VANOS target', 'Exhaust VANOS actual', 'Boost actual', 'Timing corrections', 'RPM'],
    relatedMaps: ['vanos-intake', 'spool-wgdc', 'ignition-main'],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: {
      I8A0S: 'Exhaust VANOS',
      IJE0S: 'Exhaust VANOS',
    },
  },
  {
    id: 'load-limiters',
    canonicalName: 'Load Limiters',
    category: 'Safety & Protections',
    whatItDoes:
      'Defines maximum allowed load across operating conditions so requested torque cannot exceed calibrated protection limits.',
    raisingEffect:
      'Allows higher tuned load targets to be achieved without artificial closure or intervention.',
    loweringEffect:
      'Restricts torque request and can provide a conservative cap for weak hardware, poor fuel, or break-in operation.',
    whenToTouch:
      'Raise only to support a validated boost target while retaining clear headroom limits above the intended tune.',
    whenNotToTouch:
      'Do not max limiters globally. If a limiter is intervening, confirm whether it is protecting the engine from a real fault.',
    dangerSigns:
      'Throttle closure, target load clipped below request, torque intervention, boost/load mismatch, or recurring plausibility faults.',
    logChannels: ['Load requested', 'Load actual', 'Throttle angle', 'Boost target', 'Boost actual', 'Torque intervention'],
    relatedMaps: ['boost-target', 'boost-ceiling', 'gear-load-limits'],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: {
      I8A0S: 'Load Limit / Torque Limit',
      IJE0S: 'Load Limit / Torque Limit',
    },
  },
  {
    id: 'fuel-pressure-protection',
    canonicalName: 'Fuel Pressure Protection',
    category: 'Safety & Protections',
    whatItDoes:
      'Defines how the DME reacts when low-pressure or high-pressure fuel delivery falls outside the safe window.',
    raisingEffect:
      'Can delay intervention, but may allow lean operation if used carelessly.',
    loweringEffect:
      'Intervenes earlier and protects the engine from fuel starvation at the cost of reduced power under marginal conditions.',
    whenToTouch:
      'Usually leave conservative. Only refine after validating upgraded pumps, pressure sensors, and actual pressure control.',
    whenNotToTouch:
      'Do not weaken fuel protection to keep an ethanol tune alive on an undersized pump.',
    dangerSigns:
      'HPFP pressure crash, LPFP drop, lean lambda, misfires, rail-pressure codes, or trims pinned positive.',
    logChannels: ['HPFP pressure', 'LPFP pressure', 'Lambda actual', 'STFT', 'Misfire counters', 'Fault codes'],
    relatedMaps: ['hpfp-pressure-target', 'lambda-target', 'fuel-scalar'],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: {
      I8A0S: 'Fuel Pressure Safety Limit',
      IJE0S: 'Fuel Pressure Safety Limit',
    },
  },
  {
    id: 'throttle-load-protection',
    canonicalName: 'Throttle / Load Protection',
    category: 'Safety & Protections',
    whatItDoes:
      'Uses throttle and torque intervention to keep actual load inside the allowed calibrated envelope.',
    raisingEffect:
      'Can reduce unwanted closure when the torque model and limiters are correctly aligned.',
    loweringEffect:
      'Makes intervention more conservative and can reduce output earlier during boost or load excursions.',
    whenToTouch:
      'Adjust only after confirming boost target, load limiters, torque tables, and boost ceilings agree with one another.',
    whenNotToTouch:
      'Do not disable throttle closure that is responding to real overboost, load overshoot, or torque monitoring mismatch.',
    dangerSigns:
      'Throttle angle closes during WOT, boost overshoots target, torque intervention flags, or abrupt power cut under load.',
    logChannels: ['Throttle angle', 'Pedal position', 'Load requested', 'Load actual', 'Boost target', 'Boost actual'],
    relatedMaps: ['load-limiters', 'boost-ceiling', 'boost-target'],
    relatedWorkflows: ['throttle-closure-diagnosis'],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: {
      I8A0S: 'Throttle Load Intervention',
      IJE0S: 'Throttle Load Intervention',
    },
  },
  {
    id: 'pedal-torque-request',
    canonicalName: 'Pedal Torque Request',
    category: 'Drivability & Misc',
    whatItDoes:
      'Maps accelerator pedal input into requested torque, shaping how aggressive the car feels before boost and load control respond.',
    raisingEffect:
      'Makes the car feel more responsive for a given pedal angle but can make torque delivery abrupt.',
    loweringEffect:
      'Softens pedal response and improves modulation, especially in low gears or wet conditions.',
    whenToTouch:
      'Refine after the power calibration is stable, using it to make torque delivery predictable rather than to add power.',
    whenNotToTouch:
      'Do not use pedal mapping to hide poor boost control or to create artificial aggression on a rough tune.',
    dangerSigns:
      'Jerky tip-in, traction loss from small pedal movement, throttle closure, or torque request spikes during shifts.',
    logChannels: ['Pedal position', 'Throttle angle', 'Load requested', 'Load actual', 'Boost actual'],
    relatedMaps: ['gear-load-limits', 'throttle-load-protection', 'boost-target'],
    difficulty: 'Basic',
    riskLevel: 'Moderate',
    romAliases: {
      I8A0S: 'Driver Wish / Pedal Torque',
      IJE0S: 'Driver Wish / Pedal Torque',
    },
  },
  {
    id: 'lpfp-pressure-target',
    canonicalName: 'LPFP Pressure Target',
    category: 'Fueling',
    whatItDoes:
      'Defines the low-pressure fuel pump supply target that feeds the HPFP. If the low-pressure side sags, the HPFP cannot maintain rail pressure regardless of pump duty.',
    raisingEffect:
      'Commands higher LPFP supply pressure, which can improve HPFP headroom under sustained high fuel-mass demand.',
    loweringEffect:
      'Reduces pump effort but can starve the HPFP at high ethanol blends or elevated load, causing rail pressure collapse.',
    whenToTouch:
      'Review when logs show HPFP pressure sagging despite the pump appearing to work. Confirm LPFP pressure is adequate before changing HPFP strategy.',
    whenNotToTouch:
      'Do not raise LPFP target to mask a failing low-pressure pump. A collapsing LPFP trace is a hardware failure signal.',
    dangerSigns:
      'LPFP pressure dropping under WOT, HPFP rail pressure crash that follows the LPFP sag, lean lambda, misfire, or long crank after repeated pulls.',
    logChannels: ['LPFP pressure actual', 'LPFP pressure target', 'HPFP pressure actual', 'Lambda actual', 'STFT bank 1', 'STFT bank 2'],
    relatedMaps: ['hpfp-pressure-target', 'fuel-pressure-protection', 'lambda-target'],
    relatedWorkflows: ['hpfp-lpfp-pressure-drop'],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: {
      I8A0S: 'LPFP Pressure Target',
      IJE0S: 'LPFP Pressure Target',
    },
  },
  ...teachingExpansionParameters,
]

export const getCategorySlug = (category: ParameterCategory) => categorySlugs[category]

export const getCategoryBySlug = (slug: string): ParameterCategory | undefined =>
  parameterCategories.find((category) => categorySlugs[category] === slug)

export const getParametersByCategory = (category: ParameterCategory): TuningParameter[] =>
  tuningParameters.filter((parameter) => parameter.category === category)

export const getParameterById = (id: string): TuningParameter | undefined =>
  tuningParameters.find((parameter) => parameter.id === id)

export const getRelatedParameters = (parameter: TuningParameter): TuningParameter[] =>
  parameter.relatedMaps
    .map((id) => getParameterById(id))
    .filter((related): related is TuningParameter => Boolean(related))
