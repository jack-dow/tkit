"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TRPCError } from "@trpc/server";

import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { useZodForm } from "~/hooks/use-zod-form";
import { api } from "~/lib/trpc/client";
import { SignInSchema } from "~/lib/utils";

function SignInForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { toast } = useToast();

	const form = useZodForm({
		schema: SignInSchema,
		defaultValues: {
			emailAddress: "",
		},
	});

	const sendMagicLinkMutation = api.auth.signIn.magicLink.send.useMutation();

	const from = searchParams.get("from");
	const reference = searchParams.get("ref");

	async function onSubmit(data: SignInSchema) {
		if (process.env.NODE_ENV === "development" || data.emailAddress.toLowerCase() === "test@dogworx.com.au") {
			router.push(
				`/verification-code?emailAddress=${encodeURIComponent(data.emailAddress)}${
					from ? `&from=${encodeURIComponent(from)}` : ""
				}`,
			);
			return;
		}

		try {
			await sendMagicLinkMutation.mutateAsync({ emailAddress: data.emailAddress });

			router.push(
				`/verification-code?emailAddress=${encodeURIComponent(data.emailAddress)}${
					from ? `&from=${encodeURIComponent(from)}` : ""
				}`,
			);
			toast({
				title: "Verification code sent",
				description: "Please check your email for the code and magic link.",
			});
		} catch (error) {
			if (error instanceof TRPCError) {
				if (error.code === "NOT_FOUND") {
					form.setError("emailAddress", {
						type: "manual",
						message: "Account not found",
					});
					toast({
						title: "Unknown email address",
						description: "We couldn't find a user with that email address. Please try again.",
						variant: "destructive",
					});
					return;
				}
			}
			toast({
				title: "Something went wrong",
				description: "An unknown error ocurred and your sign in request failed. Please try again.",
				variant: "destructive",
			});
		}
	}

	React.useEffect(() => {
		if (reference === "magic-link") {
			// HACK: If it is not wrapped in a setTimeout it will not render
			setTimeout(() => {
				toast({
					title: "Invalid or expired magic link",
					description: "Please sign in again to get a new magic link.",
					variant: "destructive",
				});
			}, 0);
			router.replace("/sign-in");
		}
	}, [reference, router, toast]);

	return (
		<Form {...form}>
			<form className="grid gap-4" onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}>
				<FormField
					control={form.control}
					name="emailAddress"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" disabled={form.formState.isSubmitting}>
					{form.formState.isSubmitting && <Loader aria-hidden="true" size="sm" />}
					Continue
				</Button>
			</form>
		</Form>
	);
}

export { SignInForm };
