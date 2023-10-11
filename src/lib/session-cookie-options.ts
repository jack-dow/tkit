import { type ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { type InferSelectModel } from "drizzle-orm";

import { type users } from "~/db/schema/auth";

export const sessionCookieOptions = {
	name: "__session",
	httpOnly: true,
	maxAge: 2592000000,
	path: "/",
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
} satisfies Partial<ResponseCookie>;

export type SessionCookiePayload = {
	id: string;
	user: InferSelectModel<typeof users>;
};

export type SessionCookie = SessionCookiePayload & {
	iat: number;
	nbf: number;
};

export const sessionJWTExpiry = 60; // 1 minute
