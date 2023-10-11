import { PageHeader } from "~/components/page-header";
import { TableSkeleton } from "~/components/ui/table-skeleton";

export default function Loading() {
	return (
		<>
			<PageHeader title="Manage Vet Clinics" back={{ href: "/" }} />

			<TableSkeleton rows={3} />
		</>
	);
}
