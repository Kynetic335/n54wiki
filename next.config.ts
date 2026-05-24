import type { NextConfig } from 'next'
import nextra from 'nextra'

const withNextra = nextra({
  contentDirBasePath: '/wiki',
  defaultShowCopyCode: true,
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
}

export default withNextra(nextConfig)
