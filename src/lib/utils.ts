import { type MutableRefObject, type RefCallback } from "react";
import { type ReadonlyURLSearchParams } from "next/navigation";
import { createId } from "@paralleldrive/cuid2";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

import { env } from "../env.mjs";

// ------------------------------------------------------------------
// Miscellanous
// ------------------------------------------------------------------
export const generateId = createId;

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getBaseUrl(options?: { absolute?: boolean }) {
	if (typeof window !== "undefined") {
		if (options?.absolute) {
			return env.NEXT_PUBLIC_APP_URL;
		}

		return ""; // browser should use relative url
	}
	if (env.VERCEL_URL) return env.VERCEL_URL; // SSR should use vercel url

	return `http://localhost:${env.PORT}`; // dev SSR should use localhost
}

export function secondsToHumanReadable(seconds: number, options?: { nonPlural?: boolean }): string {
	if (seconds === 86400) {
		return "1 day";
	}
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;

	const formattedTime = [];
	if (hours > 0) {
		formattedTime.push(`${hours} hour${!options?.nonPlural && hours > 1 ? "s" : ""}`);
	}
	if (minutes > 0) {
		formattedTime.push(`${minutes} minute${!options?.nonPlural && minutes > 1 ? "s" : ""}`);
	}
	if (remainingSeconds > 0 || formattedTime.length === 0) {
		formattedTime.push(`${remainingSeconds} second${!options?.nonPlural && remainingSeconds !== 1 ? "s" : ""}`);
	}

	return formattedTime.join(", ");
}

export function parseDurationToSeconds(str: string) {
	let total = 0;
	const days = str.match(/(\d*\.?\d+)\s*d/);
	const hours = str.match(/(\d*\.?\d+)\s*h/);
	const minutes = str.match(/(\d*\.?\d+)\s*m/);
	const seconds = str.match(/(\d*\.?\d+)\s*s/);

	if (days?.[1]) {
		total += parseFloat(days[1]) * 86400;
	}
	if (hours?.[1]) {
		total += parseFloat(hours[1]) * 3600;
	}
	if (minutes?.[1]) {
		total += parseFloat(minutes[1]) * 60;
	}
	if (seconds?.[1]) {
		total += parseFloat(seconds[1]);
	}

	return total;
}

export function logInDevelopment(...args: unknown[]) {
	if (process.env.NODE_ENV === "development") {
		console.log(...args);
	}
}

export type SearchParams = { [key: string]: string | string[] | undefined };

export function setSearchParams<
	NewParams extends Record<string, string | number | undefined> = Record<string, string | number | undefined>,
>(currentParams: ReadonlyURLSearchParams, newParams: NewParams) {
	const searchParams = new URLSearchParams(currentParams);

	Object.entries(newParams).forEach(([key, value]) => {
		if (value) {
			searchParams.set(key, value.toString());
		} else {
			searchParams.delete(key);
		}
	});

	return searchParams;
}

// ------------------------------------------------------------------
// Auth Zod Validation
// ------------------------------------------------------------------
export const SignInSchema = z.object({
	emailAddress: z.string().email(),
});
export type SignInSchema = z.infer<typeof SignInSchema>;

export const SignUpSchema = SignInSchema.extend({
	givenName: z.string().min(1, { message: "Required" }).max(50),
	familyName: z.string().max(50).or(z.literal("")).optional(),
});
export type SignUpSchema = z.infer<typeof SignUpSchema>;

// ------------------------------------------------------------------
// React Hook Form
// ------------------------------------------------------------------
type NestedBooleanObject = {
	[key: string]: boolean | Array<boolean | NestedBooleanObject> | NestedBooleanObject;
};

// This function exists to check formState.dirtyFields of a react-hook-form to see if there are any fields that have been changed by the user
// The reason I made this instead of just using formState.isDirty is because they work in different ways.
// SEE: https://github.com/react-hook-form/react-hook-form/issues/4740 - for some ways that isDirty can be weird (imo)
// formState.dirtyFields will include keys with a true value only if the value has been changed by the client or set with keepDirty: true (or equivalent)
// This is good because we then can keep track of actions on the form but not worry about it messing with the dirty state of the form.
// Therefore, imo it is the best way to check if a field has been changed by the user. I don't love this implementation so hopefully there will be a better way soon.
export function hasTrueValue(obj: NestedBooleanObject): boolean {
	for (const key in obj) {
		const value = obj[key];

		if (typeof value === "boolean") {
			if (value === true) {
				return true;
			}
		} else if (Array.isArray(value)) {
			for (const item of value) {
				if (typeof item === "boolean" && item === true) {
					return true;
				} else if (typeof item === "object") {
					if (hasTrueValue(item)) {
						return true;
					}
				}
			}
		} else if (typeof value === "object") {
			if (hasTrueValue(value)) {
				return true;
			}
		}
	}

	return false;
}

type RefType<T> = MutableRefObject<T> | RefCallback<T> | null;

// ------------------------------------------------------------------
// React Refs
// ------------------------------------------------------------------
export const shareRef =
	<T>(refA: RefType<T | null>, refB: RefType<T | null>): RefCallback<T> =>
	(instance) => {
		if (typeof refA === "function") {
			refA(instance);
		} else if (refA) {
			refA.current = instance;
		}
		if (typeof refB === "function") {
			refB(instance);
		} else if (refB) {
			refB.current = instance;
		}
	};

// ------------------------------------------------------------------
// Zod Validation
// ------------------------------------------------------------------
/** Combine with the rest of the form schema using z.intersection to ensure the super refine is validated at the same time as the rest of the fields */
export const EmailOrPhoneNumberSchema = z
	.object({
		emailAddress: z.string().email().max(128).or(z.literal("")).optional(),
		phoneNumber: z.string().min(9).max(16).or(z.literal("")).optional(),
	})
	.superRefine((val, ctx) => {
		if (!val.emailAddress && !val.phoneNumber) {
			const message = "Email address or phone number required";
			ctx.addIssue({
				code: z.ZodIssueCode.too_small,
				minimum: 1,
				type: "string",
				inclusive: true,
				message: message,
				path: ["emailAddress"],
			});
			ctx.addIssue({
				code: z.ZodIssueCode.too_small,
				minimum: 1,
				type: "string",
				inclusive: true,
				message: message,
				path: ["phoneNumber"],
			});
		}
	});
export type EmailOrPhoneNumberSchema = z.infer<typeof EmailOrPhoneNumberSchema>;

// ------------------------------------------------------------------
// Pagination
// ------------------------------------------------------------------
export function searchParamsToObject(searchParams: URLSearchParams): SearchParams {
	const searchParamsObject: Record<string, string> = {};

	for (const [key, value] of searchParams.entries()) {
		if (value) {
			searchParamsObject[key] = value;
		}
	}

	return searchParamsObject;
}

export const PaginationOptionsSchema = z.object({
	page: z.coerce.number().int().min(1).optional().catch(1),
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(100)
		.optional()
		.catch((ctx) => {
			if (ctx.error?.issues?.[0]?.code === "too_small") {
				return 1;
			}
			if (ctx.error?.issues?.[0]?.code === "too_big") {
				return 100;
			}
			return 20;
		}),
	sortBy: z.string().optional().catch(undefined),
	sortDirection: z
		.union([z.literal("asc"), z.literal("desc")])
		.optional()
		.catch("asc"),
});
export type PaginationOptionsSchema = z.infer<typeof PaginationOptionsSchema>;
