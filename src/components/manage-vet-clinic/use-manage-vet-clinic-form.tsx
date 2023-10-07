"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";

import { useToast } from "~/components/ui/use-toast";
import { InsertVetClinicSchema } from "~/db/validation/app";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { useZodForm } from "~/hooks/use-zod-form";
import { api } from "~/lib/trpc/client";
import { EmailOrPhoneNumberSchema, generateId, hasTrueValue, logInDevelopment } from "~/lib/utils";
import { type RouterOutputs } from "~/server";

const ManageVetClinicFormSchema = z.intersection(
	InsertVetClinicSchema.extend({
		name: z.string().min(1, { message: "Required" }).max(50),
		notes: z.string().max(100000).nullish(),
	}),
	EmailOrPhoneNumberSchema,
);
type ManageVetClinicFormSchema = z.infer<typeof ManageVetClinicFormSchema>;

type UseManageVetClinicFormProps = {
	vetClinic?: RouterOutputs["app"]["vetClinics"]["byId"]["data"];
	defaultValues?: Partial<ManageVetClinicFormSchema>;
	onSubmit?: (data: ManageVetClinicFormSchema) => Promise<void>;
	onSuccessfulSubmit?: (data: ManageVetClinicFormSchema) => void;
};

function useManageVetClinicForm(props: UseManageVetClinicFormProps) {
	const isNew = !props.vetClinic;

	const router = useRouter();
	const searchParams = useSearchParams();

	const { toast } = useToast();

	const searchTerm = searchParams.get("searchTerm") ?? "";

	const result = api.app.vetClinics.byId.useQuery(
		{ id: props.vetClinic?.id ?? "new" },
		{ initialData: { data: props.vetClinic }, enabled: !isNew },
	);
	const vetClinic = result.data?.data;

	const form = useZodForm({
		schema: ManageVetClinicFormSchema,
		defaultValues: {
			name: searchTerm,
			vetToVetClinicRelationships: [],
			...props.defaultValues,
			...vetClinic,
			id: vetClinic?.id ?? generateId(),
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	const insertMutation = api.app.vetClinics.insert.useMutation();
	const updateMutation = api.app.vetClinics.update.useMutation();

	React.useEffect(() => {
		if (searchParams.get("searchTerm")) {
			router.replace("/vet-clinics/new");
		}
	}, [searchParams, router]);

	React.useEffect(() => {
		if (vetClinic) {
			form.reset(vetClinic, {
				keepValues: true,
				keepDirty: true,
			});
		}
	}, [vetClinic, form]);

	function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		e.stopPropagation();

		void form.handleSubmit(async (data) => {
			try {
				if (props.onSubmit) {
					await props.onSubmit(data);
				} else if (isNew) {
					await insertMutation.mutateAsync(data);
				} else {
					await updateMutation.mutateAsync(data);
				}

				toast({
					title: `Vet ${isNew ? "Created" : "Updated"}`,
					description: `Successfully ${isNew ? "created" : "updated"} vet clinic "${data.name}".`,
				});
				props.onSuccessfulSubmit?.(data);
			} catch (error) {
				logInDevelopment(error);

				toast({
					title: `Vet ${isNew ? "Creation" : "Update"} Failed`,
					description: `There was an error ${isNew ? "creating" : "updating"} vet clinic "${
						data.name
					}". Please try again.`,
					variant: "destructive",
				});
			}
		})(e);
	}

	return { form, onSubmit };
}

export { type ManageVetClinicFormSchema, type UseManageVetClinicFormProps, useManageVetClinicForm };
