import { Suspense } from "react";
import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { TableSkeleton } from "~/components/ui/table-skeleton";
import { server } from "~/lib/trpc/server";
import { PaginationOptionsSchema, type SearchParams } from "~/lib/utils";
import { VetsTable } from "./_components/vets-table";

export const metadata: Metadata = {
	title: "Vets | TKIT",
};

async function VetsTableSSR({ searchParams }: { searchParams?: SearchParams }) {
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParams);

	const response = await server.app.vets.all.query(validatedSearchParams);

	return <VetsTable initialData={response} />;
}

export default function VetsPage({ searchParams }: { searchParams?: SearchParams }) {
	return (
		<>
			<PageHeader title="Manage Vets" back={{ href: "/" }} />

			<Suspense fallback={<TableSkeleton rows={3} />}>
				<VetsTableSSR searchParams={searchParams} />
			</Suspense>
		</>
	);
}
