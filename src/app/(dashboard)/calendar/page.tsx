import { type Metadata } from "next";
import { z } from "zod";

import { server } from "~/lib/trpc/server";
import { type SearchParams } from "~/lib/utils";
import { WeekView } from "./_components/week-view";

export const metadata: Metadata = {
	title: "Weekly Calendar | TKIT",
};

async function WeeklyCalendar({ searchParams }: { searchParams: SearchParams }) {
	let date = z
		.string()
		.optional()
		.catch(undefined)
		.parse(searchParams?.date);

	if (date) {
		date = date.substring(0, 10);
	}

	const [bookingTypes, bookings, organization] = await Promise.all([
		server.app.bookingTypes.all.query({}),
		server.app.bookings.byWeek.query({
			date,
			assignedToId: z
				.string()
				.optional()
				.catch(undefined)
				.parse(searchParams?.assignedToId),
		}),
		server.auth.user.organization.current.query(),
	]);

	return <WeekView date={date} initialData={bookings} bookingTypes={bookingTypes?.data} organization={organization} />;
}

export default WeeklyCalendar;
