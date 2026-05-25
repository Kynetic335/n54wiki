'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fuels } from '@/data/tune-program/fuels'
import { stages } from '@/data/tune-program/stages'
import { turboTypes } from '@/data/tune-program/turboTypes'
import { addons } from '@/data/tune-program/addons'
import { safetyRules } from '@/data/tune-program/safetyRules'
import { getTuneFileById } from '@/data/tune-program/tuneFiles'
import type { CustomerRequest, FuelType, StageId, TurboTypeId, RomVersion, AddonId } from '@/types/tune-program'

interface IntakeFormProps {
  prefill?: {
    rom?: string
    fuel?: string
    stage?: string
    turbo?: string
    fileId?: string
  }
}

const ROM_OPTIONS: RomVersion[] = ['I8A0S', 'IJE0S', 'INA0S', 'UNKNOWN']

const MAINTENANCE_OPTIONS = [
  'Spark plugs replaced',
  'Coil packs inspected',
  'HPFP cam follower inspected',
  'HPFP cam follower replaced',
  'LPFP flow confirmed adequate',
  'Boost leak test passed',
  'Coolant system serviced',
  'Charge pipes tight / no cracked boots',
  'Battery 12.5V+ or on maintainer',
  'No active fault codes',
]

function genId() {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#0d0d0d',
  border: '1px solid #1e1e1e',
  borderRadius: '0.5rem',
  padding: '0.65rem 0.8rem',
  color: '#e0e0e0',
  fontSize: '0.9rem',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.35rem',
  fontSize: '0.8rem',
  color: '#888',
  fontWeight: 500,
}

function Field({
  label,
  children,
  required,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: '#f87171' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export function IntakeForm({ prefill }: IntakeFormProps) {
  const router = useRouter()
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState(1)

  const prefillFile = prefill?.fileId ? getTuneFileById(prefill.fileId) : undefined

  const [form, setForm] = useState<Omit<CustomerRequest, 'id' | 'createdAt' | 'tunerNotes' | 'exportedAt' | 'packageHash'>>({
    status: 'New',
    name: '',
    email: '',
    vehicleYear: '',
    vehicleModel: '',
    transmission: '',
    romVersion: (prefill?.rom as RomVersion) || '',
    currentTune: '',
    turboSetup: '',
    fuelSystem: '',
    selectedFuel: (prefill?.fuel as FuelType) || '',
    selectedStage: (prefill?.stage as StageId) || '',
    selectedTurboType: (prefill?.turbo as TurboTypeId) || '',
    currentMods: '',
    maintenanceCompleted: [],
    sparkPlugType: '',
    sparkPlugGap: '',
    coilCondition: '',
    hpfpDetails: '',
    lpfpDetails: '',
    injectorIndex: '',
    goals: '',
    knownIssues: '',
    selectedTuneFileId: prefill?.fileId || '',
    selectedAddons: [],
  })

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const toggleMaintenance = (item: string) => {
    setForm((f) => ({
      ...f,
      maintenanceCompleted: f.maintenanceCompleted.includes(item)
        ? f.maintenanceCompleted.filter((m) => m !== item)
        : [...f.maintenanceCompleted, item],
    }))
  }

  const toggleAddon = (id: AddonId) => {
    setForm((f) => ({
      ...f,
      selectedAddons: (f.selectedAddons as AddonId[]).includes(id)
        ? f.selectedAddons.filter((a) => a !== id)
        : [...f.selectedAddons, id as AddonId],
    }))
  }

  const handleSubmit = () => {
    const request: CustomerRequest = {
      ...form,
      id: genId(),
      createdAt: new Date().toISOString(),
      tunerNotes: '',
    }

    // Store in localStorage (demo — replace with API call in production)
    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('synergy-tune-requests') ?? '[]') as CustomerRequest[]
      existing.push(request)
      localStorage.setItem('synergy-tune-requests', JSON.stringify(existing))
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div
        style={{
          background: '#052e16',
          border: '1px solid #16a34a44',
          borderRadius: '0.75rem',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#4ade80', marginBottom: '0.75rem' }}>
          Request Submitted
        </h2>
        <p style={{ color: '#86efac', lineHeight: 1.65, marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
          Your tune request has been saved. A Synergy tuner will review your setup details.
          You may need to submit datalogs — watch for follow-up communication.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/tune-program')}
            style={{
              padding: '0.6rem 1.4rem',
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Back to Tune Program
          </button>
          <button
            onClick={() => { setSubmitted(false); setStep(1) }}
            style={{
              padding: '0.6rem 1.4rem',
              background: 'transparent',
              color: '#4ade80',
              border: '1px solid #16a34a',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Submit Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Step indicators */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {['Customer Info', 'Vehicle & Hardware', 'Maintenance', 'Goals & Submit'].map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i + 1)}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: step === i + 1 ? '#0d1f3a' : '#111',
              border: `1px solid ${step === i + 1 ? '#2563eb' : '#1e1e1e'}`,
              borderRadius: '0.4rem',
              color: step === i + 1 ? '#93c5fd' : step > i + 1 ? '#4ade80' : '#444',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            {step > i + 1 ? '✓ ' : `${i + 1}. `}{s}
          </button>
        ))}
      </div>

      {/* Step 1 — Customer Info */}
      {step === 1 && (
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f0f0f0', marginBottom: '1.25rem' }}>
            Customer Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <Field label="Full Name" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Alex Romero"
                style={inputStyle}
              />
            </Field>
            <Field label="Email Address" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="your@email.com"
                style={inputStyle}
              />
            </Field>
            <Field label="Vehicle Year" required>
              <input
                type="text"
                value={form.vehicleYear}
                onChange={(e) => update('vehicleYear', e.target.value)}
                placeholder="2008"
                style={inputStyle}
              />
            </Field>
            <Field label="Vehicle Model" required>
              <input
                type="text"
                value={form.vehicleModel}
                onChange={(e) => update('vehicleModel', e.target.value)}
                placeholder="335i Coupe (E92)"
                style={inputStyle}
              />
            </Field>
          </div>
          <Field label="Transmission" required>
            <select
              value={form.transmission}
              onChange={(e) => update('transmission', e.target.value as 'MT' | 'AT' | 'Both')}
              style={inputStyle}
            >
              <option value="">Select transmission...</option>
              <option value="MT">Manual (MT)</option>
              <option value="AT">Automatic (AT / ZF 6HP)</option>
            </select>
          </Field>
          <Field label="ROM / Software Version">
            <select
              value={form.romVersion}
              onChange={(e) => update('romVersion', e.target.value as RomVersion)}
              style={inputStyle}
            >
              <option value="">Not sure / will check</option>
              {ROM_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Current Tune (if any)">
            <input
              type="text"
              value={form.currentTune}
              onChange={(e) => update('currentTune', e.target.value)}
              placeholder="Stock / MHD Stage 1 / Previous custom tune..."
              style={inputStyle}
            />
          </Field>

          <button onClick={() => setStep(2)} style={{ ...navBtnStyle, float: 'right' }}>
            Next: Vehicle & Hardware →
          </button>
          <div style={{ clear: 'both' }} />
        </div>
      )}

      {/* Step 2 — Vehicle & Hardware */}
      {step === 2 && (
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f0f0f0', marginBottom: '1.25rem' }}>
            Vehicle Hardware & Setup
          </h3>

          <Field label="Turbo Setup">
            <input
              type="text"
              value={form.turboSetup}
              onChange={(e) => update('turboSetup', e.target.value)}
              placeholder="Stock OEM turbos / Vargas Stage 2 / Pure Stage 2 hybrid..."
              style={inputStyle}
            />
          </Field>
          <Field label="Fuel System Details">
            <input
              type="text"
              value={form.fuelSystem}
              onChange={(e) => update('fuelSystem', e.target.value)}
              placeholder="Stock HPFP + LPFP / Fuel-It Stage 2+ HPFP + Walbro 450..."
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 1rem' }}>
            <Field label="Selected Fuel Type" required>
              <select
                value={form.selectedFuel}
                onChange={(e) => update('selectedFuel', e.target.value as FuelType)}
                style={inputStyle}
              >
                <option value="">Select fuel...</option>
                {fuels.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Tune Stage" required>
              <select
                value={form.selectedStage}
                onChange={(e) => update('selectedStage', e.target.value as StageId)}
                style={inputStyle}
              >
                <option value="">Select stage...</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Turbo Type" required>
              <select
                value={form.selectedTurboType}
                onChange={(e) => update('selectedTurboType', e.target.value as TurboTypeId)}
                style={inputStyle}
              >
                <option value="">Select turbo type...</option>
                {turboTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Current Mods">
            <textarea
              value={form.currentMods}
              onChange={(e) => update('currentMods', e.target.value)}
              rows={3}
              placeholder="List all installed mods: intake, downpipes, FMIC, charge pipes, fuel system, intercooler..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <Field label="Spark Plug Type">
              <input
                type="text"
                value={form.sparkPlugType}
                onChange={(e) => update('sparkPlugType', e.target.value)}
                placeholder="NGK LZKAR7A-11 / NGK R7437-9..."
                style={inputStyle}
              />
            </Field>
            <Field label="Spark Plug Gap">
              <input
                type="text"
                value={form.sparkPlugGap}
                onChange={(e) => update('sparkPlugGap', e.target.value)}
                placeholder='0.022" / OEM spec...'
                style={inputStyle}
              />
            </Field>
            <Field label="Coil Pack Condition">
              <input
                type="text"
                value={form.coilCondition}
                onChange={(e) => update('coilCondition', e.target.value)}
                placeholder="OEM / recently replaced / unknown..."
                style={inputStyle}
              />
            </Field>
            <Field label="Injector Index (if known)">
              <input
                type="text"
                value={form.injectorIndex}
                onChange={(e) => update('injectorIndex', e.target.value)}
                placeholder="Unknown / N54 stock..."
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="HPFP Details">
            <input
              type="text"
              value={form.hpfpDetails}
              onChange={(e) => update('hpfpDetails', e.target.value)}
              placeholder="Stock / Fuel-It Stage 2+ internals / cam follower replaced X miles ago..."
              style={inputStyle}
            />
          </Field>
          <Field label="LPFP Details">
            <input
              type="text"
              value={form.lpfpDetails}
              onChange={(e) => update('lpfpDetails', e.target.value)}
              placeholder="Stock / Walbro 450 installed / dual pump setup..."
              style={inputStyle}
            />
          </Field>

          {/* Add-ons */}
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ ...labelStyle, marginBottom: '0.5rem' }}>Add-ons / Display Options</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {addons.map((addon) => (
                <label
                  key={addon.id}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={form.selectedAddons.includes(addon.id as AddonId)}
                    onChange={() => toggleAddon(addon.id)}
                    style={{ marginTop: '0.2rem', flexShrink: 0 }}
                  />
                  <div>
                    <p style={{ margin: '0 0 0.1rem', fontSize: '0.88rem', color: '#ddd', fontWeight: 500 }}>
                      {addon.label}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#555' }}>{addon.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(1)} style={navBtnStyleBack}>← Back</button>
            <button onClick={() => setStep(3)} style={navBtnStyle}>Next: Maintenance →</button>
          </div>
        </div>
      )}

      {/* Step 3 — Maintenance */}
      {step === 3 && (
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f0f0f0', marginBottom: '0.5rem' }}>
            Maintenance Checklist
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#666', marginBottom: '1.25rem' }}>
            Check everything that has been completed on your vehicle.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {MAINTENANCE_OPTIONS.map((item) => (
              <label
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  background: form.maintenanceCompleted.includes(item) ? '#052e16' : '#111',
                  border: `1px solid ${form.maintenanceCompleted.includes(item) ? '#16a34a44' : '#1e1e1e'}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.maintenanceCompleted.includes(item)}
                  onChange={() => toggleMaintenance(item)}
                  style={{ flexShrink: 0 }}
                />
                <span style={{ fontSize: '0.88rem', color: form.maintenanceCompleted.includes(item) ? '#86efac' : '#888' }}>
                  {item}
                </span>
              </label>
            ))}
          </div>

          {/* Pre-flash checklist reminder */}
          <div
            style={{
              background: '#1a0f00',
              border: '1px solid #854d0e44',
              borderRadius: '0.6rem',
              padding: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#d97706', fontWeight: 600 }}>
              ⚠️ Pre-Flash Checklist (must be completed at flash time)
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {safetyRules.preFlashChecklist.map((item, i) => (
                <li key={i} style={{ fontSize: '0.8rem', color: '#d97706', marginBottom: '0.25rem', lineHeight: 1.5 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(2)} style={navBtnStyleBack}>← Back</button>
            <button onClick={() => setStep(4)} style={navBtnStyle}>Next: Goals & Submit →</button>
          </div>
        </div>
      )}

      {/* Step 4 — Goals & Submit */}
      {step === 4 && (
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f0f0f0', marginBottom: '1.25rem' }}>
            Goals & Known Issues
          </h3>

          <Field label="Tuning Goals">
            <textarea
              value={form.goals}
              onChange={(e) => update('goals', e.target.value)}
              rows={4}
              placeholder="What are you trying to achieve? Daily driver power increase? Track use? Street + track? Power targets?"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>

          <Field label="Known Issues / Codes / Concerns">
            <textarea
              value={form.knownIssues}
              onChange={(e) => update('knownIssues', e.target.value)}
              rows={3}
              placeholder="Any active or recent fault codes? Misfires? Boost issues? LPFP problems? List all known issues."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>

          {/* Summary */}
          <div
            style={{
              background: '#111',
              border: '1px solid #222',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ margin: '0 0 1rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555', fontWeight: 600 }}>
              Submission Summary
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' }}>
              {[
                ['Name', form.name || '—'],
                ['Email', form.email || '—'],
                ['Vehicle', form.vehicleYear + ' ' + form.vehicleModel || '—'],
                ['ROM', form.romVersion || '—'],
                ['Fuel', form.selectedFuel || '—'],
                ['Stage', form.selectedStage || '—'],
                ['Turbo Type', form.selectedTurboType || '—'],
                ['Maintenance Items', form.maintenanceCompleted.length + ' confirmed'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p style={{ margin: '0 0 0.1rem', fontSize: '0.7rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {label}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#ccc', fontWeight: 500 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Safety acknowledgment */}
          <div
            style={{
              background: '#1a0f00',
              border: '1px solid #854d0e55',
              borderRadius: '0.6rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              fontSize: '0.82rem',
              color: '#d97706',
              lineHeight: 1.65,
            }}
          >
            By submitting, you confirm that the information above is accurate to the best of your knowledge.
            You understand that this is a <strong style={{ color: '#fbbf24' }}>base tune package request</strong> —
            not a final calibration. A Synergy tuner will review your information before approving export.
            Flashing incorrect calibrations can cause engine damage.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setStep(3)} style={navBtnStyleBack}>← Back</button>
            <button
              onClick={handleSubmit}
              disabled={!form.name || !form.email || !form.selectedFuel || !form.selectedStage || !form.selectedTurboType}
              style={{
                padding: '0.75rem 2rem',
                background: form.name && form.email && form.selectedFuel ? '#16a34a' : '#1a1a1a',
                color: form.name && form.email && form.selectedFuel ? '#fff' : '#555',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: form.name && form.email && form.selectedFuel ? 'pointer' : 'not-allowed',
              }}
            >
              Submit Request →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  padding: '0.55rem 1.25rem',
  background: '#1e3a8a',
  color: '#93c5fd',
  border: '1px solid #2563eb44',
  borderRadius: '0.45rem',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.88rem',
}

const navBtnStyleBack: React.CSSProperties = {
  padding: '0.55rem 1.25rem',
  background: 'transparent',
  color: '#666',
  border: '1px solid #222',
  borderRadius: '0.45rem',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.88rem',
}
