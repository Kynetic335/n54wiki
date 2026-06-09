'use client'

/**
 * Client-only wrapper for the Nextra Search component.
 *
 * Nextra's Search uses browser APIs (useId, IntersectionObserver, etc.) that
 * produce a hydration mismatch when rendered on the server. Wrapping with
 * dynamic import + ssr:false delays mounting until the client is ready,
 * eliminating the console error without hiding real hydration bugs.
 */
import dynamic from 'next/dynamic'

const Search = dynamic(
  () => import('nextra/components').then((mod) => mod.Search),
  { ssr: false, loading: () => null },
)

export function ClientSearch() {
  return <Search />
}
