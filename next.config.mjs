/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for GitHub Pages (only in production build)
  output: process.env.NEXT_EXPORT === "1" ? "export" : undefined,

  // Set repo name as basePath for GitHub Pages.
  // Only applied when BASE_PATH env var is set (CI/deploy).
  // Leave unset for local dev — routes stay at /.
  basePath: process.env.BASE_PATH ?? "",

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  // Trailing slash for static export compat
  trailingSlash: process.env.BASE_PATH ? true : false,
}

export default nextConfig
