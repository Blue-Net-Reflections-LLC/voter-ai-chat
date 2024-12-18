import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	experimental: {
		ppr: false,
	},
	serverExternalPackages: ['sharp', 'onnxruntime-node'],
	images: {
		remotePatterns: [
			{
				hostname: 'avatar.vercel.sh',
			},
		],
	},
	webpack: (
		config,
		{ buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
	) => {
		// Add support for importing .md files as strings
		config.module.rules.push({
			test: /\.md$/,
			use: 'raw-loader',
		});

		// Disable cache in production to prevent build failures
		if (!dev) {
			config.cache = false;
		}

		return config;
	},
};

export default nextConfig;
