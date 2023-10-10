import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DarkDesktopSidebar } from "~/components/desktop-sidebar";
import { MobileNavigation } from "~/components/mobile-navigation";
import { UpdateTimezoneDialog } from "~/components/update-timezone-dialog";
import { server } from "~/lib/trpc/server";
import { SessionProvider } from "../providers";

interface DashboardLayoutProps {
	children: React.ReactNode;
}

async function DashboardLayout({ children }: DashboardLayoutProps) {
	const { data: session } = await server.auth.user.sessions.current.query();

	if (!session) {
		redirect("/sign-in");
	}

	const cookieStore = cookies();
	const timezoneDialogCookie = cookieStore.get("__timezone-dialog")?.value ?? "0";

	return (
		<SessionProvider session={session}>
			<UpdateTimezoneDialog timezoneDialogCookie={timezoneDialogCookie} />
			<MobileNavigation />
			<DarkDesktopSidebar />
			<main className="flex flex-1 flex-col lg:pl-72">
				<div className="flex flex-1 flex-col lg:border-l lg:border-zinc-50 lg:shadow">{children}</div>
			</main>
		</SessionProvider>
	);
}

export default DashboardLayout;
