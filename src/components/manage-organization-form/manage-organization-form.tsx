"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { Form } from "~/components/ui/form";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { useUser } from "~/app/providers";
import { InsertOrganizationSchema } from "~/db/validation/auth";
import { env } from "~/env.mjs";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { useZodForm } from "~/hooks/use-zod-form";
import { api } from "~/lib/trpc/client";
import { generateId, hasTrueValue, logInDevelopment } from "~/lib/utils";
import { type RouterOutputs } from "~/server";
import { OrganizationGeneralSettings } from "./organization-general-settings";
import { OrganizationInviteLinks } from "./organization-invite-links";
import { OrganizationLogoImage } from "./organization-logo-image";
import { OrganizationUsers } from "./organization-users";

const ManageOrganizationFormSchema = InsertOrganizationSchema.extend({
	name: z.string().min(1, { message: "Required" }).max(50),
});
type ManageOrganizationFormSchema = z.infer<typeof ManageOrganizationFormSchema>;

type ManageOrganizationFormProps = {
	organization?: RouterOutputs["auth"]["organizations"]["byId"]["data"];
};

function ManageOrganizationForm(props: ManageOrganizationFormProps) {
	const isNew = !props.organization;

	const { toast } = useToast();
	const user = useUser();

	const router = useRouter();

	const result = api.auth.organizations.byId.useQuery(
		{ id: props.organization?.id ?? "new" },
		{ initialData: { data: props.organization }, enabled: !isNew },
	);
	const organization = result.data?.data;

	const form = useZodForm({
		schema: ManageOrganizationFormSchema,
		defaultValues: {
			maxUsers: 1,
			organizationInviteLinks: [],
			organizationUsers: [],
			...organization,
			id: organization?.id ?? generateId(),
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	// Have to hold the file here because we need to upload as a File not a url and if you use a File in zod it errors when run on the server as File doesn't exist there
	const [uploadedLogoImage, setUploadedLogoImage] = React.useState<File | null>(null);

	const context = api.useContext();

	const insertMutation = api.auth.organizations.insert.useMutation();
	const updateMutation = api.auth.organizations.update.useMutation();

	React.useEffect(() => {
		if (organization) {
			form.reset(
				{
					...organization,
					// For some reason even though the logoImageUrl is set in the organization-logo-image component using setValue with `shouldDirty` to true, that isn't respected when calling form.reset
					logoImageUrl: form.formState.dirtyFields.logoImageUrl
						? form.getValues("logoImageUrl")
						: organization.logoImageUrl,
				},
				{
					keepDirty: true,
					keepDirtyValues: true,
				},
			);
		}
	}, [organization, form]);

	console.log(form.getValues("logoImageUrl"));

	function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		e.stopPropagation();
		void form.handleSubmit(async (data) => {
			try {
				let successfullyUploadedImage = false;

				// If the profile image has changed, upload it
				if (data.logoImageUrl !== organization?.logoImageUrl) {
					if (uploadedLogoImage) {
						try {
							const { data: url } = await context.auth.user.organization.getLogoImageUrl.fetch({
								fileType: uploadedLogoImage.type,
							});

							const uploadResponse = await fetch(url, {
								method: "PUT",
								body: uploadedLogoImage,
							});

							if (!uploadResponse.ok) {
								throw new Error("Failed to upload profile image");
							}

							const index = url.indexOf("?");
							if (index !== -1) {
								data.logoImageUrl = url.substring(0, index);
							} else {
								data.logoImageUrl = url;
							}
							successfullyUploadedImage = true;
						} catch (error) {
							logInDevelopment(error);

							toast({
								title: "Failed to upload profile image",
								description: "An unknown error occurred while trying to upload your profile image. Please try again.",
							});
						}
					}
				}

				console.log({ data });

				if (isNew) {
					await insertMutation.mutateAsync({
						...data,
						logoImageUrl: data.logoImageUrl != null ? (successfullyUploadedImage ? data.logoImageUrl : null) : null,
					});
				} else {
					await updateMutation.mutateAsync(
						successfullyUploadedImage
							? {
									...data,
									logoImageUrl: data.logoImageUrl,
							  }
							: data,
					);
				}

				if (user.organizationId === env.NEXT_PUBLIC_ADMIN_ORG_ID) {
					if (isNew) {
						router.replace(`/organizations/${data.id}`);
					} else {
						router.push(`/organizations`);
					}
				} else {
					form.reset(form.getValues());
				}

				toast({
					title: `Organization ${isNew ? "Created" : "Updated"}`,
					description: `Successfully ${isNew ? "created" : "updated"} ${
						user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID ? "your" : ""
					} organization.`,
				});
			} catch (error) {
				logInDevelopment(error);

				toast({
					title: `Organization  ${isNew ? "Creation" : "Update"} Failed`,
					description: `There was an error ${isNew ? "creating" : "updating"} ${
						user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID ? "your" : ""
					} organization. Please try again.`,
					variant: "destructive",
				});
			}
		})(e);
	}

	const [isConfirmNavigationDialogOpen, setIsConfirmNavigationDialogOpen] = React.useState(false);

	return (
		<>
			<ConfirmFormNavigationDialog
				open={isConfirmNavigationDialogOpen}
				onOpenChange={() => {
					setIsConfirmNavigationDialogOpen(false);
				}}
				onConfirm={() => {
					router.back();
				}}
			/>

			<Form {...form}>
				<form onSubmit={onSubmit} className="space-y-6 lg:space-y-10">
					<OrganizationGeneralSettings />

					<Separator />

					<OrganizationLogoImage setUploadedLogoImage={setUploadedLogoImage} />

					<Separator />

					<OrganizationInviteLinks isNew={isNew} />

					<Separator />

					<OrganizationUsers isNew={isNew} />

					<Separator />

					<div className="flex items-center justify-end space-x-3">
						<Button
							type="submit"
							disabled={
								form.formState.isSubmitting ||
								!isFormDirty ||
								(user.organizationRole !== "owner" && user.organizationRole !== "admin")
							}
							onClick={() => {
								const numOfErrors = Object.keys(form.formState.errors).length;

								if (numOfErrors > 0) {
									toast({
										title: `Form submission errors`,
										description: `There ${numOfErrors === 1 ? "is" : "are"} ${numOfErrors} error${
											numOfErrors > 1 ? "s" : ""
										} with your submission. Please fix them and resubmit.`,
										variant: "destructive",
									});
								}
							}}
						>
							{form.formState.isSubmitting && <Loader size="sm" />}
							Save changes
						</Button>
					</div>
				</form>
			</Form>
		</>
	);
}

export { ManageOrganizationForm, ManageOrganizationFormSchema };
