import { Suspense } from "react";
import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { TableSkeleton } from "~/components/ui/table-skeleton";
import { server } from "~/lib/trpc/server";
import { PaginationOptionsSchema, type SearchParams } from "~/lib/utils";
import { DogsTable } from "./_components/dogs-table";

export const metadata: Metadata = {
	title: "Dogs | TKIT",
};

async function DogsTableSSR({ searchParams }: { searchParams?: SearchParams }) {
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParams);

	const response = await server.app.dogs.all.query(validatedSearchParams);

	return <DogsTable initialData={response} />;
}

export default function DogsPage({ searchParams }: { searchParams?: SearchParams }) {
	return (
		<>
			<PageHeader title="Manage Dogs" back={{ href: "/" }} />

			<Suspense fallback={<TableSkeleton rows={4} />}>
				<DogsTableSSR searchParams={searchParams} />
			</Suspense>
		</>
	);
}
