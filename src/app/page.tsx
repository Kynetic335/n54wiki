import type { ComponentType, ReactNode } from 'react'
import type { Metadata } from 'next'
import { importPage } from 'nextra/pages'
import { useMDXComponents } from '../mdx-components'

export async function generateMetadata(): Promise<Metadata> {
  const { metadata } = await importPage([])
  return metadata as Metadata
}

export default async function HomePage() {
  const { default: MDXContent, toc, metadata } = await importPage([])
  const components = useMDXComponents({})
  const Wrapper = components.wrapper as ComponentType<{
    toc: typeof toc
    metadata: typeof metadata
    children: ReactNode
  }>

  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent />
    </Wrapper>
  )
}
