import { describe, expect, it, test, vi } from "vitest";
import { z } from "zod";

import * as utils from "./utils";

test("generateId generates a valid unique cuid2", () => {
	const cuid2 = utils.generateId();
	expect(z.string().cuid2().parse(cuid2)).toBe(cuid2);

	const uniqueCuid2s = new Set();
	for (let i = 0; i < 1000; i++) {
		uniqueCuid2s.add(utils.generateId());
	}
	expect(uniqueCuid2s.size).toBe(1000);
});

test("cn correctly merges and overwrittes classnames", () => {
	const className = utils.cn(
		"foo",
		"bar",
		{ baz: true },
		{ qux: false },
		"text-sm",
		"text-lg p-4",
		"hover:bg-red-600 p-8",
		"hover:text-red-400 hover:bg-orange-200",
	);
	expect(className).toBe("foo bar baz text-lg p-8 hover:text-red-400 hover:bg-orange-200");
});

test("secondsToHumanReadable correctly formats seconds to human readable format", () => {
	const oneSecond = utils.secondsToHumanReadable(1);
	expect(oneSecond).toBe("1 second");

	const thirtySeconds = utils.secondsToHumanReadable(30);
	expect(thirtySeconds).toBe("30 seconds");

	const oneMinute = utils.secondsToHumanReadable(60);
	expect(oneMinute).toBe("1 minute");

	const fiveMinutes = utils.secondsToHumanReadable(300);
	expect(fiveMinutes).toBe("5 minutes");

	const thirtyMinutes = utils.secondsToHumanReadable(1800);
	expect(thirtyMinutes).toBe("30 minutes");

	const oneHour = utils.secondsToHumanReadable(3600);
	expect(oneHour).toBe("1 hour");

	const fiveHours = utils.secondsToHumanReadable(18000);
	expect(fiveHours).toBe("5 hours");

	const tenHoursEightMinutes = utils.secondsToHumanReadable(36480);
	expect(tenHoursEightMinutes).toBe("10 hours, 8 minutes");

	const oneDay = utils.secondsToHumanReadable(86400);
	expect(oneDay).toBe("1 day");

	// 1 day returns 1 day but anything more still returning in hours as we cap durations at 1 day for bookings so anything more can still be in hours. This should be changed if we ever allow bookings longer than 1 day.
	const twoDays = utils.secondsToHumanReadable(172800);
	expect(twoDays).toBe("48 hours");
});

test("parseDurationToSeconds correctly parses a duration string to seconds", () => {
	const oneSecond = utils.parseDurationToSeconds("1s");
	expect(oneSecond).toBe(1);

	const thirtySeconds = utils.parseDurationToSeconds("30s");
	expect(thirtySeconds).toBe(30);

	const oneMinute = utils.parseDurationToSeconds("1m");
	expect(oneMinute).toBe(60);

	const fiveMinutes = utils.parseDurationToSeconds("5m");
	expect(fiveMinutes).toBe(300);

	const thirtyMinutes = utils.parseDurationToSeconds("30m");
	expect(thirtyMinutes).toBe(1800);

	const oneHour = utils.parseDurationToSeconds("1h");
	expect(oneHour).toBe(3600);

	const fiveHours = utils.parseDurationToSeconds("5h");
	expect(fiveHours).toBe(18000);

	const tenHoursEightMinutes = utils.parseDurationToSeconds("10h8m");
	expect(tenHoursEightMinutes).toBe(36480);

	const oneDay = utils.parseDurationToSeconds("1d");
	expect(oneDay).toBe(86400);

	const twoDays = utils.parseDurationToSeconds("2d");
	expect(twoDays).toBe(172800);

	const oneDayOneHour = utils.parseDurationToSeconds("1d1h");
	expect(oneDayOneHour).toBe(90000);

	const oneDayOneHourOneMinute = utils.parseDurationToSeconds("1d 1h 1m");
	expect(oneDayOneHourOneMinute).toBe(90060);

	const oneDayOneHourOneMinuteOneSecond = utils.parseDurationToSeconds("1d 1h 1m 1s");
	expect(oneDayOneHourOneMinuteOneSecond).toBe(90061);

	const oneDayOneHourOneMinuteOneSecondWithSpaces = utils.parseDurationToSeconds("1 d 1 h 1 m 1 s");
	expect(oneDayOneHourOneMinuteOneSecondWithSpaces).toBe(90061);

	const oneDayOneHourOneMinuteOneSecondWithSpacesAndPlurals = utils.parseDurationToSeconds(
		"1 days 1 hours 1 minutes 1 seconds",
	);
	expect(oneDayOneHourOneMinuteOneSecondWithSpacesAndPlurals).toBe(90061);
});

describe("logInDevelopment", () => {
	it("should log messages in development environment", () => {
		const consoleMock = vi.spyOn(console, "log").mockImplementation(() => undefined);

		vi.stubEnv("NODE_ENV", "development");

		expect(process.env.NODE_ENV).toBe("development");

		utils.logInDevelopment("foo", "bar");

		expect(consoleMock).toHaveBeenCalledWith("foo", "bar");

		consoleMock.mockRestore();
		vi.unstubAllEnvs();
	});

	it("should not log messages in non-development environment", () => {
		const consoleMock = vi.spyOn(console, "log").mockImplementation(() => undefined);

		vi.stubEnv("NODE_ENV", "production");

		expect(process.env.NODE_ENV).toBe("production");

		utils.logInDevelopment("foo", "bar");

		expect(consoleMock).not.toHaveBeenCalledWith("foo", "bar");

		consoleMock.mockRestore();
		vi.unstubAllEnvs();
	});
});

describe("setSearchParams", () => {
	it("should set search params correctly", () => {
		const searchParams = new URLSearchParams({
			foo: "bar",
			baz: "qux",
		});

		const newParams = utils.setSearchParams(searchParams, {
			foo: "baz",
			qux: "quux",
		});

		expect(newParams.toString()).toBe("foo=baz&baz=qux&qux=quux");
	});

	it("should set search params correctly with undefined or empty values", () => {
		const searchParams = new URLSearchParams({
			foo: "bar",
			baz: "qux",
		});

		const newParams = utils.setSearchParams(searchParams, {
			foo: undefined,
			baz: "",
			qux: "quux",
		});

		expect(newParams.toString()).toBe("qux=quux");
	});

	it("should set search params correctly with empty search params", () => {
		const searchParams = new URLSearchParams();

		const newParams = utils.setSearchParams(searchParams, {
			foo: "bar",
			baz: "qux",
		});

		expect(newParams.toString()).toBe("foo=bar&baz=qux");
	});

	it("should set search params correctly with empty new params", () => {
		const searchParams = new URLSearchParams({
			foo: "bar",
			baz: "qux",
		});

		const newParams = utils.setSearchParams(searchParams, {});

		expect(newParams.toString()).toBe("foo=bar&baz=qux");
	});

	it("should set search params correctly with empty search params and new params", () => {
		const searchParams = new URLSearchParams();

		const newParams = utils.setSearchParams(searchParams, {});

		expect(newParams.toString()).toBe("");
	});
});

test("getTimezoneOffset returns the correct offset in minutes from UTC for a given timezone", () => {
	const date = new Date("2021-08-01T00:00:00.000Z");

	const utcOffset = utils.getTimezoneOffset("UTC", date);
	expect(utcOffset).toBe(0);

	const londonOffset = utils.getTimezoneOffset("Europe/London", date);
	expect(londonOffset).toBe(60);

	const newYorkOffset = utils.getTimezoneOffset("America/New_York", date);
	expect(newYorkOffset).toBe(-240);

	const sydneyOffset = utils.getTimezoneOffset("Australia/Sydney", date);
	expect(sydneyOffset).toBe(600);

	const invalidOffset = utils.getTimezoneOffset("invalid", date);
	expect(invalidOffset).toBe(0);
});

describe("searchParamsToObject", () => {
	it("should convert search params to object correctly", () => {
		const searchParams = new URLSearchParams({
			foo: "bar",
			baz: "qux",
		});

		const object = utils.searchParamsToObject(searchParams);

		expect(object).toEqual({
			foo: "bar",
			baz: "qux",
		});
	});

	it("should convert search params to object correctly with empty search params", () => {
		const searchParams = new URLSearchParams();

		const object = utils.searchParamsToObject(searchParams);

		expect(object).toEqual({});
	});
});

test("PaginationOptionsSchema correctly validates pagination options and returns default values if incorrect values are passed", () => {
	const validOptions = {
		page: 1,
		limit: 10,
		sortDirection: "asc",
	};
	expect(utils.PaginationOptionsSchema.parse(validOptions)).toStrictEqual({
		page: 1,
		limit: 10,
		sortDirection: "asc",
	});

	const invalidOptions = {
		page: 0,
		limit: 10000,
		sortBy: "foo",
		sortDirection: "bar",
	};
	expect(utils.PaginationOptionsSchema.parse(invalidOptions)).toStrictEqual({
		page: 1,
		limit: 100,
		sortBy: "foo",
		sortDirection: "asc",
	});
});
