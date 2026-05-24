import type { ReactNode } from 'react'
import { Layout, Navbar, Footer } from 'nextra-theme-docs'
import { Search } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export default async function WikiLayout({ children }: { children: ReactNode }) {
  const pageMap = await getPageMap('/wiki')

  return (
    <Layout
      navbar={
        <Navbar
          logo={
            <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
              N54 Wiki
            </span>
          }
          logoLink="/"
          projectLink="https://synergybmwtuning.com"
          projectIcon={
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '0.25rem 0.6rem',
                borderRadius: '0.4rem',
                background: '#2563eb',
                color: '#fff',
                whiteSpace: 'nowrap',
              }}
            >
              Synergy Tuning
            </span>
          }
        />
      }
      footer={
        <Footer>
          <span>
            © {new Date().getFullYear()} N54 Wiki — Powered by{' '}
            <a
              href="https://synergybmwtuning.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 600 }}
            >
              Synergy BMW Tuning
            </a>
            . For educational purposes — always consult a professional tuner.
          </span>
        </Footer>
      }
      search={<Search />}
      pageMap={pageMap}
      docsRepositoryBase="https://github.com/synergybmwtuning/n54wiki/tree/main"
      editLink="Edit this page on GitHub"
      feedback={{ content: 'Question or correction? →' }}
      sidebar={{ defaultMenuCollapseLevel: 1, toggleButton: true }}
      toc={{ backToTop: true }}
      navigation={{ prev: true, next: true }}
    >
      {children}
    </Layout>
  )
}
