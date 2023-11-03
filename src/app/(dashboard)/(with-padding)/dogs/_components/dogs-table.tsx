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
import { DOGS_SORTABLE_COLUMNS } from "~/lib/sortable-columns";
import { api } from "~/lib/trpc/client";
import { logInDevelopment, PaginationOptionsSchema, searchParamsToObject } from "~/lib/utils";
import { type RouterOutputs } from "~/server";

function DogsTable({ initialData }: { initialData: RouterOutputs["app"]["dogs"]["all"] }) {
	const { toast } = useToast();

	const searchParams = useSearchParams();
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParamsToObject(searchParams));

	const utils = api.useUtils();

	const result = api.app.dogs.all.useQuery(validatedSearchParams, { initialData });

	const deleteMutation = api.app.dogs.delete.useMutation();
	const [confirmDogDelete, setConfirmDogDelete] = React.useState<
		RouterOutputs["app"]["dogs"]["all"]["data"][number] | null
	>(null);

	return (
		<>
			<DestructiveActionDialog
				name="dog"
				withoutTrigger
				open={!!confirmDogDelete}
				onOpenChange={() => {
					setConfirmDogDelete(null);
				}}
				onConfirm={async () => {
					if (confirmDogDelete == null) return;

					try {
						await deleteMutation.mutateAsync({ id: confirmDogDelete.id });

						toast({
							title: `Dog deleted`,
							description: `Successfully deleted dog "${confirmDogDelete.givenName}".`,
						});
					} catch (error) {
						logInDevelopment(error);

						toast({
							title: `Dog deletion failed`,
							description: `There was an error deleting dog "${confirmDogDelete.givenName}". Please try again.`,
							variant: "destructive",
						});
					}
				}}
			/>

			<DataTable
				search={{
					onSearch: async (searchTerm) => {
						const result = await utils.app.dogs.search.fetch({ searchTerm });

						return result.data;
					},
					resultLabel: (dog) => `${dog.givenName} ${dog.familyName}`,
				}}
				sortableColumns={DOGS_SORTABLE_COLUMNS}
				{...result.data}
				columns={[
					{
						id: "givenName",
						header: "Name",
						cell: (row) => {
							return (
								<div className="flex select-none space-x-2">
									<span className="truncate font-medium capitalize">{row.givenName}</span>
								</div>
							);
						},
					},
					{
						id: "familyName",
						header: "Family Name",
						cell: (row) => {
							return (
								<div className="flex select-none space-x-2">
									<span className="truncate font-medium capitalize">{row.familyName}</span>
								</div>
							);
						},
					},
					{
						id: "breed",
						header: "Breed",
						cell: (row) => {
							return (
								<div className="flex max-w-[500px] select-none items-center capitalize">
									<span className="truncate capitalize">{row.breed}</span>
								</div>
							);
						},
					},
					{
						id: "color",
						header: "Color",
						cell: (row) => {
							return (
								<div className="flex select-none items-center ">
									<span className="truncate capitalize">{row.color}</span>
								</div>
							);
						},
					},
					{
						id: "actions",
						header: "",
						cell: (row) => (
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
											<Link href={`/dogs/${row.id}`} className="hover:cursor-pointer">
												<EditIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
												Edit
											</Link>
										</DropdownMenuItem>

										<DropdownMenuItem
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();

												setConfirmDogDelete(row);
											}}
										>
											<TrashIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						),
					},
				]}
			/>
		</>
	);
}

export { DogsTable };
