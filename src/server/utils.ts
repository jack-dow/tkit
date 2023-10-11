import { asc, desc } from "drizzle-orm";
import { z } from "zod";

import { type PaginationOptionsSchema } from "~/lib/utils";
import { type ServerSortableColumns } from "./router/sortable-columns";

interface ValidatePaginationSearchParamsProps extends PaginationOptionsSchema {
	count?: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	sortableColumns: ServerSortableColumns<any>;
}

export function validatePaginationSearchParams({
	sortableColumns,
	count = 0,
	page = 1,
	limit = 20,
	sortBy,
	sortDirection = "asc",
}: ValidatePaginationSearchParamsProps) {
	const validPage = z.number().int().min(1).safeParse(page);
	const validLimit = z.number().int().min(1).max(100).safeParse(limit);

	if (!validPage.success || !page) {
		page = 1;
	}

	if (!validLimit.success || !limit) {
		limit = 20;
	}

	const maxPage = Math.ceil(count / limit) || 1;

	if (page > maxPage) {
		page = maxPage;
	}

	if (sortDirection !== "desc") {
		sortDirection = "asc";
	}

	if (!sortBy || !(sortBy in sortableColumns)) {
		sortBy = Object.keys(sortableColumns)[0] ?? "id";
	}

	let orderBy = Object.values(sortableColumns)[0]?.columns.map((column) =>
		sortDirection === "desc" ? desc(column) : asc(column),
	);

	if (sortBy && sortBy in sortableColumns) {
		orderBy = sortableColumns[sortBy]!.columns.map((column) => (sortDirection === "desc" ? desc(column) : asc(column)));
	}

	return { count, page, limit, maxPage, sortBy, sortDirection, orderBy };
}
