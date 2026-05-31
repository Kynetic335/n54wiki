import Link from 'next/link'

export const metadata = {
  title: 'XDF Architect — Synergy BMW Tuning',
  description:
    'N54 MSD80/81/87 XDF parameter database: identify ROMs, browse verified A2L/DAMOS parameters, and export TunerPro XDF files.',
}

export default function XdfArchitectPage() {
  return (
    <div className="tp-shell">
      {/* Hero */}
      <div className="tp-hero">
        <p className="tp-eyebrow">Synergy Tools · Coming Soon</p>
        <h1>XDF Architect</h1>
        <p>
          A standalone desktop tool for N54 MSD80/MSD81/MSD87 calibration definition work.
          Drop a ROM, identify the software version, browse every verified parameter from
          the A2L/DAMOS source files, and export a clean TunerPro XDF — with nothing invented
          and no BINs modified.
        </p>
        <div className="tp-hero-actions">
          <Link className="tp-button tp-button-secondary" href="/contact">
            Request Early Access
          </Link>
          <Link className="tp-button tp-button-secondary" href="/school">
            Learn the Calibration Basics First →
          </Link>
        </div>
      </div>

      {/* What it does */}
      <div className="tp-card">
        <p className="tp-eyebrow">What It Does</p>
        <div className="tp-grid-2" style={{ marginTop: '1rem' }}>
          <FeatureBlock
            title="N54-Only BIN Identification"
            body="Drop a .bin or .hex file. XDF Architect reads the ROM version string and matches it to the verified MSD80/81/87 reference list — no guessing, no writing."
          />
          <FeatureBlock
            title="Verified Parameter Database"
            body="Every parameter entry comes from OEM A2L, DAMOS, and XDF source files. Descriptions are marked with confidence levels. Nothing is auto-generated from parameter names."
          />
          <FeatureBlock
            title="Available vs Missing"
            body="See which parameters have verified addresses and dimensions (XDF-ready) vs which are catalogued but still need address confirmation."
          />
          <FeatureBlock
            title="Export TunerPro XDF"
            body="Select any subset of XDF-ready parameters and export a valid .xdf file. Axis breakpoint placeholders are clearly marked for manual fill-in."
          />
          <FeatureBlock
            title="Export Parameter Info CSV"
            body="Download the full parameter list with addresses, data types, units, and descriptions as a CSV for offline review."
          />
          <FeatureBlock
            title="No BIN Modification"
            body="XDF Architect is read-only for all BIN, HEX, and S-record files. It never patches, flashes, or writes to ECU firmware."
          />
        </div>
      </div>

      {/* Supported ROMs */}
      <div className="tp-card">
        <p className="tp-eyebrow">Supported ROMs (Planned)</p>
        <div className="tp-grid-2" style={{ marginTop: '1rem' }}>
          <RomBlock
            family="MSD80 N54"
            roms={['4DC3271S', '4DC3310S', '4DC3331S', '4DC3431S', '4DC3440S', '4DC3441S', '4DC3451S', '4DC3700S']}
            note="Plus 64B0600S / 80B3710S shared N53/N54 variants"
          />
          <RomBlock
            family="MSD81 N54"
            roms={['4CC3JM0S', '4CC3KM0S']}
            note="Shared N53/N54 platform"
          />
          <RomBlock
            family="MSD87 N54"
            roms={['9SN8101S', '9SN8211S', '9SN8301S', '9SN2600S', '9SN2610S', '9SN2710S', '9SN2850S', '9SN2881S', '9SN2C00S', '9SN2C52S', '9SN8500S', '9SN8600S', '9SN8700S', '9SN8800S', '9SN8850S', '9SN8871S']}
            note="MSD87 variants are N54-exclusive"
          />
        </div>
      </div>

      {/* Safety notice */}
      <div className="tp-card tp-warning-card">
        <p className="tp-eyebrow">Safety Policy</p>
        <ul className="tp-warning-list" style={{ marginTop: '0.75rem', paddingLeft: '1.25rem' }}>
          <li>XDF Architect never opens, modifies, or writes to BIN/HEX/S-record flash images.</li>
          <li>No calibration values are generated or guessed. Parameter data comes only from verified OEM source files.</li>
          <li>Exported XDF files contain structure and addresses only. Axis breakpoints not in the catalog are explicitly marked as placeholders.</li>
          <li>Description confidence is always displayed so users know whether text comes from OEM documentation or is still unknown.</li>
        </ul>
      </div>

      {/* Footer CTA */}
      <div className="tp-card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p className="tp-muted" style={{ marginBottom: '1rem' }}>
          XDF Architect is in active development. Access will be available to Synergy clients first.
        </p>
        <div className="tp-hero-actions" style={{ justifyContent: 'center' }}>
          <Link className="tp-button" href="/contact">
            Contact Synergy for Early Access
          </Link>
          <Link className="tp-button tp-button-secondary" href="/parameters">
            Browse the Map Reference →
          </Link>
        </div>
      </div>
    </div>
  )
}

function FeatureBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="tp-stat" style={{ padding: '1rem' }}>
      <strong style={{ fontSize: '1rem', marginBottom: '0.4rem', display: 'block' }}>{title}</strong>
      <span className="tp-muted" style={{ fontSize: '0.88rem' }}>{body}</span>
    </div>
  )
}

function RomBlock({ family, roms, note }: { family: string; roms: string[]; note: string }) {
  return (
    <div className="tp-stat" style={{ padding: '1rem' }}>
      <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '0.5rem' }}>{family}</strong>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
        {roms.map((r) => (
          <span key={r} className="tp-badge-muted">{r}</span>
        ))}
      </div>
      <span className="tp-muted" style={{ fontSize: '0.8rem' }}>{note}</span>
    </div>
  )
}
