import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { sql } from "drizzle-orm";

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
			<div className="mx-auto flex w-full flex-col items-center justify-center space-y-6 sm:w-full sm:max-w-md">
				<div className="flex flex-col space-y-2 text-center">
					<Image
						src={TKITLogo as string}
						alt="Dogworx Logo (Gradient Version)"
						width={40}
						height={40}
						className="mx-auto"
					/>

					<h1 className="text-2xl font-semibold tracking-tight">Invalid invite</h1>
					<p className="text-sm text-muted-foreground">
						This invite may have expired or is invalid. Please contact your organization owner for a new invite.
					</p>
				</div>

				<div className="mx-auto text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link
						aria-label="Sign in"
						href="/sign-in"
						className="text-primary underline-offset-4 transition-colors hover:underline"
					>
						Sign in
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto flex w-full flex-col items-center justify-center space-y-6 sm:w-full sm:max-w-md">
			<div className="flex flex-col space-y-2 text-center">
				<Image
					src={TKITLogo as string}
					alt="Dogworx Logo (Gradient Version)"
					width={40}
					height={40}
					className="mx-auto"
				/>

				<h1 className="text-2xl font-semibold tracking-tight">Welcome to TKIT</h1>
				<p className="text-sm text-muted-foreground">
					Enter your details below to create your
					<br />
					<span className="font-semibold">{response.data.organization.name}</span> account
				</p>
			</div>

			<InviteForm inviteLink={response.data} />

			<div className="mx-auto text-center text-sm text-muted-foreground">
				Already have an account?{" "}
				<Link
					aria-label="Sign in"
					href="/sign-in"
					className="text-primary underline-offset-4 transition-colors hover:underline"
				>
					Sign in
				</Link>
			</div>
		</div>
	);
}

export default InvitePage;
