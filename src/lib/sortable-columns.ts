// ------------------------------------------------------------------
// These are the columns that can be sorted in the table views.
// Here they only define the id and label and not the actual reference to the db columns as we do not want to be importing drizzle on the client.
// Therefore, there is a ~/server/sortable-columns that extends these definitions with the actual db columns.
// ------------------------------------------------------------------
export type SortableColumns = {
	[key: string]: {
		id: string;
		label: string;
	};
};

export const CLIENTS_SORTABLE_COLUMNS = {
	fullName: {
		id: "fullName",
		label: "Full name",
	},
	givenName: {
		id: "givenName",
		label: "First name",
	},
	familyName: {
		id: "familyName",
		label: "Last name",
	},
	emailAddress: {
		id: "emailAddress",
		label: "Email address",
	},
	phoneNumber: {
		id: "phoneNumber",
		label: "Phone number",
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
	},
} satisfies SortableColumns;

export const DOGS_SORTABLE_COLUMNS = {
	givenName: {
		id: "givenName",
		label: "Name",
	},
	breed: {
		id: "breed",
		label: "Breed",
	},
	color: {
		id: "color",
		label: "Color",
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
	},
} satisfies SortableColumns;

export const VETS_SORTABLE_COLUMNS = {
	fullName: {
		id: "fullName",
		label: "Full name",
	},
	givenName: {
		id: "givenName",
		label: "First name",
	},
	familyName: {
		id: "familyName",
		label: "Last name",
	},
	emailAddress: {
		id: "emailAddress",
		label: "Email address",
	},
	phoneNumber: {
		id: "phoneNumber",
		label: "Phone number",
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
	},
} satisfies SortableColumns;

export const VET_CLINICS_SORTABLE_COLUMNS = {
	name: {
		id: "name",
		label: "Name",
	},
	emailAddress: {
		id: "emailAddress",
		label: "Email address",
	},
	phoneNumber: {
		id: "phoneNumber",
		label: "Phone number",
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
	},
} satisfies SortableColumns;

export const ORGANIZATIONS_SORTABLE_COLUMNS = {
	name: {
		id: "name",
		label: "Name",
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
	},
} satisfies SortableColumns;

export const USERS_SORTABLE_COLUMNS = {
	fullName: {
		id: "fullName",
		label: "Full name",
	},
	givenName: {
		id: "givenName",
		label: "First name",
	},
	familyName: {
		id: "familyName",
		label: "Last name",
	},
	emailAddress: {
		id: "emailAddress",
		label: "Email address",
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
	},
} satisfies SortableColumns;

export const BOOKINGS_SORTABLE_COLUMNS = {
	date: {
		id: "date",
		label: "Date",
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
	},
} satisfies SortableColumns;

export const BOOKING_TYPES_SORTABLE_COLUMNS = {
	name: {
		id: "name",
		label: "Name",
	},
	duration: {
		id: "duration",
		label: "Duration",
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
	},
} satisfies SortableColumns;
