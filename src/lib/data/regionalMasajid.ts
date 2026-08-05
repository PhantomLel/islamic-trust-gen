/** Regional masajid catalog for charitable wasiyyah bequests. Expand by adding new state keys. */
export type RegionalMasjid = {
	id: string;
	name: string;
	city: string;
	region: string;
	address: string;
	state: string;
};

export type RegionalMasajidCatalog = Record<string, RegionalMasjid[]>;

/** Masajid organized by U.S. state code (currently Texas only). */
export const regionalMasajid: RegionalMasajidCatalog = {
	TX: 	[
		{
			"id": "islamic-center-of-greater-austin-austin",
			"name": "Islamic Center of Greater Austin",
			"city": "Austin",
			"region": "Central Texas",
			"address": "5110 Manor Rd, Austin, TX 78723",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-lake-travis-austin",
			"name": "Islamic Center of Lake Travis",
			"city": "Austin",
			"region": "Central Texas",
			"address": "4701 Doss Rd, Austin, TX 78734",
			"state": "TX"
		},
		{
			"id": "masjid-ibrahim-austin",
			"name": "Masjid Ibrahim",
			"city": "Austin",
			"region": "Central Texas",
			"address": "8521 State Hwy 71, Austin, TX 78735",
			"state": "TX"
		},
		{
			"id": "new-africa-islamic-community-austin",
			"name": "New Africa Islamic Community",
			"city": "Austin",
			"region": "Central Texas",
			"address": "701 Tillery St, Austin, TX 78702",
			"state": "TX"
		},
		{
			"id": "north-austin-muslim-community-center-austin",
			"name": "North Austin Muslim Community Center",
			"city": "Austin",
			"region": "Central Texas",
			"address": "11900 N Lamar Blvd, Austin, TX 78753",
			"state": "TX"
		},
		{
			"id": "nueces-mosque-austin",
			"name": "Nueces Mosque",
			"city": "Austin",
			"region": "Central Texas",
			"address": "1906 Nueces St, Austin, TX 78705",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-college-station-bryan-bryan",
			"name": "Islamic Center of College Station/Bryan",
			"city": "Bryan",
			"region": "Central Texas",
			"address": "106 Sulphur Springs Rd, Bryan, TX 77801",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-brushy-creek-cedar-park",
			"name": "Islamic Center of Brushy Creek",
			"city": "Cedar Park",
			"region": "Central Texas",
			"address": "1950 Brushy Creek Rd, Cedar Park, TX 78613",
			"state": "TX"
		},
		{
			"id": "islamic-community-of-bryan-college-station-college-station",
			"name": "Islamic Community of Bryan/College Station",
			"city": "College Station",
			"region": "Central Texas",
			"address": "417 Stasney St, College Station, TX 77840",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-hewitt-masjid-al-hidaya-hewitt",
			"name": "Islamic Center of Hewitt / Masjid Al-Hidaya",
			"city": "Hewitt",
			"region": "Central Texas",
			"address": "201 Regal Dr, Hewitt, TX 76643",
			"state": "TX"
		},
		{
			"id": "islamic-community-of-greater-killeen-killeen",
			"name": "Islamic Community of Greater Killeen",
			"city": "Killeen",
			"region": "Central Texas",
			"address": "5600 TX-195, Killeen, TX 76542",
			"state": "TX"
		},
		{
			"id": "masjid-taqwa-killeen-killeen",
			"name": "Masjid Taqwa Killeen",
			"city": "Killeen",
			"region": "Central Texas",
			"address": "5680 South Fort Hood Street, Killeen, TX 76542",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-hays-county-kyle",
			"name": "Islamic Center of Hays County",
			"city": "Kyle",
			"region": "Central Texas",
			"address": "2400 Windy Hill Rd, Kyle, TX 78640",
			"state": "TX"
		},
		{
			"id": "quad-city-islamic-center-north-austin-leander-leander",
			"name": "Quad City Islamic Center North Austin Leander",
			"city": "Leander",
			"region": "Central Texas",
			"address": "17317 RM 1431, Leander, TX 78641",
			"state": "TX"
		},
		{
			"id": "al-huda-mosque-manor",
			"name": "Al Huda Mosque",
			"city": "Manor",
			"region": "Central Texas",
			"address": "19529 Melber Ln, Manor, TX 78653",
			"state": "TX"
		},
		{
			"id": "al-noor-mosque-mcc-manor-manor",
			"name": "Al-Noor Mosque MCC Manor",
			"city": "Manor",
			"region": "Central Texas",
			"address": "1300 Old Hwy 20, Manor, TX 78653",
			"state": "TX"
		},
		{
			"id": "marble-falls-islamic-center-marble-falls",
			"name": "Marble Falls Islamic Center",
			"city": "Marble Falls",
			"region": "Central Texas",
			"address": "1103 Cedar Dr B, Marble Falls, TX 78654",
			"state": "TX"
		},
		{
			"id": "new-braunfels-islamic-center-new-braunfels",
			"name": "New Braunfels Islamic Center",
			"city": "New Braunfels",
			"region": "Central Texas",
			"address": "1658 Pahmeyer Rd, New Braunfels, TX 78130",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-pflugerville-pflugerville",
			"name": "Islamic Center of Pflugerville",
			"city": "Pflugerville",
			"region": "Central Texas",
			"address": "920 W Pflugerville Pkwy, Pflugerville, TX 78660",
			"state": "TX"
		},
		{
			"id": "baitul-muqeet-mosque-round-rock",
			"name": "Baitul Muqeet Mosque",
			"city": "Round Rock",
			"region": "Central Texas",
			"address": "800 Deep Wood Dr, Round Rock, TX 78681",
			"state": "TX"
		},
		{
			"id": "georgetown-islamic-center-round-rock",
			"name": "Georgetown Islamic Center",
			"city": "Round Rock",
			"region": "Central Texas",
			"address": "7275 Co Rd 110, Round Rock, TX 78665",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-round-rock-round-rock",
			"name": "Islamic Center of Round Rock",
			"city": "Round Rock",
			"region": "Central Texas",
			"address": "1951 Hampton Ln, Round Rock, TX 78664",
			"state": "TX"
		},
		{
			"id": "san-marcos-masjid-san-marcos",
			"name": "San Marcos Masjid",
			"city": "San Marcos",
			"region": "Central Texas",
			"address": "434 N Comanche St, San Marcos, TX 78666",
			"state": "TX"
		},
		{
			"id": "islamic-society-of-central-texas-temple",
			"name": "Islamic Society of Central Texas",
			"city": "Temple",
			"region": "Central Texas",
			"address": "3033 S Kegley Rd, Temple, TX 76502",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-waco-blue-mosque-waco",
			"name": "Islamic Center of Waco / Blue Mosque",
			"city": "Waco",
			"region": "Central Texas",
			"address": "2725 Benton Dr, Waco, TX 76706",
			"state": "TX"
		},
		{
			"id": "islamic-association-of-allen-allen",
			"name": "Islamic Association of Allen",
			"city": "Allen",
			"region": "DFW / North Texas",
			"address": "909 Allen Central Dr, Allen, TX 75013",
			"state": "TX"
		},
		{
			"id": "arlington-central-mosque-isat-arlington",
			"name": "Arlington Central Mosque / ISAT",
			"city": "Arlington",
			"region": "DFW / North Texas",
			"address": "1700 S Center St, Arlington, TX 76010",
			"state": "TX"
		},
		{
			"id": "dar-el-eman-islamic-center-arlington",
			"name": "Dar El-Eman Islamic Center",
			"city": "Arlington",
			"region": "DFW / North Texas",
			"address": "5511 Mansfield Rd, Arlington, TX 76017",
			"state": "TX"
		},
		{
			"id": "dar-el-quran-arlington",
			"name": "Dar El-Quran",
			"city": "Arlington",
			"region": "DFW / North Texas",
			"address": "110 N Davis Dr, Arlington, TX 76012",
			"state": "TX"
		},
		{
			"id": "dar-elsalam-islamic-center-arlington",
			"name": "Dar Elsalam Islamic Center",
			"city": "Arlington",
			"region": "DFW / North Texas",
			"address": "500 W Road to Six Flags St, Arlington, TX 76011",
			"state": "TX"
		},
		{
			"id": "fatima-al-zahra-arlington",
			"name": "Fatima Al-Zahra",
			"city": "Arlington",
			"region": "DFW / North Texas",
			"address": "3400 E Abram St, Arlington, TX 76010",
			"state": "TX"
		},
		{
			"id": "mansfield-islamic-center-arlington",
			"name": "Mansfield Islamic Center",
			"city": "Arlington",
			"region": "DFW / North Texas",
			"address": "6401 New York Ave #135, Arlington, TX 76018",
			"state": "TX"
		},
		{
			"id": "zia-ul-quran-masjid-arlington",
			"name": "Zia ul Quran Masjid",
			"city": "Arlington",
			"region": "DFW / North Texas",
			"address": "2425 Carter Dr, Arlington, TX 76014",
			"state": "TX"
		},
		{
			"id": "xhamia-shqiptare-dfw-masjid-albani-bedford",
			"name": "Xhamia Shqiptare DFW / Masjid Albani",
			"city": "Bedford",
			"region": "DFW / North Texas",
			"address": "3205 Brown Trail, Bedford, TX 76021",
			"state": "TX"
		},
		{
			"id": "city-of-knowledge-carrollton",
			"name": "City of Knowledge",
			"city": "Carrollton",
			"region": "DFW / North Texas",
			"address": "1800 Golden Trail Ct, Carrollton, TX 75010",
			"state": "TX"
		},
		{
			"id": "islamic-association-of-carrollton-carrollton",
			"name": "Islamic Association of Carrollton",
			"city": "Carrollton",
			"region": "DFW / North Texas",
			"address": "1901 Kelly Blvd, Carrollton, TX 75006",
			"state": "TX"
		},
		{
			"id": "madinah-mosque-carrollton-carrollton",
			"name": "Madinah Mosque Carrollton",
			"city": "Carrollton",
			"region": "DFW / North Texas",
			"address": "2180 Old Denton Rd, Carrollton, TX 75006",
			"state": "TX"
		},
		{
			"id": "minhaj-ul-quran-carrollton",
			"name": "Minhaj ul-Quran",
			"city": "Carrollton",
			"region": "DFW / North Texas",
			"address": "3751 N Josey Ln, Carrollton, TX 75007",
			"state": "TX"
		},
		{
			"id": "qalam-carrollton",
			"name": "Qalam",
			"city": "Carrollton",
			"region": "DFW / North Texas",
			"address": "4200 International Pkwy, Carrollton, TX 75007",
			"state": "TX"
		},
		{
			"id": "islamic-association-of-colleyville-colleyville",
			"name": "Islamic Association of Colleyville",
			"city": "Colleyville",
			"region": "DFW / North Texas",
			"address": "500 Cheek-Sparger Rd, Colleyville, TX 76034",
			"state": "TX"
		},
		{
			"id": "icc-islamic-center-of-coppell-coppell",
			"name": "ICC Islamic Center of Coppell",
			"city": "Coppell",
			"region": "DFW / North Texas",
			"address": "612 E Sandy Lake Rd #100, Coppell, TX 75019",
			"state": "TX"
		},
		{
			"id": "al-razzaq-islamic-centre-dallas",
			"name": "Al Razzaq Islamic Centre",
			"city": "Dallas",
			"region": "DFW / North Texas",
			"address": "11132 Shady Trail, Dallas, TX 75229",
			"state": "TX"
		},
		{
			"id": "egyptian-mosque-dallas",
			"name": "Egyptian Mosque",
			"city": "Dallas",
			"region": "DFW / North Texas",
			"address": "7319 Holly Hill Dr, Dallas, TX 75231",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-south-dallas-dallas",
			"name": "Islamic Center of South Dallas",
			"city": "Dallas",
			"region": "DFW / North Texas",
			"address": "2806 Martin Luther King Jr Blvd, Dallas, TX 75215",
			"state": "TX"
		},
		{
			"id": "islaminspanish-dallas-outreach-center-dallas",
			"name": "IslamInSpanish Dallas Outreach Center",
			"city": "Dallas",
			"region": "DFW / North Texas",
			"address": "13021 Coit Rd #108, Dallas, TX 75240",
			"state": "TX"
		},
		{
			"id": "masjid-al-quran-dallas",
			"name": "Masjid Al Quran",
			"city": "Dallas",
			"region": "DFW / North Texas",
			"address": "2420 Cedar Crest Blvd, Dallas, TX 75203",
			"state": "TX"
		},
		{
			"id": "masjid-al-islam-dallas-dallas",
			"name": "Masjid Al-Islam Dallas",
			"city": "Dallas",
			"region": "DFW / North Texas",
			"address": "2604 S Harwood St, Dallas, TX 75215",
			"state": "TX"
		},
		{
			"id": "momin-of-texas-dallas",
			"name": "MOMIN of Texas",
			"city": "Dallas",
			"region": "DFW / North Texas",
			"address": "2945 Frankford Rd, Dallas, TX 75287",
			"state": "TX"
		},
		{
			"id": "muhammad-mosque-dallas",
			"name": "Muhammad Mosque",
			"city": "Dallas",
			"region": "DFW / North Texas",
			"address": "2429 Martin Luther King Jr Blvd, Dallas, TX 75215",
			"state": "TX"
		},
		{
			"id": "oak-cliff-empowerment-center-dallas",
			"name": "Oak Cliff Empowerment Center",
			"city": "Dallas",
			"region": "DFW / North Texas",
			"address": "3436 Sunnyvale St, Dallas, TX 75216",
			"state": "TX"
		},
		{
			"id": "islamic-society-of-denton-denton",
			"name": "Islamic Society of Denton",
			"city": "Denton",
			"region": "DFW / North Texas",
			"address": "1105 Greenlee St, Denton, TX 76201",
			"state": "TX"
		},
		{
			"id": "dallas-islamic-foundation-duncanville",
			"name": "Dallas Islamic Foundation",
			"city": "Duncanville",
			"region": "DFW / North Texas",
			"address": "301 Frank Keasler Blvd, Duncanville, TX 75116",
			"state": "TX"
		},
		{
			"id": "duncanville-islamic-center-duncanville",
			"name": "Duncanville Islamic Center",
			"city": "Duncanville",
			"region": "DFW / North Texas",
			"address": "1419 Acton Ave, Duncanville, TX 75137",
			"state": "TX"
		},
		{
			"id": "heb-masjid-euless",
			"name": "HEB Masjid",
			"city": "Euless",
			"region": "DFW / North Texas",
			"address": "901 Clinic Dr, Euless, TX 76039",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-euless-euless",
			"name": "Islamic Center of Euless",
			"city": "Euless",
			"region": "DFW / North Texas",
			"address": "203 S Ector Dr, Euless, TX 76040",
			"state": "TX"
		},
		{
			"id": "islamic-association-of-lewisville-and-flower-mound-flower-mound",
			"name": "Islamic Association of Lewisville and Flower Mound",
			"city": "Flower Mound",
			"region": "DFW / North Texas",
			"address": "3430 Peters Colony Rd, Flower Mound, TX 75022",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-forney-forney",
			"name": "Islamic Center of Forney",
			"city": "Forney",
			"region": "DFW / North Texas",
			"address": "13980 FM 548 Suite 170, Forney, TX 75126",
			"state": "TX"
		},
		{
			"id": "al-mu-min-mosque-fort-worth",
			"name": "Al-Mu'min Mosque",
			"city": "Fort Worth",
			"region": "DFW / North Texas",
			"address": "3528 Westfield Ave, Fort Worth, TX 76133",
			"state": "TX"
		},
		{
			"id": "bait-ul-qayyum-mosque-fort-worth",
			"name": "Bait-ul-Qayyum Mosque",
			"city": "Fort Worth",
			"region": "DFW / North Texas",
			"address": "2801 Miller Ave, Fort Worth, TX 76105",
			"state": "TX"
		},
		{
			"id": "bayt-al-karim-islamic-center-fort-worth",
			"name": "Bayt Al-Karim Islamic Center",
			"city": "Fort Worth",
			"region": "DFW / North Texas",
			"address": "4500 Columbus Trail, Fort Worth, TX 76123",
			"state": "TX"
		},
		{
			"id": "islamic-association-of-tarrant-county-fort-worth",
			"name": "Islamic Association of Tarrant County",
			"city": "Fort Worth",
			"region": "DFW / North Texas",
			"address": "4901 Diaz Ave, Fort Worth, TX 76107",
			"state": "TX"
		},
		{
			"id": "islamic-unity-center-fort-worth",
			"name": "Islamic Unity Center",
			"city": "Fort Worth",
			"region": "DFW / North Texas",
			"address": "1207 Country Club Ln, Fort Worth, TX 76112",
			"state": "TX"
		},
		{
			"id": "keller-islamic-center-fort-worth",
			"name": "Keller Islamic Center",
			"city": "Fort Worth",
			"region": "DFW / North Texas",
			"address": "3601 Keller Hicks Rd, Fort Worth, TX 76244",
			"state": "TX"
		},
		{
			"id": "masjid-al-hedayah-academy-fort-worth",
			"name": "Masjid Al-Hedayah Academy",
			"city": "Fort Worth",
			"region": "DFW / North Texas",
			"address": "8601 Randol Mill Rd, Fort Worth, TX 76120",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-frisco-frisco",
			"name": "Islamic Center of Frisco",
			"city": "Frisco",
			"region": "DFW / North Texas",
			"address": "11137 Frisco St, Frisco, TX 75033",
			"state": "TX"
		},
		{
			"id": "mto-shahmaghsoudi-frisco",
			"name": "MTO Shahmaghsoudi",
			"city": "Frisco",
			"region": "DFW / North Texas",
			"address": "8455 Stonebrook Pkwy, Frisco, TX 75034",
			"state": "TX"
		},
		{
			"id": "al-hameed-musallah-garland",
			"name": "Al Hameed Musallah",
			"city": "Garland",
			"region": "DFW / North Texas",
			"address": "3700 N Shiloh Rd, Garland, TX 75044",
			"state": "TX"
		},
		{
			"id": "al-mustafa-community-center-garland",
			"name": "Al Mustafa Community Center",
			"city": "Garland",
			"region": "DFW / North Texas",
			"address": "4567 W Walnut St, Garland, TX 75042",
			"state": "TX"
		},
		{
			"id": "islamic-society-of-mesquite-garland",
			"name": "Islamic Society of Mesquite",
			"city": "Garland",
			"region": "DFW / North Texas",
			"address": "5906 Duck Creek Dr Apt 14, Garland, TX 75043",
			"state": "TX"
		},
		{
			"id": "makkah-masjid-garland-garland",
			"name": "Makkah Masjid Garland",
			"city": "Garland",
			"region": "DFW / North Texas",
			"address": "3301 W Buckingham Rd, Garland, TX 75042",
			"state": "TX"
		},
		{
			"id": "masjid-yaseen-garland",
			"name": "Masjid Yaseen",
			"city": "Garland",
			"region": "DFW / North Texas",
			"address": "1601 W Campbell Rd, Garland, TX 75044",
			"state": "TX"
		},
		{
			"id": "bosnian-american-cultural-center-grand-prairie",
			"name": "Bosnian American Cultural Center",
			"city": "Grand Prairie",
			"region": "DFW / North Texas",
			"address": "401 NE 5th St, Grand Prairie, TX 75050",
			"state": "TX"
		},
		{
			"id": "grand-prairie-masjid-grand-prairie",
			"name": "Grand Prairie Masjid",
			"city": "Grand Prairie",
			"region": "DFW / North Texas",
			"address": "802 Greenview Dr Suite B, Grand Prairie, TX 75050",
			"state": "TX"
		},
		{
			"id": "imam-ali-islamic-center-grand-prairie",
			"name": "Imam Ali Islamic Center",
			"city": "Grand Prairie",
			"region": "DFW / North Texas",
			"address": "2330 Dalworth St, Grand Prairie, TX 75050",
			"state": "TX"
		},
		{
			"id": "masjid-faruq-grand-prairie-grand-prairie",
			"name": "Masjid Faruq Grand Prairie",
			"city": "Grand Prairie",
			"region": "DFW / North Texas",
			"address": "2202 San Antonio St Bldg B, Grand Prairie, TX 75051",
			"state": "TX"
		},
		{
			"id": "dar-alhuda-inc-hurst",
			"name": "Dar Alhuda Inc",
			"city": "Hurst",
			"region": "DFW / North Texas",
			"address": "1245 Karla Dr, Hurst, TX 76053",
			"state": "TX"
		},
		{
			"id": "al-masjid-al-saifee-anjuman-e-najmi-irving",
			"name": "Al Masjid Al Saifee / Anjuman-e-Najmi",
			"city": "Irving",
			"region": "DFW / North Texas",
			"address": "1320 S Nursery Rd, Irving, TX 75060",
			"state": "TX"
		},
		{
			"id": "annoor-center-irving",
			"name": "Annoor Center",
			"city": "Irving",
			"region": "DFW / North Texas",
			"address": "3636 W Northgate Dr, Irving, TX 75062",
			"state": "TX"
		},
		{
			"id": "barkaat-ul-quran-irving",
			"name": "Barkaat-Ul-Quran",
			"city": "Irving",
			"region": "DFW / North Texas",
			"address": "555 W Airport Fwy #178, Irving, TX 75062",
			"state": "TX"
		},
		{
			"id": "dallas-ft-worth-islamic-center-irving",
			"name": "Dallas Ft-Worth Islamic Center",
			"city": "Irving",
			"region": "DFW / North Texas",
			"address": "4020 Jackson St, Irving, TX 75061",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-irving-irving",
			"name": "Islamic Center of Irving",
			"city": "Irving",
			"region": "DFW / North Texas",
			"address": "2555 Esters Rd, Irving, TX 75062",
			"state": "TX"
		},
		{
			"id": "las-colinas-islamic-center-irving",
			"name": "Las Colinas Islamic Center",
			"city": "Irving",
			"region": "DFW / North Texas",
			"address": "6210 N Belt Line Rd #160, Irving, TX 75063",
			"state": "TX"
		},
		{
			"id": "salaam-masjid-salaam-irving",
			"name": "Salaam / Masjid-Salaam",
			"city": "Irving",
			"region": "DFW / North Texas",
			"address": "1219 Salma Jameel Ct, Irving, TX 75060",
			"state": "TX"
		},
		{
			"id": "valley-ranch-islamic-center-irving",
			"name": "Valley Ranch Islamic Center",
			"city": "Irving",
			"region": "DFW / North Texas",
			"address": "351 Ranchview Dr, Irving, TX 75063",
			"state": "TX"
		},
		{
			"id": "vric-north-irving",
			"name": "VRIC North",
			"city": "Irving",
			"region": "DFW / North Texas",
			"address": "9940 W Valley Ranch Pkwy, Irving, TX 75063",
			"state": "TX"
		},
		{
			"id": "unity-islamic-center-mansfield-masjid-mansfield",
			"name": "Unity Islamic Center / Mansfield Masjid",
			"city": "Mansfield",
			"region": "DFW / North Texas",
			"address": "651 E Debbie Ln Bldg 400, Mansfield, TX 76063",
			"state": "TX"
		},
		{
			"id": "mckinney-islamic-association-mckinney",
			"name": "McKinney Islamic Association",
			"city": "McKinney",
			"region": "DFW / North Texas",
			"address": "2940 Eldorado Pkwy, McKinney, TX 75070",
			"state": "TX"
		},
		{
			"id": "noor-masjid-mckinney",
			"name": "Noor Masjid",
			"city": "McKinney",
			"region": "DFW / North Texas",
			"address": "1410 S Tennessee St, McKinney, TX 75069",
			"state": "TX"
		},
		{
			"id": "white-masjid-mckinney",
			"name": "White Masjid",
			"city": "McKinney",
			"region": "DFW / North Texas",
			"address": "9515 Westridge Blvd, McKinney, TX 75072",
			"state": "TX"
		},
		{
			"id": "islamic-association-of-mesquite-mesquite",
			"name": "Islamic Association of Mesquite",
			"city": "Mesquite",
			"region": "DFW / North Texas",
			"address": "2409 Gus Thomasson Rd, Mesquite, TX 75150",
			"state": "TX"
		},
		{
			"id": "mesquite-islamic-center-mesquite",
			"name": "Mesquite Islamic Center",
			"city": "Mesquite",
			"region": "DFW / North Texas",
			"address": "2403 Franklin Dr, Mesquite, TX 75150",
			"state": "TX"
		},
		{
			"id": "east-plano-islamic-center-plano",
			"name": "East Plano Islamic Center",
			"city": "Plano",
			"region": "DFW / North Texas",
			"address": "4700 14th St, Plano, TX 75074",
			"state": "TX"
		},
		{
			"id": "islamic-association-of-collin-county-iacc-plano",
			"name": "Islamic Association of Collin County (IACC)",
			"city": "Plano",
			"region": "DFW / North Texas",
			"address": "6401 Independence Pkwy, Plano, TX 75023",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-quad-cities-plano",
			"name": "Islamic Center of Quad Cities",
			"city": "Plano",
			"region": "DFW / North Texas",
			"address": "3620 State Hwy 121 STE 200, Plano, TX 75025",
			"state": "TX"
		},
		{
			"id": "isra-foundation-plano",
			"name": "ISRA Foundation",
			"city": "Plano",
			"region": "DFW / North Texas",
			"address": "930 W Parker Rd #530, Plano, TX 75075",
			"state": "TX"
		},
		{
			"id": "jamatkhana-plano-plano",
			"name": "Jamatkhana Plano",
			"city": "Plano",
			"region": "DFW / North Texas",
			"address": "6704 Alma Dr, Plano, TX 75023",
			"state": "TX"
		},
		{
			"id": "masjid-salahadeen-plano",
			"name": "Masjid Salahadeen",
			"city": "Plano",
			"region": "DFW / North Texas",
			"address": "4030 Split Trail Rd, Plano, TX 75074",
			"state": "TX"
		},
		{
			"id": "noori-masjid-plano",
			"name": "Noori Masjid",
			"city": "Plano",
			"region": "DFW / North Texas",
			"address": "1251 Shiloh Rd, Plano, TX 75074",
			"state": "TX"
		},
		{
			"id": "west-plano-musallah-plano",
			"name": "West Plano Musallah",
			"city": "Plano",
			"region": "DFW / North Texas",
			"address": "2011 W Spring Creek Pkwy #610, Plano, TX 75023",
			"state": "TX"
		},
		{
			"id": "darul-hedaya-princeton",
			"name": "Darul Hedaya",
			"city": "Princeton",
			"region": "DFW / North Texas",
			"address": "11343 FM 2756, Princeton, TX 75407",
			"state": "TX"
		},
		{
			"id": "abu-hanifa-masjid-richardson",
			"name": "Abu Hanifa Masjid",
			"city": "Richardson",
			"region": "DFW / North Texas",
			"address": "132 N Glenville Dr, Richardson, TX 75081",
			"state": "TX"
		},
		{
			"id": "al-ansar-society-richardson",
			"name": "Al-Ansar Society",
			"city": "Richardson",
			"region": "DFW / North Texas",
			"address": "1059 S Sherman St #110, Richardson, TX 75081",
			"state": "TX"
		},
		{
			"id": "diyanet-dallas-camii-richardson",
			"name": "Diyanet Dallas Camii",
			"city": "Richardson",
			"region": "DFW / North Texas",
			"address": "1100 E Campbell Rd #100, Richardson, TX 75081",
			"state": "TX"
		},
		{
			"id": "icna-center-richardson",
			"name": "ICNA Center",
			"city": "Richardson",
			"region": "DFW / North Texas",
			"address": "1600 N Plano Rd #200, Richardson, TX 75081",
			"state": "TX"
		},
		{
			"id": "islamic-association-of-north-texas-iant-richardson",
			"name": "Islamic Association of North Texas (IANT)",
			"city": "Richardson",
			"region": "DFW / North Texas",
			"address": "840 Abrams Rd, Richardson, TX 75081",
			"state": "TX"
		},
		{
			"id": "islamic-association-texas-masjid-ahsan-richardson",
			"name": "Islamic Association Texas / Masjid Ahsan",
			"city": "Richardson",
			"region": "DFW / North Texas",
			"address": "132 N Glenville Dr, Richardson, TX 75081",
			"state": "TX"
		},
		{
			"id": "mas-islamic-center-of-dallas-richardson",
			"name": "MAS Islamic Center of Dallas",
			"city": "Richardson",
			"region": "DFW / North Texas",
			"address": "1515 Blake Dr, Richardson, TX 75081",
			"state": "TX"
		},
		{
			"id": "rahmania-center-richardson",
			"name": "Rahmania Center",
			"city": "Richardson",
			"region": "DFW / North Texas",
			"address": "331 E Polk St, Richardson, TX 75081",
			"state": "TX"
		},
		{
			"id": "rockwall-masjid-rockwall",
			"name": "Rockwall Masjid",
			"city": "Rockwall",
			"region": "DFW / North Texas",
			"address": "1191 N Stodghill Rd, Rockwall, TX 75087",
			"state": "TX"
		},
		{
			"id": "association-for-guidance-and-education-rowlett",
			"name": "Association for Guidance and Education",
			"city": "Rowlett",
			"region": "DFW / North Texas",
			"address": "5219 Rowlett Rd, Rowlett, TX 75088",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-rowlett-rowlett",
			"name": "Islamic Center of Rowlett",
			"city": "Rowlett",
			"region": "DFW / North Texas",
			"address": "6710 Garner Rd, Rowlett, TX 75088",
			"state": "TX"
		},
		{
			"id": "american-imams-academy-sachse",
			"name": "American Imams Academy",
			"city": "Sachse",
			"region": "DFW / North Texas",
			"address": "5206 Ben Davis Rd, Sachse, TX 75048",
			"state": "TX"
		},
		{
			"id": "dallas-muslim-community-center-sachse",
			"name": "Dallas Muslim Community Center",
			"city": "Sachse",
			"region": "DFW / North Texas",
			"address": "7340 S State Hwy 78 #280, Sachse, TX 75048",
			"state": "TX"
		},
		{
			"id": "sachse-muslim-society-sachse",
			"name": "Sachse Muslim Society",
			"city": "Sachse",
			"region": "DFW / North Texas",
			"address": "2416 3rd St, Sachse, TX 75048",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-southlake-southlake",
			"name": "Islamic Center of Southlake",
			"city": "Southlake",
			"region": "DFW / North Texas",
			"address": "1280 N Carroll Ave, Southlake, TX 76092",
			"state": "TX"
		},
		{
			"id": "islamic-association-of-fort-worth-masjid-al-sahaabah-watauga",
			"name": "Islamic Association of Fort Worth / Masjid Al Sahaabah",
			"city": "Watauga",
			"region": "DFW / North Texas",
			"address": "6005 Chapman Rd, Watauga, TX 76148",
			"state": "TX"
		},
		{
			"id": "bosniaks-islamic-center-dfw-wylie",
			"name": "Bosniaks Islamic Center DFW",
			"city": "Wylie",
			"region": "DFW / North Texas",
			"address": "2749 Elm Grove Rd, Wylie, TX 75098",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-wylie-wylie",
			"name": "Islamic Center of Wylie",
			"city": "Wylie",
			"region": "DFW / North Texas",
			"address": "3990 Lakeway Dr, Wylie, TX 75098",
			"state": "TX"
		},
		{
			"id": "masjid-faizan-e-madinah-wylie-wylie",
			"name": "Masjid Faizan E Madinah Wylie",
			"city": "Wylie",
			"region": "DFW / North Texas",
			"address": "641 W Brown St, Wylie, TX 75098",
			"state": "TX"
		},
		{
			"id": "beaumont-mosque-islamic-society-of-triplex-beaumont",
			"name": "Beaumont Mosque / Islamic Society of Triplex",
			"city": "Beaumont",
			"region": "East Texas / Southeast",
			"address": "1270 W Cardinal Dr, Beaumont, TX 77705",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-golden-triangle-beaumont",
			"name": "Islamic Center of Golden Triangle",
			"city": "Beaumont",
			"region": "East Texas / Southeast",
			"address": "4699 Calder Ave, Beaumont, TX 77706",
			"state": "TX"
		},
		{
			"id": "jamia-masjid-beaumont-beaumont",
			"name": "Jamia Masjid Beaumont",
			"city": "Beaumont",
			"region": "East Texas / Southeast",
			"address": "2394 W Lucas Dr, Beaumont, TX 77706",
			"state": "TX"
		},
		{
			"id": "east-texas-islamic-association-commerce",
			"name": "East Texas Islamic Association",
			"city": "Commerce",
			"region": "East Texas / Southeast",
			"address": "1703 Live Oak St, Commerce, TX 75428",
			"state": "TX"
		},
		{
			"id": "masjid-al-ummah-huntsville-islamic-center-huntsville",
			"name": "Masjid Al-Ummah / Huntsville Islamic Center",
			"city": "Huntsville",
			"region": "East Texas / Southeast",
			"address": "3516 Montgomery Rd, Huntsville, TX 77340",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-longview-longview",
			"name": "Islamic Center of Longview",
			"city": "Longview",
			"region": "East Texas / Southeast",
			"address": "119 Amy St, Longview, TX 75602",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-lufkin-lufkin",
			"name": "Islamic Center of Lufkin",
			"city": "Lufkin",
			"region": "East Texas / Southeast",
			"address": "208 White Ave, Lufkin, TX 75904",
			"state": "TX"
		},
		{
			"id": "mount-pleasant-islamic-center-mount-pleasant",
			"name": "Mount Pleasant Islamic Center",
			"city": "Mount Pleasant",
			"region": "East Texas / Southeast",
			"address": "957 Nevills Rd, Mount Pleasant, TX 75455",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-nacogdoches-nacogdoches",
			"name": "Islamic Center of Nacogdoches",
			"city": "Nacogdoches",
			"region": "East Texas / Southeast",
			"address": "2125 Center Rd, Nacogdoches, TX 75961",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-paris-tx-paris",
			"name": "Islamic Center of Paris TX",
			"city": "Paris",
			"region": "East Texas / Southeast",
			"address": "248 3rd St NE, Paris, TX 75460",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-port-arthur-port-arthur",
			"name": "Islamic Center of Port Arthur",
			"city": "Port Arthur",
			"region": "East Texas / Southeast",
			"address": "1100 Gulfway Dr, Port Arthur, TX 77640",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-port-arthur-15th-street-port-arthur",
			"name": "Islamic Center of Port Arthur - 15th Street",
			"city": "Port Arthur",
			"region": "East Texas / Southeast",
			"address": "811 W 15th St, Port Arthur, TX 77640",
			"state": "TX"
		},
		{
			"id": "masjid-texarkana-texarkana",
			"name": "Masjid Texarkana",
			"city": "Texarkana",
			"region": "East Texas / Southeast",
			"address": "5509 N Kings Hwy, Texarkana, TX 75503",
			"state": "TX"
		},
		{
			"id": "east-texas-islamic-society-tyler",
			"name": "East Texas Islamic Society",
			"city": "Tyler",
			"region": "East Texas / Southeast",
			"address": "10631 State Hwy 64, Tyler, TX 75704",
			"state": "TX"
		},
		{
			"id": "tyler-islamic-center-tyler",
			"name": "Tyler Islamic Center",
			"city": "Tyler",
			"region": "East Texas / Southeast",
			"address": "13979 Rhones Quarter Rd, Tyler, TX 75707",
			"state": "TX"
		},
		{
			"id": "tyler-masjid-tyler",
			"name": "Tyler Masjid",
			"city": "Tyler",
			"region": "East Texas / Southeast",
			"address": "702 S Peach Ave, Tyler, TX 75702",
			"state": "TX"
		},
		{
			"id": "alvin-musalla-alvin",
			"name": "Alvin Musalla",
			"city": "Alvin",
			"region": "Greater Houston",
			"address": "1704 South St, Alvin, TX 77511",
			"state": "TX"
		},
		{
			"id": "baytown-islamic-center-baytown",
			"name": "Baytown Islamic Center",
			"city": "Baytown",
			"region": "Greater Houston",
			"address": "4000 Emmett Hutto Blvd, Baytown, TX 77521",
			"state": "TX"
		},
		{
			"id": "cleveland-mosque-cleveland",
			"name": "Cleveland Mosque",
			"city": "Cleveland",
			"region": "Greater Houston",
			"address": "24581 State Highway 321, Cleveland, TX 77327",
			"state": "TX"
		},
		{
			"id": "clute-musalla-clute",
			"name": "Clute Musalla",
			"city": "Clute",
			"region": "Greater Houston",
			"address": "1239 TX-332, Clute, TX 77531",
			"state": "TX"
		},
		{
			"id": "crosby-islamic-center-crosby",
			"name": "Crosby Islamic Center",
			"city": "Crosby",
			"region": "Greater Houston",
			"address": "19455 Ramsey Rd, Crosby, TX 77532",
			"state": "TX"
		},
		{
			"id": "cypress-islamic-center-cypress",
			"name": "Cypress Islamic Center",
			"city": "Cypress",
			"region": "Greater Houston",
			"address": "16103 Cypress Rose Hill Rd, Cypress, TX 77429",
			"state": "TX"
		},
		{
			"id": "icna-outreach-center-cypress",
			"name": "ICNA Outreach Center",
			"city": "Cypress",
			"region": "Greater Houston",
			"address": "19025 Wilks Dr, Cypress, TX 77433",
			"state": "TX"
		},
		{
			"id": "mason-road-community-center-cypress",
			"name": "Mason Road Community Center",
			"city": "Cypress",
			"region": "Greater Houston",
			"address": "20049 House & Hahl Rd Suite 402, Cypress, TX 77433",
			"state": "TX"
		},
		{
			"id": "mariam-center-mosque-deer-park",
			"name": "Mariam Center Mosque",
			"city": "Deer Park",
			"region": "Greater Houston",
			"address": "8007 Spencer Hwy, Deer Park, TX 77536",
			"state": "TX"
		},
		{
			"id": "galveston-islamic-center-galveston",
			"name": "Galveston Islamic Center",
			"city": "Galveston",
			"region": "Greater Houston",
			"address": "921 Broadway Avenue J, Galveston, TX 77550",
			"state": "TX"
		},
		{
			"id": "5th-ward-islamic-center-for-human-development-houston",
			"name": "5th Ward Islamic Center for Human Development",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "5303 Lyons Ave, Houston, TX 77020",
			"state": "TX"
		},
		{
			"id": "al-furqan-islamic-education-center-houston",
			"name": "Al Furqan Islamic Education Center",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "10602 Jones Rd, Houston, TX 77065",
			"state": "TX"
		},
		{
			"id": "al-furqan-masjid-houston",
			"name": "Al Furqan Masjid",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "2600 Lazy Hollow Dr, Houston, TX 77063",
			"state": "TX"
		},
		{
			"id": "al-muhajreen-houston",
			"name": "Al Muhajreen",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "10301 Harwin Dr. A, Houston, TX 77036",
			"state": "TX"
		},
		{
			"id": "al-muslimoon-houston",
			"name": "Al Muslimoon",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "2100 W Loop S Suite 1000, Houston, TX 77027",
			"state": "TX"
		},
		{
			"id": "al-noor-islamic-center-houston",
			"name": "Al Noor Islamic Center",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "8415 Hearth Dr, Houston, TX 77054",
			"state": "TX"
		},
		{
			"id": "al-noor-masjid-houston",
			"name": "Al Noor Masjid",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "6443 Prestwood Dr, Houston, TX 77081",
			"state": "TX"
		},
		{
			"id": "al-noor-masjid-maxey-rd-houston",
			"name": "Al Noor Masjid - Maxey Rd",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "225 Maxey Rd, Houston, TX 77013",
			"state": "TX"
		},
		{
			"id": "al-ghadeer-houston",
			"name": "Al-Ghadeer",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "9260 S Course Dr, Houston, TX 77099",
			"state": "TX"
		},
		{
			"id": "al-ma-adah-musalla-almeda-musalla-houston",
			"name": "Al-Ma'adah Musalla / Almeda Musalla",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "6923 Almeda Rd, Houston, TX 77021",
			"state": "TX"
		},
		{
			"id": "al-muhaimin-mosque-houston",
			"name": "Al-Muhaimin Mosque",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "3103 Cleburne St, Houston, TX 77004",
			"state": "TX"
		},
		{
			"id": "at-tawhid-mosque-houston",
			"name": "At-Tawhid Mosque",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "5514 Hirsch Rd, Houston, TX 77026",
			"state": "TX"
		},
		{
			"id": "bait-us-salaam-houston",
			"name": "Bait us-Salaam",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "1030 Manor Ave, Houston, TX 77015",
			"state": "TX"
		},
		{
			"id": "baitus-samee-mosque-houston",
			"name": "Baitus Samee Mosque",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "1333 Spears Rd, Houston, TX 77067",
			"state": "TX"
		},
		{
			"id": "clear-lake-islamic-center-houston",
			"name": "Clear Lake Islamic Center",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "17511 El Camino Real, Houston, TX 77058",
			"state": "TX"
		},
		{
			"id": "clear-lake-jama-masjid-iqra-center-houston",
			"name": "Clear Lake Jama Masjid IQRA Center",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "16400 Sea Lark Rd, Houston, TX 77062",
			"state": "TX"
		},
		{
			"id": "dar-e-abbas-islamic-center-of-houston-houston",
			"name": "Dar E Abbas Islamic Center of Houston",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "12256 Old Walters Rd, Houston, TX 77014",
			"state": "TX"
		},
		{
			"id": "diyanet-houston-camii-turkish-center-houston",
			"name": "Diyanet Houston Camii / Turkish Center",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "4135 L St, Houston, TX 77072",
			"state": "TX"
		},
		{
			"id": "e-quraish-mosque-al-quresh-masjid-houston",
			"name": "E Quraish Mosque / Al Quresh Masjid",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "12419 Scarsdale Blvd, Houston, TX 77089",
			"state": "TX"
		},
		{
			"id": "fatih-masjid-houston",
			"name": "Fatih Masjid",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "7818 Bellaire Blvd, Houston, TX 77036",
			"state": "TX"
		},
		{
			"id": "flaah-islamic-center-houston",
			"name": "Flaah Islamic Center",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "9203 Jackrabbit Rd, Houston, TX 77095",
			"state": "TX"
		},
		{
			"id": "haj-nabih-masjid-houston",
			"name": "Haj Nabih Masjid",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "14420 Sylvanfield Dr Suite 100, Houston, TX 77014",
			"state": "TX"
		},
		{
			"id": "hawa-masjid-houston",
			"name": "Hawa Masjid",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "5880 Ranchester Dr #250, Houston, TX 77036",
			"state": "TX"
		},
		{
			"id": "houston-masjid-of-al-islam-houston",
			"name": "Houston Masjid of Al-Islam",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "6641 Bellfort Ave, Houston, TX 77087",
			"state": "TX"
		},
		{
			"id": "ibrahim-islamic-center-and-mosque-houston",
			"name": "Ibrahim Islamic Center & Mosque",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "7563 South Fwy, Houston, TX 77021",
			"state": "TX"
		},
		{
			"id": "isgh-bear-creek-islamic-center-masjid-al-mustafa-houston",
			"name": "ISGH Bear Creek Islamic Center / Masjid Al-Mustafa",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "17250 Coventry Park Dr, Houston, TX 77084",
			"state": "TX"
		},
		{
			"id": "isgh-masjid-hamza-mission-bend-islamic-center-houston",
			"name": "ISGH Masjid Hamza - Mission Bend Islamic Center",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "6233 Tres Lagunas Dr, Houston, TX 77083",
			"state": "TX"
		},
		{
			"id": "isgh-masjid-savoy-wilcrest-houston",
			"name": "ISGH Masjid Savoy Wilcrest",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "11246 Wilcrest Dr Unit 110, Houston, TX 77099",
			"state": "TX"
		},
		{
			"id": "isgh-northshore-masjid-isa-ibn-maryam-houston",
			"name": "ISGH Northshore Masjid Isa ibn Maryam",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "13818 Brownsville St, Houston, TX 77015",
			"state": "TX"
		},
		{
			"id": "isgh-river-oaks-islamic-center-roic-houston",
			"name": "ISGH River Oaks Islamic Center (ROIC)",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "3110 Eastside St, Houston, TX 77098",
			"state": "TX"
		},
		{
			"id": "islamic-da-wah-center-houston",
			"name": "Islamic Da'wah Center",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "201 Travis St, Houston, TX 77002",
			"state": "TX"
		},
		{
			"id": "islamic-education-center-houston",
			"name": "Islamic Education Center",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "2313 S Voss Rd, Houston, TX 77057",
			"state": "TX"
		},
		{
			"id": "islaminspanish-centro-islamico-houston",
			"name": "IslamInSpanish Centro Islamico",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "12703 Brant Rock Dr, Houston, TX 77082",
			"state": "TX"
		},
		{
			"id": "jama-mecca-masjid-houston",
			"name": "Jama Mecca Masjid",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "15001 Beechnut St, Houston, TX 77083",
			"state": "TX"
		},
		{
			"id": "madina-masjid-expo-mosque-houston",
			"name": "Madina Masjid Expo Mosque",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "11322 Westheimer Rd #F, Houston, TX 77077",
			"state": "TX"
		},
		{
			"id": "madrasah-islamiah-houston",
			"name": "Madrasah Islamiah",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "6665 Bintliff Dr, Houston, TX 77074",
			"state": "TX"
		},
		{
			"id": "makkah-masjid-of-greater-houston-houston",
			"name": "Makkah Masjid of Greater Houston",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "3505 S Dairy Ashford Rd, Houston, TX 77082",
			"state": "TX"
		},
		{
			"id": "makki-masjid-houston",
			"name": "Makki Masjid",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "9651 Bissonnet St, Houston, TX 77036",
			"state": "TX"
		},
		{
			"id": "markazi-imam-bargah-al-murtaza-houston",
			"name": "Markazi Imam Bargah Al-Murtaza",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "14903 Bellaire Blvd B, Houston, TX 77083",
			"state": "TX"
		},
		{
			"id": "mas-katy-center-masjid-al-rahman-houston",
			"name": "MAS Katy Center / Masjid Al-Rahman",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "1800 Baker Rd, Houston, TX 77094",
			"state": "TX"
		},
		{
			"id": "masjid-abu-bakr-houston",
			"name": "Masjid Abu Bakr",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "8830 Galveston Rd, Houston, TX 77034",
			"state": "TX"
		},
		{
			"id": "masjid-al-anbiyaa-houston",
			"name": "Masjid Al Anbiyaa",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "3820 S Dairy Ashford Rd, Houston, TX 77082",
			"state": "TX"
		},
		{
			"id": "masjid-al-ihsan-houston",
			"name": "Masjid Al Ihsan",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "13180 Westpark Dr, Houston, TX 77082",
			"state": "TX"
		},
		{
			"id": "masjid-al-amin-houston",
			"name": "Masjid Al-Amin",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "6121 Hillcroft Ave Suite E, Houston, TX 77081",
			"state": "TX"
		},
		{
			"id": "masjid-al-rasul-houston-houston",
			"name": "Masjid Al-Rasul Houston",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "3204 Jensen Dr, Houston, TX 77026",
			"state": "TX"
		},
		{
			"id": "masjid-alrasool-alakram-houston",
			"name": "Masjid AlRasool AlAkram",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "9300 S Course Dr, Houston, TX 77099",
			"state": "TX"
		},
		{
			"id": "masjid-ar-raheem-cyfair-peace-center-houston",
			"name": "Masjid Ar-Raheem / Cyfair Peace Center",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "10762 FM 1960 Rd W, Houston, TX 77070",
			"state": "TX"
		},
		{
			"id": "masjid-bilal-isgh-houston",
			"name": "Masjid Bilal - ISGH",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "11815 Adel Rd, Houston, TX 77067",
			"state": "TX"
		},
		{
			"id": "masjid-e-mohammedi-houston",
			"name": "Masjid E Mohammedi",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "17730 Coventry Park Dr, Houston, TX 77084",
			"state": "TX"
		},
		{
			"id": "masjid-eesa-ibne-maryam-bammel-musallah-houston",
			"name": "Masjid Eesa Ibne Maryam / Bammel Musallah",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "13932 Bammel N Houston Rd, Houston, TX 77014",
			"state": "TX"
		},
		{
			"id": "masjid-elfarouq-houston",
			"name": "Masjid ElFarouq",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "1207 Conrad Sauer Dr, Houston, TX 77043",
			"state": "TX"
		},
		{
			"id": "masjid-gul-houston",
			"name": "Masjid Gul",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "14366 Memorial Dr Suite A, Houston, TX 77079",
			"state": "TX"
		},
		{
			"id": "masjid-khulafa-a-rashedeen-houston",
			"name": "Masjid Khulafa A Rashedeen",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "6400 Southwest Fwy Suite G, Houston, TX 77074",
			"state": "TX"
		},
		{
			"id": "masjid-marwaas-houston",
			"name": "Masjid Marwaas",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "14617 Beechnut St, Houston, TX 77083",
			"state": "TX"
		},
		{
			"id": "masjid-salah-ad-deen-houston",
			"name": "Masjid Salah Ad-Deen",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "5645 Hillcroft St #305, Houston, TX 77036",
			"state": "TX"
		},
		{
			"id": "masjid-ul-mumineen-houston",
			"name": "Masjid-ul Mumineen",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "8875 Benning Dr, Houston, TX 77031",
			"state": "TX"
		},
		{
			"id": "md-anderson-cancer-center-musalla-houston",
			"name": "MD Anderson Cancer Center Musalla",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "1515 Holcombe Blvd, Houston, TX 77030",
			"state": "TX"
		},
		{
			"id": "medical-center-islamic-society-new-almeda-masjid-houston",
			"name": "Medical Center Islamic Society / New Almeda Masjid",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "2222 Mansard St, Houston, TX 77054",
			"state": "TX"
		},
		{
			"id": "mercy-community-center-masjid-houston",
			"name": "Mercy Community Center - Masjid",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "5922 Hillcroft St #C, Houston, TX 77036",
			"state": "TX"
		},
		{
			"id": "muhammad-mosque-no-45-houston",
			"name": "Muhammad Mosque No. 45",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "4443 Old Spanish Trl, Houston, TX 77021",
			"state": "TX"
		},
		{
			"id": "muhammadi-masjid-houston",
			"name": "Muhammadi Masjid",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "11830 Corona Ln, Houston, TX 77072",
			"state": "TX"
		},
		{
			"id": "nasfat-houston-branch-houston",
			"name": "NASFAT Houston Branch",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "12102 Bissonnet St, Houston, TX 77099",
			"state": "TX"
		},
		{
			"id": "quba-academy-houston",
			"name": "Quba Academy",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "730 FM 1959, Houston, TX 77034",
			"state": "TX"
		},
		{
			"id": "riverstone-ranch-musalla-houston",
			"name": "Riverstone Ranch Musalla",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "9700 Riverstone Ranch Road #L, Houston, TX 77089",
			"state": "TX"
		},
		{
			"id": "tajweed-institute-masjid-houston",
			"name": "Tajweed Institute Masjid",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "16205 Westheimer Rd, Houston, TX 77082",
			"state": "TX"
		},
		{
			"id": "taleem-muhammad-mosque-houston",
			"name": "Taleem Muhammad Mosque",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "511 E 40th 1/2 St, Houston, TX 77022",
			"state": "TX"
		},
		{
			"id": "the-islamic-institute-houston-blue-mosque-houston",
			"name": "The Islamic Institute / Houston Blue Mosque",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "9301 W Bellfort Ave, Houston, TX 77031",
			"state": "TX"
		},
		{
			"id": "the-ismaili-center-houston-houston",
			"name": "The Ismaili Center Houston",
			"city": "Houston",
			"region": "Greater Houston",
			"address": "2323 Allen Pkwy, Houston, TX 77019",
			"state": "TX"
		},
		{
			"id": "masjid-ghous-e-azam-humble",
			"name": "Masjid Ghous-E-Azam",
			"city": "Humble",
			"region": "Greater Houston",
			"address": "5511 FM 1960 Rd E, Humble, TX 77338",
			"state": "TX"
		},
		{
			"id": "al-huda-islamic-center-katy",
			"name": "Al-Huda Islamic Center",
			"city": "Katy",
			"region": "Greater Houston",
			"address": "6703 Pitts Rd, Katy, TX 77493",
			"state": "TX"
		},
		{
			"id": "ar-rayyan-masjid-katy",
			"name": "Ar Rayyan Masjid",
			"city": "Katy",
			"region": "Greater Houston",
			"address": "6734 Westheimer Lakes N Dr #108, Katy, TX 77494",
			"state": "TX"
		},
		{
			"id": "haq-al-zahra-center-katy",
			"name": "Haq Al Zahra Center",
			"city": "Katy",
			"region": "Greater Houston",
			"address": "2011 Monarch Hollow Ln, Katy, TX 77449",
			"state": "TX"
		},
		{
			"id": "masjid-al-ahad-katy",
			"name": "Masjid Al-Ahad",
			"city": "Katy",
			"region": "Greater Houston",
			"address": "19214 Clay Rd Suite K, Katy, TX 77449",
			"state": "TX"
		},
		{
			"id": "masjid-ali-ul-murtaza-minhaj-ul-quran-katy-katy",
			"name": "Masjid Ali Ul Murtaza / Minhaj-ul-Quran Katy",
			"city": "Katy",
			"region": "Greater Houston",
			"address": "20050 Franz Rd, Katy, TX 77449",
			"state": "TX"
		},
		{
			"id": "masjid-aqsa-katy",
			"name": "Masjid Aqsa",
			"city": "Katy",
			"region": "Greater Houston",
			"address": "2810 Saddlehorn Trail, Katy, TX 77494",
			"state": "TX"
		},
		{
			"id": "masjid-darul-emaan-katy",
			"name": "Masjid Darul-Emaan",
			"city": "Katy",
			"region": "Greater Houston",
			"address": "3115 N Fry Rd Suite 504, Katy, TX 77449",
			"state": "TX"
		},
		{
			"id": "tayyaba-masjid-katy",
			"name": "Tayyaba Masjid",
			"city": "Katy",
			"region": "Greater Houston",
			"address": "20140 Morton Rd #105C, Katy, TX 77449",
			"state": "TX"
		},
		{
			"id": "wkic-al-firdous-musalla-katy",
			"name": "WKIC - Al Firdous Musalla",
			"city": "Katy",
			"region": "Greater Houston",
			"address": "4031 FM 1463 Ste 30, Katy, TX 77494",
			"state": "TX"
		},
		{
			"id": "islamic-education-center-league-city-league-city",
			"name": "Islamic Education Center League City",
			"city": "League City",
			"region": "Greater Houston",
			"address": "2619 Kentucky Ave, League City, TX 77573",
			"state": "TX"
		},
		{
			"id": "league-city-islamic-center-league-city",
			"name": "League City Islamic Center",
			"city": "League City",
			"region": "Greater Houston",
			"address": "118 McKibben Ln, League City, TX 77573",
			"state": "TX"
		},
		{
			"id": "masjid-ayesha-missouri-city",
			"name": "Masjid Ayesha",
			"city": "Missouri City",
			"region": "Greater Houston",
			"address": "4502 Watts Plantation Dr, Missouri City, TX 77545",
			"state": "TX"
		},
		{
			"id": "riverstone-musalla-missouri-city",
			"name": "Riverstone Musalla",
			"city": "Missouri City",
			"region": "Greater Houston",
			"address": "4502 Riverstone Blvd Unit #803, Missouri City, TX 77459",
			"state": "TX"
		},
		{
			"id": "pearland-islamic-center-pearland",
			"name": "Pearland Islamic Center",
			"city": "Pearland",
			"region": "Greater Houston",
			"address": "1530 Garden Rd, Pearland, TX 77581",
			"state": "TX"
		},
		{
			"id": "shadow-creek-muslim-community-center-pearland",
			"name": "Shadow Creek Muslim Community Center",
			"city": "Pearland",
			"region": "Greater Houston",
			"address": "12234 Shadow Creek Pkwy #9, Pearland, TX 77584",
			"state": "TX"
		},
		{
			"id": "kingwood-mosque-porter",
			"name": "Kingwood Mosque",
			"city": "Porter",
			"region": "Greater Houston",
			"address": "22001 E Martin Dr, Porter, TX 77365",
			"state": "TX"
		},
		{
			"id": "masjid-fatima-tuz-zahra-porter",
			"name": "Masjid Fatima Tuz Zahra",
			"city": "Porter",
			"region": "Greater Houston",
			"address": "22040 W Ford Rd, Porter, TX 77365",
			"state": "TX"
		},
		{
			"id": "harvest-green-aliana-musalla-richmond",
			"name": "Harvest Green Aliana Musalla",
			"city": "Richmond",
			"region": "Greater Houston",
			"address": "18802 West Airport Blvd Suite 200, Richmond, TX 77406",
			"state": "TX"
		},
		{
			"id": "masjid-madrasah-jamiah-islamiah-texas-richmond",
			"name": "Masjid - Madrasah Jamiah Islamiah Texas",
			"city": "Richmond",
			"region": "Greater Houston",
			"address": "7120 FM 1464 Suite C, Richmond, TX 77407",
			"state": "TX"
		},
		{
			"id": "masjid-omar-bin-khattab-texas-islamic-community-center-richmond",
			"name": "Masjid Omar Bin Khattab / Texas Islamic Community Center",
			"city": "Richmond",
			"region": "Greater Houston",
			"address": "1833 Richmond Pkwy, Richmond, TX 77469",
			"state": "TX"
		},
		{
			"id": "richmond-islamic-community-center-richmond",
			"name": "Richmond Islamic Community Center",
			"city": "Richmond",
			"region": "Greater Houston",
			"address": "5530 Long Prairie Trace #100, Richmond, TX 77407",
			"state": "TX"
		},
		{
			"id": "klein-islamic-center-masjid-spring",
			"name": "Klein Islamic Center - Masjid",
			"city": "Spring",
			"region": "Greater Houston",
			"address": "18901 Kuykendahl Rd, Spring, TX 77388",
			"state": "TX"
		},
		{
			"id": "masjid-al-salam-champions-islamic-center-spring",
			"name": "Masjid Al-Salam / Champions Islamic Center",
			"city": "Spring",
			"region": "Greater Houston",
			"address": "16700 Old Louetta Rd, Spring, TX 77379",
			"state": "TX"
		},
		{
			"id": "masjid-e-zohra-rayford-islamic-center-spring",
			"name": "Masjid E Zohra / Rayford Islamic Center",
			"city": "Spring",
			"region": "Greater Houston",
			"address": "990 Rayford Rd Suite 120, Spring, TX 77386",
			"state": "TX"
		},
		{
			"id": "masjid-ibrahim-klein-spring",
			"name": "Masjid Ibrahim - Klein",
			"city": "Spring",
			"region": "Greater Houston",
			"address": "5500 FM 2920, Spring, TX 77388",
			"state": "TX"
		},
		{
			"id": "wic-masjid-spring",
			"name": "WIC Masjid",
			"city": "Spring",
			"region": "Greater Houston",
			"address": "1625 Sawdust Rd, Spring, TX 77380",
			"state": "TX"
		},
		{
			"id": "brand-lane-islamic-center-masjid-as-sabireen-stafford",
			"name": "Brand Lane Islamic Center / Masjid As Sabireen",
			"city": "Stafford",
			"region": "Greater Houston",
			"address": "610 Brand Ln, Stafford, TX 77477",
			"state": "TX"
		},
		{
			"id": "adam-masjid-sugar-land",
			"name": "Adam Masjid",
			"city": "Sugar Land",
			"region": "Greater Houston",
			"address": "341 Southwestern Blvd, Sugar Land, TX 77478",
			"state": "TX"
		},
		{
			"id": "ali-center-markazi-imam-bargah-azakhana-e-zehra-sugar-land",
			"name": "Ali Center / Markazi Imam Bargah Azakhana e Zehra",
			"city": "Sugar Land",
			"region": "Greater Houston",
			"address": "15505 W Bellfort Ave, Sugar Land, TX 77498",
			"state": "TX"
		},
		{
			"id": "ansar-ud-deen-society-southwest-houston-sugar-land",
			"name": "Ansar Ud Deen Society Southwest Houston",
			"city": "Sugar Land",
			"region": "Greater Houston",
			"address": "16500 Boss Gaston Rd, Sugar Land, TX 77498",
			"state": "TX"
		},
		{
			"id": "darul-uloom-texas-masjid-sugar-land",
			"name": "Darul Uloom Texas Masjid",
			"city": "Sugar Land",
			"region": "Greater Houston",
			"address": "15522 Voss Rd, Sugar Land, TX 77498",
			"state": "TX"
		},
		{
			"id": "faizan-e-madinah-jamia-tul-madina-sugar-land",
			"name": "Faizan e Madinah - Jamia Tul Madina",
			"city": "Sugar Land",
			"region": "Greater Houston",
			"address": "13130 Alston Rd, Sugar Land, TX 77478",
			"state": "TX"
		},
		{
			"id": "maryam-islamic-center-sugar-land",
			"name": "Maryam Islamic Center",
			"city": "Sugar Land",
			"region": "Greater Houston",
			"address": "504 Sartartia Rd, Sugar Land, TX 77479",
			"state": "TX"
		},
		{
			"id": "masjid-arafat-sugar-land",
			"name": "Masjid Arafat",
			"city": "Sugar Land",
			"region": "Greater Houston",
			"address": "16300 Old Richmond Rd, Sugar Land, TX 77498",
			"state": "TX"
		},
		{
			"id": "masjid-at-taqwa-sugar-land",
			"name": "Masjid At-Taqwa",
			"city": "Sugar Land",
			"region": "Greater Houston",
			"address": "10415 Synott Rd, Sugar Land, TX 77478",
			"state": "TX"
		},
		{
			"id": "masjid-istiqlal-houston-sugar-land",
			"name": "Masjid Istiqlal Houston",
			"city": "Sugar Land",
			"region": "Greater Houston",
			"address": "15303 McKaskle Rd, Sugar Land, TX 77498",
			"state": "TX"
		},
		{
			"id": "quba-masjid-sugar-land",
			"name": "Quba Masjid",
			"city": "Sugar Land",
			"region": "Greater Houston",
			"address": "11920 S Texas 6 #1400, Sugar Land, TX 77498",
			"state": "TX"
		},
		{
			"id": "zun-nurain-masjid-sugar-land",
			"name": "Zun Nurain Masjid",
			"city": "Sugar Land",
			"region": "Greater Houston",
			"address": "16305 Kensington Dr #210, Sugar Land, TX 77479",
			"state": "TX"
		},
		{
			"id": "texas-city-masjid-texas-city",
			"name": "Texas City Masjid",
			"city": "Texas City",
			"region": "Greater Houston",
			"address": "4926 Texas Ave, Texas City, TX 77591",
			"state": "TX"
		},
		{
			"id": "al-ansaar-masjid-woodlands-islamic-center-the-woodlands",
			"name": "Al Ansaar Masjid / Woodlands Islamic Center",
			"city": "The Woodlands",
			"region": "Greater Houston",
			"address": "15217 Sunset Trail, The Woodlands, TX 77384",
			"state": "TX"
		},
		{
			"id": "masjid-abu-huraira-the-woodlands",
			"name": "Masjid Abu Huraira",
			"city": "The Woodlands",
			"region": "Greater Houston",
			"address": "1701 Sawdust Rd, The Woodlands, TX 77380",
			"state": "TX"
		},
		{
			"id": "asia-center-webster",
			"name": "ASIA Center",
			"city": "Webster",
			"region": "Greater Houston",
			"address": "618 Barringer Ln, Webster, TX 77598",
			"state": "TX"
		},
		{
			"id": "masjid-al-suffah-webster",
			"name": "Masjid Al Suffah",
			"city": "Webster",
			"region": "Greater Houston",
			"address": "2525 Friendswood Link Rd, Webster, TX 77598",
			"state": "TX"
		},
		{
			"id": "muslim-center-of-san-antonio-helotes",
			"name": "Muslim Center of San Antonio",
			"city": "Helotes",
			"region": "San Antonio / South Central",
			"address": "10915 FM 1560, Helotes, TX 78023",
			"state": "TX"
		},
		{
			"id": "alfalah-downtown-center-san-antonio",
			"name": "Alfalah Downtown Center",
			"city": "San Antonio",
			"region": "San Antonio / South Central",
			"address": "2554 E Houston St, San Antonio, TX 78202",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-san-antonio-san-antonio",
			"name": "Islamic Center of San Antonio",
			"city": "San Antonio",
			"region": "San Antonio / South Central",
			"address": "8638 Fairhaven St, San Antonio, TX 78229",
			"state": "TX"
		},
		{
			"id": "masjid-al-ikhlas-san-antonio",
			"name": "Masjid Al-Ikhlas",
			"city": "San Antonio",
			"region": "San Antonio / South Central",
			"address": "9323 Perrin Beitel Suite 204, San Antonio, TX 78217",
			"state": "TX"
		},
		{
			"id": "masjid-ar-rayhan-san-antonio",
			"name": "Masjid Ar Rayhan",
			"city": "San Antonio",
			"region": "San Antonio / South Central",
			"address": "6126 Montgomery Dr, San Antonio, TX 78239",
			"state": "TX"
		},
		{
			"id": "masjid-beit-el-maqdes-san-antonio",
			"name": "Masjid Beit El-Maqdes",
			"city": "San Antonio",
			"region": "San Antonio / South Central",
			"address": "7627 Culebra Rd, San Antonio, TX 78251",
			"state": "TX"
		},
		{
			"id": "masjid-bilal-ibn-rabah-san-antonio-san-antonio",
			"name": "Masjid Bilal Ibn Rabah - San Antonio",
			"city": "San Antonio",
			"region": "San Antonio / South Central",
			"address": "530 S WW White Rd, San Antonio, TX 78220",
			"state": "TX"
		},
		{
			"id": "mcecc-and-al-madinah-masjid-san-antonio",
			"name": "MCECC and Al Madinah Masjid",
			"city": "San Antonio",
			"region": "San Antonio / South Central",
			"address": "5281 Casa Bella St, San Antonio, TX 78249",
			"state": "TX"
		},
		{
			"id": "northside-islamic-center-of-san-antonio-san-antonio",
			"name": "Northside Islamic Center of San Antonio",
			"city": "San Antonio",
			"region": "San Antonio / South Central",
			"address": "21003 Encino Commons #110, San Antonio, TX 78259",
			"state": "TX"
		},
		{
			"id": "rahmani-masjid-and-learning-center-san-antonio",
			"name": "Rahmani Masjid and Learning Center",
			"city": "San Antonio",
			"region": "San Antonio / South Central",
			"address": "5403 Jackwood Dr, San Antonio, TX 78238",
			"state": "TX"
		},
		{
			"id": "zainabia-sa-islamic-education-center-san-antonio",
			"name": "Zainabia-SA Islamic Education Center",
			"city": "San Antonio",
			"region": "San Antonio / South Central",
			"address": "5005 Timberhill Dr, San Antonio, TX 78238",
			"state": "TX"
		},
		{
			"id": "islamic-society-of-brownsville-brownsville",
			"name": "Islamic Society of Brownsville",
			"city": "Brownsville",
			"region": "South Texas / RGV",
			"address": "246 Gilson Rd, Brownsville, TX 78520",
			"state": "TX"
		},
		{
			"id": "islamic-society-of-southern-texas-abul-qasim-masjid-corpus-christi",
			"name": "Islamic Society of Southern Texas / Abul Qasim Masjid",
			"city": "Corpus Christi",
			"region": "South Texas / RGV",
			"address": "7341 McArdle Rd, Corpus Christi, TX 78412",
			"state": "TX"
		},
		{
			"id": "al-khair-islamic-society-of-rgv-edinburg",
			"name": "Al Khair Islamic Society of RGV",
			"city": "Edinburg",
			"region": "South Texas / RGV",
			"address": "1910 Elsham Ave, Edinburg, TX 78542",
			"state": "TX"
		},
		{
			"id": "masjid-arridwan-edinburg",
			"name": "Masjid Arridwan",
			"city": "Edinburg",
			"region": "South Texas / RGV",
			"address": "5400 S Jackson Rd, Edinburg, TX 78539",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-harlingen-harlingen",
			"name": "Islamic Center of Harlingen",
			"city": "Harlingen",
			"region": "South Texas / RGV",
			"address": "601 Kamali Dr, Harlingen, TX 78550",
			"state": "TX"
		},
		{
			"id": "islamic-society-of-kingsville-kingsville",
			"name": "Islamic Society of Kingsville",
			"city": "Kingsville",
			"region": "South Texas / RGV",
			"address": "702 W Ave B, Kingsville, TX 78363",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-laredo-laredo",
			"name": "Islamic Center of Laredo",
			"city": "Laredo",
			"region": "South Texas / RGV",
			"address": "604 Amistad Dr, Laredo, TX 78041",
			"state": "TX"
		},
		{
			"id": "islamic-society-of-south-texas-mcallen",
			"name": "Islamic Society of South Texas",
			"city": "McAllen",
			"region": "South Texas / RGV",
			"address": "2008 N Ware Rd, McAllen, TX 78501",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-victoria-victoria",
			"name": "Islamic Center of Victoria",
			"city": "Victoria",
			"region": "South Texas / RGV",
			"address": "201 E Airline Rd, Victoria, TX 77901",
			"state": "TX"
		},
		{
			"id": "rio-grande-valley-islamic-center-weslaco",
			"name": "Rio Grande Valley Islamic Center",
			"city": "Weslaco",
			"region": "South Texas / RGV",
			"address": "502 E Pike Blvd, Weslaco, TX 78596",
			"state": "TX"
		},
		{
			"id": "masjid-e-aamina-abilene",
			"name": "Masjid e Aamina",
			"city": "Abilene",
			"region": "West Texas / Panhandle / Permian",
			"address": "840 E Hwy 80, Abilene, TX 79601",
			"state": "TX"
		},
		{
			"id": "burmese-muslim-community-of-amarillo-masjid-al-farooq-amarillo",
			"name": "Burmese Muslim Community of Amarillo / Masjid Al-Farooq",
			"city": "Amarillo",
			"region": "West Texas / Panhandle / Permian",
			"address": "1124 Aster St, Amarillo, TX 79107",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-amarillo-amarillo",
			"name": "Islamic Center of Amarillo",
			"city": "Amarillo",
			"region": "West Texas / Panhandle / Permian",
			"address": "601 Quail Creek Dr, Amarillo, TX 79124",
			"state": "TX"
		},
		{
			"id": "masjid-al-huda-amarillo-amarillo",
			"name": "Masjid Al-Huda Amarillo",
			"city": "Amarillo",
			"region": "West Texas / Panhandle / Permian",
			"address": "2354 Fritch Hwy, Amarillo, TX 79108",
			"state": "TX"
		},
		{
			"id": "cactus-musallah-cactus",
			"name": "Cactus Musallah",
			"city": "Cactus",
			"region": "West Texas / Panhandle / Permian",
			"address": "403 Winona Ave Suite D, Cactus, TX 79013",
			"state": "TX"
		},
		{
			"id": "dumas-musallah-dumas",
			"name": "Dumas Musallah",
			"city": "Dumas",
			"region": "West Texas / Panhandle / Permian",
			"address": "1332 Bruce Ave Apt 56, Dumas, TX 79029",
			"state": "TX"
		},
		{
			"id": "al-rahma-mosque-el-paso",
			"name": "Al-Rahma Mosque",
			"city": "El Paso",
			"region": "West Texas / Panhandle / Permian",
			"address": "10911 Pellicano Dr, El Paso, TX 79935",
			"state": "TX"
		},
		{
			"id": "islamic-center-of-el-paso-el-paso",
			"name": "Islamic Center of El Paso",
			"city": "El Paso",
			"region": "West Texas / Panhandle / Permian",
			"address": "143 Paragon Ln, El Paso, TX 79912",
			"state": "TX"
		},
		{
			"id": "islamic-education-center-of-el-paso-el-paso",
			"name": "Islamic Education Center of El Paso",
			"city": "El Paso",
			"region": "West Texas / Panhandle / Permian",
			"address": "150 N Festival Dr, El Paso, TX 79912",
			"state": "TX"
		},
		{
			"id": "laughlin-mosque-building-laughlin-afb",
			"name": "Laughlin Mosque Building",
			"city": "Laughlin AFB",
			"region": "West Texas / Panhandle / Permian",
			"address": "Laughlin AFB, TX 78843",
			"state": "TX"
		},
		{
			"id": "main-mosque-islamic-center-of-south-plains-lubbock",
			"name": "Main Mosque - Islamic Center of South Plains",
			"city": "Lubbock",
			"region": "West Texas / Panhandle / Permian",
			"address": "3419 La Salle Ave, Lubbock, TX 79412",
			"state": "TX"
		},
		{
			"id": "student-mosque-islamic-center-of-south-plains-lubbock",
			"name": "Student Mosque - Islamic Center of South Plains",
			"city": "Lubbock",
			"region": "West Texas / Panhandle / Permian",
			"address": "2222 15th St, Lubbock, TX 79401",
			"state": "TX"
		},
		{
			"id": "midland-musallah-midland",
			"name": "Midland Musallah",
			"city": "Midland",
			"region": "West Texas / Panhandle / Permian",
			"address": "5010 W Loop 250 N, Midland, TX 79707",
			"state": "TX"
		},
		{
			"id": "muslim-association-of-west-texas-midland",
			"name": "Muslim Association of West Texas",
			"city": "Midland",
			"region": "West Texas / Panhandle / Permian",
			"address": "1200 S Midland Dr, Midland, TX 79703",
			"state": "TX"
		},
		{
			"id": "the-mustafa-islamic-center-midland",
			"name": "The Mustafa Islamic Center",
			"city": "Midland",
			"region": "West Texas / Panhandle / Permian",
			"address": "4704 Andrews Hwy, Midland, TX 79703",
			"state": "TX"
		},
		{
			"id": "friday-musallah-odessa",
			"name": "Friday Musallah",
			"city": "Odessa",
			"region": "West Texas / Panhandle / Permian",
			"address": "1601 N Grandview Ave, Odessa, TX 79761",
			"state": "TX"
		},
		{
			"id": "azad-masjid-islamic-society-of-wichita-falls-wichita-falls",
			"name": "Azad Masjid / Islamic Society of Wichita Falls",
			"city": "Wichita Falls",
			"region": "West Texas / Panhandle / Permian",
			"address": "1701 Trigg Ln, Wichita Falls, TX 76306",
			"state": "TX"
		}
	],
};
