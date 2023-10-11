import { PageHeader } from "~/components/page-header";
import { TableSkeleton } from "~/components/ui/table-skeleton";

export default function Loading() {
	return (
		<>
			<PageHeader title="Manage Booking Types" back={{ href: "/" }} />

			<TableSkeleton rows={4} />
		</>
	);
}
