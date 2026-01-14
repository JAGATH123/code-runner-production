import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        dns: false,
        os: false,
        path: false,
        querystring: false,
        stream: false,
        url: false,
        util: false,
        zlib: false,
        timers: false,
        'timers/promises': false,
        buffer: false,
        events: false,
        assert: false,
        constants: false,
        http: false,
        https: false,
        vm: false,
        worker_threads: false,
        // MongoDB-specific dependencies
        aws4: false,
        'mongodb-client-encryption': false,
        '@mongodb-js/zstd': false,
        snappy: false,
        'bson-ext': false,
        '@aws-sdk/credential-providers': false,
        'mongodb-connection-string-url': false,
        saslprep: false,
        'sparse-bitfield': false,
      };
    }

    // Optimize Three.js bundle by code splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          threejs: {
            test: /[\\/]node_modules[\\/]three[\\/]/,
            name: 'threejs',
            chunks: 'all',
            priority: 30,
          },
          webgl: {
            test: /[\\/]src[\\/]components[\\/](SpaceWebGL|FuturisticWebGL|RSIStarMap)\.tsx$/,
            name: 'webgl-components',
            chunks: 'all',
            priority: 20,
          }
        }
      }
    };

    return config;
  },
};

export default nextConfig;
