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
import { ORGANIZATIONS_SORTABLE_COLUMNS } from "~/lib/sortable-columns";
import { api } from "~/lib/trpc/client";
import { logInDevelopment, PaginationOptionsSchema, searchParamsToObject } from "~/lib/utils";
import { type RouterOutputs } from "~/server";

function OrganizationsTable({ initialData }: { initialData: RouterOutputs["auth"]["organizations"]["all"] }) {
	const { toast } = useToast();

	const searchParams = useSearchParams();
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParamsToObject(searchParams));

	const utils = api.useUtils();

	const result = api.auth.organizations.all.useQuery(validatedSearchParams, { initialData });

	const deleteMutation = api.auth.organizations.delete.useMutation();
	const [confirmOrganizationDelete, setConfirmOrganizationDelete] = React.useState<
		RouterOutputs["auth"]["organizations"]["all"]["data"][number] | null
	>(null);

	return (
		<>
			<DestructiveActionDialog
				name="organization"
				withoutTrigger
				open={!!confirmOrganizationDelete}
				onOpenChange={() => {
					setConfirmOrganizationDelete(null);
				}}
				onConfirm={async () => {
					if (confirmOrganizationDelete == null) return;

					try {
						await deleteMutation.mutateAsync({ id: confirmOrganizationDelete.id });

						toast({
							title: `Organization deleted`,
							description: `Successfully deleted organization "${confirmOrganizationDelete.name}".`,
						});
					} catch (error) {
						logInDevelopment(error);

						toast({
							title: `Organization deletion failed`,
							description: `There was an error deleting organization "${confirmOrganizationDelete.name}". Please try again.`,
							variant: "destructive",
						});
					}
				}}
			/>

			<DataTable
				search={{
					onSearch: async (searchTerm) => {
						const result = await utils.auth.organizations.search.fetch({ searchTerm });

						return result.data;
					},
					resultLabel: (organization) => organization.name,
				}}
				sortableColumns={ORGANIZATIONS_SORTABLE_COLUMNS}
				{...result.data}
				columns={[
					{
						id: "name",
						header: "Name",
						cell: (row) => {
							return (
								<div className="flex max-w-[500px] flex-col">
									<span className="truncate font-medium">{row.name}</span>
								</div>
							);
						},
					},
					{
						id: "users",
						header: "Users",
						cell: (row) => {
							return (
								<div className="flex items-center">
									<span className="truncate">
										{row.organizationUsers.length}/{row.maxUsers}
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
												<Link href={`/organizations/${row.id}`} className="hover:cursor-pointer">
													<EditIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
													Edit
												</Link>
											</DropdownMenuItem>

											<DropdownMenuItem
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();

													setConfirmOrganizationDelete(row);
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

export { OrganizationsTable };
