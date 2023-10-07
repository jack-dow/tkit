import { type AnyColumn } from "drizzle-orm";

import { bookings, bookingTypes, clients, dogs, vetClinics, vets } from "~/db/schema/app";
import { organizations, users } from "~/db/schema/auth";

// These are in a separate file because they used on both the client and the server.
// Therefore if they were in the server router file when you imported them on the client
// you would get errors with server-only packages such as Next.js `cookies()`

type SortableColumns = {
	[key: string]: {
		id: string;
		label: string;
		columns: AnyColumn[];
	};
};

const CLIENTS_SORTABLE_COLUMNS = {
	fullName: {
		id: "fullName",
		label: "Full name",
		columns: [clients.givenName, clients.familyName],
	},
	givenName: {
		id: "givenName",
		label: "First name",
		columns: [clients.givenName],
	},
	familyName: {
		id: "familyName",
		label: "Last name",
		columns: [clients.familyName],
	},
	emailAddress: {
		id: "emailAddress",
		label: "Email address",
		columns: [clients.emailAddress],
	},
	phoneNumber: {
		id: "phoneNumber",
		label: "Phone number",
		columns: [clients.phoneNumber],
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
		columns: [clients.createdAt],
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
		columns: [clients.updatedAt],
	},
} satisfies SortableColumns;

const DOGS_SORTABLE_COLUMNS = {
	givenName: {
		id: "givenName",
		label: "Name",
		columns: [dogs.givenName],
	},
	breed: {
		id: "breed",
		label: "Breed",
		columns: [dogs.breed],
	},
	color: {
		id: "color",
		label: "Color",
		columns: [dogs.color],
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
		columns: [dogs.createdAt],
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
		columns: [dogs.updatedAt],
	},
} satisfies SortableColumns;

const VETS_SORTABLE_COLUMNS = {
	fullName: {
		id: "fullName",
		label: "Full name",
		columns: [vets.givenName, vets.familyName],
	},
	givenName: {
		id: "givenName",
		label: "First name",
		columns: [vets.givenName],
	},
	familyName: {
		id: "familyName",
		label: "Last name",
		columns: [vets.familyName],
	},
	emailAddress: {
		id: "emailAddress",
		label: "Email address",
		columns: [vets.emailAddress],
	},
	phoneNumber: {
		id: "phoneNumber",
		label: "Phone number",
		columns: [vets.phoneNumber],
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
		columns: [vets.createdAt],
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
		columns: [vets.updatedAt],
	},
} satisfies SortableColumns;

const VET_CLINICS_SORTABLE_COLUMNS = {
	name: {
		id: "name",
		label: "Name",
		columns: [vetClinics.name],
	},
	emailAddress: {
		id: "emailAddress",
		label: "Email address",
		columns: [vetClinics.emailAddress],
	},
	phoneNumber: {
		id: "phoneNumber",
		label: "Phone number",
		columns: [vetClinics.phoneNumber],
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
		columns: [vetClinics.createdAt],
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
		columns: [vetClinics.updatedAt],
	},
} satisfies SortableColumns;

const ORGANIZATIONS_SORTABLE_COLUMNS = {
	name: {
		id: "name",
		label: "Name",
		columns: [organizations.name],
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
		columns: [organizations.createdAt],
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
		columns: [organizations.updatedAt],
	},
} satisfies SortableColumns;

const USERS_SORTABLE_COLUMNS = {
	fullName: {
		id: "fullName",
		label: "Full name",
		columns: [users.givenName, users.familyName],
	},
	givenName: {
		id: "givenName",
		label: "First name",
		columns: [users.givenName],
	},
	familyName: {
		id: "familyName",
		label: "Last name",
		columns: [users.familyName],
	},
	emailAddress: {
		id: "emailAddress",
		label: "Email address",
		columns: [users.emailAddress],
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
		columns: [users.createdAt],
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
		columns: [users.updatedAt],
	},
} satisfies SortableColumns;

const BOOKINGS_SORTABLE_COLUMNS = {
	date: {
		id: "date",
		label: "Date",
		columns: [bookings.date, bookings.duration],
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
		columns: [bookings.createdAt],
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
		columns: [bookings.updatedAt],
	},
} satisfies SortableColumns;

const BOOKING_TYPES_SORTABLE_COLUMNS = {
	name: {
		id: "name",
		label: "Name",
		columns: [bookingTypes.name],
	},
	duration: {
		id: "duration",
		label: "Duration",
		columns: [bookingTypes.duration],
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
		columns: [bookingTypes.createdAt],
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
		columns: [bookingTypes.updatedAt],
	},
} satisfies SortableColumns;

export {
	type SortableColumns,
	CLIENTS_SORTABLE_COLUMNS,
	DOGS_SORTABLE_COLUMNS,
	VET_CLINICS_SORTABLE_COLUMNS,
	VETS_SORTABLE_COLUMNS,
	ORGANIZATIONS_SORTABLE_COLUMNS,
	USERS_SORTABLE_COLUMNS,
	BOOKINGS_SORTABLE_COLUMNS,
	BOOKING_TYPES_SORTABLE_COLUMNS,
};
