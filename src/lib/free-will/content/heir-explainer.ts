export type GuideSection = {
	id: string;
	title: string;
	paragraphs: string[];
	bullets?: string[];
};

export const heirExplainerSections: GuideSection[] = [
	{
		id: 'why',
		title: 'Why we ask these questions',
		paragraphs: [
			'Islamic inheritance is not distributed only according to personal preference. The Qur\u2019an and traditional rules of faraid identify certain relatives who may receive fixed or residual shares.',
			'The final distribution depends on which relatives are alive when you die, their relationship to you, whether a closer heir prevents a more distant relative from inheriting, and whether any religious or legal eligibility issue applies.',
			'That is why the calculator asks about your spouse, parents, children, siblings, and other relatives.',
		],
	},
	{
		id: 'alive',
		title: 'Include people who are alive',
		paragraphs: [
			'Only a person who survives you can inherit from you. When completing your will today, include the relatives who are currently alive. The final shares will be recalculated after your death based on which eligible heirs are then living.',
			'You do not need to predict who will die first.',
		],
	},
	{
		id: 'spouse',
		title: 'Spouse',
		paragraphs: [
			'Include your current husband or wife if you are legally and Islamically married. A spouse generally receives a defined Qur\u2019anic share.',
			'Do not leave out a spouse merely because you are separated but still married, you intend to give the spouse property another way, you believe the spouse already has enough, or you would prefer that the children receive everything.',
			'A former spouse does not inherit after a completed divorce, subject to any applicable religious or legal questions concerning the timing and status of the divorce.',
		],
	},
	{
		id: 'children',
		title: 'Children',
		paragraphs: ['Include your living biological children. This generally includes:'],
		bullets: [
			'Sons and daughters',
			'Children from a prior marriage',
			'Children who live in another household',
			'Adult and minor children',
		],
	},
	{
		id: 'adopted',
		title: 'Adopted children and stepchildren',
		paragraphs: [
			'An adopted child or stepchild is deeply part of the family, but traditional faraid rules generally do not treat that child as a biological Qur\u2019anic heir solely because of the adoption or marriage relationship.',
			'You may still provide for an adopted child or stepchild through a wasiyyah of up to one-third of the eligible estate, a lifetime gift, or a trust or other estate-planning arrangement.',
			'The distinction is about the technical inheritance category, not the value of the relationship.',
		],
	},
	{
		id: 'parents',
		title: 'Parents',
		paragraphs: [
			'Include your living mother and father. Parents may inherit even when you are married and have children.',
			'If you previously told us that a parent is deceased, that parent should not appear as a selectable living heir later in the flow.',
		],
	},
	{
		id: 'grandchildren',
		title: 'Grandchildren',
		paragraphs: [
			'Grandchildren do not always inherit automatically. Whether a grandchild inherits can depend on whether the grandchild\u2019s parent is alive, whether the grandchild descends through a son or daughter, which other heirs survive you, and the school of Islamic law being applied.',
			'Families with a deceased child who left children should obtain an attorney and qualified scholar review because a wasiyyah or trust may be needed to protect those grandchildren.',
		],
	},
	{
		id: 'siblings',
		title: 'Siblings and more distant relatives',
		paragraphs: [
			'Brothers and sisters may inherit in some family structures, but they are often excluded when closer heirs survive. Include the requested sibling information accurately; the calculator will determine whether a sibling receives a share.',
			'In some circumstances, grandparents, half-siblings, uncles, or other relatives may become relevant. The closer heirs usually take priority.',
		],
	},
	{
		id: 'muslim',
		title: 'Muslim-heir eligibility',
		paragraphs: [
			'Traditional Islamic inheritance rules generally require the inheriting relative and the deceased to share the relevant religious status required under the applied rules.',
			'Families involving converts, non-Muslim relatives, interfaith marriages, or disputed religious status should not be treated with harsh language. Where eligibility is unclear, include the family information accurately and book a consultation before relying on the result.',
		],
	},
	{
		id: 'lineage',
		title: 'Biological lineage and paternity questions',
		paragraphs: [
			'Traditional faraid rules can depend on legally and religiously recognized family relationships. Where parentage, adoption, assisted reproduction, surrogacy, or another lineage issue may affect the calculation, seek a consultation with an attorney and, where appropriate, a qualified Islamic scholar.',
		],
	},
	{
		id: 'not-heirs',
		title: 'A person may be family but not a faraid heir',
		paragraphs: ['The following people do not automatically become Qur\u2019anic heirs solely because of their relationship with you:'],
		bullets: [
			'Stepchildren, adopted children, and foster children',
			'Friends, fianc\u00e9s, unmarried partners, and in-laws',
			'Charities and mosques',
		],
	},
	{
		id: 'death',
		title: 'The shares are determined at death',
		paragraphs: [
			'The shares displayed today are an estimate based on the family information you entered. The actual distribution must be recalculated after death because an heir may die before you, a new child may be born, your marital status may change, or another eligibility fact may change.',
			'Your will should direct the executor to calculate the shares based on the eligible heirs who are alive at your death rather than permanently assigning today\u2019s estimated percentages.',
		],
	},
	{
		id: 'help',
		title: 'When you should stop and get help',
		paragraphs: ['Book a consultation before relying on the calculator when:'],
		bullets: [
			'You have a blended family or adopted or stepchildren you wish to protect',
			'A child died and left children',
			'You or a close relative is a convert, or a spouse or family member is not Muslim',
			'There is uncertainty about marriage, divorce, parentage, or lineage',
			'You want to exclude a family member who may be a mandatory heir',
		],
	},
];

export const heirExplainerDisclaimer =
	'This explainer provides general educational information. It is not a fatwa, legal advice, or a final determination that any person is or is not entitled to inherit. Islamic-law conclusions may vary by school, scholar, and family facts. State and federal law may also affect how assets are transferred.';
