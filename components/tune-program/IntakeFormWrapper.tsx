'use client'

import { IntakeForm } from './IntakeForm'

interface IntakeFormWrapperProps {
  prefill?: {
    rom?: string
    fuel?: string
    stage?: string
    turbo?: string
    fileId?: string
  }
}

// Thin client wrapper so the server page can pass prefill props to the client IntakeForm
export function IntakeFormWrapper({ prefill }: IntakeFormWrapperProps) {
  return <IntakeForm prefill={prefill} />
}
