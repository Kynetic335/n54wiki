import type { SourceReference } from './tuningParameters'

export type CalibrationGuide = {
  slug: string
  title: string
  summary: string
  sourceReferences?: SourceReference[]
  sections: {
    heading: string
    body: string
    links?: {
      label: string
      href: string
    }[]
  }[]
}

const safetyRules = [
  'Change one area at a time.',
  'Log before and after every calibration change.',
  'Do not guess timing.',
  'Do not guess lambda.',
  'Do not copy values blindly from another car.',
  'Confirm the BIN, XDF, and ROM match before interpreting any map.',
  'Bank 1 and Bank 2 scalar/lambda-related tables must match unless there is a documented reason.',
  'Treat JB4/backend-flash notes as legacy context unless explicitly building a backend flash.',
]

const n54Guide: SourceReference = {
  source: 'N54 Tuning Guide',
  locator: 'General N54 calibration workflow, load/boost/fuel/timing/VANOS/logging sections',
  note: 'Summarized into original teaching language and workflow checks.',
}

const mhdGuide: SourceReference = {
  source: 'MHD+ Suite Tuning Guide',
  locator: 'MHD+ map switching, FlexFuel, custom boost/WGDC, and antilag sections',
  note: 'Summarized into original MHD+ workflow explanations.',
}

const spreadsheet: SourceReference = {
  source: 'N5X Tuning Spreadsheet',
  locator: 'N5X map category worksheets',
  note: 'Used for map naming and category normalization.',
}

function safetySection() {
  return {
    heading: 'Safety Rules',
    body: safetyRules.join(' '),
  }
}

export const guides: CalibrationGuide[] = [
  {
    slug: 'pre-tune-checklist',
    title: 'Pre-Tune Checklist',
    summary: 'Mechanical readiness checks before raising load, boost, timing, or ethanol content on an N54.',
    sourceReferences: [n54Guide],
    sections: [
      {
        heading: 'Minimum readiness',
        body:
          'Confirm no unresolved DME faults, no boost leaks, stable HPFP and LPFP pressure, fresh plugs/coils, known injector health, clean VANOS behavior, and no cooling-system weakness. Calibration cannot rescue a mechanically unstable N54.',
        links: [
          { label: 'Fuel pressure protection', href: '/parameters/fuel-pressure-protection' },
          { label: 'Boost target', href: '/parameters/boost-target' },
        ],
      },
      {
        heading: 'Baseline log',
        body:
          'Before changing maps, capture a repeatable WOT pull where safe. Review boost target vs actual, WGDC, lambda, trims, HPFP, LPFP, timing corrections, throttle angle, IAT, and active map/fuel state if MHD+ is enabled.',
        links: [{ label: 'Logging basics', href: '/guides/logging-basics' }],
      },
      safetySection(),
    ],
  },
  {
    slug: 'xdf-bin-matching',
    title: 'XDF/BIN Matching',
    summary: 'How to keep I8A0S, IJE0S, stock BINs, tuned BINs, and XDF definitions aligned.',
    sourceReferences: [spreadsheet, n54Guide],
    sections: [
      {
        heading: 'ROM boundary',
        body:
          'A map name is not enough. The BIN and XDF must match the ROM family before values, axes, units, or offsets are trusted. I8A0S values must be interpreted through the I8A0S XDF; IJE0S values through IJE0S.',
        links: [{ label: 'I8A0S vs IJE0S', href: '/guides/i8a0s-vs-ije0s' }],
      },
      {
        heading: 'App-safe diffing',
        body:
          'The Tuning School stores only derived summaries: map names, normalized categories, changed-cell counts, stock summaries, tuned summaries, and review flags. It does not expose private binaries, XDF addresses, or patch bytes.',
        links: [{ label: 'Stage recipes', href: '/recipes' }],
      },
      safetySection(),
    ],
  },
  {
    slug: 'logging-basics',
    title: 'Logging Basics',
    summary: 'The log-review sequence used to decide whether a calibration change is ready for the next step.',
    sourceReferences: [n54Guide],
    sections: [
      {
        heading: 'Read target vs actual first',
        body:
          'Start with the controller objective. For boost, compare target to actual, then inspect WGDC base, WGDC after PID, throttle, gear, and RPM. For fueling, compare requested lambda to actual and verify fuel pressure before judging timing.',
        links: [
          { label: 'Boost error', href: '/parameters/boost-error' },
          { label: 'Fuel main', href: '/parameters/fuel-main' },
        ],
      },
      {
        heading: 'Earn the next revision',
        body:
          'Only add boost, timing, ethanol, or limiter headroom after the current file shows clean pressure control, stable lambda, fuel-pressure margin, low timing correction, and repeatability across more than one pull.',
        links: [{ label: 'Stage recipes', href: '/recipes' }],
      },
      safetySection(),
    ],
  },
  {
    slug: 'boost-load-tuning',
    title: 'Boost Load Tuning',
    summary: 'How load target, boost target, ceilings, and torque model headroom work together.',
    sourceReferences: [n54Guide, spreadsheet],
    sections: [
      {
        heading: 'Load is the request',
        body:
          'On MSD80/81, load target is the torque-model request that drives boost demand. Raising load requires fuel, timing, WGDC, throttle, and protection headroom to agree.',
        links: [
          { label: 'Load Target 1', href: '/parameters/load-target-1' },
          { label: 'Boost Ceiling', href: '/parameters/boost-ceiling' },
        ],
      },
      {
        heading: 'Failure signs',
        body:
          'Do not add load when the log already shows throttle closure, fuel pressure drop, timing correction, high IAT, or WGDC at the ceiling with low actual boost.',
      },
      safetySection(),
    ],
  },
  {
    slug: 'wgdc-pid-diagnosis',
    title: 'WGDC PID Diagnosis',
    summary: 'Diagnosing base duty, after-PID duty, adders, ceilings, and P/I/D behavior.',
    sourceReferences: [n54Guide, spreadsheet],
    sections: [
      {
        heading: 'Base vs after PID',
        body:
          'If WGDC after PID is below base while boost is on target or above target, the feed-forward side is too aggressive. If after-PID is high and boost is still low, inspect hardware and target realism before adding duty.',
        links: [
          { label: 'WGDC After PID', href: '/parameters/wgdc-after-pid' },
          { label: 'WGDC P-Factor', href: '/parameters/wgdc-p-factor' },
        ],
      },
      {
        heading: 'PID tuning order',
        body:
          'Correct base WGDC first, then refine P for immediate error response, I for persistent offset, and D for damping. Avoid changing all three in one revision.',
      },
      safetySection(),
    ],
  },
  {
    slug: 'fuel-scalar-and-trims',
    title: 'Fuel Scalar and Trims',
    summary: 'Using fuel scalar and trims to align fuel modeling without hiding hardware faults.',
    sourceReferences: [n54Guide, spreadsheet],
    sections: [
      {
        heading: 'Bank discipline',
        body:
          'Bank 1 and Bank 2 scalar-related tables should match unless there is a documented hardware or sensor reason. A bank split in trims is a diagnostic clue before it is a calibration target.',
        links: [{ label: 'Fuel Scalar Bank 1 / Bank 2', href: '/parameters/fuel-scalar-bank-1-2' }],
      },
      {
        heading: 'Trim interpretation',
        body:
          'Use STFT and LTFT trends with lambda actual, fuel pressure, and ethanol content. Do not adjust scalar while HPFP/LPFP pressure is unstable or ethanol content is unknown.',
      },
      safetySection(),
    ],
  },
  {
    slug: 'afr-lambda-strategy',
    title: 'AFR Lambda Strategy',
    summary: 'How requested lambda, actual lambda, enrichment, and fuel pressure validation fit together.',
    sourceReferences: [n54Guide, spreadsheet],
    sections: [
      {
        heading: 'Command vs result',
        body:
          'Fuel target changes must be validated with requested lambda and actual lambda for both banks. A richer target is not safe if actual lambda cannot follow because rail pressure falls.',
        links: [{ label: 'Fuel Main', href: '/parameters/fuel-main' }],
      },
      {
        heading: 'Blend sensitivity',
        body:
          'Ethanol blends need fuel model and pressure margin. Fixed-blend maps must match the fuel in the tank, and FlexFuel maps must log active ethanol content correctly.',
      },
      safetySection(),
    ],
  },
  {
    slug: 'ignition-timing-safety',
    title: 'Ignition Timing Safety',
    summary: 'Safe spark workflow for timing main, IAT correction, fuel quality, and knock correction review.',
    sourceReferences: [n54Guide, spreadsheet],
    sections: [
      {
        heading: 'Timing is earned',
        body:
          'Do not add timing until boost, lambda, HPFP/LPFP, plugs, coils, and IAT behavior are stable. Timing corrections across multiple cylinders mean the calibration or hardware is not ready.',
        links: [
          { label: 'Timing Main', href: '/parameters/timing-main' },
          { label: 'IAT Total Timing Correction', href: '/parameters/iat-total-timing-correction' },
        ],
      },
      safetySection(),
    ],
  },
  {
    slug: 'vanos-overlap-lsa',
    title: 'VANOS Overlap and LSA',
    summary: 'Teaching cam phasing, overlap, spool, torque shape, and knock sensitivity.',
    sourceReferences: [n54Guide, spreadsheet],
    sections: [
      {
        heading: 'Cam phasing affects combustion',
        body:
          'Intake and exhaust VANOS targets alter cylinder filling, residuals, turbine energy, and effective overlap. A spool gain can still be a bad change if timing corrections appear.',
        links: [
          { label: 'VANOS Intake Moving Warm', href: '/parameters/vanos-intake-moving-warm' },
          { label: 'VANOS Exhaust Moving Warm', href: '/parameters/vanos-exhaust-moving-warm' },
        ],
      },
      safetySection(),
    ],
  },
  {
    slug: 'mhd-plus-overview',
    title: 'MHD+ Overview',
    summary: 'How MHD+ feature layers sit on top of the base MSD80/81 calibration.',
    sourceReferences: [mhdGuide],
    sections: [
      {
        heading: 'Feature layers',
        body:
          'MHD+ can add map switching, FlexFuel interpolation, custom boost ceiling, custom WGDC control, and antilag behavior. These layers must be calibrated as part of the tune, not treated as checkboxes.',
        links: [
          { label: 'Enable Map Switch', href: '/parameters/enable-map-switch' },
          { label: 'Enable FlexFuel', href: '/parameters/enable-flexfuel' },
        ],
      },
      safetySection(),
    ],
  },
  {
    slug: 'map-switching',
    title: 'Map Switching',
    summary: 'Building and validating multiple active map slots safely.',
    sourceReferences: [mhdGuide],
    sections: [
      {
        heading: 'Every slot is a tune',
        body:
          'Each active slot needs matched load, timing, fuel, boost ceiling, and safety behavior. Unused slots should not contain optimistic or unvalidated values.',
        links: [{ label: 'Enable Map Switch', href: '/parameters/enable-map-switch' }],
      },
      safetySection(),
    ],
  },
  {
    slug: 'flexfuel',
    title: 'FlexFuel',
    summary: 'General FlexFuel workflow for ethanol content, interpolation, and validation.',
    sourceReferences: [mhdGuide],
    sections: [
      {
        heading: 'Log the active content',
        body:
          'FlexFuel is only as safe as the ethanol-content input and interpolation tables. Always log active ethanol content, lambda, fuel pressure, load, and timing after enabling it.',
        links: [{ label: 'Enable FlexFuel', href: '/parameters/enable-flexfuel' }],
      },
      safetySection(),
    ],
  },
  {
    slug: 'n54-flexfuel-specifics',
    title: 'N54 FlexFuel Specifics',
    summary: 'N54-specific constraints around DI fuel pressure, trims, timing, and ethanol blend range.',
    sourceReferences: [mhdGuide, n54Guide],
    sections: [
      {
        heading: 'Fuel system limit first',
        body:
          'On the N54, ethanol blend support is constrained by HPFP, LPFP, injector health, trims, and lambda tracking. Load and timing interpolation must follow real fuel pressure margin.',
        links: [
          { label: 'Fuel Pressure Target Homogeneous', href: '/parameters/fuel-pressure-target-homogeneous' },
          { label: 'Static Ethanol Content Map', href: '/parameters/static-ethanol-content-map' },
        ],
      },
      safetySection(),
    ],
  },
  {
    slug: 'custom-3d-boost-ceiling',
    title: 'Custom 3D Boost Ceiling',
    summary: 'Using custom boost ceiling logic without hiding overboost.',
    sourceReferences: [mhdGuide],
    sections: [
      {
        heading: 'Ceiling is a boundary',
        body:
          'Custom boost ceiling should sit above validated target behavior and below unsafe overboost. It is a safety envelope, not a way to ignore pressure spikes.',
        links: [{ label: 'Enable Custom 3D Boost Ceiling Table', href: '/parameters/enable-custom-3d-boost-ceiling' }],
      },
      safetySection(),
    ],
  },
  {
    slug: 'custom-wgdc-control',
    title: 'Custom WGDC Control',
    summary: 'Using custom MHD+ WGDC tables with base, P, and D strategy.',
    sourceReferences: [mhdGuide],
    sections: [
      {
        heading: 'Override responsibility',
        body:
          'Once custom WGDC override is enabled, the custom base and control terms must be treated as primary boost-control strategy and validated against boost target, actual, and throttle.',
        links: [{ label: 'Enable Custom WGDC Override', href: '/parameters/enable-custom-wgdc-override' }],
      },
      safetySection(),
    ],
  },
  {
    slug: 'antilag',
    title: 'Antilag',
    summary: 'Antilag workflow, activation expectations, and validation logs.',
    sourceReferences: [mhdGuide],
    sections: [
      {
        heading: 'Heat and shock load',
        body:
          'Antilag is a high-stress feature. Validate ignition, lambda, boost response, temperature, and drivetrain behavior before increasing aggressiveness.',
        links: [{ label: 'Antilag Safeties', href: '/parameters/antilag-safeties' }],
      },
      safetySection(),
    ],
  },
  {
    slug: 'antilag-safeties',
    title: 'Antilag Safeties',
    summary: 'Safety limits and failure signs specific to antilag operation.',
    sourceReferences: [mhdGuide],
    sections: [
      {
        heading: 'Conservative first',
        body:
          'Start with conservative activation windows, temperature limits, boost response, and timing/fuel behavior. Increase only after logs prove stability.',
        links: [{ label: 'Antilag Safeties', href: '/parameters/antilag-safeties' }],
      },
      safetySection(),
    ],
  },
  {
    slug: 'msd80-vs-msd81',
    title: 'MSD80 vs MSD81',
    summary: 'How the two N54 DME families differ in tuning workflow, validation discipline, and ROM support.',
    sourceReferences: [n54Guide, spreadsheet],
    sections: [
      {
        heading: 'Calibration stance',
        body:
          'MSD80 and MSD81 use the same core N54 control concepts, but ROM support, map addresses, package readiness, and validation history differ. Treat the ROM id as a calibration boundary.',
        links: [{ label: 'I8A0S Stage 1 93 recipe', href: '/recipes/i8a0s/stage-1/93' }],
      },
      {
        heading: 'Practical workflow',
        body:
          'Start by identifying the DME and ROM in MHD or the read tool, then match all map aliases and package data to that ROM. Do not copy tuned values across families without proving axis, units, and behavior.',
        links: [{ label: 'ROM alias guide', href: '/guides/i8a0s-vs-ije0s' }],
      },
      safetySection(),
    ],
  },
  {
    slug: 'n54-log-review',
    title: 'How to Review an N54 Log',
    summary: 'Structured sequence for reading MHD logs before deciding whether a calibration change is appropriate.',
    sourceReferences: [n54Guide],
    sections: [
      {
        heading: 'Step 1 — target vs actual, every system',
        body:
          'Start with the controller objective for each system in order: boost target vs actual, then WGDC base vs after-PID, then lambda target vs actual with fuel pressure, then timing corrections per cylinder. Never jump to a map change before this sequence is complete.',
        links: [
          { label: 'Boost target', href: '/parameters/boost-target' },
          { label: 'Lambda target', href: '/parameters/lambda-target' },
        ],
      },
      {
        heading: 'Step 2 — isolate before adjusting',
        body:
          'Identify which single control loop is failing. Boost undershooting with high WGDC is a different problem than boost overshooting with low WGDC. Fix the loop causing the symptom. Change one area per revision and log again before proceeding.',
        links: [
          { label: 'Boost control diagnostics', href: '/diagnostics/boost-control' },
          { label: 'Log review overview', href: '/diagnostics/logs' },
        ],
      },
      safetySection(),
    ],
  },
  {
    slug: 'boost-oscillation-fix',
    title: 'Fix Boost Oscillation',
    summary: 'Workflow for diagnosing and resolving boost oscillation, overshoot, or hunting after spool.',
    sourceReferences: [n54Guide],
    sections: [
      {
        heading: 'Identify the source — base or PID',
        body:
          'Log WGDC base alongside WGDC after PID. If after-PID drops below base near the oscillation point, the feed-forward table is too aggressive. If after-PID stays near base but boost oscillates, PID gains are fighting something mechanical.',
        links: [
          { label: 'Base WGDC', href: '/parameters/base-wgdc' },
          { label: 'WGDC After PID', href: '/parameters/wgdc-after-pid' },
        ],
      },
      {
        heading: 'Adjust base before PID',
        body:
          'Lower base WGDC in the RPM/load region where oscillation begins. Relog before touching P, I, or D factors. Each PID term responds differently: P reacts to current error, I to accumulated offset, D to rate of change. Change one term at a time.',
        links: [
          { label: 'WGDC P-Factor', href: '/parameters/wgdc-p-factor' },
          { label: 'WGDC D-Factor', href: '/parameters/wgdc-d-factor' },
          { label: 'Boost overshoot', href: '/diagnostics/boost-overshoot' },
        ],
      },
      safetySection(),
    ],
  },
  {
    slug: 'throttle-closure-diagnosis',
    title: 'Diagnose Throttle Closure',
    summary: 'How to find the root cause of WOT throttle closure before touching boost ceilings or torque limits.',
    sourceReferences: [n54Guide],
    sections: [
      {
        heading: 'Read throttle vs pedal first',
        body:
          'Throttle angle below pedal position during WOT means the DME intervened. The log must then identify the trigger: boost overshooting the ceiling, load exceeding a limiter, or the torque monitor detecting an implausible value. Each trigger has a different map fix.',
        links: [
          { label: 'Throttle / Load Protection', href: '/parameters/throttle-load-protection' },
          { label: 'Torque Monitor Ceiling', href: '/parameters/torque-monitor-ceiling' },
        ],
      },
      {
        heading: 'Fix the cause, not the ceiling',
        body:
          'Do not raise boost ceiling, load limiters, or torque monitor to stop closure without confirming actual boost is genuinely above a realistic target. Closure responding to real overshoot is protecting the engine.',
        links: [
          { label: 'Load Limiters', href: '/parameters/load-limiters' },
          { label: 'Boost Ceiling', href: '/parameters/boost-ceiling' },
          { label: 'Throttle closure diagnostics', href: '/diagnostics/throttle-closure' },
          { label: 'Torque limit intervention', href: '/diagnostics/torque-limit-intervention' },
        ],
      },
      safetySection(),
    ],
  },
  {
    slug: 'hpfp-lpfp-pressure-drop',
    title: 'Diagnose HPFP/LPFP Pressure Drop',
    summary: 'Step-by-step workflow for diagnosing fuel pressure sag before adjusting boost, timing, or ethanol.',
    sourceReferences: [n54Guide],
    sections: [
      {
        heading: 'Log rail pressure first, lambda second',
        body:
          'Log HPFP target vs actual and LPFP actual alongside lambda. A HPFP drop that precedes a lean lambda event confirms the supply side is failing under demand. A LPFP sag before the HPFP drops confirms the low-pressure circuit is the bottleneck.',
        links: [
          { label: 'HPFP Pressure Target', href: '/parameters/hpfp-pressure-target' },
          { label: 'LPFP Pressure Target', href: '/parameters/lpfp-pressure-target' },
          { label: 'Rail pressure crash', href: '/diagnostics/rail-pressure-crash' },
          { label: 'LPFP drop', href: '/diagnostics/lpfp-drop' },
        ],
      },
      {
        heading: 'Hardware fix before calibration',
        body:
          'A collapsing fuel pressure trace is a hardware signal. Do not reduce load targets or enrich the fuel table to compensate for a weak pump. Fix or replace the undersized component, then relog to confirm pressure holds across the intended boost and ethanol range.',
        links: [
          { label: 'Lambda target', href: '/parameters/lambda-target' },
          { label: 'Fuel pressure protection', href: '/parameters/fuel-pressure-protection' },
        ],
      },
      safetySection(),
    ],
  },
  {
    slug: 'safe-base-map-workflow',
    title: 'Safe Base Map Workflow',
    summary: 'Ordered approach for building or inheriting a base calibration before raising load, timing, or ethanol.',
    sourceReferences: [n54Guide],
    sections: [
      {
        heading: 'Establish a clean baseline log',
        body:
          'Before touching any map, capture a repeatable WOT pull. Confirm boost target vs actual, WGDC base vs after-PID, lambda target vs actual, fuel pressure, timing corrections, and throttle angle are all interpretable. A log that cannot be read cannot be improved.',
        links: [
          { label: 'Pre-tune checklist', href: '/guides/pre-tune-checklist' },
          { label: 'Logging basics', href: '/guides/logging-basics' },
          { label: 'Log review workflow', href: '/guides/n54-log-review' },
        ],
      },
      {
        heading: 'Earn each revision in order',
        body:
          'Set load and boost targets first. Validate boost control and throttle stability before touching timing. Set lambda appropriate for fuel type and confirm fuel pressure before adding timing. Never add timing while corrections are present, lambda is lean, or pressure is marginal.',
        links: [
          { label: 'Boost target', href: '/parameters/boost-target' },
          { label: 'Ignition main', href: '/parameters/ignition-main' },
          { label: 'Lambda target', href: '/parameters/lambda-target' },
        ],
      },
      safetySection(),
    ],
  },
  {
    slug: 'pump-gas-vs-e-blend',
    title: 'Pump Gas vs E-Blend Workflow',
    summary: 'How to safely transition between fuel types and calibrate for ethanol blends without masking fuel system limits.',
    sourceReferences: [n54Guide, mhdGuide],
    sections: [
      {
        heading: 'Verify fuel system before adding ethanol',
        body:
          'Confirm HPFP and LPFP pressure hold under current load before increasing ethanol content. Log STFT and LTFT on pump gas first. A scalar or trim problem on E0 will compound immediately on E30+.',
        links: [
          { label: 'HPFP Pressure Target', href: '/parameters/hpfp-pressure-target' },
          { label: 'LPFP Pressure Target', href: '/parameters/lpfp-pressure-target' },
          { label: 'STFT/LTFT diagnostics', href: '/diagnostics/stft-ltft' },
        ],
      },
      {
        heading: 'Lambda and scalar must track the blend',
        body:
          'After changing ethanol content, log lambda actual vs target and fuel trims. Fuel scalar accounts for energy content — on ethanol, raising scalar is often needed to keep trims centered. Do not carry ethanol assumptions from another car. Log active ethanol content if FlexFuel is enabled.',
        links: [
          { label: 'Fuel scalar', href: '/parameters/fuel-scalar' },
          { label: 'Lambda target', href: '/parameters/lambda-target' },
          { label: 'Enable FlexFuel', href: '/parameters/enable-flexfuel' },
          { label: 'N54 FlexFuel specifics', href: '/guides/n54-flexfuel-specifics' },
        ],
      },
      safetySection(),
    ],
  },
  {
    slug: 'turbo-type-workflow',
    title: 'Stock Turbo vs Hybrid vs Single Turbo Workflow',
    summary: 'How turbo hardware choice changes boost control strategy, WGDC authority, and safe load targets.',
    sourceReferences: [n54Guide],
    sections: [
      {
        heading: 'Hardware limits define the strategy',
        body:
          'Stock twin turbos have limited WGDC authority and a taper strategy is required past 5500 RPM. Hybrid twins extend the efficient range but retain twin boost control architecture. A single turbo requires a fundamentally different spool and target strategy with a different ceiling envelope.',
        links: [
          { label: 'Boost target', href: '/parameters/boost-target' },
          { label: 'WGDC Ceiling', href: '/parameters/wgdc-ceiling' },
        ],
      },
      {
        heading: 'Strategy diverges at Stage 2 and above',
        body:
          'For stock turbos, taper load and WGDC through the top end. For hybrid turbos, extend the midrange and verify WGDC authority before increasing the ceiling. For single turbo, validate spool WGDC independently of the base table and build a separate ceiling strategy.',
        links: [
          { label: 'Spool WGDC', href: '/parameters/spool-wgdc' },
          { label: 'Ignition main', href: '/parameters/ignition-main' },
          { label: 'Hybrid twins guide', href: '/tuning/hybrid-twins' },
          { label: 'Single turbo guide', href: '/tuning/single-turbo' },
        ],
      },
      safetySection(),
    ],
  },
  {
    slug: 'i8a0s-vs-ije0s',
    title: 'I8A0S vs IJE0S',
    summary: 'ROM aliasing and behavior notes for the two primary ROMs in this calibration reference.',
    sourceReferences: [spreadsheet],
    sections: [
      {
        heading: 'Alias discipline',
        body:
          'The parameter library uses canonical names first, then records I8A0S and IJE0S aliases on each parameter. This lets recipes link to one concept while still showing the map name a tuner expects in the ROM-specific editor.',
        links: [{ label: 'Browse parameters', href: '/parameters' }],
      },
      {
        heading: 'Validation boundary',
        body:
          'Stage and fuel recipes should be duplicated per ROM even when the strategy is similar. Stock values, tuned profiles, offsets, and safety gates must be validated in the target ROM before a recipe is promoted from scaffold to release guidance.',
      },
      safetySection(),
    ],
  },
]

export const getGuide = (slug: string): CalibrationGuide | undefined =>
  guides.find((guide) => guide.slug === slug)
