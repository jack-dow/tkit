"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TRPCError } from "@trpc/server";

import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { useZodForm } from "~/hooks/use-zod-form";
import { api } from "~/lib/trpc/client";
import { SignUpSchema } from "~/lib/utils";
import { type RouterOutputs } from "~/server";

function InviteForm({
	inviteLink,
}: {
	inviteLink: NonNullable<RouterOutputs["auth"]["organizations"]["inviteLinks"]["byId"]["data"]>;
}) {
	const { toast } = useToast();
	const router = useRouter();

	const form = useZodForm({
		schema: SignUpSchema,
		defaultValues: {
			givenName: "",
			familyName: "",
			emailAddress: "",
		},
	});

	const signUpMutation = api.auth.user.create.useMutation();
	const sendMagicLinkMutation = api.auth.signIn.magicLink.send.useMutation();

	async function onSubmit(data: SignUpSchema) {
		if (form.formState.errors.emailAddress) {
			form.setError("emailAddress", {
				type: "manual",
				message: form.formState.errors.emailAddress.message,
			});

			return;
		}

		try {
			await signUpMutation.mutateAsync({
				inviteLinkId: inviteLink.id,
				user: data,
			});

			await sendMagicLinkMutation.mutateAsync({
				emailAddress: data.emailAddress,
			});

			router.push(`/verification-code?emailAddress=${encodeURIComponent(data.emailAddress)}`);

			toast({
				title: "Verification code sent",
				description: "Please check your email for the code and magic link.",
			});
		} catch (error) {
			if (error instanceof TRPCError) {
				if (error.code === "CONFLICT") {
					form.setError("emailAddress", {
						type: "manual",
						message: "Email already in use",
					});
					toast({
						title: "Email already in use",
						description: "This email is already in use. Please try again.",
						variant: "destructive",
					});
					return;
				} else if (error.code === "BAD_REQUEST") {
					toast({
						title: "Something went wrong",
						description: error.message,
						variant: "destructive",
					});
					return;
				}
			}
			toast({
				title: `An unknown error occurred`,
				description: "An unknown error ocurred, please try again.",
				variant: "destructive",
			});
		}
	}

	return (
		<>
			<Form {...form}>
				<form
					className="grid grid-cols-2 gap-4"
					onSubmit={(e) => {
						e.stopPropagation();
						e.preventDefault();

						void form.handleSubmit(onSubmit)(e);
					}}
				>
					<FormField
						control={form.control}
						name="givenName"
						render={({ field }) => (
							<FormItem className="col-span-1">
								<FormLabel>First Name</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="familyName"
						render={({ field }) => (
							<FormItem className="col-span-1">
								<div className="flex items-center justify-between">
									<FormLabel>Last Name</FormLabel>
									<span className="text-[0.8rem] text-muted-foreground">Optional</span>
								</div>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="emailAddress"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button type="submit" disabled={form.formState.isSubmitting} className="col-span-2">
						{form.formState.isSubmitting && <Loader size="sm" aria-hidden="true" />}
						Continue
						<span className="sr-only">Continue to email verification page</span>
					</Button>
				</form>
			</Form>
		</>
	);
}

export { InviteForm };
