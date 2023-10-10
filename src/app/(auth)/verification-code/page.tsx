import { type Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { z } from "zod";

import TKITLogo from "~/assets/tkit-logo.svg";
import { type SearchParams } from "~/lib/utils";
import { AuthVerificationCodeInput } from "./_components/auth-verification-code-input";

export const metadata: Metadata = {
	title: "Sign In | TKIT",
};

const SearchParamsSchema = z.object({
	emailAddress: z.string().email().optional().catch(undefined),
	from: z.string().optional().catch(undefined),
});

function VerificationCodePage(props: { searchParams?: SearchParams }) {
	const searchParams = SearchParamsSchema.parse(props.searchParams);

	if (!searchParams?.emailAddress) {
		redirect("/sign-in");
	}

	return (
		<div className="flex w-full flex-col items-center justify-center gap-y-6 sm:w-full sm:max-w-md">
			<div className="flex flex-col gap-y-2 text-center">
				<Image
					src={TKITLogo as string}
					alt="Dogworx Logo (Gradient Version)"
					width={40}
					height={40}
					className="mx-auto"
				/>

				<h1 className="text-2xl font-semibold tracking-tight">Verify your email address</h1>
				<div className="flex flex-col gap-y-1">
					<p className="text-sm text-muted-foreground">
						We&apos;ve sent a verification code to <span className="font-medium">{searchParams.emailAddress}</span>.{" "}
					</p>
					<p className="text-sm text-muted-foreground">Enter the code below to verify your email address.</p>
				</div>
			</div>

			<AuthVerificationCodeInput />
		</div>
	);
}

export default VerificationCodePage;
