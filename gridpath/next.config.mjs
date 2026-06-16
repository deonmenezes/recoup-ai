/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // react-leaflet v5 + @react-leaflet/core are ESM-only and can leave the
  // dynamic(ssr:false) chunk stuck on "Loading map…" in dev. Transpiling them
  // makes the lazy import resolve reliably in both dev and prod.
  transpilePackages: ["react-leaflet", "@react-leaflet/core"],
};

export default nextConfig;
