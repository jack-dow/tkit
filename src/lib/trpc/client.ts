import { createTRPCReact } from "@trpc/react-query";

import { type AppRouter } from "~/server";

export const api = createTRPCReact<AppRouter>({
	overrides: {
		useMutation: {
			/**
			 * This function is called whenever a `.useMutation` succeeds
			 **/
			async onSuccess(opts) {
				/**
				 * @note that order here matters:
				 * The order here allows route changes in `onSuccess` without
				 * having a flash of content change whilst redirecting.
				 **/
				// Calls the `onSuccess` defined in the `useQuery()`-options:
				await opts.originalFn();
				// Invalidate all queries in the react-query cache:
				await opts.queryClient.invalidateQueries();
			},
		},
	},
});

export { type RouterInputs, type RouterOutputs } from "~/server";
