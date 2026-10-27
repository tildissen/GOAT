/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Innehållsfilerna läses i utvecklingsläge (utan Supabase).
  outputFileTracingIncludes: { '/api/**': ['./content/**'] },
};

export default nextConfig;
