import { useMDXComponents as getDocComponents } from 'nextra-theme-docs'
import type { MDXComponents } from 'nextra/mdx-components'
import { CTABox } from '../components/CTABox'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return getDocComponents({
    CTABox,
    ...components,
  })
}
