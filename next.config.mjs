import bundleAnalyzer from "@next/bundle-analyzer";

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.mjs");

const withBundleAnalyzer = bundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
});

/** @type {import("next").NextConfig} */
const config = {
	reactStrictMode: true,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "dogworx-management-dev.s3.ap-southeast-2.amazonaws.com",
				port: "",
				pathname: "/**/*",
			},
			{
				protocol: "https",
				hostname: "dogworx-management.s3.ap-southeast-2.amazonaws.com",
				port: "",
				pathname: "/**/*",
			},
		],
	},
	// SEE: https://github.com/aws/aws-sdk-js-v3/issues/5216
	webpack: (config) => {
		config.externals.push({
			"@aws-sdk/signature-v4-multi-region": "commonjs @aws-sdk/signature-v4-multi-region",
		});

		return config;
	},
};
export default withBundleAnalyzer(config);
