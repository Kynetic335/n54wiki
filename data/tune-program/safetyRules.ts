// ─── Hard-coded Safety Rules ───────────────────────────────────────────────────
// These rules are always displayed and cannot be disabled by UI configuration.

export const safetyRules = {
  hardRules: [
    'Do not promise horsepower numbers. All outputs are estimates until logged on your specific vehicle.',
    'Do not promise safe boost. Final boost targets depend on intercooler efficiency, ambient temperature, fuel quality, and engine condition.',
    'Final calibration depends on logs, fuel quality, hardware, maintenance, and tuner review.',
    'All recommendations are base guidance until reviewed by a Synergy tuner.',
    'This app is not an automatic custom tuner. It only packages approved Synergy/MHD base files selected by ROM/fuel/stage/turbo setup.',
    'Port injection and single turbo files are not supported in this version.',
  ],
  blockingConditions: [
    'Active misfires, lean conditions (AFR below 11.5:1 under boost), or fueling pressure drops require review before tuning.',
    'Knock events (KR > 0) under load must be resolved before flashing a higher stage.',
    'Overheating (coolant temp exceeding 230°F / 110°C) requires cooling system diagnosis.',
    'Drivetrain slipping (clutch slip, DCT judder, AT flare) must be corrected before adding power.',
    'Active fault codes — especially boost pressure, ignition, fuel pressure, or VANOS codes — require diagnosis and resolution first.',
  ],
  preFlashChecklist: [
    'Battery at 12.5V+ resting, or battery maintainer connected',
    'OBD-II cable connected and stable',
    'Engine fully warmed up to operating temperature',
    'MHD Flasher app version confirmed compatible with ROM',
    'Correct BIN / ROM version confirmed',
    'Backup read performed and saved',
    'No active fault codes',
    'Boost leak test passed within last 30 days',
  ],
  disclaimer:
    'Synergy BMW Tuning base files are approved calibrations for specific hardware combinations. ' +
    'Final delivery of any custom tune requires log review by a Synergy tuner. ' +
    'This app packages approved base files only — it does not generate, modify, or patch tune files automatically. ' +
    'Flashing incorrect calibrations can result in engine damage, catalyst damage, or vehicle shutdown. ' +
    'Always consult a professional tuner before flashing.',
} as const

export type SafetyRules = typeof safetyRules
