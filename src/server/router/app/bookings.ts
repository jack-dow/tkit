import dayjs from "dayjs";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";

import { bookings } from "~/db/schema/app";
import { InsertBookingSchema, UpdateBookingSchema } from "~/db/validation/app";
import { env } from "~/env.mjs";
import { getBaseUrl, getTimezoneOffset, logInDevelopment, PaginationOptionsSchema } from "~/lib/utils";
import { validatePaginationSearchParams } from "~/server/utils";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { BOOKINGS_SORTABLE_COLUMNS } from "../sortable-columns";

export const bookingsRouter = createTRPCRouter({
	all: protectedProcedure
		.input(
			PaginationOptionsSchema.extend({
				from: z.string().optional().catch(undefined),
				to: z.string().optional().catch(undefined),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userTimezoneOffset = getTimezoneOffset(ctx.user.timezone);

			let fromDate = input.from ? dayjs(input.from.substring(0, 10)) : undefined;

			if (!fromDate?.isValid()) {
				fromDate = undefined;
			}

			let toDate = input.to ? dayjs(input.to.substring(0, 10)) : undefined;

			if (!toDate?.isValid()) {
				toDate = undefined;
			}

			const countQuery = await ctx.db
				.select({
					count: sql<number>`count(*)`.mapWith(Number),
				})
				.from(bookings)
				.where(
					and(
						eq(bookings.organizationId, ctx.user.organizationId),
						fromDate ? gte(bookings.date, fromDate.subtract(userTimezoneOffset, "minutes").toDate()) : undefined,
						toDate
							? lt(bookings.date, toDate.endOf("day").subtract(userTimezoneOffset, "minutes").toDate())
							: undefined,
					),
				);

			const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
				...input,
				count: countQuery?.[0]?.count ?? 0,
				sortableColumns: BOOKINGS_SORTABLE_COLUMNS,
			});

			const data = await ctx.db.query.bookings.findMany({
				columns: {
					id: true,
					assignedToId: true,
					dogId: true,
					date: true,
					duration: true,
				},
				with: {
					dog: {
						columns: {
							givenName: true,
							familyName: true,
						},
					},
					bookingType: {
						columns: {
							color: true,
							name: true,
						},
					},
				},
				limit: limit,
				offset: (page - 1) * limit,
				where: and(
					eq(bookings.organizationId, ctx.user.organizationId),
					fromDate ? gte(bookings.date, fromDate.subtract(userTimezoneOffset, "minutes").toDate()) : undefined,
					toDate ? lt(bookings.date, toDate.endOf("day").subtract(userTimezoneOffset, "minutes").toDate()) : undefined,
				),
				orderBy: (bookings, { asc }) => (orderBy ? [...orderBy, asc(bookings.id)] : [asc(bookings.id)]),
			});

			return {
				pagination: {
					count,
					page,
					maxPage,
					limit,
					sortBy,
					sortDirection,
				},
				data,
			};
		}),

	checkForOverlaps: protectedProcedure
		.input(
			z.object({
				bookingId: z.string(),
				assignedToId: z.string(),
				date: z.date(),
				duration: z.number(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { assignedToId, date, duration } = input;

			const endDate = dayjs(date).add(duration, "seconds").toDate();

			const data = await ctx.db.query.bookings.findMany({
				columns: {
					id: true,
				},
				extras: {
					endDate: sql<Date>`date_add(${bookings.date}, INTERVAL ${bookings.duration} SECOND)`.as("end_date"),
				},
				where: (bookings, { and, eq, lt, gt, ne }) =>
					and(
						ne(bookings.id, input.bookingId),
						eq(bookings.organizationId, ctx.user.organizationId),
						eq(bookings.assignedToId, assignedToId),
						and(
							lt(bookings.date, endDate),
							gt(sql<Date>`date_add(${bookings.date}, INTERVAL ${bookings.duration} SECOND)`, date),
						),
					),
			});

			return {
				data,
			};
		}),

	search: protectedProcedure
		.input(
			z.object({
				dogId: z.string(),
				cursor: z
					.object({
						id: z.string().cuid2(),
						date: z.date(),
					})
					.optional(),
				after: z.date().optional(),
				sortDirection: z.union([z.literal("asc"), z.literal("desc")]).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { cursor, sortDirection, after, dogId } = input;

			const data = await ctx.db.query.bookings.findMany({
				// We display 5 bookings at a time, so if there is no cursor, we want to fetch 6 bookings to see if there is a next page.
				limit: cursor ? 5 : 6,
				where: (bookings, { eq, or, and, gt }) =>
					and(
						eq(bookings.organizationId, ctx.user.organizationId),
						eq(bookings.dogId, dogId),
						cursor
							? or(
									sortDirection === "asc" ? gt(bookings.date, cursor.date) : lt(bookings.date, cursor.date),
									and(eq(bookings.date, cursor.date), gt(bookings.id, cursor.id)),
							  )
							: undefined,
						after ? gte(bookings.date, after) : undefined,
					),
				orderBy: (bookings, { asc, desc }) => [
					sortDirection === "asc" ? asc(bookings.date) : desc(bookings.date),
					asc(bookings.id),
				],
				with: {
					assignedTo: {
						columns: {
							id: true,
							givenName: true,
							familyName: true,
							emailAddress: true,
							organizationId: true,
							organizationRole: true,
							profileImageUrl: true,
						},
					},
					dog: {
						columns: {
							id: true,
							givenName: true,
							familyName: true,
							color: true,
							breed: true,
						},
					},
				},
			});

			return {
				data,
			};
		}),

	byWeek: protectedProcedure
		.input(
			z
				.object({
					date: z.string().optional().catch(undefined),
					assignedToId: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const userTimezoneOffset = getTimezoneOffset(ctx.user.timezone);
			let date = dayjs(input?.date).startOf("day");

			if (!date.isValid()) {
				date = dayjs().startOf("day");
			}

			date = date.subtract(userTimezoneOffset, "minutes");

			const data = await ctx.db.query.bookings.findMany({
				where: and(
					eq(bookings.organizationId, ctx.user.organizationId),
					// -14/+12 hours to account for timezones. Easier to do this than to manage conversion based on user's timezone.
					// And it shouldn't over-fetch too much.
					gte(bookings.date, date.toDate()),
					lt(bookings.date, date.add(7, "days").toDate()),
					input?.assignedToId ? eq(bookings.assignedToId, input.assignedToId) : eq(bookings.assignedToId, ctx.user.id),
				),
				orderBy: (bookings, { asc, desc }) => [asc(bookings.date), desc(bookings.duration), asc(bookings.id)],
				with: {
					dog: {
						columns: {
							id: true,
							givenName: true,
							familyName: true,
							color: true,
							breed: true,
						},
					},
					assignedTo: {
						columns: {
							id: true,
							givenName: true,
							familyName: true,
							emailAddress: true,
							organizationId: true,
							organizationRole: true,
							profileImageUrl: true,
						},
					},
				},
			});

			return { data };
		}),

	byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const data = await ctx.db.query.bookings.findFirst({
			where: and(eq(bookings.organizationId, ctx.user.organizationId), eq(bookings.id, input.id)),
			with: {
				dog: {
					columns: {
						id: true,
						givenName: true,
						familyName: true,
						color: true,
						breed: true,
					},
				},
				assignedTo: {
					columns: {
						id: true,
						givenName: true,
						familyName: true,
						emailAddress: true,
						organizationId: true,
						organizationRole: true,
						profileImageUrl: true,
					},
				},
			},
		});

		return { data };
	}),

	insert: protectedProcedure
		.input(InsertBookingSchema.extend({ sendConfirmationEmail: z.boolean().default(true) }))
		.mutation(async ({ ctx, input }) => {
			const { sendConfirmationEmail, ...data } = input;

			await ctx.db.insert(bookings).values({
				...data,
				organizationId: ctx.user.organizationId,
			});

			if (env.NODE_ENV !== "development" && sendConfirmationEmail && data.date > new Date()) {
				void fetch(getBaseUrl() + "/api/emails/booking-confirmation", {
					method: "POST",
					credentials: "include",
					headers: {
						cookie: ctx.request.headers.get("cookie") ?? "",
					},
					body: JSON.stringify({ bookingId: data.id }),
				});
			}
		}),

	update: protectedProcedure
		.input(UpdateBookingSchema.extend({ sendEmailUpdates: z.boolean().default(true) }))
		.mutation(async ({ ctx, input }) => {
			const { id, sendEmailUpdates, ...data } = input;

			await ctx.db
				.update(bookings)
				.set(data)
				.where(and(eq(bookings.organizationId, ctx.user.organizationId), eq(bookings.id, id)));

			if (env.NODE_ENV !== "development" && sendEmailUpdates) {
				void fetch(getBaseUrl() + "/api/emails/booking-updated", {
					method: "POST",
					credentials: "include",
					headers: {
						cookie: ctx.request.headers.get("cookie") ?? "",
					},
					body: JSON.stringify({ bookingId: id }),
				});
			}
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string(), dogId: z.string().optional(), sendCancellationEmail: z.boolean().default(true) }))
		.mutation(async ({ ctx, input }) => {
			const { id, sendCancellationEmail } = input;

			if (env.NODE_ENV !== "development" && sendCancellationEmail) {
				try {
					await fetch(getBaseUrl() + "/api/emails/booking-cancellation", {
						method: "POST",
						credentials: "include",
						headers: {
							cookie: ctx.request.headers.get("cookie") ?? "",
						},
						body: JSON.stringify({ bookingId: id }),
					});
				} catch (error) {
					logInDevelopment(error);
				}
			}

			await ctx.db
				.delete(bookings)
				.where(and(eq(bookings.organizationId, ctx.user.organizationId), eq(bookings.id, id)));

			const countQuery = await ctx.db
				.select({
					count: sql<number>`count(*)`.mapWith(Number),
				})
				.from(bookings)
				.where(
					and(
						eq(bookings.organizationId, ctx.user.organizationId),
						input.dogId ? eq(bookings.dogId, input.dogId) : undefined,
					),
				);

			return {
				count: countQuery[0]?.count ?? 0,
			};
		}),
});
