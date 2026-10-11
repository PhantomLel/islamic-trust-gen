import { freeWillSigningWrapper } from '$lib/free-will/deliveryCopy';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { WillPdfContext } from './context';

const TITLE = 'LAST WILL AND TESTAMENT OF {{testator_full_name}}';
const CA_INTRO =
	'I, {{testator_full_name}}, residing at {{street_address}}, {{city}}, California {{zip}}, being of sound mind and at least eighteen years of age, make this Last Will and Testament. I revoke all prior wills and codicils.';
const TX_INTRO =
	'I, {{testator_full_name}}, residing at {{street_address}}, {{city}}, Texas {{zip}}, being of sound mind and at least eighteen years of age, make this Last Will and Testament. I revoke all prior wills and codicils.';
const MUSLIM =
	'I am a Muslim. I intend my probate estate to be distributed in a manner consistent with the Islamic rules of inheritance (faraid) according to the Hanafi method, subject to applicable law, beneficiary designations, nonprobate transfers, and the terms of this Will.';
const MARITAL = 'My marital status is: {{marital_status_display}}.';
const SPOUSE = 'My spouse is {{spouse_name}}.';
const CHILDREN = 'My children are: {{children_names_joined}}.';
const NO_CHILDREN = 'I have no children.';
const PARENTS =
	'My parents are: {{father_name}} ({{living_or_deceased}}) and {{mother_name}} ({{living_or_deceased}}).';
const HEIRS_LISTED =
	'The persons I identified as my heirs under Islamic inheritance law when I signed this Will are listed in Appendix A.';
const EXECUTORS =
	'I nominate {{executor_1}} as Executor of this Will. If {{executor_1}} is unable or unwilling to serve, I nominate {{executor_2}}.';
const EXECUTOR_3 = 'If neither can serve, I nominate {{executor_3}}.';
const DEBTS =
	'My Executor shall pay from my probate estate my legally enforceable debts, funeral and burial expenses, expenses of administration, and taxes, if any. I also request, to the extent lawful and administratively reasonable, that my Executor consider unpaid Islamic obligations that I identify in writing, including unpaid zakat, fidya, kaffarah, debts owed to individuals, or other obligations listed in any letter of instruction.';
const FUNERAL =
	'I request that my body be washed, shrouded, prayed over, and buried according to Islamic practice as soon as reasonably possible, and that there be no cremation unless required by law. These wishes are directions to my family and Executor to the extent permitted by law. I understand that some funeral decisions may need to be made before this Will is admitted to probate.';
const WASIYYAH_INTRO =
	'I give the following gifts to charitable organizations and to persons who are not my heirs under Islamic inheritance law, from no more than one-third of my probate estate remaining after the payments described in Section 3:';
const GIFT_RECIPIENT = 'Recipient';
const GIFT_SHARE = 'Share of estate';
const GIFT_EIN = 'EIN (charities)';
const GIFT_NOTES = 'Notes';
const WASIYYAH_REDUCE =
	"If these gifts together exceed one-third of my probate estate remaining after those payments, each gift shall be reduced proportionally so that together they equal one-third. A gift under this Section to a person who does not survive me lapses, does not pass to that person's descendants, and becomes part of my residuary estate.";
const NO_WASIYYAH = 'I make no wasiyyah gifts.';
const RESIDUE_1 =
	'After the payments described in Section 3 and any gifts under Section 5, I give the residue of my probate estate to the persons who are my heirs under Islamic inheritance law, determined as of the date of my death, in the shares that law assigns to them under the Hanafi method.';
const RESIDUE_2 =
	'Appendix A shows how those shares are calculated for the family members I identified when I signed this Will. If every person listed in Appendix A survives me and no other person has become my heir, my Executor shall distribute the residue in the shares shown in Appendix A. If any person listed in Appendix A does not survive me, or if any person not listed has become my heir, including through marriage, birth, or adoption, the shares shall be recalculated under the same method based on my heirs at my death, and Appendix A shall serve only as a guide to that method.';
const RESIDUE_3 =
	'My Executor may rely on a written calculation prepared or confirmed by a qualified Islamic inheritance scholar or by an attorney experienced in Islamic inheritance, and shall not be liable for acting in good faith on that calculation.';
const CA_ANTILAPSE =
	'The gift in this Section is a gift to a class: my heirs under Islamic inheritance law as determined at my death. A share that would have passed to a person who does not survive me shall not pass under any anti-lapse statute, including California Probate Code section 21110, and shall instead be distributed by the recalculation described above.';
const TX_ANTILAPSE =
	'The gift in this Section is a gift to a class: my heirs under Islamic inheritance law as determined at my death. A share that would have passed to a person who does not survive me shall not pass under any anti-lapse statute, including Texas Estates Code section 255.153, and shall instead be distributed by the recalculation described above.';
const CA_INTESTACY =
	'If for any reason the residue cannot be distributed under this Section, it shall pass to the persons who would inherit it under the California law of intestate succession in effect at my death.';
const TX_INTESTACY =
	'If for any reason the residue cannot be distributed under this Section, it shall pass to the persons who would inherit it under the Texas law of intestate succession in effect at my death.';
const SURVIVAL =
	'A person must survive me to take under this Will. If a person and I die in circumstances in which the order of our deaths cannot be established by clear and convincing evidence, that person shall be treated as not having survived me.';
const GUARDIAN =
	'If a guardian is needed for any minor child of mine, I nominate {{guardian_1}} as guardian of the person and of the estate of each minor child of mine. If {{guardian_1}} cannot serve, I nominate {{guardian_2}}.';
const GUARDIAN_RAISE =
	"I request that any guardian raise my children as Muslims, maintain their connection to the Muslim community, preserve their family relationships, and consider Islamic education, Arabic and Qur'an education, and halal food and lifestyle needs.";
const CA_MINORS =
	"If any property passes under this Will to a person under twenty-five years of age, my Executor may distribute it to a custodian for that person under the California Uniform Transfers to Minors Act, to be held until the person reaches age twenty-five. I nominate as custodian the person then serving as guardian of that person's estate, or if none, my Executor.";
const TX_MINORS =
	"If any property passes under this Will to a person under twenty-one years of age, my Executor may distribute it to a custodian for that person under the Texas Uniform Transfers to Minors Act, to be held until the person reaches age twenty-one. I nominate as custodian the person then serving as guardian of that person's estate, or if none, my Executor.";
const DIGITAL =
	"My Executor may access, manage, copy, preserve, delete, or transfer my digital assets and electronic communications to the fullest extent permitted by law and by any service provider's terms, for the limited purpose of administering my estate, preserving family records, and carrying out this Will.";
const NONPROBATE =
	'I understand that this Will may not control assets passing by beneficiary designation, survivorship, pay-on-death or transfer-on-death designation, joint tenancy, trust, or other nonprobate transfer. I request that my family and advisors review those assets for consistency with my Islamic estate planning goals.';
const CA_COMMUNITY =
	"California is a community property state. This Will controls only property I have the legal power to transfer by will, including my separate property and my one-half interest in community property. It does not transfer my spouse's share of community property.";
const TX_COMMUNITY =
	"Texas is a community property state. This Will controls only property I have the legal power to transfer by will, including my separate property and my one-half interest in community property. It does not transfer my spouse's share of community property.";
const RECONCILE =
	'I request that my family honor this Will and resolve any disagreements with Islamic manners, consultation, mediation, and, where appropriate, advice from qualified scholars and counsel. To the extent enforceable under applicable law, any person who contests this Will without probable cause shall forfeit any benefit provided to that person under this Will.';
const CA_ADMIN =
	'I request that my Executor be granted the broadest authority available under the California Independent Administration of Estates Act, to the maximum extent permitted by law. I understand that the probate court must grant that authority as provided by California law.';
const TX_ADMIN =
	'I direct that my estate be administered as an independent administration, with no action in the probate court other than the probating of this Will and the filing of an inventory, appraisement, and list of claims, or an affidavit in lieu of them, to the extent permitted by Texas law.';
const NO_BOND =
	'No bond, surety, or other security shall be required of any Executor, Guardian, or Custodian nominated or appointed under this Will, to the fullest extent permitted by law.';
const CA_POWERS =
	'My Executor shall have all powers available to a personal representative under California law and all powers necessary or advisable to collect, manage, protect, sell, lease, insure, invest, distribute, and otherwise administer my estate, including authority to sell real or personal property, settle claims, employ professionals, maintain or close accounts, handle tax matters, and distribute property in cash or in kind, subject to any court supervision or notice requirements that apply.';
const TX_POWERS =
	'My Executor shall have all powers available to a personal representative under Texas law and all powers necessary or advisable to collect, manage, protect, sell, lease, insure, invest, distribute, and otherwise administer my estate, including authority to sell real or personal property, settle claims, employ professionals, maintain or close accounts, handle tax matters, and distribute property in cash or in kind, subject to any court supervision or notice requirements that apply.';
const SCHEDULE_INTRO = 'Appendix A, which immediately follows and forms part of this Will, is incorporated by reference.';
const APPENDIX_HEADING = 'APPENDIX A — Islamic Inheritance Schedule';
const APPENDIX_METHOD =
	'Method: Hanafi. Calculated for the family members identified by {{testator_full_name}} when this Will was prepared. Some schools of Islamic law calculate certain family situations differently. Section 6 of this Will governs if my heirs at my death differ from those listed below.';
const HEIR_NAME = 'Heir';
const HEIR_RELATIONSHIP = 'Relationship';
const HEIR_SHARE = 'Share';
const HEIR_PERCENT = 'Approx. %';
const CA_EXECUTION =
	'I sign this Will on ____________________, 20____, at ______________________, California. I declare that this instrument is my Last Will and Testament and that I sign it willingly as my free act.';
const TX_EXECUTION =
	'I sign this Will on ____________________, 20____, at ______________________, Texas. I declare that this instrument is my Last Will and Testament and that I sign it willingly as my free act.';
const SIGNATURE_LINE = '______________________________________________';
const TESTATOR_LINE = '{{testator_full_name}}, Testator';
const CA_WITNESS =
	"We, the undersigned witnesses, sign our names to this Will during the lifetime of the Testator. We were both present at the same time. The Testator signed this Will, or acknowledged the Testator's signature or this Will, in our presence. We understand that this instrument is the Testator's Will. The Testator appeared to be of sound mind and free from undue influence.";
const TX_WITNESS =
	"The foregoing instrument was, on the date shown above, signed and declared by {{testator_full_name}} to be the Testator's Last Will and Testament in our presence. At the Testator's request, in the Testator's presence, and in the presence of each other, we sign our names as witnesses. Each of us is at least fourteen years of age.";
const WITNESS_1_SIGNATURE = '______________________________  Witness 1 signature';
const WITNESS_1_NAME = '______________________________  Witness 1 printed name and address';
const WITNESS_2_SIGNATURE = '______________________________  Witness 2 signature';
const WITNESS_2_NAME = '______________________________  Witness 2 printed name and address';
const AFFIDAVIT_STATE = 'THE STATE OF TEXAS';
const AFFIDAVIT_COUNTY = 'COUNTY OF ______________________';
const AFFIDAVIT_BODY =
	"Before me, the undersigned authority, on this day personally appeared {{FULL_LEGAL_NAME}}, _________, and _________, known to me to be the testator and the witnesses, respectively, whose names are subscribed to the annexed or foregoing instrument in their respective capacities, and all of said persons being by me duly sworn, the said {{FULL_LEGAL_NAME}}, testator, declared to me and to the said witnesses in my presence that said instrument is the testator's Will, and that the testator had willingly made and executed it as the testator's free act and deed; and the said witnesses, each on the witness's oath stated to me, in the presence and hearing of the said testator, that the said testator had declared to them that said instrument is the testator's Will, and that the testator executed same as such and wanted each of them to sign it as a witness; and upon their oaths each witness stated further that they did sign the same as witnesses in the presence of the said testator and at the testator's request; that the testator was at that time eighteen years of age or over and was of sound mind; and that each of said witnesses was then at least fourteen years of age.";
const AFFIDAVIT_TESTATOR = 'Testator';
const AFFIDAVIT_WITNESS_1 = 'Witness 1';
const AFFIDAVIT_WITNESS_2 = 'Witness 2';
const AFFIDAVIT_NOTARY_INTRO =
	'Subscribed and sworn to before me by {{FULL_LEGAL_NAME}}, testator, and by _________ and _________, witnesses, this ____ day of __________, 20____.';
const AFFIDAVIT_NOTARY = 'Notary Public, State of Texas';
const SIGNING_HEADING = 'Signing Instructions — not part of your Will. Keep with it.';
const CA_STEP_1 = '1. Print every page, single-sided. Do not separate, remove, or replace any page.';
const CA_STEP_2 = '2. Do not sign alone. Sign in front of two witnesses who are both present at the same time.';
const CA_STEP_3 =
	"3. Use two adult witnesses who receive nothing under the Will. Do not use a beneficiary, a beneficiary's spouse, or anyone named as Executor or Guardian.";
const CA_STEP_4 = '4. Each witness signs and prints their name and address after you sign.';
const CA_STEP_5 =
	'5. California does not require a notary for a will. Do not have the Will notarized in place of the two witnesses.';
const CA_STEP_6 = '6. Do not write on or change the Will after signing. To change it, make a new will.';
const CA_STEP_7 = '7. Keep the signed original somewhere safe and tell your Executor where it is.';
const TX_STEP_1 = '1. Print every page, single-sided. Do not separate, remove, or replace any page.';
const TX_STEP_2 = '2. Sign in person. Your will cannot be signed through an online notary or a video session.';
const TX_STEP_3 =
	'3. Have two witnesses with you at the same time. Each must be at least 14 years old and receive nothing under the Will.';
const TX_STEP_4 = '4. Sign the Will in front of both witnesses. Each witness then signs in front of you.';
const TX_STEP_5 =
	'5. Sign the self-proving affidavit in front of a notary who is physically present, with both witnesses also signing before the notary.';
const TX_STEP_6 = '6. Notarization alone is not a substitute for the two witnesses.';
const TX_STEP_7 = '7. Do not write on or change the Will after signing. To change it, make a new will.';
const TX_STEP_8 = '8. Keep the signed original somewhere safe that your Executor can reach.';
const LIMITATIONS_HEADING = 'Limitations of this Free Will — not part of your Will. Keep with it.';
const LIMIT_1 = 'No attorney has reviewed your answers or this document.';
const LIMIT_2 = 'This Will may not avoid probate.';
const LIMIT_3 =
	'This Will may not control retirement accounts, life insurance, joint accounts, TOD/POD accounts, trust assets, or property with survivorship rights.';
const LIMIT_4 = 'A will alone may not fully carry out Islamic inheritance in a community property state.';
const LIMIT_5 =
	'Consider an attorney if you own a home, have minor children, a blended family, a business, a beneficiary with special needs, substantial debts, an expected dispute, or immigration questions, or if you want Islamic inheritance applied across assets outside your will.';
const LIMIT_6 =
	'Make a new will after marriage, divorce, the birth or adoption of a child, the death of an heir, a major change in assets, or a move to another state.';

const SECTION = {
	family: '1. Family Information',
	executor: '2. Executor',
	debts: '3. Debts, Expenses, and Islamic Obligations',
	funeral: '4. Funeral and Burial Wishes',
	wasiyyah: '5. Wasiyyah',
	residue: '6. Residuary Estate — Islamic Distribution',
	survival: '7. Survival',
	minors: '8. Minor Children and Property for Minors',
	digital: '9. Digital Assets and Personal Records',
	nonprobate: '10. Nonprobate Assets and Beneficiary Designations',
	community: '11. Community Property',
	reconcile: '12. Family Reconciliation',
	admin: '13. Independent Administration',
	bond: '14. No Bond',
	powers: '15. Executor Powers',
	schedule: '16. Islamic Inheritance Schedule',
	execution: '17. Execution',
	witness: '18. Witness Attestation',
	affidavit: '19. Self-Proving Affidavit',
} as const;

/** Every fixed sentence printed in a will or sheet. Each one is copied from TPL. */
export const fixedSentences: readonly string[] = [
	TITLE,
	CA_INTRO,
	TX_INTRO,
	MUSLIM,
	MARITAL,
	SPOUSE,
	CHILDREN,
	NO_CHILDREN,
	PARENTS,
	HEIRS_LISTED,
	EXECUTORS,
	EXECUTOR_3,
	DEBTS,
	FUNERAL,
	WASIYYAH_INTRO,
	GIFT_RECIPIENT,
	GIFT_SHARE,
	GIFT_EIN,
	GIFT_NOTES,
	WASIYYAH_REDUCE,
	NO_WASIYYAH,
	RESIDUE_1,
	RESIDUE_2,
	RESIDUE_3,
	CA_ANTILAPSE,
	TX_ANTILAPSE,
	CA_INTESTACY,
	TX_INTESTACY,
	SURVIVAL,
	GUARDIAN,
	GUARDIAN_RAISE,
	CA_MINORS,
	TX_MINORS,
	DIGITAL,
	NONPROBATE,
	CA_COMMUNITY,
	TX_COMMUNITY,
	RECONCILE,
	CA_ADMIN,
	TX_ADMIN,
	NO_BOND,
	CA_POWERS,
	TX_POWERS,
	SCHEDULE_INTRO,
	APPENDIX_HEADING,
	APPENDIX_METHOD,
	HEIR_NAME,
	HEIR_RELATIONSHIP,
	HEIR_SHARE,
	HEIR_PERCENT,
	CA_EXECUTION,
	TX_EXECUTION,
	SIGNATURE_LINE,
	TESTATOR_LINE,
	CA_WITNESS,
	TX_WITNESS,
	WITNESS_1_SIGNATURE,
	WITNESS_1_NAME,
	WITNESS_2_SIGNATURE,
	WITNESS_2_NAME,
	AFFIDAVIT_STATE,
	AFFIDAVIT_COUNTY,
	AFFIDAVIT_BODY,
	AFFIDAVIT_TESTATOR,
	AFFIDAVIT_WITNESS_1,
	AFFIDAVIT_WITNESS_2,
	AFFIDAVIT_NOTARY_INTRO,
	AFFIDAVIT_NOTARY,
	SIGNING_HEADING,
	freeWillSigningWrapper,
	CA_STEP_1,
	CA_STEP_2,
	CA_STEP_3,
	CA_STEP_4,
	CA_STEP_5,
	CA_STEP_6,
	CA_STEP_7,
	TX_STEP_2,
	TX_STEP_3,
	TX_STEP_4,
	TX_STEP_5,
	TX_STEP_6,
	TX_STEP_7,
	TX_STEP_8,
	LIMITATIONS_HEADING,
	LIMIT_1,
	LIMIT_2,
	LIMIT_3,
	LIMIT_4,
	LIMIT_5,
	LIMIT_6,
	...Object.values(SECTION),
];

export { freeWillSigningWrapper };

function pick(ctx: WillPdfContext, california: string, texas: string): string {
	return ctx.stateCode === 'CA' ? california : texas;
}

function fill(template: string, ctx: WillPdfContext): string {
	const statuses = [ctx.fatherStatus, ctx.motherStatus];
	let livingIndex = 0;
	const values: Record<string, string> = {
		testator_full_name: ctx.testatorFullName,
		street_address: ctx.streetAddress,
		city: ctx.city,
		zip: ctx.zip,
		marital_status_display: ctx.maritalStatusDisplay,
		spouse_name: ctx.spouseName,
		children_names_joined: ctx.childrenNamesJoined ?? '',
		father_name: ctx.fatherName,
		mother_name: ctx.motherName,
		executor_1: ctx.executor1,
		executor_2: ctx.executor2,
		executor_3: ctx.executor3 ?? '',
		guardian_1: ctx.guardian1 ?? '',
		guardian_2: ctx.guardian2 ?? '',
		FULL_LEGAL_NAME: ctx.testatorFullName,
	};
	const filled = template.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (_whole, key: string) => {
		if (key === 'living_or_deceased') {
			const status = statuses[livingIndex++];
			if (!status) throw new Error('Missing parent status');
			return status;
		}
		if (!(key in values)) throw new Error(`Unknown merge field ${key}`);
		return values[key];
	});
	if (filled.includes('{{') || filled.includes('[IF')) throw new Error('Unresolved template marker');
	return filled;
}

function paragraph(text: string): Content {
	return { text, margin: [0, 0, 0, 8] };
}

function heading(text: string): Content {
	return { text, style: 'heading' };
}

const styles = {
	title: { bold: true, fontSize: 14, alignment: 'center' as const, margin: [0, 0, 0, 14] as [number, number, number, number] },
	heading: { bold: true, fontSize: 12, margin: [0, 12, 0, 6] as [number, number, number, number] },
};

const defaultStyle = { font: 'NotoSerif', fontSize: 11, lineHeight: 1.25 };

function headerCell(text: string): Content {
	return { text, bold: true };
}

/** Will text through the last signature page. Footer counts these pages only. */
export function buildWillDefinition(ctx: WillPdfContext): TDocumentDefinitions {
	const content: Content[] = [
		{ text: fill(TITLE, ctx), style: 'title' },
		paragraph(fill(pick(ctx, CA_INTRO, TX_INTRO), ctx)),
		paragraph(MUSLIM),
		heading(SECTION.family),
		paragraph(fill(MARITAL, ctx)),
	];
	if (ctx.married) content.push(paragraph(fill(SPOUSE, ctx)));
	content.push(paragraph(ctx.childrenNamesJoined ? fill(CHILDREN, ctx) : NO_CHILDREN));
	content.push(paragraph(fill(PARENTS, ctx)));
	content.push(paragraph(HEIRS_LISTED));
	content.push(heading(SECTION.executor));
	content.push(paragraph(fill(EXECUTORS, ctx)));
	if (ctx.executor3) content.push(paragraph(fill(EXECUTOR_3, ctx)));
	content.push(heading(SECTION.debts), paragraph(DEBTS));
	content.push(heading(SECTION.funeral), paragraph(FUNERAL));
	content.push(heading(SECTION.wasiyyah));
	if (ctx.gifts.length > 0) {
		content.push(paragraph(WASIYYAH_INTRO));
		content.push({
			table: {
				headerRows: 1,
				widths: ['*', 80, 80, '*'],
				body: [
					[GIFT_RECIPIENT, GIFT_SHARE, GIFT_EIN, GIFT_NOTES].map(headerCell),
					...ctx.gifts.map((gift) => [gift.recipient, `${gift.percent}%`, gift.ein, gift.notes]),
				],
			},
			margin: [0, 0, 0, 8],
		});
		content.push(paragraph(WASIYYAH_REDUCE));
	} else {
		content.push(paragraph(NO_WASIYYAH));
	}
	content.push(
		heading(SECTION.residue),
		paragraph(RESIDUE_1),
		paragraph(RESIDUE_2),
		paragraph(RESIDUE_3),
		paragraph(pick(ctx, CA_ANTILAPSE, TX_ANTILAPSE)),
		paragraph(pick(ctx, CA_INTESTACY, TX_INTESTACY)),
		heading(SECTION.survival),
		paragraph(SURVIVAL),
		heading(SECTION.minors),
	);
	if (ctx.hasMinorChildren) {
		content.push(paragraph(fill(GUARDIAN, ctx)), paragraph(GUARDIAN_RAISE));
	}
	content.push(
		paragraph(pick(ctx, CA_MINORS, TX_MINORS)),
		heading(SECTION.digital),
		paragraph(DIGITAL),
		heading(SECTION.nonprobate),
		paragraph(NONPROBATE),
		heading(SECTION.community),
		paragraph(pick(ctx, CA_COMMUNITY, TX_COMMUNITY)),
		heading(SECTION.reconcile),
		paragraph(RECONCILE),
		heading(SECTION.admin),
		paragraph(pick(ctx, CA_ADMIN, TX_ADMIN)),
		heading(SECTION.bond),
		paragraph(NO_BOND),
		heading(SECTION.powers),
		paragraph(pick(ctx, CA_POWERS, TX_POWERS)),
		heading(SECTION.schedule),
		paragraph(SCHEDULE_INTRO),
		heading(APPENDIX_HEADING),
		paragraph(fill(APPENDIX_METHOD, ctx)),
		{
			table: {
				headerRows: 1,
				widths: ['*', '*', 'auto', 'auto'],
				body: [
					[HEIR_NAME, HEIR_RELATIONSHIP, HEIR_SHARE, HEIR_PERCENT].map(headerCell),
					...ctx.heirs.map((heir) => [heir.name, heir.relationship, heir.fraction, heir.percent]),
				],
			},
			margin: [0, 0, 0, 8],
		},
		heading(SECTION.execution),
		paragraph(pick(ctx, CA_EXECUTION, TX_EXECUTION)),
		paragraph(SIGNATURE_LINE),
		paragraph(fill(TESTATOR_LINE, ctx)),
		heading(SECTION.witness),
		paragraph(fill(pick(ctx, CA_WITNESS, TX_WITNESS), ctx)),
		paragraph(WITNESS_1_SIGNATURE),
		paragraph(WITNESS_1_NAME),
		paragraph(WITNESS_2_SIGNATURE),
		paragraph(WITNESS_2_NAME),
	);
	if (ctx.stateCode === 'TX') {
		content.push(
			heading(SECTION.affidavit),
			paragraph(AFFIDAVIT_STATE),
			paragraph(AFFIDAVIT_COUNTY),
			paragraph(fill(AFFIDAVIT_BODY, ctx)),
			paragraph(SIGNATURE_LINE),
			paragraph(AFFIDAVIT_TESTATOR),
			paragraph(SIGNATURE_LINE),
			paragraph(AFFIDAVIT_WITNESS_1),
			paragraph(SIGNATURE_LINE),
			paragraph(AFFIDAVIT_WITNESS_2),
			paragraph(fill(AFFIDAVIT_NOTARY_INTRO, ctx)),
			paragraph(SIGNATURE_LINE),
			paragraph(AFFIDAVIT_NOTARY),
		);
	}

	return {
		pageSize: 'LETTER',
		pageMargins: [54, 54, 54, 64],
		defaultStyle,
		styles,
		footer: (currentPage, pageCount) => ({
			text: `Page ${currentPage} of ${pageCount}`,
			alignment: 'center',
			fontSize: 9,
			margin: [0, 12, 0, 0],
		}),
		content,
	};
}

/** Signing sheet and limitations sheet. No page numbers. */
export function buildSheetsDefinition(ctx: WillPdfContext): TDocumentDefinitions {
	const steps =
		ctx.stateCode === 'CA'
			? [CA_STEP_1, CA_STEP_2, CA_STEP_3, CA_STEP_4, CA_STEP_5, CA_STEP_6, CA_STEP_7]
			: [TX_STEP_1, TX_STEP_2, TX_STEP_3, TX_STEP_4, TX_STEP_5, TX_STEP_6, TX_STEP_7, TX_STEP_8];
	return {
		pageSize: 'LETTER',
		pageMargins: [54, 54, 54, 54],
		defaultStyle,
		styles,
		content: [
			heading(SIGNING_HEADING),
			paragraph(freeWillSigningWrapper),
			...steps.map(paragraph),
			{ text: LIMITATIONS_HEADING, style: 'heading', pageBreak: 'before' },
			...[LIMIT_1, LIMIT_2, LIMIT_3, LIMIT_4, LIMIT_5, LIMIT_6].map(paragraph),
		],
	};
}
