import { env } from "~/env.mjs";

export function getBaseUrl(options?: { absolute?: boolean }) {
	if (typeof window !== "undefined") {
		if (options?.absolute) {
			return env.NEXT_PUBLIC_APP_URL;
		}

		return ""; // browser should use relative url
	}
	if (env.VERCEL_URL) return env.VERCEL_URL; // SSR should use vercel url

	return `http://localhost:${env.PORT}`; // dev SSR should use localhost
}
