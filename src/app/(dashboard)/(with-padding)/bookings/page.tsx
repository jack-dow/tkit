import { Suspense } from "react";
import { type Metadata } from "next";
import { z } from "zod";

import { PageHeader } from "~/components/page-header";
import { TableSkeleton } from "~/components/ui/table-skeleton";
import { server } from "~/lib/trpc/server";
import { PaginationOptionsSchema, type SearchParams } from "~/lib/utils";
import { BookingsTable } from "./_components/bookings-table";

export const metadata: Metadata = {
	title: "Bookings | TKIT",
};

async function BookingsTableSSR({ searchParams }: { searchParams?: SearchParams }) {
	const validatedSearchParams = PaginationOptionsSchema.extend({
		from: z.string().optional().catch(undefined),
		to: z.string().optional().catch(undefined),
		sortDirection: PaginationOptionsSchema.shape.sortDirection.default("desc"),
	}).parse(searchParams);

	const response = await server.app.bookings.all.query(validatedSearchParams);

	return <BookingsTable initialData={response} />;
}

export default function BookingsPage({ searchParams }: { searchParams?: SearchParams }) {
	return (
		<>
			<PageHeader title="Manage Bookings" back={{ href: "/" }} />

			<Suspense fallback={<TableSkeleton rows={4} />}>
				<BookingsTableSSR searchParams={searchParams} />
			</Suspense>
		</>
	);
}
