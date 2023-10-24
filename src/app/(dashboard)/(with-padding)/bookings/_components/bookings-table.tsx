"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type DateRange } from "react-day-picker";
import { z } from "zod";

import { BOOKING_TYPES_COLORS } from "~/components/manage-booking-types/booking-types-fields";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { CalendarIcon, ChevronUpDownIcon, EditIcon, EllipsisVerticalIcon, TrashIcon } from "~/components/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { useToast } from "~/components/ui/use-toast";
import { useDayjs } from "~/hooks/use-dayjs";
import { BOOKINGS_SORTABLE_COLUMNS } from "~/lib/sortable-columns";
import { api } from "~/lib/trpc/client";
import { cn, logInDevelopment, PaginationOptionsSchema, searchParamsToObject } from "~/lib/utils";
import { type RouterOutputs } from "~/server";

function BookingsTable({ initialData }: { initialData: RouterOutputs["app"]["bookings"]["all"] }) {
	const { dayjs } = useDayjs();
	const { toast } = useToast();

	const searchParams = useSearchParams();
	const validatedSearchParams = PaginationOptionsSchema.extend({
		from: z.string().optional().catch(undefined),
		to: z.string().optional().catch(undefined),
		sortDirection: PaginationOptionsSchema.shape.sortDirection.default("desc"),
	}).parse(searchParamsToObject(searchParams));

	const result = api.app.bookings.all.useQuery(validatedSearchParams, { initialData });

	const deleteMutation = api.app.bookings.delete.useMutation();
	const [confirmBookingDelete, setConfirmBookingDelete] = React.useState<
		RouterOutputs["app"]["bookings"]["all"]["data"][number] | null
	>(null);

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
				sortableColumns={BOOKINGS_SORTABLE_COLUMNS}
				{...result.data}
				search={{
					component: DateRangeSearch,
				}}
				columns={[
					{
						id: "bookingType",
						header: "Booking Type",
						cell: (row) => {
							const bookingType = row.bookingType;
							return (
								<div className="relative flex select-none space-x-2">
									<div
										className={cn(
											"w-4 h-4 rounded-full absolute mt-0.5 left-2 flex items-center justify-center",
											bookingType && bookingType?.color in BOOKING_TYPES_COLORS
												? BOOKING_TYPES_COLORS[bookingType.color as keyof typeof BOOKING_TYPES_COLORS]
												: "bg-sky-200",
										)}
									/>
									<span className="truncate pl-6 font-medium capitalize">{bookingType?.name ?? "Default Booking"}</span>
								</div>
							);
						},
					},
					{
						id: "dogsName",
						header: "Dog",
						cell: (row) => {
							const dog = row.dog;
							return (
								<div className="flex select-none space-x-2">
									<span className="truncate font-medium capitalize">
										{dog?.givenName} {dog?.familyName}
									</span>
								</div>
							);
						},
					},
					{
						id: "date",
						header: "Date",
						cell: (row) => {
							const date = dayjs.tz(row.date);
							const end = date.add(row.duration, "seconds");

							return (
								<div className="flex max-w-[500px] select-none items-center">
									<span className="truncate">
										{date.day() !== end.day() ? (
											<>
												{date.format("MMMM Do, YYYY")} - {end.format("MMMM Do, YYYY")}
											</>
										) : (
											<>{date.format("MMMM Do, YYYY")}</>
										)}
									</span>
								</div>
							);
						},
					},
					{
						id: "time",
						header: "Time",
						cell: (row) => {
							const date = dayjs.tz(row.date);
							const end = date.add(row.duration, "seconds");

							return (
								<div className="flex max-w-[500px] select-none items-center">
									<span className="truncate">
										{date.format("h:mm")} {date.format("a") !== end.format("a") ? date.format("a") : ""} -{" "}
										{end.format("h:mma")}
									</span>
								</div>
							);
						},
					},
					{
						id: "actions",
						header: "",
						cell: (row) => (
							<div className="flex justify-end">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
											<EllipsisVerticalIcon className="h-4 w-4" />
											<span className="sr-only">Open menu</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-[160px]">
										<DropdownMenuLabel>Actions</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem asChild>
											<Link href={`/bookings/${row.id}`} className="hover:cursor-pointer">
												<EditIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
												Edit
											</Link>
										</DropdownMenuItem>

										<DropdownMenuItem
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();

												setConfirmBookingDelete(row);
											}}
										>
											<TrashIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						),
					},
				]}
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
