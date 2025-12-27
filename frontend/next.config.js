/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
