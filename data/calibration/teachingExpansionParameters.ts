import type { TuningParameter } from './tuningParameters'

const n54Guide = {
  source: 'N54 Tuning Guide',
  locator: 'Boost, fueling, ignition, VANOS, and logging workflow sections',
  note: 'Used as calibration workflow context; public copy is summarized in original app language.',
} as const

const mhdGuide = {
  source: 'MHD+ Suite Tuning Guide',
  locator: 'Map switching, FlexFuel, custom boost ceiling, custom WGDC, and antilag sections',
  note: 'Used as feature workflow context; public copy is summarized in original app language.',
} as const

const spreadsheet = {
  source: 'N5X Tuning Spreadsheet',
  locator: 'Map category worksheets: Load, Boost Control, Fuel, Ignition Timing and IAT, Vanos',
  note: 'Used for real N5X map naming and category normalization.',
} as const

const localDiff = {
  source: 'Local BIN/XDF Diff',
  locator: 'Readable I8A0S/IJE0S stock-to-tuned diff dataset',
  note: 'Used for app-safe stock-vs-tuned summary patterns without exposing private binaries.',
} as const

export const teachingExpansionParameters: TuningParameter[] = [
  {
    id: 'load-target-1',
    canonicalName: 'Load Target 1',
    category: 'Boost Control',
    whatItDoes:
      'Primary requested load curve used by the torque model to request airflow before boost control turns that request into wastegate action.',
    raisingEffect:
      'Requests more cylinder filling and usually more boost, torque, fuel mass, and turbo work in the affected RPM/load region.',
    loweringEffect:
      'Reduces torque request and turbo demand; useful for heat, traction, fuel pressure, or unstable boost control.',
    whenToTouch:
      'After the car has a clean baseline log and WGDC, throttle, lambda, and timing show enough margin for a higher request.',
    whenNotToTouch:
      'Do not raise load target to compensate for boost leaks, weak wastegates, poor fuel pressure, or timing corrections.',
    dangerSigns:
      'Actual load under target with high WGDC, throttle closure, HPFP pressure drop, or timing correction across multiple cylinders.',
    logChannels: ['Load requested', 'Load actual', 'Boost target', 'Boost actual', 'WGDC after PID', 'Throttle angle', 'Timing corrections'],
    relatedMaps: ['boost-target', 'boost-ceiling', 'base-wgdc', 'load-limiters'],
    teachingExamples: [
      {
        title: 'Load target raised but throttle closes',
        situation: 'A Stage 1 revision requests more load in the midrange but the throttle closes during WOT.',
        logSymptoms: ['Load requested exceeds load actual', 'Throttle angle drops while pedal remains 100%', 'Boost is close to or above target'],
        likelyCause: 'Load request, torque limiters, or boost ceiling no longer agree with the real operating point.',
        mapsToCheck: ['Load Target 1', 'Load Limit Factor', 'Boost Ceiling', 'Torque Monitor Ceiling'],
        safeAdjustmentDirection: 'Align limit headroom with the intended request or reduce the target where the car cannot validate it.',
        validationSteps: ['Flash one change area', 'Log the same gear and RPM range', 'Confirm throttle remains open and timing stays clean'],
        warning: 'Do not simply max all torque limits; determine which protection is intervening and why.',
      },
    ],
    sourceReferences: [n54Guide, spreadsheet, localDiff],
    difficulty: 'Intermediate',
    riskLevel: 'High',
    romAliases: { I8A0S: 'Load Target', IJE0S: 'Load Target' },
  },
  {
    id: 'boost-error',
    canonicalName: 'Boost Error',
    category: 'Boost Control',
    whatItDoes:
      'Difference between boost target and boost actual; this is the signal the PID loop reacts to when adding or removing duty.',
    raisingEffect:
      'A larger positive error means the car is under target and the controller will generally add duty if allowed.',
    loweringEffect:
      'A negative error means actual boost is above target and the controller should pull duty or protection may intervene.',
    whenToTouch:
      'Boost error is logged and interpreted rather than directly tuned. Use it to decide whether target, base WGDC, adders, or PID terms need work.',
    whenNotToTouch:
      'Do not chase single-sample spikes. Look for repeatable error in the same RPM/load region.',
    dangerSigns:
      'Persistent positive error with high WGDC, negative error with throttle closure, oscillating error after spool, or boost error changing sign repeatedly.',
    logChannels: ['Boost target', 'Boost actual', 'Boost error', 'WGDC base', 'WGDC after PID', 'Throttle angle'],
    relatedMaps: ['base-wgdc', 'wgdc-p-factor', 'wgdc-d-factor', 'wgdc-ceiling'],
    teachingExamples: [
      {
        title: 'WGDC after PID below base',
        situation: 'Car reaches boost target but PID is pulling duty below the feed-forward base table.',
        logSymptoms: ['WGDC after PID trends below WGDC base', 'Boost actual close to or above target', 'Boost error near zero or negative'],
        likelyCause: 'Base WGDC or airflow adder is too aggressive in the affected area.',
        mapsToCheck: ['WGDC Base', 'WGDC Adder Airflow', 'WGDC Ceiling Adder', 'WGDC P-Factor'],
        safeAdjustmentDirection: 'Remove base/adders in the affected RPM/load/airflow area, then log again.',
        validationSteps: ['Compare base vs after-PID duty', 'Verify boost error settles near zero', 'Check throttle remains open'],
        warning: 'Do not fix overboost by blindly lowering boost target only.',
      },
    ],
    sourceReferences: [n54Guide, spreadsheet],
    difficulty: 'Basic',
    riskLevel: 'Moderate',
    romAliases: { I8A0S: 'Boost Error', IJE0S: 'Boost Error' },
  },
  {
    id: 'wgdc-after-pid',
    canonicalName: 'WGDC After PID',
    category: 'Boost Control',
    whatItDoes:
      'Final wastegate duty after feed-forward, adders, ceilings, and PID correction. It shows what the DME is actually commanding.',
    raisingEffect:
      'More final duty closes the wastegates harder and increases turbo drive if the pneumatic system can respond.',
    loweringEffect:
      'Less final duty opens the wastegates and reduces boost or overshoot.',
    whenToTouch:
      'Use the logged channel to diagnose whether base duty or PID is doing the work. Adjust the underlying tables, not the channel.',
    whenNotToTouch:
      'Do not judge WGDC without boost target, boost actual, throttle, gear, and RPM context.',
    dangerSigns:
      'High final duty with low boost, final duty below base during overshoot, or final duty oscillation after spool.',
    logChannels: ['WGDC base', 'WGDC after PID', 'Boost target', 'Boost actual', 'Throttle angle', 'RPM'],
    relatedMaps: ['base-wgdc', 'wgdc-p-factor', 'wgdc-i-factor', 'wgdc-d-factor'],
    teachingExamples: [
      {
        title: 'High duty with low boost',
        situation: 'The car cannot reach target and WGDC after PID rises toward the ceiling.',
        logSymptoms: ['Boost actual below target', 'WGDC after PID high', 'Throttle open', 'No timing or fuel pressure reason for torque reduction'],
        likelyCause: 'Boost leak, wastegate/vacuum issue, tired turbo hardware, or target beyond hardware capacity.',
        mapsToCheck: ['WGDC Ceiling Adder', 'WGDC Limit', 'Load Target 1', 'Boost Ceiling'],
        safeAdjustmentDirection: 'Verify hardware first; only add duty if the system is healthy and target is realistic.',
        validationSteps: ['Pressure test', 'Check vacuum and solenoids', 'Repeat log after repair or small duty change'],
        warning: 'Do not raise WGDC ceilings to hide a mechanical underboost condition.',
      },
    ],
    sourceReferences: [n54Guide, localDiff],
    difficulty: 'Intermediate',
    riskLevel: 'High',
    romAliases: { I8A0S: 'WGDC After PID', IJE0S: 'WGDC After PID' },
  },
  {
    id: 'wgdc-p-factor',
    canonicalName: 'WGDC P-Factor',
    category: 'Boost Control',
    whatItDoes:
      'Proportional boost-control gain that reacts to current boost error. It changes how aggressively duty responds to target error.',
    raisingEffect:
      'More proportional response can correct error faster but may overshoot or oscillate.',
    loweringEffect:
      'Less proportional response calms the loop but may leave slow correction or steady boost error.',
    whenToTouch:
      'After base WGDC is close and repeatable boost error remains during transient or steady-state control.',
    whenNotToTouch:
      'Do not use P-factor to compensate for a bad base table, boost leak, or unstable target.',
    dangerSigns:
      'Boost oscillation, duty oscillation, overshoot after spool, or slow recovery from error.',
    logChannels: ['Boost error', 'WGDC after PID', 'WGDC base', 'Boost actual', 'Boost target'],
    relatedMaps: ['wgdc-i-factor', 'wgdc-d-factor', 'wgdc-after-pid', 'base-wgdc'],
    sourceReferences: [n54Guide, spreadsheet, localDiff],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: { I8A0S: 'WGDC P-Factor', IJE0S: 'WGDC P-Factor' },
  },
  {
    id: 'wgdc-i-factor',
    canonicalName: 'WGDC I-Factor',
    category: 'Boost Control',
    whatItDoes:
      'Integral boost-control gain that corrects accumulated boost error over time.',
    raisingEffect:
      'Can reduce persistent boost error but may wind up and cause overshoot.',
    loweringEffect:
      'Reduces wind-up risk but may leave a persistent offset from target.',
    whenToTouch:
      'Only after base WGDC and P/D behavior are stable and a repeatable steady error remains.',
    whenNotToTouch:
      'Do not add integral gain when boost error is caused by hardware limits.',
    dangerSigns:
      'Delayed overshoot, slow oscillation, duty staying high after target is reached.',
    logChannels: ['Boost error', 'WGDC after PID', 'Boost actual', 'Boost target', 'Throttle angle'],
    relatedMaps: ['wgdc-p-factor', 'wgdc-d-factor', 'wgdc-after-pid'],
    sourceReferences: [n54Guide, spreadsheet],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: { I8A0S: 'WGDC I-Factor', IJE0S: 'WGDC I-Factor' },
  },
  {
    id: 'wgdc-d-factor',
    canonicalName: 'WGDC D-Factor',
    category: 'Boost Control',
    whatItDoes:
      'Derivative boost-control gain that reacts to the rate of boost-error change and damps rapid movement.',
    raisingEffect:
      'Can reduce overshoot and improve damping but may make duty noisy or overly reactive.',
    loweringEffect:
      'Reduces damping and can make the system rely more on base and P/I response.',
    whenToTouch:
      'When base WGDC is accurate but boost overshoot or oscillation remains during spool or gear changes.',
    whenNotToTouch:
      'Do not use D-factor as a substitute for correcting excessive base WGDC.',
    dangerSigns:
      'Noisy WGDC trace, oscillating boost, or persistent overshoot after spool.',
    logChannels: ['Boost error', 'WGDC after PID', 'WGDC base', 'Boost actual', 'Throttle angle'],
    relatedMaps: ['wgdc-d-factor-multiplier', 'wgdc-p-factor', 'base-wgdc'],
    sourceReferences: [n54Guide, spreadsheet, localDiff],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: { I8A0S: 'WGDC D-Factor', IJE0S: 'WGDC D-Factor' },
  },
  {
    id: 'wgdc-d-factor-multiplier',
    canonicalName: 'WGDC D-Factor Multiplier',
    category: 'Boost Control',
    whatItDoes:
      'Scales derivative boost-control behavior across operating regions so damping can vary by load/RPM/flow area.',
    raisingEffect:
      'Adds derivative damping effect where the multiplier is increased.',
    loweringEffect:
      'Reduces derivative damping and may make response less restrained.',
    whenToTouch:
      'When a specific region needs more or less damping after the main D-factor shape is understood.',
    whenNotToTouch:
      'Do not flatten multipliers globally without verifying boost response across gears.',
    dangerSigns:
      'Region-specific oscillation, overshoot, or noisy duty after PID correction.',
    logChannels: ['Boost error', 'WGDC after PID', 'Boost actual', 'RPM', 'Load actual'],
    relatedMaps: ['wgdc-d-factor', 'wgdc-p-factor', 'base-wgdc'],
    sourceReferences: [spreadsheet, localDiff],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: { I8A0S: 'WGDC D-Factor Multiplier', IJE0S: 'WGDC D-Factor Multiplier' },
  },
  {
    id: 'map-max-voltage',
    canonicalName: 'MAP Max Voltage',
    category: 'Safety & Protections',
    whatItDoes:
      'Defines the upper voltage plausibility window for the manifold pressure sensor signal.',
    raisingEffect:
      'Allows a higher sensor voltage before plausibility intervention, which may be required for different MAP sensor scaling.',
    loweringEffect:
      'Tightens plausibility and may fault earlier if boost or sensor scaling exceeds the limit.',
    whenToTouch:
      'Only when the MAP sensor calibration and voltage range are known and matched to the hardware.',
    whenNotToTouch:
      'Do not raise it to hide overboost or a wiring/sensor fault.',
    dangerSigns:
      'MAP plausibility faults, boost readings pegging, boost target/actual mismatch, or limp mode during high boost.',
    logChannels: ['Boost actual', 'Boost target', 'MAP voltage', 'Throttle angle', 'Fault codes'],
    relatedMaps: ['boost-ceiling', 'boost-target', 'load-limiters'],
    teachingExamples: [
      {
        title: 'MAP sensor voltage ceiling hit',
        situation: 'A car with upgraded boost sensor scaling faults near peak boost.',
        logSymptoms: ['Boost actual trace clips or becomes implausible', 'Fault code occurs at repeatable pressure', 'Throttle closes after plausibility event'],
        likelyCause: 'Sensor scaling, MAP voltage limits, or boost ceiling are mismatched to the hardware.',
        mapsToCheck: ['MAP Max Voltage', 'Boost Ceiling', 'Load Target 1'],
        safeAdjustmentDirection: 'Confirm sensor scaling first, then align voltage limits only to the validated sensor range.',
        validationSteps: ['Confirm installed sensor', 'Log MAP voltage and pressure', 'Verify no overboost after adjustment'],
        warning: 'Never use voltage limits to suppress a real overboost condition.',
      },
    ],
    sourceReferences: [n54Guide, spreadsheet],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: { I8A0S: 'MAP Max Voltage', IJE0S: 'MAP Max Voltage' },
  },
  {
    id: 'fuel-main',
    canonicalName: 'Fuel Main',
    category: 'Fueling',
    whatItDoes:
      'Main commanded fuel/lambda profile for high-load operation, usually split by bank in the XDF.',
    raisingEffect:
      'Depending on units, can command a leaner or richer target. Always confirm unit convention in the XDF before changing values.',
    loweringEffect:
      'Depending on units, can command the opposite direction. Treat fuel tables as unit-sensitive and validate with lambda actual.',
    whenToTouch:
      'When boost/load is changed, fuel type changes, or logs show the commanded target needs a safer high-load profile.',
    whenNotToTouch:
      'Do not alter fuel targets to mask HPFP/LPFP weakness, injector faults, or wrong ethanol content.',
    dangerSigns:
      'Lambda actual misses target, trims peg, HPFP pressure falls, misfires under load, or timing corrections increase with lean operation.',
    logChannels: ['Lambda bank 1', 'Lambda bank 2', 'Lambda requested bank 1', 'Lambda requested bank 2', 'STFT bank 1', 'STFT bank 2', 'HPFP pressure'],
    relatedMaps: ['lambda-target', 'fuel-scalar', 'hpfp-pressure-target'],
    teachingExamples: [
      {
        title: 'Bank lambda mismatch after fuel table edit',
        situation: 'Bank 1 and Bank 2 lambda targets or actuals diverge after a revision.',
        logSymptoms: ['Lambda bank 1 differs from bank 2', 'STFT bank split grows under load', 'One bank corrects harder than the other'],
        likelyCause: 'Bank-specific fuel tables or scalar tables were not matched, or there is a bank-specific hardware fault.',
        mapsToCheck: ['Fuel Main Bank 1', 'Fuel Main Bank 2', 'Fuel Scalar Bank 1', 'Fuel Scalar Bank 2'],
        safeAdjustmentDirection: 'Keep bank paired tables matched unless a known hardware reason exists; diagnose bank-specific faults before calibration split.',
        validationSteps: ['Compare both bank tables', 'Log both lambda channels', 'Verify trims converge after matching'],
        warning: 'Do not intentionally split bank lambda/scalar tables without a documented reason.',
      },
    ],
    sourceReferences: [n54Guide, spreadsheet, localDiff],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: { I8A0S: 'Fuel (Bank 1) / Fuel (Bank 2)', IJE0S: 'Fuel (Bank 1) / Fuel (Bank 2)' },
  },
  {
    id: 'fuel-pressure-target-homogeneous',
    canonicalName: 'Fuel Pressure Target Homogeneous',
    category: 'Fueling',
    whatItDoes:
      'High-pressure direct-injection rail target used during homogeneous combustion operation.',
    raisingEffect:
      'Can increase injector pressure headroom if the pump can support it, but raises pump load.',
    loweringEffect:
      'Reduces pump work but can reduce fuel mass headroom at high load.',
    whenToTouch:
      'When ethanol content, load, and injection window demand more pressure and logs prove the HPFP can track target.',
    whenNotToTouch:
      'Do not raise pressure on a weak HPFP or to hide rail-pressure sag.',
    dangerSigns:
      'Rail pressure target not met, lean lambda, misfire, long crank, or rail pressure oscillation.',
    logChannels: ['HPFP pressure target', 'HPFP pressure actual', 'LPFP pressure', 'Lambda actual', 'STFT'],
    relatedMaps: ['hpfp-pressure-target', 'fuel-main', 'fuel-scalar'],
    sourceReferences: [n54Guide, spreadsheet],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: { I8A0S: 'Fuel Pressure Target Homogeneous', IJE0S: 'Fuel Pressure Target Homogeneous' },
  },
  {
    id: 'fuel-scalar-bank-1-2',
    canonicalName: 'Fuel Scalar Bank 1 / Bank 2',
    category: 'Fueling',
    whatItDoes:
      'Bank-specific fuel model correction used to align fuel mass delivery with fuel blend and injector behavior.',
    raisingEffect:
      'Generally increases modeled fuel delivery and can pull trims back from positive on ethanol blends.',
    loweringEffect:
      'Reduces modeled fuel delivery and can correct overly rich behavior if scalar is too high.',
    whenToTouch:
      'When ethanol content or fuel model assumptions change and trims show repeatable bias after hardware is verified.',
    whenNotToTouch:
      'Do not split banks to hide injector, O2 sensor, or fuel-system faults.',
    dangerSigns:
      'Bank-to-bank trim split, lambda mismatch, trims pegged positive or negative, or rail pressure drop.',
    logChannels: ['STFT bank 1', 'STFT bank 2', 'LTFT bank 1', 'LTFT bank 2', 'Lambda bank 1', 'Lambda bank 2', 'Ethanol content'],
    relatedMaps: ['fuel-scalar', 'fuel-main', 'lambda-target'],
    sourceReferences: [n54Guide, spreadsheet],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: { I8A0S: 'Fuel Scalar Bank 1 / Fuel Scalar Bank 2', IJE0S: 'Fuel Scalar Bank 1 / Fuel Scalar Bank 2' },
  },
  {
    id: 'timing-main',
    canonicalName: 'Timing Main',
    category: 'Ignition',
    whatItDoes:
      'Primary commanded spark table before corrections for IAT, knock, torque intervention, and fuel quality.',
    raisingEffect:
      'Can increase torque if knock margin exists, but quickly raises cylinder-pressure risk.',
    loweringEffect:
      'Adds safety margin but can reduce torque and increase exhaust heat if excessive.',
    whenToTouch:
      'After lambda, fuel pressure, boost control, IAT, plugs, coils, and fuel quality are verified.',
    whenNotToTouch:
      'Do not add timing while corrections are present or fuel pressure/lambda is unstable.',
    dangerSigns:
      'Timing corrections on multiple cylinders, misfire, knock codes, or power loss despite higher boost.',
    logChannels: ['Timing cyl 1-6', 'Timing corrections cyl 1-6', 'IAT', 'Lambda actual', 'Boost actual', 'HPFP pressure'],
    relatedMaps: ['ignition-main', 'iat-timing-correction', 'lambda-target'],
    teachingExamples: [
      {
        title: 'Corrections after adding timing',
        situation: 'A revision adds timing in the midrange and the car logs correction across several cylinders.',
        logSymptoms: ['Timing corrections on multiple cylinders', 'IAT elevated or rising', 'Lambda and fuel pressure otherwise stable'],
        likelyCause: 'Timing was advanced beyond the fuel and charge-temperature knock margin.',
        mapsToCheck: ['Timing Main', 'IAT Timing Correction Factor', 'Fuel Main', 'Load Target 1'],
        safeAdjustmentDirection: 'Remove timing in the corrected load/RPM cells or lower load if fuel/heat margin is limited.',
        validationSteps: ['Repeat same gear pull', 'Confirm corrections are isolated or gone', 'Check IAT and lambda repeatability'],
        warning: 'Do not guess timing from another car or fuel blend.',
      },
    ],
    sourceReferences: [n54Guide, spreadsheet],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: { I8A0S: 'Timing Main', IJE0S: 'Timing Main' },
  },
  {
    id: 'iat-total-timing-correction',
    canonicalName: 'IAT Total Timing Correction',
    category: 'Ignition',
    whatItDoes:
      'Total ignition retard applied from intake-air temperature correction strategy.',
    raisingEffect:
      'Retains more timing at high IAT if correction is reduced, which increases knock risk.',
    loweringEffect:
      'Removes more timing as IAT rises, protecting the engine but reducing power during heat soak.',
    whenToTouch:
      'After base timing is safe and IAT behavior is repeatable across pulls.',
    whenNotToTouch:
      'Do not flatten IAT correction to make a hot dyno pull look better.',
    dangerSigns:
      'Corrections increase with IAT, power falls pull-to-pull, or knock appears after heat soak.',
    logChannels: ['IAT', 'Timing cyl 1-6', 'Timing corrections cyl 1-6', 'Boost actual'],
    relatedMaps: ['iat-timing-correction', 'timing-main'],
    sourceReferences: [n54Guide, spreadsheet],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: { I8A0S: 'IAT Total Timing Correction', IJE0S: 'IAT Total Timing Correction' },
  },
  {
    id: 'vanos-intake-moving-warm',
    canonicalName: 'VANOS Intake Moving Warm',
    category: 'VANOS',
    whatItDoes:
      'Warm-operating intake cam target table that shapes spool, cylinder filling, overlap, and knock tendency.',
    raisingEffect:
      'More intake advance in the correct area can improve spool and midrange torque; too much can hurt knock margin or top-end flow.',
    loweringEffect:
      'Can reduce overlap and knock sensitivity but may slow spool or soften torque.',
    whenToTouch:
      'After boost, fuel, and timing are stable and the goal is to refine torque shape or spool.',
    whenNotToTouch:
      'Do not tune around VANOS faults, worn solenoids, or inconsistent cam tracking.',
    dangerSigns:
      'VANOS target/actual deviation, torque holes, slower spool, or new timing corrections after cam changes.',
    logChannels: ['Intake VANOS target', 'Intake VANOS actual', 'Boost actual', 'Timing corrections', 'RPM'],
    relatedMaps: ['vanos-intake', 'vanos-exhaust-moving-warm', 'timing-main'],
    teachingExamples: [
      {
        title: 'Overlap change creates knock sensitivity',
        situation: 'A VANOS revision improves spool but introduces timing corrections near peak torque.',
        logSymptoms: ['Boost response improves', 'Timing corrections appear in the same RPM/load area', 'IAT and lambda are stable'],
        likelyCause: 'Cam phasing increased effective cylinder pressure or residuals in a knock-sensitive area.',
        mapsToCheck: ['VANOS Intake Moving Warm', 'VANOS Exhaust Moving Warm', 'Timing Main'],
        safeAdjustmentDirection: 'Back out the cam change in the affected area or reduce timing/load until logs are clean.',
        validationSteps: ['Log VANOS target and actual', 'Compare spool and corrections before/after', 'Repeat in same gear'],
        warning: 'Do not change VANOS and timing at the same time when diagnosing knock.',
      },
    ],
    sourceReferences: [n54Guide, spreadsheet, localDiff],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: { I8A0S: 'VANOS Intake (Moving) Warm', IJE0S: 'VANOS Intake (Moving) Warm' },
  },
  {
    id: 'vanos-exhaust-moving-warm',
    canonicalName: 'VANOS Exhaust Moving Warm',
    category: 'VANOS',
    whatItDoes:
      'Warm-operating exhaust cam target table that affects turbine energy, residual gas, overlap, and top-end breathing.',
    raisingEffect:
      'Can alter exhaust energy and overlap; effects depend on RPM/load and the intake cam target.',
    loweringEffect:
      'Can reduce residuals or change turbine response but may reduce spool or midrange torque if overdone.',
    whenToTouch:
      'When refining spool/torque shape after the main boost and timing calibration is stable.',
    whenNotToTouch:
      'Do not make broad exhaust cam changes without logging target/actual tracking and timing response.',
    dangerSigns:
      'VANOS deviation, rough torque transition, slower spool, or added timing correction.',
    logChannels: ['Exhaust VANOS target', 'Exhaust VANOS actual', 'Boost actual', 'Timing corrections', 'RPM'],
    relatedMaps: ['vanos-intake-moving-warm', 'timing-main', 'spool-wgdc'],
    sourceReferences: [n54Guide, spreadsheet, localDiff],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: { I8A0S: 'VANOS Exhaust (Moving) Warm', IJE0S: 'VANOS Exhaust (Moving) Warm' },
  },
  {
    id: 'torque-monitor-ceiling',
    canonicalName: 'Torque Monitor Ceiling',
    category: 'Safety & Protections',
    whatItDoes:
      'Torque-monitoring ceiling used by the DME to detect implausible torque/load behavior.',
    raisingEffect:
      'Allows more torque-model headroom before intervention, but can reduce protection sensitivity.',
    loweringEffect:
      'Intervenes sooner and may close throttle or reduce torque if tuned load exceeds the model.',
    whenToTouch:
      'Only enough to align the torque model with a validated load target and measured behavior.',
    whenNotToTouch:
      'Do not max it globally to bypass torque monitoring.',
    dangerSigns:
      'Throttle closure, torque intervention, torque plausibility faults, or sudden power cuts.',
    logChannels: ['Throttle angle', 'Load requested', 'Load actual', 'Boost target', 'Boost actual', 'Torque intervention'],
    relatedMaps: ['load-limiters', 'throttle-load-protection', 'load-target-1'],
    sourceReferences: [n54Guide, spreadsheet, localDiff],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: { I8A0S: 'Torque Monitor Ceiling', IJE0S: 'Torque Monitor Ceiling' },
  },
  {
    id: 'requested-torque-monitor-factor-a-b',
    canonicalName: 'Requested Torque Monitor Factor A / B',
    category: 'Safety & Protections',
    whatItDoes:
      'Torque-monitor scaling factors that influence how requested torque is checked against modeled behavior.',
    raisingEffect:
      'Can loosen torque monitoring in affected regions depending on table convention.',
    loweringEffect:
      'Can tighten or reshape monitoring, again depending on the exact axis and convention.',
    whenToTouch:
      'Only during torque-model alignment after identifying the exact intervention path.',
    whenNotToTouch:
      'Do not treat these as power tables; they are monitoring/protection strategy.',
    dangerSigns:
      'Torque intervention, throttle closure, plausibility faults, or inconsistent requested-vs-actual load.',
    logChannels: ['Load requested', 'Load actual', 'Throttle angle', 'Boost actual', 'Torque intervention'],
    relatedMaps: ['torque-monitor-ceiling', 'load-limiters', 'load-target-1'],
    sourceReferences: [spreadsheet, localDiff],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: { I8A0S: 'Requested Torque Mon. Factor A / B', IJE0S: 'Requested Torque Mon. Factor A / B' },
  },
  {
    id: 'threshold-major-throttle-closures',
    canonicalName: 'Threshold Major Throttle Closures',
    category: 'Safety & Protections',
    whatItDoes:
      'Threshold logic used to identify or react to major throttle closures during torque/boost control.',
    raisingEffect:
      'May reduce sensitivity to closure events depending on table convention.',
    loweringEffect:
      'May make closure detection or intervention more sensitive.',
    whenToTouch:
      'Only after boost, load, and torque monitor behavior are understood from logs.',
    whenNotToTouch:
      'Do not change it to hide throttle closure caused by real overboost or torque mismatch.',
    dangerSigns:
      'Throttle angle drops under WOT, boost overshoot, load overshoot, or torque intervention flags.',
    logChannels: ['Throttle angle', 'Pedal position', 'Boost target', 'Boost actual', 'Load requested', 'Load actual'],
    relatedMaps: ['throttle-load-protection', 'torque-monitor-ceiling', 'boost-ceiling'],
    sourceReferences: [n54Guide, spreadsheet],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: { I8A0S: 'Threshold Major Throttle Closures', IJE0S: 'Threshold Major Throttle Closures' },
  },
  {
    id: 'enable-map-switch',
    canonicalName: 'Enable Map Switch',
    category: 'MHD+',
    whatItDoes:
      'Enables MHD+ map switching so multiple calibrated slots can be selected through the supported MHD+ workflow.',
    raisingEffect:
      'Enables the feature when set according to MHD+ convention.',
    loweringEffect:
      'Disables the feature or reduces available switching behavior depending on the toggle.',
    whenToTouch:
      'When building a deliberate multi-map calibration with matching load, timing, fuel, and safety tables per slot.',
    whenNotToTouch:
      'Do not enable map switching unless each active slot is fully calibrated and documented.',
    dangerSigns:
      'Wrong active slot, unexpected load/timing target, fuel blend mismatch, or driver selecting an unsafe map.',
    logChannels: ['Active map slot', 'Boost target', 'Load requested', 'Timing', 'Ethanol content active'],
    relatedMaps: ['active-map-slots', 'fuel-interpolation', 'load-interpolation', 'timing-interpolation'],
    teachingExamples: [
      {
        title: 'Wrong map slot after flashing',
        situation: 'The car logs a load target that does not match the expected pump-gas map.',
        logSymptoms: ['Active map slot is not the intended slot', 'Boost/load target differs from expected', 'Timing target does not match fuel'],
        likelyCause: 'Map switching is enabled but slots are not documented or selected correctly.',
        mapsToCheck: ['Enable Map Switch', 'Active Map Slots', 'Load Interpolation', 'Timing Interpolation'],
        safeAdjustmentDirection: 'Disable unused slots or document and validate every active slot before delivery.',
        validationSteps: ['Log active slot', 'Verify target values per slot', 'Confirm driver selection procedure'],
        warning: 'Do not ship a multi-map file with unvalidated slots.',
      },
    ],
    sourceReferences: [mhdGuide],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: { I8A0S: 'Enable Map Switch', IJE0S: 'Enable Map Switch' },
  },
  {
    id: 'enable-flexfuel',
    canonicalName: 'Enable FlexFuel',
    category: 'MHD+',
    whatItDoes:
      'Enables MHD+ FlexFuel strategy so ethanol content can influence load, fuel, and timing interpolation.',
    raisingEffect:
      'Enables ethanol-content based strategy when configured with matching sensor/input and interpolation maps.',
    loweringEffect:
      'Disables FlexFuel behavior and returns the file to fixed-fuel assumptions.',
    whenToTouch:
      'When a verified ethanol-content input exists and all interpolation tables are calibrated for the supported blend range.',
    whenNotToTouch:
      'Do not enable FlexFuel if ethanol content cannot be logged and validated.',
    dangerSigns:
      'Ethanol content reads wrong, timing/load do not follow blend, lambda drifts, or fuel pressure falls at high ethanol.',
    logChannels: ['Ethanol content CAN', 'Ethanol content active', 'Lambda actual', 'Fuel pressure', 'Timing', 'Load requested'],
    relatedMaps: ['static-ethanol-content-map', 'fuel-interpolation', 'load-interpolation', 'timing-interpolation'],
    sourceReferences: [mhdGuide],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: { I8A0S: 'Enable FlexFuel', IJE0S: 'Enable FlexFuel' },
  },
  {
    id: 'static-ethanol-content-map',
    canonicalName: 'Static Ethanol Content Map 1-4',
    category: 'MHD+',
    whatItDoes:
      'Defines fixed ethanol-content assumptions per map slot when operating without a live ethanol-content input.',
    raisingEffect:
      'Tells interpolation logic to assume more ethanol, which can permit more timing/load only if fuel system and real blend match.',
    loweringEffect:
      'Assumes less ethanol and should command safer pump-gas style load/timing.',
    whenToTouch:
      'When creating fixed-blend map slots and the driver can reliably fuel to the documented blend.',
    whenNotToTouch:
      'Do not set optimistic ethanol values for unknown pump mixtures.',
    dangerSigns:
      'Timing corrections, lean lambda, fuel pressure drop, or active ethanol content not matching the fuel in the tank.',
    logChannels: ['Ethanol content active', 'Timing corrections', 'Lambda actual', 'HPFP pressure', 'Load requested'],
    relatedMaps: ['enable-flexfuel', 'fuel-interpolation', 'load-interpolation', 'timing-interpolation'],
    sourceReferences: [mhdGuide],
    difficulty: 'Advanced',
    riskLevel: 'High',
    romAliases: { I8A0S: 'Static Ethanol Content Map 1-4', IJE0S: 'Static Ethanol Content Map 1-4' },
  },
  {
    id: 'enable-custom-3d-boost-ceiling',
    canonicalName: 'Enable Custom 3D Boost Ceiling Table',
    category: 'MHD+',
    whatItDoes:
      'Enables a custom boost ceiling strategy, commonly shaped by gear and RPM for better pressure headroom control.',
    raisingEffect:
      'Allows the custom ceiling logic to govern overboost headroom when configured.',
    loweringEffect:
      'Returns control to the base ceiling strategy or disables the custom layer.',
    whenToTouch:
      'When target boost varies strongly by gear/RPM or upgraded sensors require a controlled custom ceiling envelope.',
    whenNotToTouch:
      'Do not use custom ceilings to hide uncontrolled boost overshoot.',
    dangerSigns:
      'Boost exceeds intended ceiling, throttle closes, pressure plausibility faults, or gear-specific overboost.',
    logChannels: ['Gear', 'RPM', 'Boost target', 'Boost actual', 'Throttle angle'],
    relatedMaps: ['boost-ceiling', 'boost-ceiling-relative-gear-rpm', 'map-max-voltage'],
    sourceReferences: [mhdGuide],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: { I8A0S: 'Enable Custom 3D Boost Ceiling Table', IJE0S: 'Enable Custom 3D Boost Ceiling Table' },
  },
  {
    id: 'enable-custom-wgdc-override',
    canonicalName: 'Enable Custom WGDC Override',
    category: 'MHD+',
    whatItDoes:
      'Enables MHD+ custom WGDC control tables such as custom base, P-factor, and D-factor behavior.',
    raisingEffect:
      'Turns on the custom control layer when set according to MHD+ convention.',
    loweringEffect:
      'Disables the override and returns to the base WGDC strategy.',
    whenToTouch:
      'For advanced boost-control builds where the custom WGDC tables are fully calibrated and logged.',
    whenNotToTouch:
      'Do not enable override with copied or empty custom WGDC tables.',
    dangerSigns:
      'Immediate overboost, no boost response, duty pegged, oscillation, or throttle closure after enabling.',
    logChannels: ['WGDC custom base', 'WGDC after PID', 'Boost target', 'Boost actual', 'Boost error'],
    relatedMaps: ['wgdc-base-custom', 'wgdc-p-factor-custom', 'wgdc-d-factor-custom', 'min-load-threshold-pd-factors'],
    sourceReferences: [mhdGuide],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: { I8A0S: 'Enable Custom WGDC Override', IJE0S: 'Enable Custom WGDC Override' },
  },
  {
    id: 'antilag-safeties',
    canonicalName: 'Antilag Safeties',
    category: 'MHD+',
    whatItDoes:
      'Safety limits around antilag operation, including activation conditions, temperature limits, torque limits, and exit behavior.',
    raisingEffect:
      'Can make antilag more permissive depending on the limit, increasing heat and drivetrain stress.',
    loweringEffect:
      'Makes antilag more conservative and may reduce availability or aggressiveness.',
    whenToTouch:
      'Only for a build with known turbo, fueling, ignition, exhaust, and thermal limits.',
    whenNotToTouch:
      'Do not enable or loosen antilag safeties on a car with unknown fuel pressure, weak ignition, stock fragile exhaust components, or no validation plan.',
    dangerSigns:
      'Misfire, lambda instability, excessive EGT/heat, boost spike after launch, clutch/transmission distress, or fault codes.',
    logChannels: ['Antilag active', 'Boost actual', 'Lambda actual', 'Timing', 'Misfire counters', 'IAT', 'Coolant temp'],
    relatedMaps: ['enable-map-switch', 'enable-flexfuel', 'timing-main', 'fuel-main'],
    sourceReferences: [mhdGuide],
    difficulty: 'Critical',
    riskLevel: 'Critical',
    romAliases: { I8A0S: 'Antilag Safeties', IJE0S: 'Antilag Safeties' },
  },
]
