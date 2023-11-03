"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
import { VET_CLINICS_SORTABLE_COLUMNS } from "~/lib/sortable-columns";
import { api } from "~/lib/trpc/client";
import { logInDevelopment, PaginationOptionsSchema, searchParamsToObject } from "~/lib/utils";
import { type RouterOutputs } from "~/server";

function VetClinicsTable({ initialData }: { initialData: RouterOutputs["app"]["vetClinics"]["all"] }) {
	const { toast } = useToast();

	const searchParams = useSearchParams();
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParamsToObject(searchParams));

	const utils = api.useUtils();

	const result = api.app.vetClinics.all.useQuery(validatedSearchParams, {
		initialData: initialData,
	});

	const deleteMutation = api.app.vetClinics.delete.useMutation();

	const [confirmVetClinicDelete, setConfirmVetClinicDelete] = React.useState<
		RouterOutputs["app"]["vetClinics"]["all"]["data"][number] | null
	>(null);

	return (
		<>
			<DestructiveActionDialog
				name="vet clinic"
				withoutTrigger
				open={!!confirmVetClinicDelete}
				onOpenChange={() => {
					setConfirmVetClinicDelete(null);
				}}
				onConfirm={async () => {
					if (confirmVetClinicDelete == null) return;

					try {
						await deleteMutation.mutateAsync({ id: confirmVetClinicDelete.id });

						toast({
							title: `Vet clinic deleted`,
							description: `Successfully deleted vet clinic "${confirmVetClinicDelete.name}".`,
						});
					} catch (error) {
						logInDevelopment(error);

						toast({
							title: `Vet clinic deletion failed`,
							description: `There was an error deleting vet clinic "${confirmVetClinicDelete.name}". Please try again.`,
							variant: "destructive",
						});
					}
				}}
			/>

			<DataTable
				search={{
					onSearch: async (searchTerm) => {
						const result = await utils.app.vetClinics.search.fetch({ searchTerm });

						return result.data;
					},
					resultLabel: (vetClinic) => vetClinic.name,
				}}
				sortableColumns={VET_CLINICS_SORTABLE_COLUMNS}
				{...result.data}
				columns={[
					{
						id: "name",
						header: "Name",
						cell: (row) => {
							return (
								<div className="flex max-w-[500px] flex-col">
									<span className="truncate font-medium">{row.name}</span>
									<span className="text-xs text-muted-foreground sm:hidden">{row.emailAddress}</span>
								</div>
							);
						},
					},
					{
						id: "emailAddress",
						header: "Email address",
						cell: (row) => {
							return (
								<div className="hidden max-w-[500px] items-center sm:flex">
									<span className="truncate">{row.emailAddress}</span>
								</div>
							);
						},
						meta: {
							classNames: {
								header: "hidden sm:table-cell",
							},
						},
					},
					{
						id: "phoneNumber",
						header: "Phone number",
						cell: (row) => {
							return (
								<div className="flex items-center">
									<span className="truncate">{row.phoneNumber}</span>
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
												<Link href={`/vets/${row.id}`} className="hover:cursor-pointer">
													<EditIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
													Edit
												</Link>
											</DropdownMenuItem>

											<DropdownMenuItem
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();

													setConfirmVetClinicDelete(row);
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

export { VetClinicsTable };
