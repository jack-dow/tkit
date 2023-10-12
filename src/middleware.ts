import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { drizzle } from "./db/drizzle";
import { sessions } from "./db/schema/auth";
import { createSessionJWT, jwt } from "./lib/jwt";
import { sessionCookieOptions, sessionJWTExpiry, type SessionCookie } from "./lib/session-cookie-options";

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const isAuthPage =
		pathname.startsWith("/sign-in") || pathname.startsWith("/invite") || pathname.startsWith("/verification-code");

	let from = pathname;
	if (request.nextUrl.search) {
		from += request.nextUrl.search;
	}

	const signInUrl = new URL(`/sign-in?from=${encodeURIComponent(from)}`, request.url);

	const cookieStore = cookies();
	const sessionCookie = cookieStore.get(sessionCookieOptions.name);

	const sessionToken = sessionCookie?.value ?? null;

	const unAuthedResponse = isAuthPage ? NextResponse.next() : NextResponse.redirect(signInUrl);

	if (!sessionToken) {
		return unAuthedResponse;
	}

	const currentSession = (await jwt.verify(sessionToken)) as SessionCookie | null;

	if (!currentSession) {
		unAuthedResponse.cookies.set({
			...sessionCookieOptions,
			value: "",
		});

		return unAuthedResponse;
	}

	const response =
		isAuthPage || pathname === "/"
			? process.env.NODE_ENV !== "development"
				? NextResponse.redirect(new URL("/calendar", request.url))
				: NextResponse.redirect(new URL("/test", request.url))
			: NextResponse.next();

	if (Math.floor(Date.now() / 1000) - currentSession.iat > sessionJWTExpiry) {
		const session = await drizzle.query.sessions.findFirst({
			where: (sessions, { eq }) => eq(sessions.id, currentSession.id),
			with: {
				user: true,
			},
		});

		if (
			!session ||
			session.expiresAt < new Date() ||
			!session.user ||
			(session.user.bannedAt && !session.user.bannedUntil) ||
			(session.user.bannedAt && session.user.bannedUntil && session.user.bannedUntil < new Date())
		) {
			if (session) {
				await drizzle.delete(sessions).where(eq(sessions.id, session.id));
			}

			unAuthedResponse.cookies.set({
				...sessionCookieOptions,
				value: "",
			});

			return unAuthedResponse;
		}

		const headersList = headers();

		if (
			session.ipAddress != request.ip ||
			session.userAgent !== headersList.get("user-agent") ||
			session.city != request.geo?.city ||
			session.country != request.geo?.country
		) {
			await drizzle
				.update(sessions)
				.set({
					ipAddress: request.ip ?? session.ipAddress,
					userAgent: headersList.get("user-agent") || session.userAgent,
					city: request.geo?.city || session.city,
					country: request.geo?.country || session.country,
					lastActiveAt: new Date(),
				})
				.where(eq(sessions.id, session.id));
		} else {
			await drizzle.update(sessions).set({ lastActiveAt: new Date() }).where(eq(sessions.id, session.id));
		}

		response.cookies.set({
			...sessionCookieOptions,
			value: await createSessionJWT({
				id: session.id,
				user: session.user,
			}),
		});
	}

	return response;
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|static|favicon.ico|robots.txt).*)"],
};
