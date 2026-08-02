export function isRecommendationQuestion(question: string): boolean {
	return /\b(which (is )?best|what should i choose|recommend|tell me what to pick|better option for me)\b/i.test(
		question,
	);
}

export function isDraftingRequest(question: string): boolean {
	return /\b(draft|write|wording for|clause language|modify my trust language|example language)\b/i.test(
		question,
	);
}

export function isFaraidCalculationRequest(question: string): boolean {
	return /\b(calculate my share|what is my faraid share|custom share calculation)\b/i.test(question);
}
