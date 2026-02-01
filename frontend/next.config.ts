import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export', // Outputs a Single-Page Application (SPA)
  distDir: 'build', // Changes the build output directory to `build`
  // When repo has multiple lockfiles (e.g. monorepo root + frontend), set root so Next/Turbopack uses this directory
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig