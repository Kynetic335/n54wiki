import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Layout, Navbar, Footer } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://n54wiki.com'),
  title: {
    template: '%s | N54 Wiki',
    default: 'N54 Wiki — BMW N54 Tuning, Diagnostics & Upgrades',
  },
  description:
    'The BMW N54 tuning wiki. Engine guides, stage upgrade paths, datalogging, diagnostics, and hardware references — powered by Synergy BMW Tuning.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'N54 Wiki',
  },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const pageMap = await getPageMap()

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
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
      </body>
    </html>
  )
}
