"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { api } from "~/lib/trpc/client";
import { DestructiveActionDialog } from "../ui/destructive-action-dialog";
import { useToast } from "../ui/use-toast";
import { type ManageBookingFormSchema } from "./use-manage-booking-form";

function BookingDeleteDialog({ onSuccessfulDelete }: { onSuccessfulDelete?: () => void }) {
	const router = useRouter();
	const pathname = usePathname();

	const form = useFormContext<ManageBookingFormSchema>();
	const { toast } = useToast();

	const deleteMutation = api.app.bookings.delete.useMutation();

	return (
		<DestructiveActionDialog
			name="booking"
			trigger="trash"
			onConfirm={async () => {
				try {
					await deleteMutation.mutateAsync({
						id: form.getValues("id"),
						sendCancellationEmail: form.getValues("sendEmailUpdates"),
					});
					toast({
						title: `Booking deleted`,
						description: `Successfully deleted booking.`,
					});

					if (pathname.startsWith("/bookings/")) {
						router.push("/bookings");
						return;
					}

					onSuccessfulDelete?.();
				} catch (error) {
					toast({
						title: `Booking deletion failed`,
						description: `There was an error deleting this booking. Please try again.`,
						variant: "destructive",
					});
				}
			}}
		/>
	);
}

export { BookingDeleteDialog };
