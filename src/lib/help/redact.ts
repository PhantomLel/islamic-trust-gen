export type RedactionResult = {
	text: string;
	hadSensitiveData: boolean;
	markers: string[];
};

const SSN = /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g;
const ACCOUNT_NUMBER = /\b(?:\d[ -]*?){13,19}\b/g;
const PRIVATE_KEY_HEX = /\b(?:0x)?[a-fA-F0-9]{64}\b/g;
const SEED_HINT = /\b(seed phrase|recovery phrase|private key|mnemonic|passphrase)\b/i;
const PASSWORD_HINT = /\b(password|bank login|login credentials)\b/i;
const DOB = /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g;

export function redactSensitiveText(input: string): RedactionResult {
	let text = input.slice(0, 2000);
	const markers: string[] = [];
	let hadSensitiveData = false;

	const replace = (pattern: RegExp, marker: string) => {
		if (pattern.test(text)) {
			hadSensitiveData = true;
			markers.push(marker);
			text = text.replace(pattern, `[redacted: ${marker}]`);
		}
	};

	replace(SSN, 'possible SSN');
	replace(ACCOUNT_NUMBER, 'possible account number');
	replace(PRIVATE_KEY_HEX, 'possible private key');
	replace(DOB, 'possible date of birth');

	if (SEED_HINT.test(text)) {
		hadSensitiveData = true;
		markers.push('credential reference');
	}
	if (PASSWORD_HINT.test(text)) {
		hadSensitiveData = true;
		markers.push('credential reference');
	}

	return { text, hadSensitiveData, markers: [...new Set(markers)] };
}
