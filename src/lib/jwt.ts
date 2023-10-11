import { jwtVerify, SignJWT } from "jose";

import { env } from "~/env.mjs";
import { type SessionCookiePayload } from "./session-cookie-options";

// ------------------------------------------------------------------
// JWTs
// ------------------------------------------------------------------
async function sign<Token extends Record<string, unknown>>(payload: Token) {
	const iat = Math.floor(Date.now() / 1000);

	// Didn't include exp here because jose throws error if exp is passed and we want to be able to access the payload of expired jwt's in middleware
	return new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256", typ: "JWT" })
		.setIssuedAt(iat)
		.setNotBefore(iat)
		.sign(new TextEncoder().encode(env.JWT_SECRET));
}

async function verify(token: string) {
	return jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET))
		.then((result) => {
			return result.payload;
		})
		.catch(() => {
			return null;
		});
}

export async function createSessionJWT(payload: SessionCookiePayload) {
	const accessToken = await jwt.sign(payload);

	return accessToken;
}

export const jwt = {
	sign,
	verify,
};
