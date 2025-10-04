/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Desativa o Turbopack explicitamente
    // Isso é necessário para resolver problemas de compatibilidade com certas bibliotecas
    // como chart.js e react-chartjs-2, que podem não ser totalmente compatíveis com o Turbopack ainda.
    // Se você precisar do Turbopack no futuro, pode remover esta linha.
  },
  images: {
    domains: ['cdn.tecconcursos.com.br'],
  },
  transpilePackages: ['uuid'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
