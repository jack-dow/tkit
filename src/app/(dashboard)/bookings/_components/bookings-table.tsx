"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type DateRange } from "react-day-picker";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { CalendarIcon, ChevronUpDownIcon } from "~/components/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { useToast } from "~/components/ui/use-toast";
import { useDayjs } from "~/hooks/use-dayjs";
import { api } from "~/lib/trpc/client";
import { cn, logInDevelopment, PaginationOptionsSchema, searchParamsToObject } from "~/lib/utils";
import { type RouterOutputs } from "~/server";
import { BOOKINGS_SORTABLE_COLUMNS } from "~/server/router/sortable-columns";
import { createBookingsTableColumns } from "./bookings-table-columns";

function BookingsTable({ initialData }: { initialData: RouterOutputs["app"]["bookings"]["all"] }) {
	const { dayjs } = useDayjs();
	const { toast } = useToast();

	const searchParams = useSearchParams();
	const validatedSearchParams = PaginationOptionsSchema.extend({
		from: z.string().optional().catch(undefined),
		to: z.string().optional().catch(undefined),
	}).parse(searchParamsToObject(searchParams));

	const result = api.app.bookings.all.useQuery(validatedSearchParams, { initialData });

	const deleteMutation = api.app.bookings.delete.useMutation();
	const [confirmBookingDelete, setConfirmBookingDelete] = React.useState<
		RouterOutputs["app"]["bookings"]["all"]["data"][number] | null
	>(null);

	// Remove bookings that were added to ensure timezones are correct
	if (searchParams.get("from") || searchParams.get("to")) {
		const startingLength = initialData.data.length;

		initialData.data = initialData.data.filter((booking) => {
			const from = searchParams.get("from") ? dayjs.tz(searchParams.get("from") as string).toDate() : undefined;
			const to = searchParams.get("to") ? dayjs.tz(searchParams.get("to") as string).toDate() : undefined;

			if (from && dayjs.tz(booking.date).isBefore(from)) {
				return false;
			}

			if (to && dayjs.tz(booking.date).isAfter(to)) {
				return false;
			}

			return true;
		});

		if (startingLength !== initialData.data.length) {
			initialData.pagination.count -= startingLength - initialData.data.length;
			initialData.pagination.maxPage = Math.ceil(initialData.pagination.count / initialData.pagination.limit);
		}
	}

	return (
		<>
			<DestructiveActionDialog
				name="booking"
				withoutTrigger
				open={!!confirmBookingDelete}
				onOpenChange={() => {
					setConfirmBookingDelete(null);
				}}
				onConfirm={async () => {
					if (confirmBookingDelete == null) return;

					try {
						await deleteMutation.mutateAsync({ id: confirmBookingDelete.id });

						toast({
							title: `Booking deleted`,
							description: `Successfully deleted booking`,
						});
					} catch (error) {
						logInDevelopment(error);

						toast({
							title: `Booking deletion failed`,
							description: `There was an error deleting the booking. Please try again.`,
							variant: "destructive",
						});
					}
				}}
			/>

			<DataTable
				columns={createBookingsTableColumns(dayjs, (booking) => {
					setConfirmBookingDelete(booking);
				})}
				sortableColumns={BOOKINGS_SORTABLE_COLUMNS}
				{...result.data}
				search={{
					component: DateRangeSearch,
				}}
			/>
		</>
	);
}

function DateRangeSearch({ setIsLoading }: { setIsLoading?: (isLoading: boolean) => void }) {
	const { dayjs } = useDayjs();
	const router = useRouter();

	const searchParams = useSearchParams();

	const [date, setDate] = React.useState<DateRange | undefined>({
		from: searchParams.get("from") ? dayjs.tz(searchParams.get("from") as string).toDate() : undefined,
		to: searchParams.get("to") ? dayjs.tz(searchParams.get("to") as string).toDate() : undefined,
	});

	return (
		<div className={cn("grid gap-2 w-full md:w-fit")}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						id="date"
						variant="outline"
						size="sm"
						className={cn("justify-start text-left font-normal flex-1 md:flex-none", !date && "text-muted-foreground")}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						<span className="mr-2 truncate xl:hidden">
							{date?.from ? (
								date.to ? (
									<>
										{dayjs.tz(date.from).format("MMM Do, YYYY")} - {dayjs.tz(date.to).format("MMM Do, YYYY")}
									</>
								) : (
									dayjs.tz(date.from).format("MMMM Do, YYYY")
								)
							) : (
								<>Select date</>
							)}
						</span>
						<span className="mr-2 hidden truncate xl:inline">
							{date?.from ? (
								date.to ? (
									<>
										{dayjs.tz(date.from).format("MMMM Do, YYYY")} - {dayjs.tz(date.to).format("MMMM Do, YYYY")}
									</>
								) : (
									dayjs.tz(date.from).format("MMMM Do, YYYY")
								)
							) : (
								<>Select date</>
							)}
						</span>
						<ChevronUpDownIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0">
					<Calendar
						initialFocus
						mode="range"
						defaultMonth={date?.from}
						selected={date}
						onSelect={(value) => {
							const newSearchParams = new URLSearchParams(searchParams);

							if (value?.from) {
								newSearchParams.set("from", dayjs.tz(value.from).format("YYYY-MM-DD"));
							} else {
								newSearchParams.delete("from");
							}

							if (value?.to) {
								newSearchParams.set("to", dayjs.tz(value.to).format("YYYY-MM-DD"));
							} else {
								newSearchParams.delete("to");
							}

							if (setIsLoading) {
								setIsLoading(true);
							}

							router.push(`/bookings?${newSearchParams.toString()}`);

							setDate(value);
						}}
						numberOfMonths={2}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}

export { BookingsTable };
