import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "~/components/page-header";
import { Test } from "./_components/test";

export const metadata: Metadata = {
	title: "Test Page | TKIT",
};

function TestPage() {
	if (process.env.NODE_ENV !== "development") {
		redirect("/calendar");
	}

	return (
		<>
			<PageHeader title="Test Page" back={{ href: "/" }} />
			{process.env.NODE_ENV === "development" && <Test />}
			{/* <div className="flex flex-col space-y-4 ">
				<div className="flex shrink-0 gap-4 pb-3 pt-6"></div>
			</div> */}
		</>
	);
}

export default TestPage;
