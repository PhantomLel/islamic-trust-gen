/** Keywords that suggest the user is listing a vehicle (soft warning only). */
const VEHICLE_KEYWORDS = [
	'car',
	'vehicle',
	'truck',
	'suv',
	'van',
	'motorcycle',
	'toyota',
	'honda',
	'ford',
	'chevy',
	'chevrolet',
	'tesla',
	'nissan',
	'bmw',
	'mercedes',
	'lexus',
	'hyundai',
	'kia',
] as const;

const VEHICLE_PATTERN = new RegExp(
	`\\b(?:${VEHICLE_KEYWORDS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
	'i',
);

export function textLooksLikeVehicle(text: string): boolean {
	return VEHICLE_PATTERN.test(text.trim());
}

export const VEHICLE_WARNING_COPY =
	'Please do not list vehicles here. We generally recommend using your state’s vehicle transfer-on-death form instead of putting cars into the trust.';

export const DO_LIST_ASSETS = [
	'Home',
	'Bank accounts',
	'Investment accounts',
	'Retirement accounts',
	'Business interests',
	'Rental property / other real estate',
	'Fine jewelry / art / collectibles',
	'Other high-value or important personal items',
] as const;

export const DO_NOT_LIST_ASSETS = [
	'Cars or vehicles',
	'Clothing',
	'Furniture',
	'Appliances',
	'Dishes',
	'Ordinary electronics',
	'Everyday household items',
	'Low-value personal property',
] as const;
