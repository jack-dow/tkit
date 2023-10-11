import { type AnyColumn } from "drizzle-orm";

import { bookings, bookingTypes, clients, dogs, vetClinics, vets } from "~/db/schema/app";
import { organizations, users } from "~/db/schema/auth";
import type * as SORTABLE_COLUMNS from "~/lib/sortable-columns";

// ------------------------------------------------------------------
// These are the columns that can be sorted in the table views.
// Here we extend the client-only defined sortable columns and define the db columns that they actually reference.
// They are split into separate files so that we are not importing drizzle on the client.
// SEE: ~/lib/sortable-columns.ts for the client-only defined sortable columns
// ------------------------------------------------------------------
export type ServerSortableColumns<ClientSortableColumns extends SORTABLE_COLUMNS.SortableColumns> = {
	[key in keyof ClientSortableColumns]: {
		columns: AnyColumn[];
	};
};

export const CLIENTS_SORTABLE_COLUMNS = {
	fullName: {
		columns: [clients.givenName, clients.familyName],
	},
	givenName: {
		columns: [clients.givenName],
	},
	familyName: {
		columns: [clients.familyName],
	},
	emailAddress: {
		columns: [clients.emailAddress],
	},
	phoneNumber: {
		columns: [clients.phoneNumber],
	},
	createdAt: {
		columns: [clients.createdAt],
	},
	updatedAt: {
		columns: [clients.updatedAt],
	},
} satisfies ServerSortableColumns<typeof SORTABLE_COLUMNS.CLIENTS_SORTABLE_COLUMNS>;

export const DOGS_SORTABLE_COLUMNS = {
	givenName: {
		columns: [dogs.givenName],
	},
	breed: {
		columns: [dogs.breed],
	},
	color: {
		columns: [dogs.color],
	},
	createdAt: {
		columns: [dogs.createdAt],
	},
	updatedAt: {
		columns: [dogs.updatedAt],
	},
} satisfies ServerSortableColumns<typeof SORTABLE_COLUMNS.DOGS_SORTABLE_COLUMNS>;

export const VETS_SORTABLE_COLUMNS = {
	fullName: {
		columns: [vets.givenName, vets.familyName],
	},
	givenName: {
		columns: [vets.givenName],
	},
	familyName: {
		columns: [vets.familyName],
	},
	emailAddress: {
		columns: [vets.emailAddress],
	},
	phoneNumber: {
		columns: [vets.phoneNumber],
	},
	createdAt: {
		columns: [vets.createdAt],
	},
	updatedAt: {
		columns: [vets.updatedAt],
	},
} satisfies ServerSortableColumns<typeof SORTABLE_COLUMNS.VETS_SORTABLE_COLUMNS>;

export const VET_CLINICS_SORTABLE_COLUMNS = {
	name: {
		columns: [vetClinics.name],
	},
	emailAddress: {
		columns: [vetClinics.emailAddress],
	},
	phoneNumber: {
		columns: [vetClinics.phoneNumber],
	},
	createdAt: {
		columns: [vetClinics.createdAt],
	},
	updatedAt: {
		columns: [vetClinics.updatedAt],
	},
} satisfies ServerSortableColumns<typeof SORTABLE_COLUMNS.VET_CLINICS_SORTABLE_COLUMNS>;

export const ORGANIZATIONS_SORTABLE_COLUMNS = {
	name: {
		columns: [organizations.name],
	},
	createdAt: {
		columns: [organizations.createdAt],
	},
	updatedAt: {
		columns: [organizations.updatedAt],
	},
} satisfies ServerSortableColumns<typeof SORTABLE_COLUMNS.ORGANIZATIONS_SORTABLE_COLUMNS>;

export const USERS_SORTABLE_COLUMNS = {
	fullName: {
		columns: [users.givenName, users.familyName],
	},
	givenName: {
		columns: [users.givenName],
	},
	familyName: {
		columns: [users.familyName],
	},
	emailAddress: {
		columns: [users.emailAddress],
	},
	createdAt: {
		columns: [users.createdAt],
	},
	updatedAt: {
		columns: [users.updatedAt],
	},
} satisfies ServerSortableColumns<typeof SORTABLE_COLUMNS.USERS_SORTABLE_COLUMNS>;

export const BOOKINGS_SORTABLE_COLUMNS = {
	date: {
		columns: [bookings.date, bookings.duration],
	},
	createdAt: {
		columns: [bookings.createdAt],
	},
	updatedAt: {
		columns: [bookings.updatedAt],
	},
} satisfies ServerSortableColumns<typeof SORTABLE_COLUMNS.BOOKINGS_SORTABLE_COLUMNS>;

export const BOOKING_TYPES_SORTABLE_COLUMNS = {
	name: {
		columns: [bookingTypes.name],
	},
	duration: {
		columns: [bookingTypes.duration],
	},
	createdAt: {
		columns: [bookingTypes.createdAt],
	},
	updatedAt: {
		columns: [bookingTypes.updatedAt],
	},
} satisfies ServerSortableColumns<typeof SORTABLE_COLUMNS.BOOKING_TYPES_SORTABLE_COLUMNS>;
