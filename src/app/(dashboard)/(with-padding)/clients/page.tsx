import { Suspense } from "react";
import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { TableSkeleton } from "~/components/ui/table-skeleton";
import { server } from "~/lib/trpc/server";
import { PaginationOptionsSchema, type SearchParams } from "~/lib/utils";
import { ClientsTable } from "./_components/clients-table";

export const metadata: Metadata = {
	title: "Clients | TKIT",
};

async function ClientsTableSSR({ searchParams }: { searchParams?: SearchParams }) {
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParams);

	const response = await server.app.clients.all.query(validatedSearchParams);

	return <ClientsTable initialData={response} />;
}

export default function ClientsPage({ searchParams }: { searchParams?: SearchParams }) {
	return (
		<>
			<PageHeader title="Manage Clients" back={{ href: "/" }} />

			<Suspense fallback={<TableSkeleton rows={3} />}>
				<ClientsTableSSR searchParams={searchParams} />
			</Suspense>
		</>
	);
}
