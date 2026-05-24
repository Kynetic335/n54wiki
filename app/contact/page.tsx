import type { Metadata } from 'next'
import ContactForm from '../../components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact Synergy BMW Tuning',
  description:
    'Get in touch with Synergy BMW Tuning for custom N54 tunes, professional log review, and pre-tune consultations.',
}

type SearchParams = { [key: string]: string | string[] | undefined }

export default async function ContactPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const from = typeof params.from === 'string' ? params.from : undefined
  return <ContactForm initialFrom={from} />
}
