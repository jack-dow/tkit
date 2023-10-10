import { type Metadata } from "next";
import { z } from "zod";

import { server } from "~/lib/trpc/server";
import { type SearchParams } from "~/lib/utils";
import { WeekView } from "./_components/week-view";

export const metadata: Metadata = {
	title: "Weekly Calendar | TKIT",
};

async function WeeklyCalendar({ searchParams }: { searchParams: SearchParams }) {
	const date = z
		.string()
		.pipe(z.coerce.date())
		.optional()
		.catch(undefined)
		.parse(searchParams?.date ?? new Date().toISOString());

	const [bookingTypes, bookings, organization] = await Promise.all([
		server.app.bookingTypes.all.query({}),
		server.app.bookings.byWeek.query({
			date: date?.toISOString(),
			assignedTo: z
				.string()
				.optional()
				.catch(undefined)
				.parse(searchParams?.assignedTo),
		}),
		server.auth.user.organization.query(),
	]);

	// const bookingTypes = [
	// 	{
	// 		id: "utzx6i2afvha32zajgef3v57",
	// 		name: "Busy",
	// 		duration: 1800,
	// 		color: "gray",
	// 		showDetailsInCalendar: false,
	// 		isDefault: false,
	// 	},
	// 	{
	// 		id: "jb9cckaphbs3p1xs4uubc8ja",
	// 		name: "Follow up session",
	// 		duration: 1800,
	// 		color: "sky",
	// 		showDetailsInCalendar: false,
	// 		isDefault: true,
	// 	},
	// 	{
	// 		id: "xp5u04mdvm6ognnz7z7tm9xr",
	// 		name: "Initial Consultation",
	// 		duration: 3600,
	// 		color: "red",
	// 		showDetailsInCalendar: false,
	// 		isDefault: false,
	// 	},
	// ];

	return (
		<WeekView
			date={date?.toISOString()}
			initialData={bookings}
			bookingTypes={bookingTypes?.data}
			organization={organization}
		/>
	);
}

export default WeeklyCalendar;
