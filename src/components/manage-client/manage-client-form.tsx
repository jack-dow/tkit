"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { hasTrueValue } from "~/lib/utils";
import { Form, FormSection } from "../ui/form";
import { useToast } from "../ui/use-toast";
import { ClientDeleteDialog } from "./client-delete-dialog";
import { ClientPersonalInformation } from "./client-personal-information";
import { ClientToDogRelationships } from "./client-to-dog-relationships";
import { useManageClientForm, type UseManageClientFormProps } from "./use-manage-client-form";

function ManageClientForm({ client, onSubmit, onSuccessfulSubmit }: UseManageClientFormProps) {
	const isNew = !client;

	const { toast } = useToast();
	const router = useRouter();

	const { form, onSubmit: _onSubmit } = useManageClientForm({
		client,
		onSubmit,
		onSuccessfulSubmit: (data) => {
			onSuccessfulSubmit?.(data);

			if (isNew) {
				router.replace(`/clients/${data.id}`);
				return;
			}

			router.push("/clients");
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);

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
				<form onSubmit={_onSubmit} className="space-y-6 lg:space-y-10">
					<ClientPersonalInformation variant="form" />

					<Separator />

					<FormSection
						title="Manage Relationships"
						description="Manage the relationships of this client between other dogs within the system."
					>
						<ClientToDogRelationships isNew={isNew} variant="form" />
					</FormSection>

					<Separator />

					<div className="flex items-center justify-end space-x-3">
						{!isNew && (
							<>
								<ClientDeleteDialog />
								<Separator orientation="vertical" className="h-4" />
							</>
						)}

						<Button
							type="submit"
							disabled={form.formState.isSubmitting || (!isNew && !isFormDirty)}
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
							{isNew ? "Create" : "Update"} client
						</Button>
					</div>
				</form>
			</Form>
		</>
	);
}

export { ManageClientForm };
