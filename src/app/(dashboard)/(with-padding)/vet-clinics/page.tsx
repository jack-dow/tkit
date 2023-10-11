import { Suspense } from "react";
import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { TableSkeleton } from "~/components/ui/table-skeleton";
import { server } from "~/lib/trpc/server";
import { PaginationOptionsSchema, type SearchParams } from "~/lib/utils";
import { VetClinicsTable } from "./_components/vet-clinics-table";

export const metadata: Metadata = {
	title: "Vet Clinics | TKIT",
};

async function VetClinicsTableSSR({ searchParams }: { searchParams?: SearchParams }) {
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParams);

	const response = await server.app.vetClinics.all.query(validatedSearchParams);

	return <VetClinicsTable initialData={response} />;
}

export default function VetClinicsPage({ searchParams }: { searchParams?: SearchParams }) {
	return (
		<>
			<PageHeader title="Manage Vets Clinics" back={{ href: "/" }} />

			<Suspense fallback={<TableSkeleton rows={3} />}>
				<VetClinicsTableSSR searchParams={searchParams} />
			</Suspense>
		</>
	);
}
