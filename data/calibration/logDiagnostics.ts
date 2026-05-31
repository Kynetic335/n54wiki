import type { ParameterCategory, SourceReference } from './tuningParameters'

export type LogDiagnosticCategory =
  | 'logs'
  | 'boost-control'
  | 'fueling'
  | 'timing-corrections'
  | 'throttle-closure'
  | 'fuel-pressure'

export type LogDiagnostic = {
  slug: string
  title: string
  summary: string
  category: ParameterCategory | 'Log Workflow'
  sourceReferences?: SourceReference[]
  relatedWorkflows?: string[]
  cases: {
    title: string
    symptom: string
    logEvidence: string[]
    mapsToInspect: string[]
    safeAdjustmentDirection: string
    validation: string[]
  }[]
}

const n54Guide: SourceReference = {
  source: 'N54 Tuning Guide',
  locator: 'Logging and calibration workflow sections',
  note: 'Summarized into original diagnostic workflow language.',
}

const spreadsheet: SourceReference = {
  source: 'N5X Tuning Spreadsheet',
  locator: 'Load, Boost Control, Fuel, Ignition, and VANOS worksheets',
  note: 'Used for map naming and diagnostic grouping.',
}

export const logDiagnostics: LogDiagnostic[] = [
  {
    slug: 'logs',
    title: 'N54 Log Diagnostics',
    summary:
      'A lightweight diagnostic index for reading N54 logs by symptom before changing calibration maps.',
    category: 'Log Workflow',
    sourceReferences: [n54Guide, spreadsheet],
    cases: [
      {
        title: 'Start with target vs actual',
        symptom: 'The car feels inconsistent or slower after a revision.',
        logEvidence: ['Compare requested vs actual load/boost', 'Check throttle angle', 'Check lambda actual and fuel pressure', 'Check timing corrections'],
        mapsToInspect: ['Load Target 1', 'WGDC Base', 'Fuel Main', 'Timing Main'],
        safeAdjustmentDirection: 'Identify which control loop is failing before changing any map values.',
        validation: ['Repeat the same gear pull', 'Change one area only', 'Confirm the next log moved the intended signal'],
      },
    ],
  },
  {
    slug: 'boost-control',
    title: 'Boost Control Diagnostics',
    summary:
      'Diagnose underboost, overboost, boost oscillation, and WGDC behavior using target, actual, base duty, and after-PID duty.',
    category: 'Boost Control',
    sourceReferences: [n54Guide, spreadsheet],
    relatedWorkflows: ['boost-oscillation-fix'],
    cases: [
      {
        title: 'WGDC after PID below WGDC base',
        symptom: 'Car hits target but the controller is pulling duty.',
        logEvidence: ['WGDC after PID trends below WGDC base', 'Boost actual is close to or above target', 'Throttle may begin to close if overshoot continues'],
        mapsToInspect: ['WGDC Base', 'WGDC Adder Airflow', 'WGDC Ceiling Adder', 'WGDC P-Factor'],
        safeAdjustmentDirection: 'Reduce base or adders in the affected RPM/load/airflow region, then relog.',
        validation: ['Boost error settles near zero', 'Throttle remains open', 'WGDC after PID no longer fights base duty'],
      },
    ],
  },
  {
    slug: 'fueling',
    title: 'Fueling Diagnostics',
    summary:
      'Diagnose lambda target tracking, bank mismatch, scalar error, and fuel-trim behavior before changing fuel tables.',
    category: 'Fueling',
    sourceReferences: [n54Guide, spreadsheet],
    relatedWorkflows: ['pump-gas-vs-e-blend'],
    cases: [
      {
        title: 'Bank lambda or trim mismatch',
        symptom: 'One bank tracks lambda differently or trims diverge under load.',
        logEvidence: ['Lambda bank 1 differs from bank 2', 'STFT bank split increases', 'Fuel pressure is stable enough to rule out global supply first'],
        mapsToInspect: ['Fuel Main Bank 1', 'Fuel Main Bank 2', 'Fuel Scalar Bank 1', 'Fuel Scalar Bank 2'],
        safeAdjustmentDirection: 'Keep bank paired tables matched unless a documented hardware reason exists; diagnose sensors/injectors first.',
        validation: ['Both banks track requested lambda', 'Trims converge', 'No fuel pressure drop appears after the correction'],
      },
    ],
  },
  {
    slug: 'timing-corrections',
    title: 'Timing Correction Diagnostics',
    summary:
      'Diagnose knock/timing corrections with fuel quality, IAT, lambda, fuel pressure, and load context.',
    category: 'Ignition',
    sourceReferences: [n54Guide, spreadsheet],
    cases: [
      {
        title: 'Multi-cylinder timing corrections',
        symptom: 'Timing corrections appear across several cylinders in the same load/RPM area.',
        logEvidence: ['Corrections on multiple cylinders', 'High or rising IAT', 'Boost/load increased from prior revision', 'Lambda and pressure must be checked before spark is blamed'],
        mapsToInspect: ['Timing Main', 'IAT Timing Correction Factor', 'Load Target 1', 'Fuel Main'],
        safeAdjustmentDirection: 'Remove timing or reduce load in the affected area until the log is clean.',
        validation: ['Repeat same gear pull', 'Corrections are gone or isolated', 'IAT/lambda/fuel pressure are repeatable'],
      },
    ],
  },
  {
    slug: 'throttle-closure',
    title: 'Throttle Closure Diagnostics',
    summary:
      'Diagnose WOT throttle closure caused by boost overshoot, load limiters, torque monitoring, or protection intervention.',
    category: 'Safety & Protections',
    sourceReferences: [n54Guide, spreadsheet],
    relatedWorkflows: ['throttle-closure-diagnosis'],
    cases: [
      {
        title: 'Throttle closes during WOT',
        symptom: 'Pedal remains high but throttle angle drops during a pull.',
        logEvidence: ['Throttle angle drops while pedal stays high', 'Load actual may exceed allowed headroom', 'Boost actual may overshoot target'],
        mapsToInspect: ['Boost Ceiling', 'Torque Monitor Ceiling', 'Load Limit Factor', 'Threshold Major Throttle Closures'],
        safeAdjustmentDirection: 'Fix the cause of intervention: overshoot, torque-model mismatch, or excessive load request.',
        validation: ['Throttle remains open', 'Boost actual follows target', 'No torque intervention or plausibility fault returns'],
      },
    ],
  },
  {
    slug: 'fuel-pressure',
    title: 'Fuel Pressure Diagnostics',
    summary:
      'Diagnose HPFP/LPFP pressure margin before raising load, ethanol, fuel mass, or timing.',
    category: 'Fueling',
    sourceReferences: [n54Guide, spreadsheet],
    relatedWorkflows: ['hpfp-lpfp-pressure-drop'],
    cases: [
      {
        title: 'Rail pressure drops under load',
        symptom: 'Lambda drifts lean or the car misfires near peak fuel demand.',
        logEvidence: ['HPFP actual falls away from target', 'LPFP may sag', 'Lambda actual misses requested', 'Timing corrections or misfire may follow'],
        mapsToInspect: ['Fuel Pressure Target Homogeneous', 'Fuel Main', 'Fuel Scalar', 'Load Target 1'],
        safeAdjustmentDirection: 'Reduce load/ethanol/fuel demand or fix hardware before adding timing or boost.',
        validation: ['HPFP tracks target', 'Lambda follows request', 'Corrections and misfires do not return'],
      },
    ],
  },
  {
    slug: 'boost-overshoot',
    title: 'Boost Overshoot',
    summary: 'Diagnose boost spiking above target after spool, including WGDC feed-forward and spool duty causes.',
    category: 'Boost Control',
    sourceReferences: [n54Guide, spreadsheet],
    relatedWorkflows: ['boost-oscillation-fix'],
    cases: [
      {
        title: 'Boost spikes above target after spool',
        symptom: 'Boost actual exceeds target immediately after spool, then throttle may close to correct.',
        logEvidence: ['Boost actual above target in the spool region', 'WGDC after PID falls below base as PID corrects', 'Throttle may partially close to control pressure'],
        mapsToInspect: ['WGDC Base', 'Spool WGDC', 'Boost Ceiling', 'WGDC Ceiling'],
        safeAdjustmentDirection: 'Reduce base WGDC or spool duty in the RPM/load region where overshoot occurs. Relog before touching PID factors.',
        validation: ['Boost actual follows target through spool', 'Throttle stays open', 'WGDC after PID no longer fights base duty'],
      },
    ],
  },
  {
    slug: 'boost-undershoot',
    title: 'Boost Undershoot',
    summary: 'Diagnose persistent underboost where actual boost cannot reach target despite high WGDC.',
    category: 'Boost Control',
    sourceReferences: [n54Guide, spreadsheet],
    relatedWorkflows: ['boost-oscillation-fix'],
    cases: [
      {
        title: 'Boost cannot reach target',
        symptom: 'Boost actual remains persistently below target across gears and RPM ranges.',
        logEvidence: ['Boost actual below target across the pull', 'WGDC after PID high or at ceiling', 'Throttle open, no obvious intervention signal'],
        mapsToInspect: ['WGDC Base', 'WGDC Ceiling', 'Load Target 1', 'Boost Target'],
        safeAdjustmentDirection: 'Check hardware first — boost leaks, wastegate preload, solenoid function. Only add base duty after hardware is verified and target is realistic.',
        validation: ['Pressure test confirms no boost leak', 'Boost actual approaches target', 'WGDC after PID is no longer at ceiling'],
      },
    ],
  },
  {
    slug: 'wgdc-maxed',
    title: 'WGDC Maxed Out',
    summary: 'Diagnose WGDC hitting the ceiling with underboost — a hardware or target-strategy problem, not a duty problem.',
    category: 'Boost Control',
    sourceReferences: [n54Guide, spreadsheet],
    relatedWorkflows: ['boost-oscillation-fix'],
    cases: [
      {
        title: 'WGDC at ceiling with underboost',
        symptom: 'WGDC after PID sits at the ceiling value while boost actual remains below target.',
        logEvidence: ['WGDC after PID equals or clips the ceiling value', 'Boost actual is significantly below target', 'Throttle is open and boost error is large and positive'],
        mapsToInspect: ['WGDC Ceiling', 'WGDC Base', 'Load Target 1', 'Boost Target'],
        safeAdjustmentDirection: 'Do not raise the ceiling until hardware is checked. Maxed WGDC with low boost is almost always a mechanical or target-realism problem.',
        validation: ['Hardware check completes with no boost leaks or wastegate faults', 'Target is reduced to a hardware-realistic level', 'WGDC after PID no longer clips ceiling'],
      },
    ],
  },
  {
    slug: 'rail-pressure-crash',
    title: 'Rail Pressure Crash',
    summary: 'Diagnose HPFP pressure sag under WOT that leads to lean lambda or misfire at peak demand.',
    category: 'Fueling',
    sourceReferences: [n54Guide, spreadsheet],
    relatedWorkflows: ['hpfp-lpfp-pressure-drop'],
    cases: [
      {
        title: 'HPFP pressure drops under WOT',
        symptom: 'Rail pressure sags below target at peak fuel demand, often followed by lean lambda or misfire.',
        logEvidence: ['HPFP actual falls below target near peak load', 'Lambda actual goes lean relative to target', 'Timing corrections or misfires may follow the pressure drop'],
        mapsToInspect: ['Fuel Pressure Target Homogeneous', 'Fuel Main', 'Load Target 1', 'Fuel Scalar'],
        safeAdjustmentDirection: 'Reduce load or ethanol content until rail pressure holds. Hardware fix (HPFP, LPFP, injectors) is required before adding demand back.',
        validation: ['HPFP actual tracks target through the pull', 'Lambda stays on target', 'No timing corrections or misfires appear'],
      },
    ],
  },
  {
    slug: 'lpfp-drop',
    title: 'LPFP Drop',
    summary: 'Diagnose low-pressure fuel pump sag that starves the HPFP before the rail pressure crashes.',
    category: 'Fueling',
    sourceReferences: [n54Guide, spreadsheet],
    relatedWorkflows: ['hpfp-lpfp-pressure-drop'],
    cases: [
      {
        title: 'LPFP sags under high fuel demand',
        symptom: 'Low-pressure pump supply drops under sustained load, causing the HPFP to lose prime.',
        logEvidence: ['LPFP actual drops under target at high load', 'HPFP rail pressure may follow the LPFP sag', 'Lambda drifts lean or STFT goes positive after the drop'],
        mapsToInspect: ['LPFP Pressure Target', 'Fuel Pressure Target Homogeneous', 'Fuel Main', 'Load Target 1'],
        safeAdjustmentDirection: 'Do not add boost, ethanol, or injection mass until LPFP pressure holds. Replacement or upgrade of the low-pressure circuit is required.',
        validation: ['LPFP actual tracks target through full pulls', 'HPFP rail pressure remains stable', 'Lambda holds target without correction'],
      },
    ],
  },
  {
    slug: 'stft-ltft',
    title: 'STFT/LTFT Issues',
    summary: 'Diagnose persistent short-term and long-term fuel trim bias before adjusting scalar or fuel tables.',
    category: 'Fueling',
    sourceReferences: [n54Guide, spreadsheet],
    relatedWorkflows: ['pump-gas-vs-e-blend'],
    cases: [
      {
        title: 'Persistent positive trims at cruise',
        symptom: 'STFT and LTFT stay positive at idle and cruise, indicating the fueling model is delivering less than the engine needs.',
        logEvidence: ['STFT bank 1 or 2 positive at light load', 'LTFT accumulates positive over time', 'Lambda actual lean relative to stoich at cruise, fuel pressure stable'],
        mapsToInspect: ['Fuel Scalar Bank 1', 'Fuel Scalar Bank 2', 'Fuel Main', 'Static Ethanol Content Map 1-4'],
        safeAdjustmentDirection: 'Confirm ethanol content and injector health first. A scalar increase is appropriate only after ruling out hardware and verifying the blend.',
        validation: ['STFT returns to near-zero at cruise', 'LTFT stops accumulating', 'Bank-to-bank trim balance is restored'],
      },
    ],
  },
  {
    slug: 'torque-limit-intervention',
    title: 'Torque Limit Intervention',
    summary: 'Diagnose throttle closure and power cuts caused by torque monitoring detecting a model mismatch.',
    category: 'Safety & Protections',
    sourceReferences: [n54Guide, spreadsheet],
    relatedWorkflows: ['throttle-closure-diagnosis'],
    cases: [
      {
        title: 'Throttle closes from torque monitoring',
        symptom: 'Torque intervention flag activates and throttle closes despite pedal at 100%, without obvious boost overshoot.',
        logEvidence: ['Throttle angle drops while pedal remains high', 'Load requested diverges from load actual', 'Torque monitor channel activates or plausibility fault triggers'],
        mapsToInspect: ['Torque Monitor Ceiling', 'Load Limit Factor', 'Threshold Major Throttle Closures', 'Requested Torque Monitor Factor A / B'],
        safeAdjustmentDirection: 'Align the torque model with the actual operating point. Raise monitor headroom only enough to match validated load targets — do not disable monitoring globally.',
        validation: ['Throttle stays open through WOT', 'Torque intervention channel shows inactive', 'Load requested and actual track closely without plausibility faults'],
      },
    ],
  },
]

export const getLogDiagnostic = (slug: string): LogDiagnostic | undefined =>
  logDiagnostics.find((diagnostic) => diagnostic.slug === slug)
