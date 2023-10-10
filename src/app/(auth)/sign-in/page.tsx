import { type Metadata } from "next";
import Image from "next/image";

import TKITLogo from "~/assets/tkit-logo.svg";
import { SignInForm } from "./_components/sign-in-form";

export const metadata: Metadata = {
	title: "Sign In | TKIT",
};

function SignInPage() {
	return (
		<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
			<div className="flex flex-col space-y-2 text-center">
				<Image
					src={TKITLogo as string}
					alt="Dogworx Logo (Gradient Version)"
					width={40}
					height={40}
					className="mx-auto"
				/>

				<h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
				<p className="text-sm text-muted-foreground">Enter your email to sign in to your account</p>
			</div>

			<SignInForm />
		</div>
	);
}

export default SignInPage;
