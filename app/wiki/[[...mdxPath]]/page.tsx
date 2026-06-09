import type { ComponentType, ReactNode } from 'react'
import { generateStaticParamsFor, importPage } from 'nextra/pages'
// Nextra's useMDXComponents is a component-map factory, not a React hook.
// Alias away the `use*` name so rules-of-hooks does not flag this async page.
import { useMDXComponents as getMDXComponents } from '../../../mdx-components'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

export async function generateMetadata(props: { params: Promise<{ mdxPath?: string[] }> }) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath)
  return metadata
}

export default async function Page(props: { params: Promise<{ mdxPath?: string[] }> }) {
  const params = await props.params
  const result = await importPage(params.mdxPath)
  const { default: MDXContent, toc, metadata } = result
  const components = getMDXComponents({})
  const Wrapper = components.wrapper as ComponentType<{
    toc: typeof toc
    metadata: typeof metadata
    children: ReactNode
  }>

  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  )
}
