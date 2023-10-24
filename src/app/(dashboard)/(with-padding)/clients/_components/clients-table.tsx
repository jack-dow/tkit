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
import { CLIENTS_SORTABLE_COLUMNS } from "~/lib/sortable-columns";
import { api } from "~/lib/trpc/client";
import { logInDevelopment, PaginationOptionsSchema, searchParamsToObject } from "~/lib/utils";
import { type RouterOutputs } from "~/server";

function ClientsTable({ initialData }: { initialData: RouterOutputs["app"]["clients"]["all"] }) {
	const { toast } = useToast();

	const searchParams = useSearchParams();
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParamsToObject(searchParams));

	const context = api.useContext();

	const result = api.app.clients.all.useQuery(validatedSearchParams, { initialData });

	const deleteMutation = api.app.clients.delete.useMutation();
	const [confirmClientDelete, setConfirmClientDelete] = React.useState<
		RouterOutputs["app"]["clients"]["all"]["data"][number] | null
	>(null);

	return (
		<>
			<DestructiveActionDialog
				name="client"
				withoutTrigger
				open={!!confirmClientDelete}
				onOpenChange={() => {
					setConfirmClientDelete(null);
				}}
				onConfirm={async () => {
					if (confirmClientDelete == null) return;

					try {
						await deleteMutation.mutateAsync({ id: confirmClientDelete.id });
						toast({
							title: `Client deleted`,
							description: `Successfully deleted client "${confirmClientDelete.givenName}${
								confirmClientDelete.familyName ? " " + confirmClientDelete.familyName : ""
							}".`,
						});
					} catch (error) {
						logInDevelopment(error);

						toast({
							title: `Client deletion failed`,
							description: `There was an error deleting client "${confirmClientDelete.givenName}${
								confirmClientDelete.familyName ? " " + confirmClientDelete.familyName : ""
							}". Please try again.`,
							variant: "destructive",
						});
					}
				}}
			/>

			<DataTable
				search={{
					onSearch: async (searchTerm) => {
						const result = await context.app.clients.search.fetch({ searchTerm });

						return result.data;
					},
					resultLabel: (client) => `${client.givenName} ${client.familyName}`,
				}}
				sortableColumns={CLIENTS_SORTABLE_COLUMNS}
				{...result.data}
				columns={[
					{
						id: "fullName",
						header: "Full name",
						cell: (row) => {
							return (
								<div className="flex max-w-[500px] flex-col">
									<span className="truncate font-medium">
										{row.givenName} {row.familyName}
									</span>
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
						header: (
							<div className="truncate text-xs">
								Phone <span className="hidden sm:inline">number</span>
							</div>
						),
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
												<Link href={`/clients/${row.id}`} className="hover:cursor-pointer">
													<EditIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
													Edit
												</Link>
											</DropdownMenuItem>

											<DropdownMenuItem
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();

													setConfirmClientDelete(row);
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

export { ClientsTable };
