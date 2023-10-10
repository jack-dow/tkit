import { type Metadata } from "next";
import Image from "next/image";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import TKITLogo from "~/assets/tkit-logo.svg";
import { SignInForm } from "./_components/sign-in-form";

export const metadata: Metadata = {
	title: "Sign In | TKIT",
};

function SignInPage() {
	return (
		<Card className="w-full sm:max-w-lg">
			<CardHeader className="space-y-1 pb-4">
				<Image
					src={TKITLogo as string}
					alt="Dogworx Logo (Gradient Version)"
					width={40}
					height={40}
					className="mx-auto pb-2"
				/>
				<CardTitle className="text-2xl">Sign in</CardTitle>
				<CardDescription>Enter your email address to sign in to your account.</CardDescription>
			</CardHeader>

			<CardContent className="grid gap-4">
				<SignInForm />
			</CardContent>
		</Card>
	);
}

export default SignInPage;
