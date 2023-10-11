import { Separator } from "./separator";
import { Skeleton } from "./skeleton";

function getRandomNumberBetween(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
	return (
		<div className="w-full space-y-4">
			<header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div className="flex flex-1 items-center space-x-3">
					<div className="relative w-full md:max-w-[288px]">
						<Skeleton className="h-8 w-[288px] rounded-md" />
					</div>
				</div>
				<div className="flex flex-1 items-center justify-end gap-x-3 md:flex-none md:gap-x-5">
					<div className="flex flex-1 items-center space-x-2">
						<Skeleton className="h-8 w-24 rounded-md" />
					</div>
					<Separator orientation="vertical" className="h-4" />
					<Skeleton className="h-8 w-24 rounded-md" />
				</div>
			</header>
			<main className="rounded-md border bg-white">
				<div className="w-full table-fixed overflow-auto">
					<table className="w-full caption-bottom text-sm">
						<thead className="[&_tr]:border-b">
							<tr className="border-b transition-colors">
								{new Array(rows).fill(undefined).map((_, i) => (
									<th
										key={`heading-${i}`}
										className="h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
									>
										<Skeleton className="h-4 rounded-md" style={{ width: getRandomNumberBetween(35, 170) }} />
									</th>
								))}
							</tr>
						</thead>
						<tbody className="[&_tr:last-child]:border-0">
							{new Array(15).fill(undefined).map((_, i) => (
								<tr key={`row-${i}`} className="border-b transition-colors">
									{new Array(rows).fill(undefined).map((_, j) => (
										<td
											key={`cell-${i}-${j}`}
											className="h-[49px] p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
										>
											<div>
												<Skeleton className="h-5 rounded-md" style={{ width: getRandomNumberBetween(35, 170) }} />
											</div>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</main>
			<div className="flex w-full items-center justify-between space-x-6 lg:space-x-8">
				<div className="flex items-center space-x-2">
					<p className="text-sm font-medium leading-none">Rows per page</p>
					<Skeleton className="h-8 w-[70px] rounded-md" />
				</div>
				<div className="flex">
					<div className="flex items-center space-x-2">
						{new Array(4).fill(undefined).map((_, i) => (
							<Skeleton key={`pagination-${i}`} className="h-8 w-8 rounded-md" />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
