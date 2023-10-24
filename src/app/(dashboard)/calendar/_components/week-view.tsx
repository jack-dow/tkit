"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { type BOOKING_TYPES_COLORS } from "~/components/manage-booking-types/booking-types-fields";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
	CalendarDaysIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	DogIcon,
	EditIcon,
	FunnelOutlineIcon,
} from "~/components/ui/icons";
import { Label } from "~/components/ui/label";
import { Loader } from "~/components/ui/loader";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { useUser } from "~/app/providers";
import { useDayjs, type Dayjs, type DayjsDate } from "~/hooks/use-dayjs";
import { useDidUpdate } from "~/hooks/use-did-update";
import { api } from "~/lib/trpc/client";
import { cn, secondsToHumanReadable, setSearchParams } from "~/lib/utils";
import { type RouterOutputs } from "~/server";

const DynamicManageBookingDialog = dynamic(
	() => import("../../../../components/manage-booking/manage-booking-dialog"),
	{ ssr: false },
);

type BookingsByWeek = RouterOutputs["app"]["bookings"]["byWeek"]["data"];
type Booking = BookingsByWeek[number];

function areBookingsOverlapping(dayjs: Dayjs, booking1: Booking, booking2: Booking): boolean {
	const start1 = dayjs.tz(booking1.date);
	const end1 = start1.add(booking1.duration, "second");

	const start2 = dayjs.tz(booking2.date).add(1, "second");
	const end2 = start2.add(booking2.duration, "second");

	// end_date2 >= start_date1 and end_date1 > start_date2 - SEE: https://blog.widefix.com/date-ranges-overlap/
	// Don't wnt to check end_date 1 >= start_date2 as that wouldn't allow bookings to be back to back
	if (end2.isSameOrAfter(start1) && end1.isAfter(start2)) {
		return true;
	}

	return false;
}

function groupOverlappingBookings(dayjs: Dayjs, bookings: Booking[]) {
	const groups: Record<string, { booking: Booking; overlaps: Set<string> }> = {};

	for (let i = 0; i < bookings.length; i++) {
		const currentBooking = bookings[i];

		if (!currentBooking) {
			continue;
		}

		if (!groups[currentBooking.id]) {
			groups[currentBooking.id] = {
				booking: currentBooking,
				overlaps: new Set(),
			};
		}

		groups[currentBooking.id]!.overlaps.add(currentBooking.id);

		for (let j = i + 1; j < bookings.length; j++) {
			const otherBooking = bookings[j];

			if (!otherBooking) {
				continue;
			}

			if (areBookingsOverlapping(dayjs, currentBooking, otherBooking)) {
				groups[currentBooking.id]!.overlaps.add(otherBooking.id);

				if (!groups[otherBooking.id]) {
					groups[otherBooking.id] = {
						booking: otherBooking,
						overlaps: new Set(),
					};
				}

				groups[otherBooking.id]!.overlaps.add(currentBooking.id);
			}
		}
	}

	return groups;
}

const colStartClasses = [
	"sm:col-start-1",
	"sm:col-start-2",
	"sm:col-start-3",
	"sm:col-start-4",
	"sm:col-start-5",
	"sm:col-start-6",
	"sm:col-start-7",
];

const bookingCardColors = {
	gray: { card: "border-zinc-200 bg-zinc-50 hover:bg-zinc-100", text: "text-zinc-700" },
	red: { card: "border-red-200 bg-red-50 hover:bg-red-100", text: "text-red-700" },
	amber: { card: "border-amber-200 bg-amber-50 hover:bg-amber-100", text: "text-amber-700" },
	yellow: { card: "border-yellow-200 bg-yellow-50 hover:bg-yellow-100", text: "text-yellow-700" },
	lime: { card: "border-lime-200 bg-lime-50 hover:bg-lime-100", text: "text-lime-700" },
	emerald: { card: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100", text: "text-emerald-700" },
	teal: { card: "border-teal-200 bg-teal-50 hover:bg-teal-100", text: "text-teal-700" },
	cyan: { card: "border-cyan-200 bg-cyan-50 hover:bg-cyan-100", text: "text-cyan-700" },
	purple: { card: "border-purple-200 bg-purple-50 hover:bg-purple-100", text: "text-purple-700" },
	violet: { card: "border-violet-200 bg-violet-50 hover:bg-violet-100", text: "text-violet-700" },
	rose: { card: "border-rose-200 bg-rose-50 hover:bg-rose-100", text: "text-rose-700" },
} satisfies Record<keyof typeof BOOKING_TYPES_COLORS, { card: string; text: string }>;

function WeekView({
	date: _date,
	initialData,
	bookingTypes,
	organization: _organization,
}: {
	date?: string;
	initialData: RouterOutputs["app"]["bookings"]["byWeek"];
	bookingTypes: RouterOutputs["app"]["bookingTypes"]["all"]["data"];
	organization: RouterOutputs["auth"]["user"]["organization"]["current"];
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { toast } = useToast();
	const { dayjs } = useDayjs();
	const user = useUser();

	const {
		data: { data: organization },
	} = api.auth.user.organization.current.useQuery(undefined, {
		initialData: _organization,
	});

	const assignedToId = searchParams.get("assignedTo") ?? user.id;
	const assignedTo = organization.organizationUsers.find((u) => u.id === assignedToId) ?? null;

	const {
		data: { data: bookings },
	} = api.app.bookings.byWeek.useQuery({ date: _date, assignedToId }, { initialData });

	const containerRef = React.useRef<HTMLDivElement>(null);
	const containerNavRef = React.useRef<HTMLDivElement>(null);
	const containerOffsetRef = React.useRef<HTMLDivElement>(null);
	const calendarRef = React.useRef<HTMLOListElement>(null);

	let startDate = dayjs.tz(_date).startOf("day");
	if (!startDate.isValid()) {
		startDate = dayjs.tz().startOf("day");
	}
	const endDate = startDate.add(6, "days").endOf("day");

	const prevWeek = startDate.subtract(7, "days");
	const nextWeek = startDate.add(7, "days");

	// Visible day on mobile device
	const [visibleDate, setVisibleDate] = React.useState(startDate.date());

	const [isManageBookingDialogOpen, setIsManageBookingDialogOpen] = React.useState(false);
	const [selectedBooking, setSelectedBooking] = React.useState<BookingsByWeek[number] | undefined>(undefined);
	const [lastSelectedDate, setLastSelectedDate] = React.useState<DayjsDate | undefined>(undefined);

	const [isLoading, setIsLoading] = React.useState(false);

	const [isPreviewCardOpen, setIsPreviewCardOpen] = React.useState(false);

	React.useEffect(() => {
		// Set the container scroll position based on the current time.
		const currentMinute = new Date().getHours() * 60;
		if (containerRef.current && containerNavRef.current && containerOffsetRef.current) {
			containerRef.current.scrollTop =
				((containerRef.current.scrollHeight -
					containerNavRef.current.offsetHeight -
					containerOffsetRef.current.offsetHeight) *
					currentMinute) /
				1440;
		}
	}, []);

	React.useEffect(() => {
		if (bookings === null) {
			// HACK: If it is not wrapped in a setTimeout it will not render
			setTimeout(() => {
				toast({
					title: "Failed to fetch bookings",
					description: "An unknown error occurred while fetching bookings for this week. Please try again later.",
					variant: "destructive",
				});
			}, 0);
		}
	}, [bookings, toast]);

	useDidUpdate(() => {
		if (isLoading) {
			setIsLoading(false);
			setVisibleDate(startDate.date());
		}
	}, [searchParams]);

	const sortedBookings: Booking[] = [];

	if (bookings) {
		for (const booking of bookings) {
			const date = dayjs.tz(booking.date);

			if (date.isBefore(startDate) || date.isAfter(endDate)) {
				continue;
			}

			if (date.date() !== date.add(booking.duration, "seconds").date()) {
				// Split booking into two bookings - one for the first day and one for the second day
				sortedBookings.push({
					...booking,
					// +1 because technically end of day is 11:59:59
					duration: date.endOf("day").diff(date, "seconds") + 1,
				});

				sortedBookings.push({
					...booking,
					id: `${booking.id}-1`,
					date: date.endOf("day").add(1, "second").toDate(),
					duration: date.add(booking.duration, "seconds").diff(date.endOf("day"), "seconds"),
				});
			} else {
				sortedBookings.push(booking);
			}
		}
	}

	return (
		<div className="max-h-screen overflow-hidden">
			<header className="flex flex-none justify-between gap-x-4 gap-y-3 px-4 py-2 sm:flex-row sm:items-center sm:p-4">
				<div className="flex flex-1 items-center justify-between gap-x-3 sm:flex-none">
					<h1 className="text-xl font-semibold leading-6 text-gray-900 md:text-2xl">
						{startDate.format("MMMM")}{" "}
						{startDate.year() !== endDate.year() && <span className="font-normal">{startDate.format("YYYY")}</span>}
						{startDate.month() !== endDate.month() && (
							<>
								<span className="font-normal"> - </span>
								{endDate.format("MMMM")}{" "}
							</>
						)}
						<span className="font-normal">{endDate.format("YYYY")}</span>
					</h1>
					<Separator orientation="vertical" className="hidden h-6 sm:block" />

					<Popover>
						<PopoverTrigger asChild>
							<Button size="icon" variant="outline">
								<span className="sr-only">Open day select calendar</span>
								<CalendarDaysIcon className="h-5 w-5" aria-hidden="true" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="center">
							<Calendar
								mode="single"
								selected={startDate.toDate()}
								onSelect={(value) => {
									setIsLoading(true);
									router.push(
										`/calendar?${setSearchParams(searchParams, {
											date: dayjs.tz(value).format("YYYY-MM-DD"),
										}).toString()}`,
									);
								}}
								defaultMonth={startDate.toDate()}
								initialFocus
							/>
						</PopoverContent>
					</Popover>
				</div>

				<div className="flex items-center justify-between gap-x-3 md:gap-x-5">
					<div className="hidden items-center gap-x-1.5 sm:flex">
						{isLoading && <Loader variant="black" size="sm" />}

						{
							// If today is not in the current week
							!(dayjs.tz().isSameOrAfter(startDate, "day") && dayjs.tz().isSameOrBefore(endDate, "day")) && (
								<Button variant="outline" asChild onClick={() => setIsLoading(true)}>
									<Link
										href={`/calendar?${setSearchParams(searchParams, {
											date: undefined,
										}).toString()}`}
									>
										Today
									</Link>
								</Button>
							)
						}

						<Button size="icon" variant="ghost" asChild onClick={() => setIsLoading(true)}>
							<Link
								href={`/calendar?${setSearchParams(searchParams, {
									date: `${prevWeek.year()}-${prevWeek.month() + 1}-${prevWeek.date()}`,
								}).toString()}`}
							>
								<span className="sr-only">Previous week</span>
								<ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
							</Link>
						</Button>
						<span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden" />
						<Button size="icon" variant="ghost" asChild onClick={() => setIsLoading(true)}>
							<Link
								href={`/calendar?${setSearchParams(searchParams, {
									date: `${nextWeek.year()}-${nextWeek.month() + 1}-${nextWeek.date()}`,
								}).toString()}`}
							>
								<span className="sr-only">Next week</span>
								<ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
							</Link>
						</Button>
					</div>

					<Separator orientation="vertical" className="h-6" />

					<Select value={assignedToId}>
						<SelectTrigger className="flex h-8 w-auto gap-1 space-x-0 bg-white text-xs">
							<span className="hidden md:inline">
								{assignedTo ? (
									<>
										{assignedTo.givenName} {assignedTo.familyName}
									</>
								) : (
									"User not found"
								)}
							</span>
							<span className="md:hidden">
								<FunnelOutlineIcon className="h-4 w-4" />
							</span>
						</SelectTrigger>
						<SelectContent className="pointer-events-none w-44" align="start">
							<SelectGroup className={cn("space-y-2")}>
								{organization.organizationUsers.map((user) => (
									<SelectItem
										key={user.id}
										value={user.id}
										onClick={() => {
											if (user.id !== assignedToId) {
												setIsLoading(true);
												router.push(`/calendar?${setSearchParams(searchParams, { assignedTo: user.id }).toString()}`);
											}
										}}
									>
										<div className="flex items-center gap-2">
											<div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-[10px]">
												{user.profileImageUrl ? (
													<Image
														src={user.profileImageUrl}
														alt="User's profile image"
														width={128}
														height={128}
														className="aspect-square rounded-full object-cover"
													/>
												) : (
													<>
														{user.givenName[0]}
														{user.familyName?.[0]}
													</>
												)}
											</div>
											<span className="truncate">
												{user.givenName} {user.familyName}
											</span>
										</div>
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
			</header>
			<div
				ref={containerRef}
				className="isolate flex max-h-[calc(100vh-68px)] flex-auto flex-col overflow-auto border bg-white"
			>
				<div style={{ width: "165%" }} className="flex max-w-full flex-none flex-col sm:max-w-none lg:max-w-full">
					<div
						ref={containerNavRef}
						className="sticky top-0 z-30 flex-none bg-white shadow ring-1 ring-black/5  sm:pr-8"
					>
						<div className="m-1 grid grid-cols-7 text-sm leading-6 text-gray-500 sm:-mr-px sm:divide-x sm:divide-gray-100 sm:border-r sm:border-gray-100 ">
							{new Array(7).fill(undefined).map((_, index) => {
								const date = startDate.add(index, "day");
								return (
									<button
										key={date.date()}
										type="button"
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											setVisibleDate(date.date());
										}}
										className={cn(
											"sm:hidden flex flex-col items-center p-0.5 leading-snug rounded-md focus-visible:relative focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
											date.date() === visibleDate && "bg-primary text-primary-foreground ",
										)}
									>
										{date.format("dd")}
										<span
											className={cn(
												"flex items-center justify-center font-semibold",
												date.date() === visibleDate ? "text-white" : "text-primary",
											)}
										>
											{date.date()}
										</span>
									</button>
								);
							})}
							<div className="col-end-1 hidden w-14 sm:block" />
							{new Array(7).fill(undefined).map((_, index) => {
								const date = startDate.add(index, "day");
								return (
									<div key={date.date()} className="hidden items-center justify-center py-1 sm:flex">
										<span
											className={cn(
												date.isToday() ? "bg-primary text-primary-foreground rounded-md text-center px-3 py-1" : "",
											)}
										>
											{date.format("ddd")}{" "}
											<span
												className={cn(
													"items-center justify-center font-semibold",
													date.isToday() ? "text-white" : "text-primary",
												)}
											>
												{date.date()}
											</span>
										</span>
									</div>
								);
							})}
						</div>
					</div>
					<div className="flex flex-auto">
						<div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
						<div className="grid flex-auto grid-cols-1 grid-rows-1">
							{/* Horizontal lines */}
							<div
								className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
								style={{ gridTemplateRows: "repeat(48, minmax(1rem, 1fr))" }}
							>
								<div ref={containerOffsetRef} className="row-end-1 h-7" />

								{[
									"12AM",
									"1AM",
									"2AM",
									"3AM",
									"4AM",
									"5AM",
									"6AM",
									"7AM",
									"8AM",
									"9AM",
									"10AM",
									"11AM",
									"12PM",
									"1PM",
									"2PM",
									"3PM",
									"4PM",
									"5PM",
									"6PM",
									"7PM",
									"8PM",
									"9PM",
									"10PM",
									"11PM",
								].map((time) => (
									<React.Fragment key={time}>
										<div>
											<div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
												{time}
											</div>
										</div>
										<div />
									</React.Fragment>
								))}
							</div>

							{/* Vertical lines */}
							<div className="col-start-1 col-end-2 row-start-1 hidden grid-cols-7 grid-rows-1 divide-x divide-gray-100 sm:grid sm:grid-cols-7">
								<div className="col-start-1 row-span-full" />
								<div className="col-start-2 row-span-full" />
								<div className="col-start-3 row-span-full" />
								<div className="col-start-4 row-span-full" />
								<div className="col-start-5 row-span-full" />
								<div className="col-start-6 row-span-full" />
								<div className="col-start-7 row-span-full" />
								<div className="col-start-8 row-span-full w-8" />
							</div>

							<DynamicManageBookingDialog
								withoutTrigger
								open={isManageBookingDialogOpen}
								setOpen={(value) => {
									setIsManageBookingDialogOpen(value);

									if (!value) {
										setTimeout(() => {
											setLastSelectedDate(undefined);
											setSelectedBooking(undefined);
										}, 205);
									}
								}}
								booking={selectedBooking}
								defaultValues={
									lastSelectedDate
										? {
												date: lastSelectedDate?.toDate(),
										  }
										: undefined
								}
								bookingTypes={bookingTypes}
							/>

							{/* Events */}
							<ol
								className="col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:grid-cols-7 sm:pr-8"
								style={{ gridTemplateRows: "1.75rem repeat(288, minmax(0, 0.5rem)) auto" }}
								ref={calendarRef}
								onClick={(event) => {
									if (isPreviewCardOpen) {
										return;
									}

									const div = event.currentTarget;
									const rect = div.getBoundingClientRect();

									const offsetX = event.clientX - rect.left;
									const offsetY = event.clientY - rect.top - 16;

									if (offsetY < 0) {
										return;
									}

									const halfHourHeight = Math.ceil((rect.height - 32) / 48);

									const day = Math.floor(offsetX / ((rect.width - 32) / 7));
									const halfHourClicked = Math.floor(offsetY / halfHourHeight);
									const date = startDate
										.startOf("day")
										.add(day, "day")
										.add(halfHourClicked * 30, "minutes");

									setIsManageBookingDialogOpen(true);
									setLastSelectedDate(date);
								}}
							>
								<li
									className="relative col-span-full flex w-full items-center"
									style={{
										gridRow: `${Math.floor(
											(288 / 24) * (dayjs.tz().get("hours") + dayjs.tz().get("minutes") / 60) + 2,
										)} / span ${1}`,
									}}
								>
									<div className="absolute left-[-51.5px] z-30 text-right text-xs leading-5 text-gray-400">
										{dayjs.tz().format("h:mmA")}
									</div>
									<Separator className=" h-full w-px bg-primary pl-[2px]" />
									<Separator orientation="horizontal" className="bg-primary" />
								</li>
								{Object.values(groupOverlappingBookings(dayjs, sortedBookings)).map(({ booking, overlaps }) => {
									const index = Array.from(overlaps).indexOf(booking.id);

									const bookingStart = dayjs.tz(booking.date);
									// Convert time to fraction. e.g. 10:30 AM => 10.5
									const time = bookingStart.hour() + bookingStart.minute() / 60;

									const bookingType = bookingTypes.find((bookingType) => bookingType.id === booking.bookingTypeId);
									const colors =
										bookingType && bookingType?.color in bookingCardColors
											? bookingCardColors[bookingType.color as keyof typeof bookingCardColors]
											: { card: "border-sky-200 bg-sky-50 hover:bg-sky-100", text: "text-sky-700" };

									const gridRowSpan = Math.floor((booking.duration / 60) * 0.2) || 1;

									return (
										<li
											key={booking.id}
											className={cn(
												bookingStart.date() === visibleDate ? "flex" : "hidden",
												"relative mt-px sm:flex col-start-1",
												colStartClasses.at(bookingStart.diff(startDate, "day")),
											)}
											style={{
												gridRow: `${Math.floor((288 / 24) * time + 2)}`,
												gridRowEnd: `span ${gridRowSpan < 5 ? 5 : gridRowSpan}`,
												width:
													overlaps.size > 1
														? index === 0
															? overlaps.size === 2
																? "75%"
																: `calc(${(100 / overlaps.size) * (overlaps.size - 1)}% - 18px)`
															: index === 1
															? `calc(50% - 18px)`
															: `calc(${100 / overlaps.size}% + ${18 * (index || 1)}px)`
														: undefined,
												marginLeft:
													index === 1
														? `${100 / overlaps.size}%`
														: index > 1
														? `calc(${(100 / overlaps.size) * index}% - ${18 * index}px)`
														: undefined,
											}}
										>
											<BookingPopover
												booking={booking}
												onEditClick={(booking) => {
													setIsManageBookingDialogOpen(true);
													setSelectedBooking(booking);
												}}
												setIsPreviewCardOpen={setIsPreviewCardOpen}
												trigger={
													<button
														className={cn(
															"group m-1 mt-0 flex flex-col max-h-full overflow-hidden whitespace-normal rounded-lg border p-2 text-xs leading-tight flex-1",
															colors.card,
														)}
														onClick={(e) => {
															e.stopPropagation();
														}}
													>
														<p
															className={cn(
																"max-w-full shrink-0 truncate whitespace-normal text-left font-semibold leading-none break-words text-[11px]",
																colors.text,
															)}
														>
															{booking.dog && (
																<>
																	{booking.dog.givenName} {booking.dog.familyName}
																</>
															)}
															{booking.dog && " - "}
															{bookingType && bookingType.name ? bookingType.name : "Booking"}
														</p>
														{!bookingType?.showDetailsInCalendar ||
														(bookingType?.showDetailsInCalendar && booking.details && booking.duration > 2400) ? (
															<p className={cn("max-w-full whitespace-normal text-left text-[9px]", colors.text)}>
																{secondsToHumanReadable(booking.duration)}
															</p>
														) : null}
														{bookingType?.showDetailsInCalendar ? (
															booking.details ? (
																<div
																	className={cn(
																		"prose prose-sm whitespace-pre-wrap text-left tracking-tight",
																		booking.duration > 2400 ? "text-[10px]" : "text-[9px] ",
																		colors.text,
																	)}
																	dangerouslySetInnerHTML={{ __html: booking.details }}
																/>
															) : (
																<div className="prose prose-sm whitespace-pre-wrap ">
																	<p
																		className={cn(
																			"italic text-left tracking-tight",
																			booking.duration > 2400 ? "text-[10px]" : "text-[9px] ",
																			colors.text,
																		)}
																	>
																		No details provided.
																	</p>
																</div>
															)
														) : null}
													</button>
												}
											/>
										</li>
									);
								})}
							</ol>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

type BookingPopoverProps = {
	booking: BookingsByWeek[number];
	trigger: React.ReactNode;
	onEditClick: (booking: BookingsByWeek[number]) => void;
	setIsPreviewCardOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

function BookingPopover({ booking, trigger, onEditClick, setIsPreviewCardOpen }: BookingPopoverProps) {
	const { dayjs } = useDayjs();

	const bookingStart = dayjs.tz(booking.date);
	const bookingEnd = bookingStart.add(booking.duration, "seconds");
	return (
		<Popover
			onOpenChange={(value) => {
				if (value === false) {
					setTimeout(() => {
						setIsPreviewCardOpen(false);
					}, 205);
				}

				setIsPreviewCardOpen(true);
			}}
		>
			<PopoverTrigger asChild>{trigger}</PopoverTrigger>
			<PopoverContent className="w-80">
				<div className="grid gap-4">
					<div className="flex w-[286px] items-start justify-between">
						<div className="max-w-full space-y-1">
							<h4 className="text-sm font-medium leading-none">
								{bookingStart.day() !== bookingEnd.day() ? (
									<>
										{bookingStart.format("MMMM Do, YYYY, h:mma")} - {bookingEnd.format("MMMM Do, YYYY, h:mma")}
									</>
								) : (
									<>
										{bookingStart.format("h:mm")}
										{bookingStart.format("a") !== bookingEnd.format("a") ? bookingStart.format("a") : ""} -{" "}
										{bookingEnd.format("h:mma")} &bull; {bookingStart.format("MMMM Do")}
									</>
								)}
							</h4>

							<p className="max-w-full text-xs text-muted-foreground">
								Assigned to{" "}
								{booking.assignedTo
									? `${booking.assignedTo.givenName} ${booking.assignedTo.familyName}`
									: "Deleted User"}{" "}
							</p>
						</div>
						<div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									onEditClick(booking);
								}}
								className="-mr-2.5 -mt-2.5"
							>
								<span className="sr-only">Edit Booking</span>
								<EditIcon className="h-4 w-4" aria-hidden="true" />
							</Button>
						</div>
					</div>
					<div className="grid gap-4">
						{booking.dog && (
							<div className="grid gap-y-2">
								<Label htmlFor="dog">Dog</Label>
								<Button variant="ghost" asChild className="-ml-4 h-auto w-[318px] justify-between rounded-none">
									<Link href={`/dogs/${booking.dog.id}`}>
										<div className="flex max-w-full shrink items-center gap-x-4 truncate">
											<div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-zinc-50">
												<DogIcon className="h-5 w-5" />
											</div>
											<div className="min-w-0 flex-auto">
												<p className="truncate text-sm font-semibold capitalize leading-6 text-primary">
													{booking.dog.givenName} {booking.dog.familyName}
												</p>
												<p className="truncate text-xs capitalize leading-5 text-zinc-500">{booking.dog.color}</p>
											</div>
										</div>
										<div className="flex space-x-4 text-muted-foreground">
											<span className="sr-only">Edit dog</span>
											<ChevronRightIcon className="h-4 w-4" />
										</div>
									</Link>
								</Button>
							</div>
						)}
						<div className="grid gap-y-2">
							<Label htmlFor="details">Details</Label>
							{booking.details ? (
								<div
									className="prose prose-sm w-[286px] whitespace-pre-wrap text-xs"
									dangerouslySetInnerHTML={{ __html: booking.details }}
								/>
							) : (
								<div className="prose prose-sm whitespace-pre-wrap">
									<p className="italic text-zinc-500">No details provided.</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export { WeekView };
