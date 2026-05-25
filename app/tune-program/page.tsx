import type { Metadata } from 'next'
import TuneProgram from '../../components/TuneProgram'

export const metadata: Metadata = {
  title: 'N54 BIN Generator',
  description:
    'Upload your stock I8A0S BIN, select your stage and fuel, and generate a BIN file to flash with MHD or N54 Quickflash. Synergy BMW Tuning N54 Tune Program.',
}

export default function TuneProgramPage() {
  return <TuneProgram />
}
