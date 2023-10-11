import { Suspense } from "react";
import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { TableSkeleton } from "~/components/ui/table-skeleton";
import { server } from "~/lib/trpc/server";
import { PaginationOptionsSchema, type SearchParams } from "~/lib/utils";
import { BookingTypesTable } from "./_components/booking-types-table";

export const metadata: Metadata = {
	title: "Booking Types | TKIT",
};

async function BookingTypesTableSSR({ searchParams }: { searchParams?: SearchParams }) {
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParams);

	const response = await server.app.bookingTypes.all.query(validatedSearchParams);

	return <BookingTypesTable initialData={response} />;
}

export default function BookingsTypesPage({ searchParams }: { searchParams?: SearchParams }) {
	return (
		<>
			<PageHeader title="Manage Booking Types" back={{ href: "/" }} />

			<Suspense fallback={<TableSkeleton rows={4} />}>
				<BookingTypesTableSSR searchParams={searchParams} />
			</Suspense>
		</>
	);
}
