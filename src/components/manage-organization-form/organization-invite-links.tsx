"use client";

import * as React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { ClickToCopy } from "~/components/ui/click-to-copy";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { FormGroup, FormSection } from "~/components/ui/form";
import { EllipsisVerticalIcon, TrashIcon } from "~/components/ui/icons";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { useUser } from "~/app/providers";
import { env } from "~/env.mjs";
import { useDayjs } from "~/hooks/use-dayjs";
import { api } from "~/lib/trpc/client";
import { getBaseUrl, logInDevelopment } from "~/lib/utils";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { type ManageOrganizationFormSchema } from "./manage-organization-form";
import { ManageOrganizationInviteLinkDialog } from "./manage-organization-invite-link-dialog";

function OrganizationInviteLinks({ isNew }: { isNew: boolean }) {
	const { toast } = useToast();
	const user = useUser();
	const form = useFormContext<ManageOrganizationFormSchema>();
	const organizationInviteLinks = useFieldArray({
		control: form.control,
		name: "organizationInviteLinks",
		keyName: "rhf-id",
	});

	const [confirmInviteLinkDelete, setConfirmInviteLinkDelete] = React.useState<string | null>(null);

	const deleteMutation = api.auth.organizations.inviteLinks.delete.useMutation();

	async function handleInviteLinkDelete(inviteLinkId: string) {
		try {
			if (!isNew) {
				await deleteMutation.mutateAsync({
					id: inviteLinkId,
				});
			}

			organizationInviteLinks.remove(organizationInviteLinks.fields.findIndex((link) => link.id === inviteLinkId));

			toast({
				title: `Invite link deleted`,
				description: `Successfully deleted invite link.`,
			});
		} catch (error) {
			logInDevelopment(error);

			toast({
				title: `Invite link deletion failed`,
				description: "There was an error deleting the invite link. Please try again",
				variant: "destructive",
			});
		}
	}

	return (
		<>
			<DestructiveActionDialog
				name="invite link"
				requiresSaveOf="organization"
				withoutTrigger
				open={!!confirmInviteLinkDelete}
				onOpenChange={() => setConfirmInviteLinkDelete(null)}
				onConfirm={async () => {
					if (confirmInviteLinkDelete) {
						await handleInviteLinkDelete(confirmInviteLinkDelete);
					}
				}}
			/>

			<FormSection title="Invite Links" description="Manage this organization's invite links">
				<FormGroup>
					<div className="grid sm:col-span-6">
						<div className="-mx-4 sm:-mx-0">
							<table className="min-w-full divide-y divide-border">
								<thead>
									<tr>
										<th scope="col" className="pb-3.5 pl-4 pr-3 text-left text-sm font-semibold text-primary sm:pl-0">
											Created by
										</th>
										<th scope="col" className="px-3 pb-3.5 text-left text-sm font-semibold text-primary">
											Code
										</th>
										<th
											scope="col"
											className="hidden px-3 pb-3.5 text-left text-sm font-semibold text-primary sm:table-cell"
										>
											Uses
										</th>
										<th
											scope="col"
											className="hidden px-3 pb-3.5 text-left text-sm font-semibold text-primary sm:table-cell"
										>
											Expires
										</th>
										<th scope="col" className="relative w-8 pb-3.5 pl-3 pr-4 sm:pr-0">
											<span className="sr-only">Edit</span>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 bg-white">
									{organizationInviteLinks.fields.map((inviteLink) => (
										<OrganizationInviteLinkTableRow
											key={inviteLink.id}
											inviteLink={inviteLink}
											onDelete={async () => {
												if (isNew) {
													await handleInviteLinkDelete(inviteLink.id);
													return;
												}

												setConfirmInviteLinkDelete(inviteLink.id);
											}}
										/>
									))}
								</tbody>
							</table>
						</div>
						<Separator />
						<div className="mt-5 flex justify-end">
							{organizationInviteLinks.fields.length < 20 ? (
								<ManageOrganizationInviteLinkDialog
									isNewOrganization={isNew}
									onSuccessfulSubmit={(inviteLink) => {
										if (isNew) {
											organizationInviteLinks.append({
												createdAt: new Date(),
												...inviteLink,
												user,
											});
										} else {
											// Using form.setValue instead of append if this isn't a new organization because we don't want to dirty the form when adding a new invite link
											form.setValue(
												"organizationInviteLinks",
												[
													...organizationInviteLinks.fields,
													{
														createdAt: new Date(),
														...inviteLink,
														user,
													},
												],
												{
													shouldDirty: false,
												},
											);
										}
									}}
									defaultValues={
										user.organizationId === env.NEXT_PUBLIC_ADMIN_ORG_ID
											? {
													organizationId: form.getValues("id"),
											  }
											: undefined
									}
								/>
							) : (
								<Button
									onClick={() => {
										toast({
											title: `Maximum invite links reached`,
											description: `You can only have a maximum of 20 invite links at one time. Please delete an existing invite link to create a new one.`,
										});
									}}
								>
									Generate invite link
								</Button>
							)}
						</div>
					</div>
				</FormGroup>
			</FormSection>
		</>
	);
}

const useCountdown = (targetDate: Date) => {
	const countDownDate = new Date(targetDate).getTime();

	const [countDown, setCountDown] = React.useState(countDownDate - new Date().getTime());

	React.useEffect(() => {
		const interval = setInterval(() => {
			setCountDown(countDownDate - new Date().getTime());
		}, 1000);

		return () => clearInterval(interval);
	}, [countDownDate]);

	return getReturnValues(countDown);
};

const getReturnValues = (countDown: number) => {
	// calculate time left
	const days = Math.floor(countDown / (1000 * 60 * 60 * 24))
		.toString()
		.padStart(2, "0");
	const hours = Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
		.toString()
		.padStart(2, "0");
	const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60))
		.toString()
		.padStart(2, "0");
	const seconds = Math.floor((countDown % (1000 * 60)) / 1000)
		.toString()
		.padStart(2, "0");

	return [days, hours, minutes, seconds] as const;
};

function Timer({ targetDate }: { targetDate: Date }) {
	const [days, hours, minutes, seconds] = useCountdown(targetDate);

	return (
		<div>
			<div className="flex w-fit min-w-[85px] gap-2 text-sm font-medium text-muted-foreground">
				{days}:{hours}:{minutes}:{seconds}
			</div>
		</div>
	);
}

function OrganizationInviteLinkTableRow({
	inviteLink,
	onDelete,
}: {
	inviteLink: ManageOrganizationFormSchema["organizationInviteLinks"][number];
	onDelete: () => Promise<void>;
}) {
	const { dayjs } = useDayjs();

	const user = useUser();

	const [isDeleting, setIsDeleting] = React.useState(false);
	return (
		<tr key={inviteLink.id}>
			<td className="w-full max-w-0 py-5 pl-4 pr-3 text-sm font-medium sm:w-auto sm:max-w-none sm:pl-0">
				{inviteLink.user ? (
					<>
						{inviteLink.user.givenName} {inviteLink.user.familyName}
					</>
				) : (
					"Deleted User"
				)}
				<dl className="font-normal sm:hidden">
					<dt className="sr-only">Uses</dt>
					<dd className="mt-1 truncate">
						{inviteLink.uses}
						{inviteLink.maxUses ? `/${inviteLink.maxUses}` : null} uses
					</dd>
					<dt className="sr-only">Expires</dt>
					<dd className="mt-1 truncate capitalize">
						{dayjs.tz(inviteLink.createdAt).add(inviteLink.expiresAfter, "seconds").isBefore(dayjs.tz()) ? (
							"Expired"
						) : (
							<Timer targetDate={dayjs.tz(inviteLink.createdAt).add(inviteLink.expiresAfter, "seconds").toDate()} />
						)}
					</dd>
				</dl>
			</td>
			<td className="px-3 py-4 text-sm ">
				<ClickToCopy text={`${getBaseUrl({ absolute: true })}/invite/${inviteLink.id}`} className="text-sm">
					{inviteLink.id}
				</ClickToCopy>
			</td>
			<td className="hidden px-3 py-4 text-sm sm:table-cell">
				{inviteLink.uses}
				{inviteLink.maxUses ? `/${inviteLink.maxUses}` : null}
			</td>
			<td className="hidden px-3 py-4 text-sm capitalize sm:table-cell">
				{dayjs.tz(inviteLink.createdAt).add(inviteLink.expiresAfter, "seconds").isBefore(dayjs.tz()) ? (
					"Expired"
				) : (
					<Timer targetDate={dayjs.tz(inviteLink.createdAt).add(inviteLink.expiresAfter, "seconds").toDate()} />
				)}
			</td>
			<td className="w-8 py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
				<div className="flex items-center justify-end">
					{user.organizationRole !== "member" && (
						<DropdownMenu>
							<DropdownMenuTrigger className="flex items-center rounded-full text-slate-400 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
								<span className="sr-only">Open options</span>
								<EllipsisVerticalIcon className="h-5 w-5" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>Actions</DropdownMenuLabel>
								<DropdownMenuSeparator />

								<DropdownMenuItem
									onSelect={() => {
										setIsDeleting(true);
										void onDelete().finally(() => {
											setIsDeleting(false);
										});
									}}
								>
									<TrashIcon className="mr-2 h-4 w-4" />
									<span className="flex-1">Remove</span>
									{isDeleting && <Loader size="sm" variant="black" className="ml-2 mr-0" />}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</td>
		</tr>
	);
}

export { OrganizationInviteLinks };
