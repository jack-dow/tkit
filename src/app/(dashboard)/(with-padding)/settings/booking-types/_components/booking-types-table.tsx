"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { BOOKING_TYPES_COLORS } from "~/components/manage-booking-types/booking-types-fields";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { EditIcon, EllipsisVerticalIcon, TrashIcon } from "~/components/ui/icons";
import { useToast } from "~/components/ui/use-toast";
import { BOOKING_TYPES_SORTABLE_COLUMNS } from "~/lib/sortable-columns";
import { api } from "~/lib/trpc/client";
import {
	cn,
	logInDevelopment,
	PaginationOptionsSchema,
	searchParamsToObject,
	secondsToHumanReadable,
} from "~/lib/utils";
import { type RouterOutputs } from "~/server";

function BookingTypesTable({ initialData }: { initialData: RouterOutputs["app"]["bookingTypes"]["all"] }) {
	const { toast } = useToast();

	const searchParams = useSearchParams();
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParamsToObject(searchParams));

	const context = api.useContext();

	const result = api.app.bookingTypes.all.useQuery(validatedSearchParams, { initialData });

	const deleteMutation = api.app.bookingTypes.delete.useMutation();
	const [confirmBookingTypeDelete, setConfirmBookingTypeDelete] = React.useState<
		RouterOutputs["app"]["bookingTypes"]["all"]["data"][number] | null
	>(null);

	return (
		<>
			<DestructiveActionDialog
				name="booking type"
				withoutTrigger
				open={!!confirmBookingTypeDelete}
				onOpenChange={() => {
					setConfirmBookingTypeDelete(null);
				}}
				onConfirm={async () => {
					if (confirmBookingTypeDelete == null) return;

					try {
						await deleteMutation.mutateAsync({ id: confirmBookingTypeDelete.id });

						toast({
							title: `Booking type deleted`,
							description: `Successfully deleted booking type "${confirmBookingTypeDelete.name}".`,
						});
					} catch (error) {
						logInDevelopment(error);

						toast({
							title: `Booking type deletion failed`,
							description: `There was an error deleting booking type "${confirmBookingTypeDelete.name}". Please try again.`,
							variant: "destructive",
						});
					}
				}}
			/>

			<DataTable
				basePath="/settings"
				search={{
					onSearch: async (searchTerm) => {
						const result = await context.app.bookingTypes.search.fetch({ searchTerm });

						return result.data;
					},
					resultLabel: (bookingType) => `${bookingType.name}`,
				}}
				sortableColumns={BOOKING_TYPES_SORTABLE_COLUMNS}
				{...result.data}
				columns={[
					{
						id: "name",
						header: "Name",
						cell: (row) => {
							return (
								<div className="flex max-w-[500px] items-center gap-2">
									<span className="truncate font-medium">{row.name}</span>
								</div>
							);
						},
					},
					{
						id: "isDefault",
						header: "Status",
						cell: (row) => {
							return (
								<div className="relative flex items-center">
									{row.isDefault && <Badge variant="default">Default</Badge>}
								</div>
							);
						},
					},
					{
						id: "duration",
						header: "Duration",
						cell: (row) => {
							return (
								<div className="hidden max-w-[500px] items-center sm:flex">
									<span className="truncate">{secondsToHumanReadable(row.duration)}</span>
								</div>
							);
						},
					},
					{
						id: "color",
						header: "Color",
						cell: (row) => {
							return (
								<div className="relative flex items-center">
									{row.color in BOOKING_TYPES_COLORS && (
										<div
											className={cn(
												"w-4 h-4 rounded-full absolute mt-0.5 left-0 flex items-center justify-center",
												BOOKING_TYPES_COLORS[row.color as keyof typeof BOOKING_TYPES_COLORS],
											)}
										/>
									)}
									<span className={cn("truncate capitalize", row.color in BOOKING_TYPES_COLORS && "pl-6")}>
										{row.color}
									</span>
								</div>
							);
						},
					},

					{
						id: "actions",
						header: "",
						cell: (row) => {
							return (
								<div className="flex justify-end">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
												<EllipsisVerticalIcon className="h-4 w-4" />
												<span className="sr-only">Open menu</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-[160px]">
											<DropdownMenuLabel>Actions</DropdownMenuLabel>
											<DropdownMenuSeparator />
											<DropdownMenuItem asChild>
												<Link href={`/booking-types/${row.id}`} className="hover:cursor-pointer">
													<EditIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
													Edit
												</Link>
											</DropdownMenuItem>

											<DropdownMenuItem
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();

													setConfirmBookingTypeDelete(row);
												}}
											>
												<TrashIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							);
						},
					},
				]}
			/>
		</>
	);
}

export { BookingTypesTable };
