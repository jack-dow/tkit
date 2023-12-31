/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { drizzle } from "~/db/drizzle";
import { jwt } from "~/lib/jwt";
import { sessionCookieOptions, type SessionCookie } from "~/lib/session-cookie-options";
import { logInDevelopment } from "~/lib/utils";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API
 *
 * These allow you to access things like the database, the session, etc, when
 * processing a request
 *
 */
interface CreateContextOptions {
	session: SessionCookie | null;
	user: SessionCookie["user"] | null;
	request: NextRequest;
}

/**
 * This helper generates the "internals" for a tRPC context. If you need to use
 * it, you can export it from here.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
export const createInnerTRPCContext = (opts: CreateContextOptions) => {
	return {
		session: opts.session,
		user: opts.user,
		db: drizzle,
		request: opts.request,
	};
};

/**
 * This is the actual context you'll use in your router. It will be used to
 * process every request that goes through your tRPC endpoint
 * @link https://trpc.io/docs/context
 */
type Opts = { request: NextRequest };

async function getServerSession() {
	const cookieStore = cookies();
	const sessionCookie = cookieStore.get(sessionCookieOptions.name);

	const sessionToken = sessionCookie?.value;

	if (!sessionToken) {
		return null;
	}

	const sessionTokenData = (await jwt.verify(sessionToken)) as SessionCookie | null;

	if (!sessionTokenData) {
		return null;
	}

	return sessionTokenData;
}

export const createTRPCContext = async (opts: Opts) => {
	const session = await getServerSession();
	const source = opts.request?.headers.get("x-trpc-source") ?? "unknown";

	logInDevelopment(
		">>> tRPC Request from",
		source,
		"by",
		`${session?.user.givenName} ${session?.user.familyName}`,
		"to",
		opts.request?.headers.get("x-invoke-path"),
		"from",
		opts.request?.headers.get("referer"),
	);

	return createInnerTRPCContext({
		session,
		user: session?.user ?? null,
		request: opts.request,
	});
};

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		};
	},
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure;

/**
 * Reusable middleware that enforces users are logged in before running the
 * procedure
 */
const enforceUserIsAuthenticated = t.middleware(({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	return next({
		ctx: {
			// infers the `session` as non-nullable
			session: { ...ctx.session, user: ctx.session.user },
			user: ctx.session.user,
		},
	});
});

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use
 * this. It verifies the session is valid and guarantees ctx.session.user is not
 * null
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthenticated);
