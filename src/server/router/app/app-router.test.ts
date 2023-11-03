import { type inferProcedureInput } from "@trpc/server";
import { expect, test } from "vitest";

import { type SessionCookie } from "../../../lib/session-cookie-options";
import { generateId } from "../../../lib/utils";
import { appRouter, type AppRouter } from "../../index";
import { createInnerTRPCContext } from "../../trpc";

const session = {
	id: generateId(),
	iat: Date.now(),
	nbf: Date.now(),
	user: {
		id: generateId(),
		organizationId: "p5fvi3glupqhvywkcslxra0j",
		givenName: "Jack",
		familyName: "Dow",
		emailAddress: "jack.dowww@gmail.com",
		createdAt: new Date(),
		updatedAt: new Date(),
		organizationRole: "owner",
		bannedAt: null,
		bannedUntil: null,
		profileImageUrl: null,
		timezone: "Australia/Brisbane",
	},
} satisfies SessionCookie;

test("insert, get and delete booking type", async () => {
	const ctx = createInnerTRPCContext({
		session,
		user: session.user,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
		request: null as any,
	});
	const caller = appRouter.createCaller(ctx);

	const input: inferProcedureInput<AppRouter["app"]["bookingTypes"]["insert"]> = {
		id: generateId(),
		name: "Test Booking Type",
		duration: 1800,
		color: "sky",
	};

	await caller.app.bookingTypes.insert(input);
	const byId = await caller.app.bookingTypes.byId({ id: input.id });

	expect(byId.data).toMatchObject(input);

	await caller.app.bookingTypes.delete({ id: input.id });
	const byIdAfterDelete = await caller.app.bookingTypes.byId({ id: input.id });

	expect(byIdAfterDelete.data).toBeUndefined();
});
