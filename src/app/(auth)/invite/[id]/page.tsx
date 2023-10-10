import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { sql } from "drizzle-orm";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import TKITLogo from "~/assets/tkit-logo.svg";
import { drizzle } from "~/db/drizzle";
import { organizationInviteLinks } from "~/db/schema/auth";
import { server } from "~/lib/trpc/server";
import { InviteForm } from "./_components/invite-form";

export const metadata: Metadata = {
	title: "Create your account | TKIT",
};

async function InvitePage({ params }: { params: { id: string } }) {
	const response = await server.auth.organizations.inviteLinks.byId.query({ id: params.id });

	if (
		!response.data ||
		(response.data.maxUses && response.data.uses >= response.data.maxUses) ||
		response.data.createdAt.setSeconds(response.data.createdAt.getSeconds() + response.data.expiresAfter) <
			new Date().getTime()
	) {
		if (response.data) {
			if (
				(response.data.maxUses && response.data.uses >= response.data.maxUses) ||
				response.data.createdAt.setSeconds(response.data.createdAt.getSeconds() + response.data.expiresAfter) <
					new Date().getTime()
			) {
				await drizzle.delete(organizationInviteLinks).where(sql`BINARY ${organizationInviteLinks.id} = ${params.id}`);
			}
		}

		return (
			<Card className="w-full text-center sm:max-w-lg">
				<CardHeader className="space-y-1 pb-4">
					<Image
						src={TKITLogo as string}
						alt="Dogworx Logo (Gradient Version)"
						width={40}
						height={40}
						className="mx-auto pb-2"
					/>
					<CardTitle className="text-2xl">Invalid invite</CardTitle>
					<CardDescription>
						This invite has expired or is invalid. Please contact your organization owner for a new invite.
					</CardDescription>
				</CardHeader>

				<CardContent className="grid gap-4">
					<div className="text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link
							aria-label="Sign in"
							href="/sign-in"
							className="text-primary underline-offset-4 transition-colors hover:underline"
						>
							Sign in
						</Link>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full sm:max-w-lg">
			<CardHeader className="space-y-1 pb-4 text-center">
				<Image
					src={TKITLogo as string}
					alt="Dogworx Logo (Gradient Version)"
					width={40}
					height={40}
					className="mx-auto pb-2"
				/>
				<CardTitle className=" text-2xl">Welcome to TKIT</CardTitle>
				<CardDescription>
					Enter your details below to create your{" "}
					<span className="font-semibold">{response.data.organization.name}</span> account
				</CardDescription>
			</CardHeader>

			<CardContent className="grid gap-4">
				<InviteForm inviteLink={response.data} />

				<div className="text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link
						aria-label="Sign in"
						href="/sign-in"
						className="text-primary underline-offset-4 transition-colors hover:underline"
					>
						Sign in
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}

export default InvitePage;
