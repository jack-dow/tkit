"use client";

import * as React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { ManageBookingDialog } from "~/components/manage-booking/manage-booking-dialog";
import { Button } from "~/components/ui/button";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { ChevronLeftIcon, ChevronRightIcon } from "~/components/ui/icons";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { useUser } from "~/app/providers";
import { useDayjs } from "~/hooks/use-dayjs";
import { api } from "~/lib/trpc/client";
import { logInDevelopment } from "~/lib/utils";
import { type RouterOutputs } from "~/server";
import { type ManageDogFormSchema } from "../manage-dog-form";
import { Booking } from "./booking";

function sortBookingsAscending(a: ManageDogFormSchema["bookings"][number], b: ManageDogFormSchema["bookings"][number]) {
	if (a.date > b.date) {
		return 1;
	}
	if (a.date < b.date) {
		return -1;
	}

	if (a.duration > b.duration) {
		return 1;
	}

	if (a.duration < b.duration) {
		return -1;
	}

	// If dates are the same, compare ids in ascending order (like the db query)
	return a.id.localeCompare(b.id);
}

function sortBookingsDescending(
	a: ManageDogFormSchema["bookings"][number],
	b: ManageDogFormSchema["bookings"][number],
) {
	if (a.date > b.date) {
		return -1;
	}
	if (a.date < b.date) {
		return 1;
	}

	if (a.duration > b.duration) {
		return -1;
	}

	if (a.duration < b.duration) {
		return 1;
	}

	// If dates are the same, compare ids in ascending order (like the db query)
	return a.id.localeCompare(b.id);
}

function BookingsList({
	isNew,
	tab,
	bookings,
	bookingTypes,
}: {
	isNew: boolean;
	// Have to pass in bookings otherwise react-hook-form wasn't re-rendering properly on update/submit/delete
	bookings: ManageDogFormSchema["bookings"];
	tab: "past" | "future";
	bookingTypes: RouterOutputs["app"]["bookingTypes"]["all"]["data"];
}) {
	const { dayjs } = useDayjs();
	const { toast } = useToast();
	const form = useFormContext<ManageDogFormSchema>();

	const context = api.useContext();
	const bookingDeleteMutation = api.app.bookings.delete.useMutation();

	const user = useUser();

	const allBookings = useFieldArray({
		control: form.control,
		name: "bookings",
		keyName: "rhf-id",
	});

	// Pagination Management
	const [page, setPage] = React.useState(1);
	const [loadedPages, setLoadedPages] = React.useState(Math.ceil((bookings.length - 1) / 5) || 1);
	const [isLoading, setIsLoading] = React.useState(false);
	const [hasMore, setHasMore] = React.useState(bookings.length > 5);

	const [confirmBookingDelete, setConfirmBookingDelete] = React.useState<string | null>(null);

	const [editingBooking, setEditingBooking] = React.useState<ManageDogFormSchema["bookings"][number] | null>(null);
	const [copiedBooking, setCopiedBooking] = React.useState<ManageDogFormSchema["bookings"][number] | null>(null);

	let visibleBookings: typeof bookings = [];

	if (tab === "past") {
		visibleBookings = [...bookings].sort(sortBookingsDescending).slice((page - 1) * 5, page * 5);
	} else {
		visibleBookings = [...bookings].sort(sortBookingsAscending).slice((page - 1) * 5, page * 5);
	}

	React.useEffect(() => {
		// If new booking has been added, ensure loaded pages is correct
		if (bookings.length > loadedPages * 5) {
			setHasMore(true);
		}
	}, [bookings, loadedPages]);

	return (
		<>
			<DestructiveActionDialog
				name="booking"
				withoutTrigger
				open={!!confirmBookingDelete}
				onOpenChange={() => setConfirmBookingDelete(null)}
				onConfirm={async () => {
					if (confirmBookingDelete) {
						try {
							if (!isNew) {
								const result = await bookingDeleteMutation.mutateAsync({
									id: confirmBookingDelete,
									dogId: form.getValues("id"),
								});

								if (bookings.length - 1 < result.count) {
									setHasMore(true);
								}

								if (bookings.length - 1 === result.count) {
									setHasMore(false);
								}
							}

							allBookings.remove(allBookings.fields.findIndex((f) => f.id === confirmBookingDelete));

							if (visibleBookings.length - 1 === 0) {
								setPage(page - 1);
								setLoadedPages(loadedPages - 1);
							}

							toast({
								title: "Session deleted",
								description: "This booking has been successfully deleted.",
							});
						} catch (error) {
							logInDevelopment(error);

							toast({
								title: "Session deletion failed",
								description: "There was an error deleting this booking. Please try again.",
								variant: "destructive",
							});
						}
					}
				}}
			/>

			<ManageBookingDialog
				bookingTypes={bookingTypes}
				open={!!editingBooking || !!copiedBooking}
				setOpen={(value) => {
					if (value === false) {
						setEditingBooking(null);
						setCopiedBooking(null);
					}
				}}
				disableDogSearch={isNew}
				withoutTrigger
				booking={
					editingBooking
						? {
								createdAt: new Date(),
								updatedAt: new Date(),
								organizationId: user?.organizationId,
								...editingBooking,
								dog: {
									id: form.getValues("id"),
									givenName: form.getValues("givenName") ?? "Unnamed new dog",
									familyName: form.getValues("familyName") ?? "",
									color: form.getValues("color") ?? "",
									breed: form.getValues("breed") ?? "",
								},
						  }
						: undefined
				}
				defaultValues={
					copiedBooking
						? {
								...copiedBooking,
								dog: {
									id: form.getValues("id"),
									givenName: form.getValues("givenName") ?? "Unnamed new dog",
									familyName: form.getValues("familyName") ?? "",
									color: form.getValues("color") ?? "",
									breed: form.getValues("breed") ?? "",
								},
						  }
						: undefined
				}
				onSuccessfulSubmit={(booking) => {
					// Remove booking if dog has been changed
					if (booking.dogId !== form.getValues("id")) {
						form.setValue(
							"bookings",
							[...allBookings.fields].filter((b) => b.id !== booking.id),
							{ shouldDirty: false },
						);
						return;
					}

					const existing = allBookings.fields.find((f) => f.id === booking.id);

					if (existing) {
						form.setValue(
							"bookings",
							[...allBookings.fields].map((b) => {
								if (b.id === booking.id) {
									return booking;
								}

								return b;
							}),
							{ shouldDirty: false },
						);
						return;
					}

					form.setValue("bookings", [...allBookings.fields, booking], { shouldDirty: false });
				}}
				onSubmit={isNew ? async () => {} : undefined}
			/>

			<ul role="list">
				{visibleBookings.map((booking, index) => {
					return (
						<Booking
							key={booking.id}
							booking={booking}
							isLast={index === 4 || index === visibleBookings.length - 1}
							onEditClick={() => {
								setEditingBooking(booking);
							}}
							onCopy={() => {
								setCopiedBooking(booking);
							}}
							onDelete={() => {
								setConfirmBookingDelete(booking.id);
							}}
						/>
					);
				})}
			</ul>

			{visibleBookings.length > 0 ? (
				<div className="flex items-center justify-center space-x-2">
					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						disabled={page === 1}
						onClick={() => {
							setPage(page - 1);
							setHasMore(true);
						}}
					>
						<span className="sr-only">Go to previous page</span>
						<ChevronLeftIcon className="h-4 w-4" />
					</Button>

					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						disabled={isNew ? bookings.length <= page * 5 : !hasMore || isLoading}
						onClick={() => {
							if (page !== loadedPages || isNew) {
								if (page + 1 === loadedPages && bookings.length <= loadedPages * 5) {
									setHasMore(false);
								}
								setPage(page + 1);
								return;
							}

							if (bookings.length > loadedPages * 5) {
								setIsLoading(true);

								let cursor: (typeof bookings)[number] | null = null;

								if (tab === "past") {
									cursor = [...bookings]
										.sort(sortBookingsDescending)
										.slice((page - 1) * 5, page * 5 + 1)
										.pop()!;
								} else {
									cursor = [...bookings]
										.sort(sortBookingsAscending)
										.slice((page - 1) * 5, page * 5 + 1)
										.pop()!;
								}

								context.app.bookings.search
									.fetch({
										dogId: form.getValues("id"),
										cursor,
										after: tab === "past" ? undefined : dayjs.tz().startOf("day").toDate(),
										sortDirection: tab === "past" ? "desc" : "asc",
									})
									.then((result) => {
										form.setValue("bookings", [...allBookings.fields, ...result.data], { shouldDirty: false });
										setPage(page + 1);
										setLoadedPages(loadedPages + 1);
										setHasMore(result.data.length === 5);
									})
									.catch(() => {
										toast({
											title: "Failed to load bookings",
											description: "There was an error loading more bookings. Please try again.",
											variant: "destructive",
										});
									})
									.finally(() => {
										setIsLoading(false);
									});
								return;
							}
						}}
					>
						<span className="sr-only">Go to next page</span>
						{isLoading ? (
							<Loader size="sm" variant="black" className="mr-0" />
						) : (
							<ChevronRightIcon className="h-4 w-4" />
						)}
					</Button>
				</div>
			) : (
				<div className="flex items-center justify-center space-x-2">
					<p className="text-sm italic text-muted-foreground">No {tab} bookings.</p>
				</div>
			)}
		</>
	);
}

export { BookingsList };
