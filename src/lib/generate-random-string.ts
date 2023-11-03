type Options = {
	length: number;
	type: (typeof allowTypes)[number];
};

const allowTypes = ["numeric", "url-safe"] as const;

export function generateRandomString({ length, type }: Options) {
	if (!allowTypes.includes(type)) {
		throw new Error(`type must be one of ${allowTypes.join(", ")}`);
	}

	const numericCharacters =
		type === "url-safe" ? "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~" : "0123456789";
	const randomValues = new Uint32Array(length);

	// Generate random values using a CSPRNG
	crypto.getRandomValues(randomValues);

	let randomString = "";
	for (let i = 0; i < length; i++) {
		randomString += numericCharacters[randomValues[i]! % numericCharacters.length];
	}

	return randomString;
}
