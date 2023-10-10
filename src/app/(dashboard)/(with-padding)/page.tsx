import { type Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Dashboard | TKIT",
};

function RootPage() {
	if (process.env.NODE_ENV !== "development") {
		redirect("/calendar");
	} else {
		redirect("/test");
	}
}

export default RootPage;
