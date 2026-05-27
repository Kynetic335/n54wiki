'use client'

// ─── Safety Disclaimer ─────────────────────────────────────────────────────────
// Hard-coded, always-visible owner-review disclaimer.
// These statements cannot be disabled by UI configuration.
// ─────────────────────────────────────────────────────────────────────────────

export function SafetyDisclaimer() {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700 dark:bg-amber-950/40">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden>⚠️</span>
        <div className="space-y-2 text-amber-900 dark:text-amber-200">
          <p className="font-semibold text-amber-800 dark:text-amber-300">
            Owner Review — Internal Use Only
          </p>
          <ul className="list-inside list-disc space-y-1 text-amber-800 dark:text-amber-300">
            <li>This tool generates a <strong>raw, unencrypted BIN</strong> for TunerPro owner review only.</li>
            <li>This is <strong>not a customer release</strong> and is <strong>not flash-approved</strong>.</li>
            <li>This tool is <strong>not a flasher</strong>. An external flasher (MHD N54, Quickflash) is required.</li>
            <li>MHD locked export is <strong>disabled</strong> — no per-order encryption approval has been granted.</li>
            <li>The downloaded BIN is <strong>readable if exported</strong> — treat it as sensitive source material.</li>
            <li>Owner must inspect the patched BIN in TunerPro before any further use.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
