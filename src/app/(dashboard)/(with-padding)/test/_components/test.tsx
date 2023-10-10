"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { TimeInput } from "~/components/ui/time-input";

const RichTextEditor = dynamic(() => import("../../../../../components/ui/rich-text-editor/rich-text-editor"), {
	ssr: false,
	loading: () => (
		<div className="relative min-h-[150px] w-full rounded-md px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-input transition-colors focus-within:ring-inset focus-within:ring-ring" />
	),
});

function Test() {
	return (
		<>
			<div className="flex flex-col space-y-4 ">
				<div className="flex shrink-0 gap-4 pb-3 pt-6">
					{process.env.NODE_ENV === "development" && (
						<>
							<div className="flex flex-col justify-center gap-y-6">
								<Button>Button Text</Button>
								<Button variant="destructive">Button Text</Button>
								<Button variant="ghost">Button Text</Button>
								<Button variant="link">Button Text</Button>
								<Button variant="outline">Button Text</Button>
								<Button variant="secondary">Button Text</Button>
							</div>
							<div className="flex flex-col gap-y-6">
								<Input placeholder="Search..." />
								<TimeInput />
							</div>
							<div className="min-w-[400px]">
								<RichTextEditor />
							</div>
							<div className="flex flex-col gap-y-6">
								<Checkbox />
								<Checkbox checked />
							</div>
						</>
					)}
				</div>
			</div>
		</>
	);
}

export { Test };
