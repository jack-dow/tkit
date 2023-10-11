"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useFormContext } from "react-hook-form";

import { cn, parseDurationToSeconds, secondsToHumanReadable } from "~/lib/utils";
import { Checkbox } from "../ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";
import { type ManageBookingTypeFormSchema } from "./use-manage-booking-types-form";

const RichTextEditor = dynamic(() => import("../ui/rich-text-editor/rich-text-editor"), {
	ssr: false,
	loading: () => (
		<div className="relative min-h-[150px] w-full rounded-md px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-input transition-colors focus-within:ring-inset focus-within:ring-ring" />
	),
});

export const BOOKING_TYPES_COLORS = {
	gray: "bg-zinc-200",
	red: "bg-red-200",
	amber: "bg-amber-200",
	yellow: "bg-yellow-200",
	lime: "bg-lime-200",
	emerald: "bg-emerald-200",
	teal: "bg-teal-200",
	cyan: "bg-cyan-200",
	purple: "bg-purple-200",
	violet: "bg-violet-200",
	rose: "bg-rose-200",
};

function convertToNumber(input: string): number | null {
	// Step 1: Remove leading and trailing whitespace
	const trimmedInput = input.trim();

	// Step 2: Check if the string contains only digits and an optional decimal point
	const isNumeric = /^-?\d+(\.\d+)?$/.test(trimmedInput);

	if (!isNumeric) {
		return null; // Not a valid number
	}

	// Step 3: Convert the string to a number and return its absolute value
	const numericValue = parseFloat(trimmedInput);
	return Math.abs(numericValue);
}

function BookingTypeFields({}: { variant: "dialog" | "form" }) {
	const form = useFormContext<ManageBookingTypeFormSchema>();

	const [durationInputValue, setDurationInputValue] = React.useState(
		form.getValues("duration") ? secondsToHumanReadable(form.getValues("duration")) : "",
	);

	return (
		<>
			<div className="flex flex-col gap-y-4 md:flex-row md:space-x-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem className="w-full">
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input {...field} value={field.value ?? ""} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="color"
					render={({ field }) => (
						<FormItem className="w-full md:w-48">
							<FormLabel>Color</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger className={cn("relative", field.value && "pl-8")}>
										<SelectValue placeholder="Select color">
											<div
												className={cn(
													"w-4 h-4 rounded-full absolute mt-0.5 left-2 flex items-center justify-center",
													BOOKING_TYPES_COLORS[field.value as keyof typeof BOOKING_TYPES_COLORS],
												)}
											/>
											<span className="truncate  capitalize">{field.value}</span>
										</SelectValue>
									</SelectTrigger>
								</FormControl>
								<SelectContent align="end">
									<SelectGroup>
										<SelectLabel>Colors</SelectLabel>
										{Object.keys(BOOKING_TYPES_COLORS).map((color) => (
											<SelectItem key={color} value={color} className="pl-8 capitalize">
												<div
													className={cn(
														"w-4 h-4 rounded-full absolute mt-0.5 left-2 flex items-center justify-center",
														BOOKING_TYPES_COLORS[color as keyof typeof BOOKING_TYPES_COLORS],
													)}
												/>
												{color}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<FormField
				control={form.control}
				name="duration"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Duration</FormLabel>
						<FormControl>
							<Input
								autoComplete="off"
								value={durationInputValue}
								onChange={(e) => {
									setDurationInputValue(e.target.value);

									const value = convertToNumber(e.target.value) ?? e.target.value;

									if (value) {
										// If value is just a number, assume it is in minutes
										if (typeof value === "number") {
											field.onChange(value * 60, { shouldValidate: true });
										} else {
											// Otherwise see if it is a valid time
											let parsed = parseDurationToSeconds(value);

											if (parsed > 86400000) {
												parsed = 86400000;
											}

											// If it's a valid time, convert it to seconds and set it
											if (parsed) {
												field.onChange(parsed / 1000, { shouldValidate: true });
											}
										}
									}
								}}
								onBlur={() => {
									if (!durationInputValue) {
										field.onChange(undefined);
										return;
									}

									const duration = form.getValues("duration");

									if (duration) {
										setDurationInputValue(secondsToHumanReadable(duration));
										return;
									}

									setDurationInputValue("");
								}}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="space-y-2">
				<FormField
					control={form.control}
					name="details"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Default details</FormLabel>
							<FormControl>
								<RichTextEditor
									content={field.value ?? undefined}
									onValueChange={({ html, text }) => {
										if (text === "") {
											field.onChange(text);
										} else {
											field.onChange(html);
										}
									}}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="showDetailsInCalendar"
					render={({ field }) => (
						<FormItem className="flex items-center space-x-2 space-y-0">
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={(checked) => {
										field.onChange(checked);
									}}
								/>
							</FormControl>
							<FormLabel>Display details on calendar</FormLabel>
						</FormItem>
					)}
				/>
			</div>
		</>
	);
}

export { BookingTypeFields };
