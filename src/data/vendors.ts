// src/data/vendors.ts

// ============================================================================
// TYPES
// ============================================================================
export interface VendorInfo {
  id: string;
  displayName: string;
  originalName: string;
  logoUrl: string | null;
  icon: string;
  iconLib: "Ionicons" | "MaterialCommunityIcons" | "MaterialIcons";
  color: string;
  isKnown: boolean;
  categoryKey: string; // Translation key, e.g., 'category_entertainment'
  cancelUrl?: string; // <--- NEW FIELD
}

export const bulkURL = "https://tinyurl.com/billMVP";
//export const serverURL = "https://dunn-carabali.com/billMVP";
export const serverURL = "https://billbellapp.com";

export const normalizeVendorKey = (input: string) =>
  (input || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "")
    .trim();

const VENDOR_DOMAIN_ALIASES: Record<string, string> = {
  aws: "aws.amazon.com",
  amazonwebservices: "aws.amazon.com",
  primevideo: "primevideo.com",
  amazonprimevideo: "primevideo.com",
  googleworkspace: "workspace.google.com",
  gsuite: "workspace.google.com",
  o365: "microsoft.com",
  office365: "microsoft.com",
  microsoft365: "microsoft.com",
  xfinity: "xfinity.com",
  att: "att.com",
  verizonwireless: "verizon.com",
  tmobile: "t-mobile.com",
  adobecreativecloud: "adobe.com",
  icloud: "icloud.com",
  googleone: "one.google.com",
  youtubetv: "tv.youtube.com"
};

// ============================================================================
// 1. GLOBAL VENDOR DOMAINS (For Logo API)
// ============================================================================
export const VENDOR_DOMAINS: Record<string, string> = {
  // --- STREAMING & ENTERTAINMENT ---
  "Netflix": "netflix.com",
  "Spotify": "spotify.com",
  "Hulu": "hulu.com",
  "Disney+": "disneyplus.com",
  "HBO Max": "hbo.com",
  "Max": "max.com",
  "Amazon Prime Video": "primevideo.com",
  "Prime Video": "primevideo.com",
  "YouTube Premium": "youtube.com",
  "YouTube": "youtube.com",
  "Apple Music": "apple.com",
  "Apple TV+": "apple.com",
  "Audible": "audible.com",
  "SiriusXM": "siriusxm.com",
  "Peacock": "peacocktv.com",
  "Paramount+": "paramountplus.com",
  "Twitch": "twitch.tv",
  "Discord": "discord.com",
  "Patreon": "patreon.com",
  "Steam": "steampowered.com",
  "PlayStation": "playstation.com",
  "Xbox": "xbox.com",
  "Nintendo": "nintendo.com",
  "Crunchyroll": "crunchyroll.com",
  "Funimation": "funimation.com",
  "Tidal": "tidal.com",
  "SoundCloud": "soundcloud.com",
  "Pandora": "pandora.com",
  "Vimeo": "vimeo.com",
  "Roku": "roku.com",
  "Sling TV": "sling.com",
  "FuboTV": "fubo.tv",
  "DirecTV": "directv.com",
  "DAZN": "dazn.com",
  "Sky": "sky.com",
  "Canal+": "canalplus.com",
// --- CHINA / HK / TAIWAN ---
  "Alibaba": "alibaba.com",
  "Tencent": "tencent.com",
  "Baidu": "baidu.com",
  "China Mobile": "chinamobileltd.com",
  "China Unicom": "chinaunicom.com",
  "China Telecom": "chinatelecom.com",
  "State Grid": "sgcc.com.cn", // World's largest utility
  "Huawei": "huawei.com",
  "DJI": "dji.com",
  "Cathay Pacific": "cathaypacific.com",
  "HK Electric": "hkelectric.com",
  "CLP Power": "clp.com.hk",
  "Chunghwa Telecom": "cht.com.tw", // Taiwan
  "TSMC": "tsmc.com",

  // --- GLOBAL AIRLINES (High Recurring Spend) ---
  "Emirates": "emirates.com",
  "Qatar Airways": "qatarairways.com",
  "Singapore Airlines": "singaporeair.com",
  "ANA": "ana.co.jp", // All Nippon Airways
  "JAL": "jal.com", // Japan Airlines
  "Air Canada": "aircanada.com",
  "KLM": "klm.com",
  "Air France": "airfrance.com",
  "Turkish Airlines": "turkishairlines.com",
  "Qantas": "qantas.com",

  // --- DIGITAL NOMAD & EXPAT TOOLS ---
  "Airalo": "airalo.com", // eSIM
  "Holafly": "holafly.com",
  "SafetyWing": "safetywing.com", // Nomad Insurance
  "World Nomads": "worldnomads.com",
  "Deel": "deel.com",
  "Payoneer": "payoneer.com",
  "Remitly": "remitly.com",
  "Preply": "preply.com", // Language tutoring
  "Italki": "italki.com",

  // --- GLOBAL RETAIL GIANTS ---
  "Shein": "shein.com",
  "Temu": "temu.com",
  "AliExpress": "aliexpress.com",
  "Zara": "zara.com",
  "Uniqlo": "uniqlo.com",
  "H&M": "hm.com",
  "Decathlon": "decathlon.com",
  "Sephora": "sephora.com",
  // --- STUDENT LOANS ---
  "Navient": "navient.com",
  "Nelnet": "nelnet.com",
  "Sallie Mae": "salliemae.com",
  "Mohela": "mohela.com",
  "Aidvantage": "aidvantage.com",
  "Great Lakes": "mygreatlakes.org",
  "SoFi Student Loans": "sofi.com",
  "Earnest": "earnest.com",
  "Firstmark": "firstmarkservices.com",

  // --- PET INSURANCE & SERVICES ---
  "Lemonade": "lemonade.com",
  "Trupanion": "trupanion.com",
  "Healthy Paws": "healthypawspetinsurance.com",
  "Nationwide Pet": "petinsurance.com",
  "Embrace": "embracepetinsurance.com",
  "Petplan": "gopetplan.com",
  "Rover": "rover.com",
  "Chewy": "chewy.com", // Existing, but good to group
  "BarkBox": "barkbox.com", // Existing

  // --- STORAGE & MOVING ---
  "Public Storage": "publicstorage.com",
  "Extra Space Storage": "extraspace.com",
  "CubeSmart": "cubesmart.com",
  "U-Haul": "uhaul.com",
  "Life Storage": "lifestorage.com",
  "Pods": "pods.com",

  // --- HOME SERVICES (PEST/LAWN/SOLAR) ---
  "Terminix": "terminix.com",
  "Orkin": "orkin.com",
  "TruGreen": "trugreen.com",
  "Sunrun": "sunrun.com",
  "SunPower": "sunpower.com",
  "Vivint Solar": "vivint.com",
  "Tesla Energy": "tesla.com",

  // --- MEDICAL & DENTAL FINANCE ---
  "CareCredit": "carecredit.com",
  "Invisalign": "invisalign.com",
  "SmileDirectClub": "smiledirectclub.com",
  "Quest Diagnostics": "questdiagnostics.com",
  "LabCorp": "labcorp.com",

  // --- STORE CARD BANKS (White Label) ---
  // These banks back 100s of store cards (Wayfair, Gap, etc.)
  "Synchrony Bank": "synchrony.com",
  "Comenity Bank": "comenity.net",
  "Bread Financial": "breadfinancial.com",

  // --- US BANKS & FINANCE ---
  "Chase": "chase.com",
  "Bank of America": "bankofamerica.com",
  "Wells Fargo": "wellsfargo.com",
  "Citi": "citi.com",
  "Capital One": "capitalone.com",
  "American Express": "americanexpress.com",
  "Amex": "americanexpress.com",
  "Discover": "discover.com",
  "US Bank": "usbank.com",
  "PNC": "pnc.com",
  "TD Bank": "td.com",
  "Goldman Sachs": "goldmansachs.com",
  "Fidelity": "fidelity.com",
  "Schwab": "schwab.com",
  "PayPal": "paypal.com",
  "Venmo": "venmo.com",
  "Cash App": "cash.app",
  "Affirm": "affirm.com",
  "Klarna": "klarna.com",
  "SoFi": "sofi.com",
  "Chime": "chime.com",
  "Ally Bank": "ally.com",
  "Citizens Bank": "citizensbank.com",
  "KeyBank": "key.com",
  "Fifth Third": "53.com",
  "Regions": "regions.com",
  "M&T Bank": "mtb.com",
  "Huntington": "huntington.com",
  "Synchrony": "synchrony.com",
  "Robinhood": "robinhood.com",
  "Coinbase": "coinbase.com",
  "Crypto.com": "crypto.com",
  "Binance": "binance.com",
  "BlockFi": "blockfi.com",
  "Mint": "mint.com",
  "YNAB": "youneedabudget.com",
  "Credit Karma": "creditkarma.com",
  "Rocket Money": "rocketmoney.com",

  // --- CANADA BANKS ---
  "RBC": "rbcroyalbank.com",
  "TD Canada Trust": "td.com",
  "Scotiabank": "scotiabank.com",
  "BMO": "bmo.com",
  "CIBC": "cibc.com",
  "National Bank": "nbc.ca",
  "Desjardins": "desjardins.com",
  "Tangerine": "tangerine.ca",
  "Simplii": "simplii.com",

  "Starlink": "starlink.com",
  "HughesNet": "hughesnet.com",
  "Viasat": "viasat.com",
  "Rise Broadband": "risebroadband.com",
  "Google Fiber": "fiber.google.com",
  "Sonic": "sonic.com",
  "Starry": "starry.com",
  "EarthLink": "earthlink.net",
  "Ziply Fiber": "ziplyfiber.com",

  // --- UK & EUROPE BANKS ---
  "HSBC": "hsbc.com",
  "Barclays": "barclays.co.uk",
  "Lloyds Bank": "lloydsbank.com",
  "NatWest": "natwest.com",
  "Santander": "santander.com",
  "Standard Chartered": "sc.com",
  "Royal Bank of Scotland": "rbs.co.uk",
  "Halifax": "halifax.co.uk",
  "Nationwide": "nationwide.co.uk",
  "Revolut": "revolut.com",
  "Monzo": "monzo.com",
  "Starling Bank": "starlingbank.com",
  "Deutsche Bank": "db.com",
  "Commerzbank": "commerzbank.de",
  "BNP Paribas": "mabanque.bnpparibas",
  "Societe Generale": "societegenerale.com",
  "Credit Agricole": "credit-agricole.fr",
  "ING": "ing.com",
  "ABN AMRO": "abnamro.com",
  "Rabobank": "rabobank.com",
  "UBS": "ubs.com",
  "Credit Suisse": "credit-suisse.com",
  "Nordea": "nordea.com",
  "Danske Bank": "danskebank.com",
  "Swedbank": "swedbank.com",
  "BBVA": "bbva.com",
  "CaixaBank": "caixabank.com",
  "Intesa Sanpaolo": "group.intesasanpaolo.com",
  "UniCredit": "unicreditgroup.eu",

  // --- AUSTRALIA & NZ BANKS ---
  "Commonwealth Bank": "commbank.com.au",
  "Westpac": "westpac.com.au",
  "ANZ": "anz.com.au",
  "NAB": "nab.com.au",
  "Macquarie": "macquarie.com",
  "Suncorp": "suncorp.com.au",
  "Bendigo Bank": "bendigobank.com.au",
  "Bank of Queensland": "boq.com.au",
  "ASB": "asb.co.nz",
  "KiwiBank": "kiwibank.co.nz",

  // --- ASIA BANKS ---
  "DBS": "dbs.com",
  "UOB": "uob.com.sg",
  "OCBC": "ocbc.com",
  "HDFC Bank": "hdfcbank.com",
  "ICICI Bank": "icicibank.com",
  "SBI": "sbi.co.in",
  "Axis Bank": "axisbank.com",
  "Kotak Mahindra": "kotak.com",
  "Bank of China": "boc.cn",
  "ICBC": "icbc.com.cn",
  "Mitsubishi UFJ": "mufg.jp",
  "Sumitomo Mitsui": "smbc.co.jp",
  "Mizuho": "mizuhobank.com",

  // --- INSURANCE ---
  "Geico": "geico.com",
  "State Farm": "statefarm.com",
  "Progressive": "progressive.com",
  "Allstate": "allstate.com",
  "Liberty Mutual": "libertymutual.com",
  "Nationwide Insurance": "nationwide.com",
  "USAA": "usaa.com",
  "Farmers Insurance": "farmers.com",
  "Travelers": "travelers.com",
  "American Family": "amfam.com",
  "Chubb": "chubb.com",
  "The Hartford": "thehartford.com",
  "MetLife": "metlife.com",
  "Prudential": "prudential.com",
  "Aetna": "aetna.com",
  "UnitedHealthcare": "uhc.com",
  "Blue Cross": "bcbs.com",
  "Blue Cross Blue Shield": "bcbs.com",
  "Anthem": "anthem.com",
  "Cigna": "cigna.com",
  "Humana": "humana.com",
  "Kaiser Permanente": "kaiserpermanente.org",
  "AXA": "axa.com",
  "Allianz": "allianz.com",
  "Aviva": "aviva.com",
  "Zurich": "zurich.com",
  "Generali": "generali.com",
  "Manulife": "manulife.com",
  "Sun Life": "sunlife.com",
  "AIA": "aia.com",

  // --- UTILITIES & HOME (US & GLOBAL) ---
  "ComEd": "comed.com",
  "PG&E": "pge.com",
  "Duke Energy": "duke-energy.com",
  "Con Edison": "coned.com",
  "National Grid": "nationalgridus.com",
  "Southern Company": "southerncompany.com",
  "Florida Power & Light": "fpl.com",
  "Dominion Energy": "dominionenergy.com",
  "Xcel Energy": "xcelenergy.com",
  "Entergy": "entergy.com",
  "DTE Energy": "dteenergy.com",
  "Eversource": "eversource.com",
  "PSEG": "pseg.com",
  "FirstEnergy": "firstenergycorp.com",
  "American Water": "amwater.com",
  "Aqua America": "aquaamerica.com",
  "Waste Management": "wm.com",
  "Republic Services": "republicservices.com",
  "British Gas": "britishgas.co.uk",
  "EDF Energy": "edfenergy.com",
  "E.ON": "eon.com",
  "Scottish Power": "scottishpower.co.uk",
  "Thames Water": "thameswater.co.uk",
  "Origin Energy": "originenergy.com.au",
  "AGL": "agl.com.au",
  "EnergyAustralia": "energyaustralia.com.au",
  "Enel": "enel.com",
  "Iberdrola": "iberdrola.com",
  "Engie": "engie.com",
  "RWE": "rwe.com",
  "TEPCO": "tepco.co.jp",
  "ADT": "adt.com",
  "Ring": "ring.com",
  "SimpliSafe": "simplisafe.com",
  "Vivint": "vivint.com",
  "Brinks Home": "brinkshome.com",

  // --- TELECOM & INTERNET ---
  "T-Mobile": "t-mobile.com",
  "Verizon": "verizon.com",
  "AT&T": "att.com",
  "Xfinity": "xfinity.com",
  "Spectrum": "spectrum.com",
  "Cox": "cox.com",
  "CenturyLink": "centurylink.com",
  "Frontier": "frontier.com",
  "Altice": "alticeusa.com",
  "Optimum": "optimum.com",
  "Virgin Media": "virginmedia.com",
  "BT": "bt.com",
  "Sky Broadband": "sky.com",
  "Vodafone": "vodafone.com",
  "O2": "o2.co.uk",
  "EE": "ee.co.uk",
  "Three": "three.co.uk",
  "Orange": "orange.com",
  "Deutsche Telekom": "telekom.com",
  "Telefonica": "telefonica.com",
  "TIM": "tim.it",
  "Rogers": "rogers.com",
  "Bell": "bell.ca",
  "Telus": "telus.com",
  "Telstra": "telstra.com.au",
  "Optus": "optus.com.au",
  "NBN": "nbnco.com.au",
  "Jio": "jio.com",
  "Airtel": "airtel.in",
  "NTT Docomo": "docomo.ne.jp",
  "SoftBank": "softbank.jp",
  "Google Fi": "fi.google.com",
  "Mint Mobile": "mintmobile.com",
  "Cricket Wireless": "cricketwireless.com",

  // ... existing domains ...

  // ============================================================
  // GLOBAL & REGIONAL EXPANSION
  // ============================================================

  // --- UK (Specifics) ---
  "Octopus Energy": "octopus.energy",
  "Bulb": "bulb.co.uk",
  "Ovo Energy": "ovoenergy.com",
  "TalkTalk": "talktalk.co.uk",
  "Tesco Mobile": "tescomobile.com",
  "Giffgaff": "giffgaff.com",
  "Tesco": "tesco.com",
  "Sainsbury's": "sainsburys.co.uk",
  "Asda": "asda.com",
  "Waitrose": "waitrose.com",
  "Council Tax": "gov.uk", // Generic fallback
  "TV Licencing": "tvlicensing.co.uk",
  "Transport for London": "tfl.gov.uk",

  // --- CANADA (Specifics) ---
  "Hydro One": "hydroone.com",
  "BC Hydro": "bchydro.com",
  "Enbridge": "enbridge.com",
  "FortisBC": "fortisbc.com",
  "Hydro Quebec": "hydroquebec.com",
  "Fido": "fido.ca",
  "Koodo": "koodomobile.com",
  "Freedom Mobile": "freedommobile.ca",
  "Videotron": "videotron.com",
  "Shaw": "shaw.ca",
  "Canadian Tire": "canadiantire.ca",
  "Loblaws": "loblaws.ca",
  "Metro": "metro.ca",
  "Sobeys": "sobeys.com",
  "Shoppers Drug Mart": "shoppersdrugmart.ca",

  // --- AUSTRALIA & NZ (Specifics) ---

  "Vodafone AU": "vodafone.com.au",
  "Woolworths": "woolworths.com.au",
  "Coles": "coles.com.au",
  "Aldi AU": "aldi.com.au",
  "Bunnings": "bunnings.com.au",
  "JB Hi-Fi": "jbhifi.com.au",
  "Officeworks": "officeworks.com.au",
  "Medibank": "medibank.com.au",
  "Bupa": "bupa.com.au",
  "Sydney Water": "sydneywater.com.au",
  "Ergon Energy": "ergon.com.au",
  "ATO": "ato.gov.au", // Tax
  "Linkt": "linkt.com.au", // Tolls

  // --- GERMANY (DACH) ---
  "Vodafone DE": "vodafone.de",
  "O2 DE": "o2online.de",
  "1&1": "1und1.de",
  "Vattenfall": "vattenfall.de",
  "EnBW": "enbw.com",
  "Deutsche Bahn": "bahn.de",
  "BVG": "bvg.de", // Berlin Transit
  "Techniker Krankenkasse": "tk.de",
  "AOK": "aok.de",
  "Barmer": "barmer.de",
  "Allianz DE": "allianz.de",
  "Sparkasse": "sparkasse.de",
  "Volksbank": "volksbank.de",
  "Comdirect": "comdirect.de",
  "DKB": "dkb.de",
  "N26": "n26.com",
  "Lidl": "lidl.de",
  "Aldi Sud": "aldi-sued.de",
  "Rewe": "rewe.de",
  "Edeka": "edeka.de",
  "Rossmann": "rossmann.de",
  "dm": "dm.de",
  "Rundfunkbeitrag": "rundfunkbeitrag.de", // Media Tax

  // --- FRANCE ---
  "EDF": "edf.fr",
  "TotalEnergies": "totalenergies.fr",
  "Orange FR": "orange.fr",
  "SFR": "sfr.fr",
  "Bouygues": "bouyguestelecom.fr",
  "Free Mobile": "free.fr",
  "SNCF": "sncf.com",
  "RATP": "ratp.fr",
  "Carrefour": "carrefour.fr",
  "Leclerc": "e-leclerc.com",
  "Auchan": "auchan.fr",
  "Intermarche": "intermarche.com",

  // --- INDIA ---
  "Vi": "myvi.in",
  "BSNL": "bsnl.co.in",
  "Tata Power": "tatapower.com",
  "Adani Electricity": "adanielectricity.com",
  "LIC": "licindia.in",
  "HDFC Life": "hdfclife.com",
  "SBI Card": "sbicard.com",
  "Paytm": "paytm.com",
  "PhonePe": "phonepe.com",
  "Flipkart": "flipkart.com",
  "Zomato": "zomato.com",
  "Swiggy": "swiggy.com",
  "Ola": "olacabs.com",
  "Uber India": "uber.com",
  "BigBasket": "bigbasket.com",

  // --- LATAM (Brazil/Mexico) ---
  "Nubank": "nubank.com.br",
  "Mercado Libre": "mercadolibre.com",
  "Rappi": "rappi.com",
  "Claro": "claro.com.br",
  "Vivo": "vivo.com.br",
  "Tim": "tim.com.br",
  "Telcel": "telcel.com",
  "CFE": "cfe.mx", // Mexico Power
  "Cofepris": "gob.mx",
  "Petrobras": "petrobras.com.br",
  "Itaú": "itau.com.br",
  "Bradesco": "bradesco.com.br",

  // --- SOFTWARE & SAAS ---
  "Google": "google.com",
  "Google One": "one.google.com",
  "Google Drive": "drive.google.com",
  "iCloud": "icloud.com",
  "Microsoft": "microsoft.com",
  "Office 365": "office.com",
  "Microsoft 365": "office.com",
  "Adobe": "adobe.com",
  "Creative Cloud": "adobe.com",
  "Dropbox": "dropbox.com",
  "Zoom": "zoom.us",
  "Slack": "slack.com",
  "Salesforce": "salesforce.com",
  "Atlassian": "atlassian.com",
  "Jira": "atlassian.com",
  "Trello": "trello.com",
  "Asana": "asana.com",
  "Monday.com": "monday.com",
  "Notion": "notion.so",
  "Evernote": "evernote.com",
  "GitHub": "github.com",
  "GitLab": "gitlab.com",
  "Bitbucket": "bitbucket.org",
  "DigitalOcean": "digitalocean.com",
  "AWS": "aws.amazon.com",
  "Heroku": "heroku.com",
  "Vercel": "vercel.com",
  "Netlify": "netlify.com",
  "ChatGPT": "openai.com",
  "OpenAI": "openai.com",
  "Midjourney": "midjourney.com",
  "Canva": "canva.com",
  "Figma": "figma.com",
  "Sketch": "sketch.com",
  "InVision": "invisionapp.com",
  "Miro": "miro.com",
  "Intuit": "intuit.com",
  "QuickBooks": "quickbooks.intuit.com",
  "TurboTax": "turbotax.intuit.com",
  "Xero": "xero.com",
  "Sage": "sage.com",
  "DocuSign": "docusign.com",
  "LastPass": "lastpass.com",
  "1Password": "1password.com",
  "Dashlane": "dashlane.com",
  "Bitwarden": "bitwarden.com",
  "NordVPN": "nordvpn.com",
  "ExpressVPN": "expressvpn.com",
  "Surfshark": "surfshark.com",
  "Proton VPN": "protonvpn.com",
  "McAfee": "mcafee.com",
  "Norton": "norton.com",
  "Kaspersky": "kaspersky.com",
  "Shopify": "shopify.com",
  "Square": "squareup.com",
  "Stripe": "stripe.com",
  "Wix": "wix.com",
  "Squarespace": "squarespace.com",
  "GoDaddy": "godaddy.com",
  "Namecheap": "namecheap.com",
  "Wordpress": "wordpress.com",

  // --- SHOPPING & LIFESTYLE ---
  "Amazon": "amazon.com",
  "Walmart": "walmart.com",
  "Target": "target.com",
  "Costco": "costco.com",
  "Best Buy": "bestbuy.com",
  "Home Depot": "homedepot.com",
  "Lowe's": "lowes.com",
  "IKEA": "ikea.com",
  "Wayfair": "wayfair.com",
  "Nike": "nike.com",
  "Adidas": "adidas.com",
  "Lululemon": "lululemon.com",
  "ASOS": "asos.com",
  "Apple Store": "apple.com",
  "eBay": "ebay.com",
  "Etsy": "etsy.com",
  "CVS": "cvs.com",
  "Walgreens": "walgreens.com",
  "Rite Aid": "riteaid.com",
  "Ulta": "ulta.com",
  "Planet Fitness": "planetfitness.com",
  "Gold's Gym": "goldsgym.com",
  "Equinox": "equinox.com",
  "LA Fitness": "lafitness.com",
  "24 Hour Fitness": "24hourfitness.com",
  "Anytime Fitness": "anytimefitness.com",
  "Peloton": "onepeloton.com",
  "Strava": "strava.com",
  "MyFitnessPal": "myfitnesspal.com",
  "Headspace": "headspace.com",
  "Calm": "calm.com",
  "Duolingo": "duolingo.com",
  "MasterClass": "masterclass.com",
  "Dollar Shave Club": "dollarshaveclub.com",
  "Stitch Fix": "stitchfix.com",
  "FabFitFun": "fabfitfun.com",
  
  // --- FOOD & DELIVERY ---
  "Uber Eats": "ubereats.com",
  "DoorDash": "doordash.com",
  "Grubhub": "grubhub.com",
  "Postmates": "postmates.com",
  "Instacart": "instacart.com",
  "HelloFresh": "hellofresh.com",
  "Blue Apron": "blueapron.com",
  "Freshly": "freshly.com",
  "Factor": "factor75.com",
  "Starbucks": "starbucks.com",
  "Dunkin": "dunkindonuts.com",
  "McDonalds": "mcdonalds.com",
  "Burger King": "burgerking.com",
  "Chipotle": "chipotle.com",
  "Domino's": "dominos.com",
  "Pizza Hut": "pizzahut.com",
  "Whole Foods": "wholefoodsmarket.com",
  "Trader Joe's": "traderjoes.com",
  "Kroger": "kroger.com",
  "Publix": "publix.com",
  "Safeway": "safeway.com",
  "Aldi": "aldi.us",

  // --- TRANSPORT & TRAVEL ---
  "Uber": "uber.com",
  "Lyft": "lyft.com",
  "Airbnb": "airbnb.com",
  "Vrbo": "vrbo.com",
  "Expedia": "expedia.com",
  "Booking.com": "booking.com",
  "Hotels.com": "hotels.com",
  "TripAdvisor": "tripadvisor.com",
  "Delta": "delta.com",
  "United Airlines": "united.com",
  "American Airlines": "aa.com",
  "Southwest": "southwest.com",
  "JetBlue": "jetblue.com",
  "British Airways": "britishairways.com",
  "Lufthansa": "lufthansa.com",
  "Ryanair": "ryanair.com",
  "EasyJet": "easyjet.com",
  "Hertz": "hertz.com",
  "Enterprise": "enterprise.com",
  "Avis": "avis.com",
  "Budget": "budget.com",
  "National Car Rental": "nationalcar.com",
  "Alamo": "alamo.com",
  "Tesla": "tesla.com",
  "Zipcar": "zipcar.com",
  "Turo": "turo.com",
  "EZPass": "e-zpassiag.com",
  "SunPass": "sunpass.com",
  "FasTrak": "bayareafastrak.org",

  // --- NEWS & MEDIA ---
  "New York Times": "nytimes.com",
  "NYT": "nytimes.com",
  "Washington Post": "washingtonpost.com",
  "Wall Street Journal": "wsj.com",
  "WSJ": "wsj.com",
  "Bloomberg": "bloomberg.com",
  "The Economist": "economist.com",
  "Financial Times": "ft.com",
  "The Guardian": "theguardian.com",
  "BBC": "bbc.com",
  "CNN": "cnn.com",
  "Medium": "medium.com",
  "Substack": "substack.com",

  "Rocket Mortgage": "rocketmortgage.com",
  "Mr. Cooper": "mrcooper.com",
  "Freedom Mortgage": "freedommortgage.com",
  "LoanDepot": "loandepot.com",
  "United Wholesale Mortgage": "uwm.com",
  "PennyMac": "pennymac.com",
  "Better Mortgage": "better.com",
  "Caliber Home Loans": "caliberhomeloans.com",
  "Fairway Independent": "fairwayindependentmc.com",
  "Guild Mortgage": "guildmortgage.com",
  "Movement Mortgage": "movement.com",

  // --- AUTO FINANCE & MANUFACTURERS ---
  "Toyota Financial": "toyotafinancial.com",
  "Honda Financial": "hondafinancialservices.com",
  "Ford Credit": "ford.com",
  "GM Financial": "gmfinancial.com",
  "Nissan Finance": "nissanfinance.com",
  "Hyundai Finance": "hmfusa.com",
  "Kia Finance": "kiafinance.com",
  "BMW Financial": "bmwusa.com",
  "Mercedes-Benz Financial": "mbfs.com",
  "Volkswagen Credit": "vwcredit.com",
  "Audi Financial": "audiusa.com",
  "Lexus Financial": "lexusfinancial.com",
  "CarMax": "carmax.com",
  "Carvana": "carvana.com",
  "Santander Consumer": "santanderconsumerusa.com",
  "Ally Auto": "ally.com",
  "Bridgecrest": "bridgecrest.com",

  "EdFinancial": "edfinancial.com",
  "ECSI": "heartlandecsi.com", // Major servicer for Perkins/University loans
  "College Ave": "collegeave.com",
  "Laurel Road": "laurelroad.com", // Huge for medical/grad school refinancing
  "Ascendium": "ascendiumeducation.org",
  "OSLA": "osla.org", // Oklahoma Student Loan Authority
  "Discover Student Loans": "discover.com", // Distinct from credit cards
  "Commonbond": "commonbond.co",
  "LendKey": "lendkey.com",
  "Prodigy Finance": "prodigyfinance.com", // International student loans
  "MPower": "mpowerfinancing.com",
  "Rakuten": "rakuten.co.jp",
  "au KDDI": "au.com",
  "Kansai Electric": "kepco.co.jp",
  "SK Telecom": "sktelecom.com",
  "KT Corp": "kt.com",
  "LG U+": "uplus.co.kr",
  "Coupang": "coupang.com",
  "Kakao": "kakaocorp.com",
  "Naver": "naver.com",
  "Samsung Finance": "samsungcard.com",
  "LINE": "line.me",

  // --- SOUTHEAST ASIA (SG, ID, MY, PH, TH, VN) ---
  "Grab": "grab.com",
  "Gojek": "gojek.com",
  "Shopee": "shopee.com",
  "Lazada": "lazada.com",
  "Singtel": "singtel.com", // Singapore
  "StarHub": "starhub.com",
  "M1": "m1.com.sg",
  "PLDT": "pldt.com", // Philippines
  "Globe Telecom": "globe.com.ph",
  "Telkomsel": "telkomsel.com", // Indonesia
  "Indihome": "indihome.co.id",
  "Tenaga Nasional": "tnb.com.my", // Malaysia Power
  "AIS": "ais.th", // Thailand
  "TrueMove": "true.th",
  "Viettel": "viettel.com.vn", // Vietnam

  // --- MIDDLE EAST (UAE, KSA, EG) ---
  "Etisalat": "etisalat.ae",
  "Du": "du.ae",
  "STC": "stc.com.sa", // Saudi Telecom
  "Mobily": "mobily.com.sa",
  "Ooredoo": "ooredoo.com",
  "Careem": "careem.com",
  "DEWA": "dewa.gov.ae", // Dubai Water/Power
  "Noon": "noon.com",
  "Talabat": "talabat.com",

  // --- AFRICA (ZA, NG, KE) ---
  "MTN": "mtn.com",
  "Vodacom": "vodacom.co.za",
  "Safaricom": "safaricom.co.ke",
  "M-Pesa": "mpesa.in", // Financed often billed via carrier
  "DStv": "dstv.com", // Major African Pay TV
  "Showmax": "showmax.com",
  "Jumia": "jumia.com.ng",
  "Eskom": "eskom.co.za", // SA Power
  "Telkom SA": "telkom.co.za",
};

// ============================================================================
// 2. REGEX CATEGORY MAP (Fallback to Vector Icons)
// ============================================================================
export const BILL_ICON_MAP: { 
  regex: RegExp; 
  icon: string; 
  color: string; 
  categoryKey: string; 
}[] = [
  // --- ENTERTAINMENT ---
  // --- STUDENT LOANS (Update) ---
  // Federal & Major Servicers
  { regex: /navient|nelnet|sallie\s?mae|mohela|aidvantage|great\s?lakes|edfinancial|osla|ascendium/i, icon: "school", color: "#005596", categoryKey: "category_debt" },
  // Private Lenders & Refinancing
  { regex: /sofi|earnest|firstmark|college\s?ave|laurel\s?road|lendkey|commonbond|prodigy|mpower/i, icon: "school-outline", color: "#2ECC71", categoryKey: "category_debt" },
  // Perkins / University Held (Heartland ECSI)
  { regex: /ecsi|heartland\s?ecsi|university\s?loan/i, icon: "book-account", color: "#8E44AD", categoryKey: "category_debt" },
  // Generic Dept of Education Matches
  { regex: /dept\s?of\s?ed|student\s?loan|fedloan|direct\s?loan/i, icon: "book-education", color: "#2C3E50", categoryKey: "category_debt" },
  // --- STREAMING & ENTERTAINMENT ---
  { regex: /starlink|spacex/i, icon: "satellite-uplink", color: "#000000", categoryKey: "category_utilities" },
  { regex: /hughesnet|viasat|satellite\s?internet/i, icon: "satellite-variant", color: "#005596", categoryKey: "category_utilities" },
  { regex: /google\s?fiber/i, icon: "speedometer", color: "#34A853", categoryKey: "category_utilities" },
  { regex: /sonic\s?internet|sonic\.net|ziply/i, icon: "router-wireless", color: "#D32F2F", categoryKey: "category_utilities" },
  { regex: /netflix/i, icon: "netflix", color: "#E50914", categoryKey: "category_entertainment" },
  { regex: /spotify/i, icon: "spotify", color: "#1DB954", categoryKey: "category_entertainment" },
  { regex: /hulu/i, icon: "hulu", color: "#1CE783", categoryKey: "category_entertainment" },
  { regex: /disney|plus/i, icon: "movie-open", color: "#0D2593", categoryKey: "category_entertainment" },
  { regex: /hbo|max/i, icon: "movie-open", color: "#532386", categoryKey: "category_entertainment" },
  { regex: /peacock/i, icon: "feather", color: "#000000", categoryKey: "category_entertainment" },
  { regex: /paramount/i, icon: "movie", color: "#0066CC", categoryKey: "category_entertainment" },
  { regex: /youtube|google video/i, icon: "youtube", color: "#FF0000", categoryKey: "category_entertainment" },
  { regex: /twitch/i, icon: "twitch", color: "#9146FF", categoryKey: "category_entertainment" },
  { regex: /discord/i, icon: "discord", color: "#5865F2", categoryKey: "category_entertainment" },
  { regex: /patreon/i, icon: "patreon", color: "#F96854", categoryKey: "category_entertainment" },
  { regex: /sirius|audible|podcast|radio|pandora|tidal|soundcloud/i, icon: "radio", color: "#F07241", categoryKey: "category_entertainment" },
  { regex: /apple|music|itunes|icloud/i, icon: "apple", color: "#A2AAAD", categoryKey: "category_entertainment" },
  { regex: /roku|sling|fubo|directv/i, icon: "television", color: "#662D91", categoryKey: "category_entertainment" },
  { regex: /pool|poool|swiming/i, icon: "pool", color: "#0066CC", categoryKey: "category_housing" },

  // --- STUDENT LOANS ---
  { regex: /navient|nelnet|sallie\s?mae|mohela|aidvantage|great\s?lakes/i, icon: "school", color: "#005596", categoryKey: "category_debt" },
  { regex: /earnest|firstmark|fedloan|edfinancial/i, icon: "school-outline", color: "#2ECC71", categoryKey: "category_debt" },
  { regex: /student\s?loan|dept\s?of\s?ed/i, icon: "book-education", color: "#2C3E50", categoryKey: "category_debt" },

  // --- PETS ---
  { regex: /lemonade|trupanion|healthy\s?paws|embrace|petplan|nationwide\s?pet/i, icon: "paw", color: "#FF0083", categoryKey: "category_insurance" },
  { regex: /rover|wag|chewy|barkbox|petco|petsmart/i, icon: "dog", color: "#1C49C2", categoryKey: "category_shopping" },
  { regex: /vet|veterinary|animal\s?hospital/i, icon: "hospital-box", color: "#E74C3C", categoryKey: "category_health" },
{ regex: /suica|pasmo|icoca|octopus\s?card|oyster\s?card|tfl\s?topup|presto\s?card|clipper\s?card|opal\s?card/i, icon: "smart-card", color: "#27AE60", categoryKey: "category_transport" },

  // --- GLOBAL AIRLINES ---
  { regex: /emirates|qatar\s?air|singapore\s?air|cathay\s?pacific|ana\s?air|jal|japan\s?air|klm|air\s?france|turkish\s?air/i, icon: "airplane", color: "#2980B9", categoryKey: "category_travel" },

  // --- GLOBAL RETAIL ---
  { regex: /shein|temu|aliexpress|zara|uniqlo|h&m|decathlon|sephora/i, icon: "shopping", color: "#E74C3C", categoryKey: "category_shopping" },

  // --- DIGITAL NOMAD / EXPAT ---
  { regex: /airalo|holafly|esim/i, icon: "sim", color: "#34495E", categoryKey: "category_utilities" },
  { regex: /safetywing|world\s?nomads/i, icon: "shield-airplane", color: "#E67E22", categoryKey: "category_insurance" },
  { regex: /remitly|payoneer|western\s?union/i, icon: "cash-multiple", color: "#27AE60", categoryKey: "category_finance" },
  // --- STORAGE ---
  { regex: /public\s?storage|extra\s?space|cubesmart|life\s?storage/i, icon: "warehouse", color: "#F39C12", categoryKey: "category_housing" },
  { regex: /u-?haul|pods|moving/i, icon: "truck", color: "#F39C12", categoryKey: "category_housing" },

  // --- HOME SERVICES (SOLAR / PEST / LAWN) ---
  { regex: /sunrun|sunpower|tesla\s?energy|solar/i, icon: "solar-power", color: "#F1C40F", categoryKey: "category_utilities" },
  { regex: /terminix|orkin|pest/i, icon: "bug", color: "#27AE60", categoryKey: "category_housing" },
  { regex: /trugreen|lawn|landscap/i, icon: "flower", color: "#27AE60", categoryKey: "category_housing" },

  // --- CREDIT & MEDICAL DEBT ---
  { regex: /carecredit|synchrony|comenity|bread\s?financial/i, icon: "credit-card-settings", color: "#5D6D7E", categoryKey: "category_debt" },
  { regex: /quest\s?diag|labcorp|doctor|clinic|dental|ortho/i, icon: "doctor", color: "#3498DB", categoryKey: "category_health" },

  // --- CHILDCARE ---
  { regex: /daycare|preschool|tuition|kinder/i, icon: "baby-carriage", color: "#9B59B6", categoryKey: "category_education" },
  { regex: /bright\s?horizons|kindercare/i, icon: "human-male-female-child", color: "#E67E22", categoryKey: "category_education" },

  // --- MORTGAGE & HOUSING (Update/Add) ---
  { regex: /rocket\s?mortgage|quicken\s?loans/i, icon: "home-lightning-bolt", color: "#D42E12", categoryKey: "category_housing" },
  { regex: /mr\.?\s?cooper/i, icon: "home-account", color: "#00A3E0", categoryKey: "category_housing" },
  { regex: /freedom\s?mortgage/i, icon: "flag", color: "#002F6C", categoryKey: "category_housing" },
  { regex: /loandepot/i, icon: "home-analytics", color: "#F7561B", categoryKey: "category_housing" },
  { regex: /uwm|united\s?wholesale/i, icon: "home-group", color: "#008751", categoryKey: "category_housing" },
  { regex: /calibe?r\s?home/i, icon: "home", color: "#002C5F", categoryKey: "category_housing" },
  // Generic Catch-alls for Housing
  { regex: /mortgage|mtg|home\s?loan|principal/i, icon: "home-city", color: "#2C3E50", categoryKey: "category_housing" },

  // --- AUTO LOANS (Update/Add) ---
  { regex: /toyota\s?financial|tfs/i, icon: "car", color: "#EB0A1E", categoryKey: "category_transport" },
  { regex: /honda\s?financial|hfs/i, icon: "car", color: "#CC0000", categoryKey: "category_transport" },
  { regex: /ford\s?credit|ford\s?motor/i, icon: "car", color: "#003478", categoryKey: "category_transport" },
  { regex: /gm\s?financial|general\s?motors/i, icon: "car", color: "#005595", categoryKey: "category_transport" },
  { regex: /nissan|infiniti/i, icon: "car", color: "#C3002F", categoryKey: "category_transport" },
  { regex: /bmw\s?fs|bmw\s?bank/i, icon: "car-sports", color: "#1C69D4", categoryKey: "category_transport" },
  { regex: /mercedes|daimler/i, icon: "car-sports", color: "#000000", categoryKey: "category_transport" },
  { regex: /hyundai|kia/i, icon: "car", color: "#002C5F", categoryKey: "category_transport" },
  { regex: /vw\s?credit|volkswagen|audi/i, icon: "car", color: "#001E50", categoryKey: "category_transport" },
  { regex: /lexus/i, icon: "car-luxury", color: "#5B7F95", categoryKey: "category_transport" },
  { regex: /bridgecrest|drivetime/i, icon: "car-clock", color: "#0047BB", categoryKey: "category_transport" },
  { regex: /carmax|carvana/i, icon: "car-side", color: "#00529A", categoryKey: "category_transport" },

  // --- GAMING ---
  { regex: /steam|valve/i, icon: "steam", color: "#171A21", categoryKey: "category_entertainment" },
  { regex: /playstation|sony/i, icon: "sony-playstation", color: "#003791", categoryKey: "category_entertainment" },
  { regex: /xbox|microsoft store/i, icon: "microsoft-xbox", color: "#107C10", categoryKey: "category_entertainment" },
  { regex: /nintendo/i, icon: "nintendo-switch", color: "#E60012", categoryKey: "category_entertainment" },

  // --- TECH & SAAS ---
  { regex: /google|gsuite|workspace/i, icon: "google", color: "#4285F4", categoryKey: "category_software" },
  { regex: /microsoft|office|azure/i, icon: "microsoft", color: "#F25022", categoryKey: "category_software" },
  { regex: /amazon|aws|amzn/i, icon: "amazon", color: "#FF9900", categoryKey: "category_shopping" },
  { regex: /adobe|creative cloud/i, icon: "adobe", color: "#FF0000", categoryKey: "category_software" },
  { regex: /dropbox/i, icon: "dropbox", color: "#0061FF", categoryKey: "category_software" },
  { regex: /salesforce|slack|trello|asana|jira|atlassian|notion/i, icon: "briefcase", color: "#00A1E0", categoryKey: "category_software" },
  { regex: /zoom/i, icon: "video", color: "#2D8CFF", categoryKey: "category_software" },
  { regex: /github|gitlab|bitbucket/i, icon: "github", color: "#181717", categoryKey: "category_software" },
  { regex: /openai|chatgpt|midjourney/i, icon: "robot", color: "#10A37F", categoryKey: "category_software" },
  { regex: /intuit|quickbooks|turbotax|xero|sage/i, icon: "file-chart", color: "#2CA01C", categoryKey: "category_software" },
  { regex: /mcafee|norton|kaspersky|vpn/i, icon: "shield-lock", color: "#C0392B", categoryKey: "category_software" },
  { regex: /pennymac|penny mac|p mac/i, icon: "home", color: "#FF9900", categoryKey: "category_finance" },

  // --- BANKS & FINANCE (US) ---
  { regex: /chase|jpmorgan/i, icon: "bank", color: "#117ACA", categoryKey: "category_finance" },
  { regex: /bank of america|bofa/i, icon: "bank", color: "#E31837", categoryKey: "category_finance" },
  { regex: /wells fargo/i, icon: "bank", color: "#CD1409", categoryKey: "category_finance" },
  { regex: /citi/i, icon: "bank", color: "#003B70", categoryKey: "category_finance" },
  { regex: /capital one/i, icon: "credit-card", color: "#004879", categoryKey: "category_finance" },
  { regex: /amex|american express/i, icon: "credit-card-outline", color: "#2E77BC", categoryKey: "category_finance" },
  { regex: /discover/i, icon: "credit-card", color: "#FF6000", categoryKey: "category_finance" },
  { regex: /us bank/i, icon: "bank", color: "#2E86C1", categoryKey: "category_finance" },
  { regex: /(nordvpn|expressvpn|proton\s?vpn|mullvad|openvpn)/i, icon: "shield", color: "#2E86C1", categoryKey: "category_software" },
  { regex: /(1password|lastpass|bitwarden|dashlane)/i, icon: "key", color: "#6C5CE7", categoryKey: "category_software" },
  { regex: /(okta|auth0|duo\s?security)/i, icon: "lock", color: "#34495E", categoryKey: "category_software" },
{ regex: /grab|gojek|uber\s?asia/i, icon: "moped", color: "#00B140", categoryKey: "category_transport" },
  { regex: /shopee|lazada|coupang|rakuten|tmall|taobao|jd\.com/i, icon: "shopping", color: "#EE4D2D", categoryKey: "category_shopping" },
  { regex: /alipay|wechat\s?pay|line\s?pay|paypay|kakao\s?pay|phonepe/i, icon: "qrcode-scan", color: "#1677FF", categoryKey: "category_finance" },
  { regex: /careem|talabat|noon/i, icon: "scooter", color: "#32CD32", categoryKey: "category_food" },

  // --- REGIONAL UTILITIES ---
  { regex: /tepco|kepco|eskom|dewa|tenaga|meralco/i, icon: "lightning-bolt", color: "#F1C40F", categoryKey: "category_utilities" },
  { regex: /docomo|au\s?kddi|softbank|sk\s?telecom|kt\s?corp|singtel|telkomsel|ais|viettel|mtn|vodacom|safaricom/i, icon: "cellphone-wireless", color: "#E67E22", categoryKey: "category_utilities" },
  // --- HR / PAYROLL ---
  { regex: /(gusto|adp|paychex|rippling|workday|paylocity|paycom|deel|remote\.com|justworks)/i, icon: "users", color: "#27AE60", categoryKey: "category_software" },

  // --- AIRLINES / HOTELS / RENTALS ---
  { regex: /(delta|united|american\s?airlines|southwest|jetblue|alaska\s?airlines|spirit|frontier)/i, icon: "plane", color: "#2980B9", categoryKey: "category_travel" },
  { regex: /(marriott|hilton|hyatt|ihg|hotels?\.com|booking\.com|expedia|airbnb)/i, icon: "hotel", color: "#8E44AD", categoryKey: "category_travel" },
  { regex: /(hertz|avis|budget|enterprise|national\s?car\s?rental|alamo)/i, icon: "car", color: "#D35400", categoryKey: "category_travel" },

  // --- GROCERIES / PHARMACY / HEALTH INSURANCE ---
  { regex: /(kroger|whole\s?foods|trader\s?joe|aldi|safeway|publix)/i, icon: "shopping-cart", color: "#16A085", categoryKey: "category_food" },
  { regex: /(cvs|walgreens)/i, icon: "plus", color: "#C0392B", categoryKey: "category_health" },
  { regex: /(aetna|cigna|unitedhealthcare|blue\s?cross|bcbs|anthem|kaiser)/i, icon: "heart", color: "#E74C3C", categoryKey: "category_insurance" },
  { regex: /(insurance|insur|ensure)/i, icon: "shield-outline", color: "#34495E", categoryKey: "category_insurance" },

  { regex: /k/i, icon: "bank", color: "#0C2074", categoryKey: "category_finance" },
  { regex: /pnc/i, icon: "bank", color: "#F48024", categoryKey: "category_finance" },
  { regex: /goldman sachs|fidelity|schwab/i, icon: "bank", color: "#7399C6", categoryKey: "category_finance" },
  { regex: /chime|sofi|ally/i, icon: "bank-circle", color: "#00D588", categoryKey: "category_finance" },
  { regex: /usaa/i, icon: "bank-circle", color: "#0C2074", categoryKey: "category_finance" },

  // --- BANKS & FINANCE (GLOBAL) ---
  { regex: /hsbc/i, icon: "bank", color: "#DB0011", categoryKey: "category_finance" },
  { regex: /barclays/i, icon: "bank", color: "#00AEEF", categoryKey: "category_finance" },
  { regex: /santander/i, icon: "bank", color: "#EC0000", categoryKey: "category_finance" },
  { regex: /lloyds|halifax/i, icon: "horse", color: "#006A4D", categoryKey: "category_finance" },
  { regex: /natwest|rbs/i, icon: "bank", color: "#42145F", categoryKey: "category_finance" },
  { regex: /rbc|royal bank/i, icon: "bank", color: "#FFC222", categoryKey: "category_finance" },
  { regex: /td bank|toronto dominion/i, icon: "bank", color: "#008A00", categoryKey: "category_finance" },
  { regex: /scotiabank/i, icon: "bank", color: "#EC111A", categoryKey: "category_finance" },
  { regex: /bmo|bank of montreal/i, icon: "bank", color: "#0079C1", categoryKey: "category_finance" },
  { regex: /commbank|commonwealth/i, icon: "bank", color: "#FFCC00", categoryKey: "category_finance" },
  { regex: /westpac/i, icon: "bank", color: "#DA1710", categoryKey: "category_finance" },
  { regex: /anz/i, icon: "bank", color: "#004165", categoryKey: "category_finance" },
  { regex: /nab/i, icon: "bank", color: "#BD0029", categoryKey: "category_finance" },
  { regex: /dbs|uob|ocbc/i, icon: "bank", color: "#FF3300", categoryKey: "category_finance" },
  { regex: /deutsche bank/i, icon: "bank", color: "#0018A8", categoryKey: "category_finance" },
  { regex: /ing/i, icon: "bank", color: "#FF6200", categoryKey: "category_finance" },
  { regex: /lightstream|light stream/i, icon: "bank", color: "#FF6200", categoryKey: "category_debt" },
  { regex: /boat|car|rv|toys/i, icon: "bank", color: "#006A4D", categoryKey: "category_debt" },

  // --- PAYMENTS & CRYPTO ---
  { regex: /paypal/i, icon: "paypal", color: "#003087", categoryKey: "category_finance" },
  { regex: /venmo/i, icon: "cash-fast", color: "#3D95CE", categoryKey: "category_finance" },
  { regex: /cash app/i, icon: "cash", color: "#00D632", categoryKey: "category_finance" },
  { regex: /affirm/i, icon: "check-circle-outline", color: "#4A4A4A", categoryKey: "category_debt" },
  { regex: /klarna/i, icon: "shopping", color: "#FFB3C7", categoryKey: "category_debt" },
  { regex: /bitcoin|crypto|coinbase|binance/i, icon: "bitcoin", color: "#F7931A", categoryKey: "category_finance" },
  { regex: /visa|mastercard/i, icon: "credit-card-multiple", color: "#1A1F71", categoryKey: "category_finance" },

  // --- INSURANCE ---
  { regex: /geico/i, icon: "shield-car", color: "#00377C", categoryKey: "category_insurance" },
  { regex: /state farm/i, icon: "shield-home", color: "#E31837", categoryKey: "category_insurance" },
  { regex: /progressive/i, icon: "shield-account", color: "#0047BB", categoryKey: "category_insurance" },
  { regex: /allstate/i, icon: "hand-heart", color: "#0075C9", categoryKey: "category_insurance" },
  { regex: /liberty mutual/i, icon: "shield-check", color: "#FFC600", categoryKey: "category_insurance" },
  { regex: /axa/i, icon: "shield-plus", color: "#00008F", categoryKey: "category_insurance" },
  { regex: /allianz/i, icon: "shield-outline", color: "#003781", categoryKey: "category_insurance" },
  { regex: /united ?health|uhc|aetna|blue cross|cigna|humana/i, icon: "medical-bag", color: "#004685", categoryKey: "category_insurance" },

  // --- TELECOM & INTERNET ---
  { regex: /t-mobile|telekom/i, icon: "cellphone", color: "#E20074", categoryKey: "category_utilities" },
  { regex: /verizon/i, icon: "cellphone-check", color: "#CD040B", categoryKey: "category_utilities" },
  { regex: /att/i, icon: "cellphone-wireless", color: "#00A8E0", categoryKey: "category_utilities" },
  { regex: /xfinity|comcast/i, icon: "router-wireless", color: "#7B3F97", categoryKey: "category_utilities" },
  { regex: /spectrum/i, icon: "router-wireless", color: "#005CAB", categoryKey: "category_utilities" },
  { regex: /vodafone/i, icon: "cellphone-message", color: "#E60000", categoryKey: "category_utilities" },
  { regex: /orange/i, icon: "cellphone", color: "#FF7900", categoryKey: "category_utilities" },
  { regex: /rogers/i, icon: "wifi", color: "#DA291C", categoryKey: "category_utilities" },
  { regex: /bell/i, icon: "phone-classic", color: "#005596", categoryKey: "category_utilities" },
  { regex: /telstra/i, icon: "access-point", color: "#0064D2", categoryKey: "category_utilities" },
  { regex: /virgin/i, icon: "access-point-network", color: "#E10A0A", categoryKey: "category_utilities" },
  { regex: /bt group|british telecom/i, icon: "router", color: "#5514B4", categoryKey: "category_utilities" },
  { regex: /sky/i, icon: "satellite-uplink", color: "#E95622", categoryKey: "category_utilities" },
  { regex: /jio|airtel/i, icon: "access-point", color: "#D32F2F", categoryKey: "category_utilities" },
  { regex: /go daddy|godaddy|server/i, icon: "server-outline", color: "#0E7490", categoryKey: "category_software" },

  // --- HOUSING / RENT (Global) ---
  // Rent, Miete (DE), Loyer (FR), Alquiler (ES)
  { regex: /rent|lease|miete|loyer|alquiler|arrendamiento/i, icon: "home-city", color: "#2C3E50", categoryKey: "category_housing" },
  // Mortgage, Hypotheke (DE), Pret Immo (FR), Hipoteca (ES)
  { regex: /mortgage|home\s?loan|hypothe|pret\s?immo|hipoteca/i, icon: "home-analytics", color: "#2C3E50", categoryKey: "category_housing" },
  // Council Tax / Property Tax
  { regex: /council\s?tax|property\s?tax|grundsteuer|taxe\s?fonciere/i, icon: "bank-transfer", color: "#5D6D7E", categoryKey: "category_housing" },

  // --- UTILITIES (Global) ---
  // Electricity: Power, Strom (DE), Electricite (FR), Luz (ES)
  { regex: /electricity|power|strom|electricit|luz|energia/i, icon: "lightning-bolt", color: "#F1C40F", categoryKey: "category_utilities" },
  // Water: Wasser (DE), Eau (FR), Agua (ES)
  { regex: /water|wasser|eau|agua|sewer|abwasser/i, icon: "water", color: "#3498DB", categoryKey: "category_utilities" },
  // Gas (Universal)
  { regex: /gas|gaz/i, icon: "fire", color: "#E74C3C", categoryKey: "category_utilities" },

  // --- TELECOM (Global) ---
  // Mobile, Handy (DE), Portable (FR), Celular (ES)
  { regex: /mobile|cell|handy|portable|celular|movil|wireless/i, icon: "cellphone", color: "#8E44AD", categoryKey: "category_utilities" },
  // Internet, Breitband (DE), Fibra (ES)
  { regex: /internet|broadband|wifi|breitband|fiber|fibra/i, icon: "router-wireless", color: "#2980B9", categoryKey: "category_utilities" },
  // TV Licence / Media Tax
  { regex: /tv\s?licence|rundfunk|redevance/i, icon: "television-classic", color: "#2C3E50", categoryKey: "category_utilities" },

  // --- TRANSPORT (Global) ---
  // Public Transport: Transit, Bahn (DE), SNCF (FR), Tren (ES)
  { regex: /transit|metro|tube|bahn|sncf|tren|transport|tfl/i, icon: "train", color: "#E67E22", categoryKey: "category_transport" },
  // Tolls: EzPass, Toll, Peage (FR), Maut (DE), Peaje (ES)
  { regex: /toll|peage|maut|peaje|linkt|fastrak/i, icon: "highway", color: "#F39C12", categoryKey: "category_transport" },

  // --- GROCERIES (Global Supermarkets) ---
  { regex: /tesco|sainsbury|asda|waitrose|lidl|aldi|rewe|edeka|carrefour|leclerc|auchan|woolworths|coles|loblaws|metro|sobeys/i, icon: "cart", color: "#27AE60", categoryKey: "category_shopping" },

  // --- HEALTH (Global) ---
  // Pharmacy: Apotheke (DE), Pharmacie (FR), Farmacia (ES)
  { regex: /pharmacy|drug\s?store|apotheke|pharmacie|farmacia|boots|superdrug|shoppers/i, icon: "pill", color: "#E74C3C", categoryKey: "category_health" },
  // Health Insurance: Krankenkasse (DE), Mutuelle (FR)
  { regex: /health|medical|krankenkasse|mutuelle|seguro\s?salud/i, icon: "hospital-box", color: "#E74C3C", categoryKey: "category_insurance" },

  // --- UTILITIES & HOUSING ---
  { regex: /comed|con edison|pge|duke energy|edf|e\.on|british gas|agl|origin|enel/i, icon: "lightning-bolt", color: "#FBBF24", categoryKey: "category_utilities" },
  { regex: /gas|heating|propane|national grid/i, icon: "fire", color: "#E74C3C", categoryKey: "category_utilities" },
  { regex: /water|sewer|sanitation/i, icon: "water", color: "#0E7490", categoryKey: "category_utilities" },
  { regex: /trash|waste|republic services/i, icon: "trash-can", color: "#839192", categoryKey: "category_utilities" },
  { regex: /rent|lease|mortgage|property|hoa/i, icon: "home-city", color: "#020202ff", categoryKey: "category_housing" },
  { regex: /adt|ring|simplisafe|alarm|vivint/i, icon: "security", color: "#0055A5", categoryKey: "category_housing" },
  { regex: /solar|electricity|elec|Solar Panels/i, icon: "flash-outline", color: "#F4D03F", categoryKey: "category_utilities" },
  { regex: /sams|club|sams club|club/i, icon: "cart-outline", color: "#839192", categoryKey: "category_shopping" },

  // --- TRANSPORT & TRAVEL ---
  { regex: /uber|lyft|grab|taxi/i, icon: "taxi", color: "#000000", categoryKey: "category_transport" },
  { regex: /airbnb|booking|expedia|hotel|vrbo/i, icon: "bed", color: "#FF5A5F", categoryKey: "category_travel" },
  { regex: /delta|united|american air|lufthansa|british airways|emirates|qantas/i, icon: "airplane", color: "#003A70", categoryKey: "category_travel" },
  { regex: /tesla/i, icon: "car-electric", color: "#CC0000", categoryKey: "category_transport" },
  { regex: /car loan|auto payment|toyota|honda|ford|bmw|mercedes/i, icon: "car", color: "#444444", categoryKey: "category_transport" },
  { regex: /toll|ezpass|highway|sunpass/i, icon: "highway", color: "#F4D03F", categoryKey: "category_transport" },

  // --- SHOPPING & LIFESTYLE ---
  { regex: /amazon/i, icon: "amazon", color: "#FF9900", categoryKey: "category_shopping" },
  { regex: /walmart/i, icon: "cart", color: "#0071CE", categoryKey: "category_shopping" },
  { regex: /target/i, icon: "bullseye-arrow", color: "#CC0000", categoryKey: "category_shopping" },
  { regex: /costco/i, icon: "cart-outline", color: "#0060A9", categoryKey: "category_shopping" },
  { regex: /ikea/i, icon: "home-floor-2", color: "#FFDA1A", categoryKey: "category_shopping" },
  { regex: /nike/i, icon: "shoe-sneaker", color: "#111111", categoryKey: "category_shopping" },
  { regex: /adidas/i, icon: "shoe-sneaker", color: "#000000", categoryKey: "category_shopping" },
  { regex: /doordash|ubereats|grubhub|deliveroo|just eat/i, icon: "food", color: "#FF3008", categoryKey: "category_food" },
  { regex: /instacart|hellofresh|blue apron/i, icon: "food-apple", color: "#43B02A", categoryKey: "category_food" },
  { regex: /gym|planet fitness|gold's|equinox|peloton|fitness/i, icon: "dumbbell", color: "#6A1E99", categoryKey: "category_health" },
  { regex: /duolingo/i, icon: "owl", color: "#58CC02", categoryKey: "category_education" },

  // --- GENERIC CATCH-ALLS (Low Priority) ---
  { regex: /news|times|post|guardian|bbc|cnn/i, icon: "newspaper", color: "#2C3E50", categoryKey: "category_entertainment" },
  { regex: /loan|debt/i, icon: "bank-transfer", color: "#7F8C8D", categoryKey: "category_debt" },
  { regex: /student loan|fedloan/i, icon: "school", color: "#2ECC71", categoryKey: "category_debt" },
  { regex: /phone|landline/i, icon: "phone", color: "#3F51B5", categoryKey: "category_utilities" },
  { regex: /storage/i, icon: "archive", color: "#E67E22", categoryKey: "category_housing" }

];

// ============================================================================
// 3. KNOWN SUBSCRIPTIONS (Specific Overrides & Manual Definitions)
// ============================================================================
export const KNOWN_SUBSCRIPTIONS = [
  // ==========================================
  // 1. STREAMING: VIDEO & MUSIC
  // ==========================================
  { 
    id: 'netflix', 
    name: 'Netflix', 
    patterns: [/netflix/i], 
    color: '#E50914', 
    icon: 'netflix', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://www.netflix.com/cancelplan' 
  },
  { 
    id: 'spotify', 
    name: 'Spotify', 
    patterns: [/spotify/i], 
    color: '#1DB954', 
    icon: 'spotify', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://www.spotify.com/account/subscription' 
  },
  { 
    id: 'youtube', 
    name: 'YouTube Premium', 
    patterns: [/youtube/i, /google.*yt/i], 
    color: '#FF0000', 
    icon: 'youtube', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://www.youtube.com/paid_memberships'
  },
  { 
    id: 'hulu', 
    name: 'Hulu', 
    patterns: [/hulu/i], 
    color: '#1CE783', 
    icon: 'hulu', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://secure.hulu.com/account'
  },
  { 
    id: 'hbo', 
    name: 'HBO / Max', 
    patterns: [/hbo/i, /hbomax/i, /wb.*discovery/i], 
    color: '#560FD1', 
    icon: 'movie-roll', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://auth.max.com/subscription'
  },
  { 
    id: 'disney', 
    name: 'Disney+', 
    patterns: [/disney/i], 
    color: '#113CCF', 
    icon: 'creation', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://www.disneyplus.com/account/subscription'
  },
  { 
    id: 'prime_video', 
    name: 'Prime Video', 
    patterns: [/prime video/i], 
    color: '#00A8E1', 
    icon: 'amazon', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://www.amazon.com/gp/video/settings'
  },
  { 
    id: 'apple_tv', 
    name: 'Apple TV+', 
    patterns: [/apple.*tv/i], 
    color: '#000000', 
    icon: 'apple', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://apps.apple.com/account/subscriptions'
  },
  { 
    id: 'paramount', 
    name: 'Paramount+', 
    patterns: [/paramount/i], 
    color: '#0064FF', 
    icon: 'movie', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://www.paramountplus.com/account'
  },
  { 
    id: 'peacock', 
    name: 'Peacock', 
    patterns: [/peacock.*tv/i], 
    color: '#000000', 
    icon: 'feather', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://www.peacocktv.com/account/plans'
  },
  { 
    id: 'audible', 
    name: 'Audible', 
    patterns: [/audible/i, /amazon.*audio/i], 
    color: '#F8991C', 
    icon: 'book-open-page-variant', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://www.audible.com/account/overview'
  },
  { 
    id: 'siriusxm', 
    name: 'SiriusXM', 
    patterns: [/siriusxm/i, /sirius\s?xm/i], 
    color: '#0000A0', 
    icon: 'radio', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://care.siriusxm.com/account/subscriptions'
  },

  // ==========================================
  // 2. NEWS & JOURNALISM (High Churn)
  // ==========================================
  { 
    id: 'nyt', 
    name: 'NY Times', 
    patterns: [/new\s?york\s?times/i, /ny\s?times/i, /nyt\s?sub/i], 
    color: '#000000', 
    icon: 'newspaper', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://www.nytimes.com/myaccount/subscription/manage'
  },
  { 
    id: 'wsj', 
    name: 'Wall Street Journal', 
    patterns: [/wall\s?street\s?journal/i, /wsj/i], 
    color: '#000000', 
    icon: 'newspaper-variant', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://customercenter.wsj.com/manage-subscriptions'
  },
  { 
    id: 'washington_post', 
    name: 'Washington Post', 
    patterns: [/washington\s?post/i, /wash\s?post/i], 
    color: '#000000', 
    icon: 'newspaper', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://subscribe.washingtonpost.com/myaccount/profile'
  },
  { 
    id: 'economist', 
    name: 'The Economist', 
    patterns: [/economist/i], 
    color: '#E3120B', 
    icon: 'earth', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://myaccount.economist.com/s/manage-subscription'
  },
  { 
    id: 'medium', 
    name: 'Medium', 
    patterns: [/medium/i], 
    color: '#000000', 
    icon: 'book-open', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://medium.com/me/settings/membership'
  },

  // ==========================================
  // 3. LEARNING & SELF-IMPROVEMENT
  // ==========================================
  { 
    id: 'duolingo', 
    name: 'Duolingo', 
    patterns: [/duolingo/i], 
    color: '#58CC02', 
    icon: 'owl', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://www.duolingo.com/settings/plus'
  },
  { 
    id: 'masterclass', 
    name: 'MasterClass', 
    patterns: [/masterclass/i], 
    color: '#000000', 
    icon: 'school', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://www.masterclass.com/account/edit'
  },
  { 
    id: 'skillshare', 
    name: 'Skillshare', 
    patterns: [/skillshare/i], 
    color: '#00FF84', 
    icon: 'school-outline', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://www.skillshare.com/settings/payments'
  },
  { 
    id: 'coursera', 
    name: 'Coursera', 
    patterns: [/coursera/i], 
    color: '#0056D2', 
    icon: 'certificate', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://www.coursera.org/my-purchases'
  },
  { 
    id: 'audible', 
    name: 'Audible', 
    patterns: [/audible/i], 
    color: '#F8991C', 
    icon: 'book-open-page-variant', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://www.audible.com/account/overview'
  },
  { 
    id: 'blinkist', 
    name: 'Blinkist', 
    patterns: [/blinkist/i], 
    color: '#2CE080', 
    icon: 'book-open', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://www.blinkist.com/nc/settings/account'
  },

  // ==========================================
  // 4. CREATIVE ASSETS (Music, Video, Design)
  // ==========================================
  { 
    id: 'adobe', 
    name: 'Adobe Creative', 
    patterns: [/adobe/i], 
    color: '#FF0000', 
    icon: 'pencil-ruler', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://account.adobe.com/plans'
  },
  { 
    id: 'canva', 
    name: 'Canva', 
    patterns: [/canva/i], 
    color: '#00C4CC', 
    icon: 'palette', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://www.canva.com/settings/billing'
  },
  { 
    id: 'epidemic_sound', 
    name: 'Epidemic Sound', 
    patterns: [/epidemic\s?sound/i], 
    color: '#000000', 
    icon: 'music-note', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://epidemicsound.com/account/subscription'
  },
  { 
    id: 'artlist', 
    name: 'Artlist', 
    patterns: [/artlist/i], 
    color: '#FFB800', 
    icon: 'music-clef-treble', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://artlist.io/account/billing'
  },
  { 
    id: 'shutterstock', 
    name: 'Shutterstock', 
    patterns: [/shutterstock/i], 
    color: '#F93933', 
    icon: 'camera-image', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://www.shutterstock.com/account/plans'
  },
  { 
    id: 'figma', 
    name: 'Figma', 
    patterns: [/figma/i], 
    color: '#F24E1E', 
    icon: 'vector-square', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://www.figma.com/settings/billing'
  },

  // ==========================================
  // 5. ANCESTRY & GENEALOGY (Annual Shocks)
  // ==========================================
  { 
    id: 'ancestry', 
    name: 'Ancestry.com', 
    patterns: [/ancestry/i, /ancestry.*com/i], 
    color: '#84BD00', 
    icon: 'tree', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://www.ancestry.com/account/subscription'
  },
  { 
    id: '23andme', 
    name: '23andMe', 
    patterns: [/23andme/i], 
    color: '#FF545D', 
    icon: 'dna', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_health',
    cancelUrl: 'https://you.23andme.com/user/settings/'
  },
  { 
    id: 'myheritage', 
    name: 'MyHeritage', 
    patterns: [/myheritage/i], 
    color: '#C63628', 
    icon: 'family-tree', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://www.myheritage.com/account/my-purchases'
  },

  // ==========================================
  // 6. DATING & SOCIAL
  // ==========================================
  { 
    id: 'tinder', 
    name: 'Tinder', 
    patterns: [/tinder/i], 
    color: '#FE3C72', 
    icon: 'fire', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_health',
    cancelUrl: 'https://www.tinder.com/account/settings' 
  },
  { 
    id: 'bumble', 
    name: 'Bumble', 
    patterns: [/bumble/i], 
    color: '#FFC629', 
    icon: 'bee', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_health',
    cancelUrl: 'https://bumble.com/help-search?q=cancel' 
  },
  { 
    id: 'hinge', 
    name: 'Hinge', 
    patterns: [/hinge/i], 
    color: '#000000', 
    icon: 'heart', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_health',
    cancelUrl: 'https://apps.apple.com/account/subscriptions'
  },
  { 
    id: 'match', 
    name: 'Match.com', 
    patterns: [/match\.com/i], 
    color: '#0061E0', 
    icon: 'heart-outline', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_health',
    cancelUrl: 'https://www.match.com/account/subscription/manage'
  },

  // ==========================================
  // 7. GAMING (Deep)
  // ==========================================
  { 
    id: 'xbox', 
    name: 'Xbox Game Pass', 
    patterns: [/microsoft.*xbox/i, /xbox/i], 
    color: '#107C10', 
    icon: 'microsoft-xbox', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://account.microsoft.com/services'
  },
  { 
    id: 'playstation', 
    name: 'PlayStation Plus', 
    patterns: [/playstation/i, /sony.*network/i, /psn/i], 
    color: '#003791', 
    icon: 'sony-playstation', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://www.playstation.com/acct/management'
  },
  { 
    id: 'nintendo', 
    name: 'Nintendo Online', 
    patterns: [/nintendo/i], 
    color: '#E60012', 
    icon: 'nintendo-switch', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://ec.nintendo.com/my/membership'
  },
  { 
    id: 'steam', 
    name: 'Steam', 
    patterns: [/steam/i, /valve/i], 
    color: '#171A21', 
    icon: 'steam', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://store.steampowered.com/account/subscriptions/'
  },
  { 
    id: 'ea_play', 
    name: 'EA Play', 
    patterns: [/ea\s?play/i, /electronic\s?arts/i], 
    color: '#FF4747', 
    icon: 'gamepad-variant', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://myaccount.ea.com/cp-ui/subscription/index'
  },
  { 
    id: 'ubisoft_plus', 
    name: 'Ubisoft+', 
    patterns: [/ubisoft/i], 
    color: '#005DF4', 
    icon: 'ubisoft', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://store.ubisoft.com/my-subscription'
  },
  { 
    id: 'roblox', 
    name: 'Roblox Premium', 
    patterns: [/roblox/i], 
    color: '#000000', 
    icon: 'controller-classic', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_entertainment',
    cancelUrl: 'https://www.roblox.com/my/account?tab=Billing'
  },

  // ==========================================
  // 8. PRODUCTIVITY & TOOLS
  // ==========================================
  { 
    id: 'evernote', 
    name: 'Evernote', 
    patterns: [/evernote/i], 
    color: '#00A82D', 
    icon: 'notebook-outline', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://www.evernote.com/Settings.action'
  },
  { 
    id: 'notion', 
    name: 'Notion', 
    patterns: [/notion/i], 
    color: '#000000', 
    icon: 'notebook', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://www.notion.so/settings/billing'
  },
  { 
    id: 'todoist', 
    name: 'Todoist', 
    patterns: [/todoist/i, /doist/i], 
    color: '#E44332', 
    icon: 'check-bold', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://todoist.com/app/settings/subscription'
  },
  { 
    id: 'dropbox', 
    name: 'Dropbox', 
    patterns: [/dropbox/i], 
    color: '#0061FF', 
    icon: 'dropbox', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://www.dropbox.com/account/plan'
  },
  { 
    id: '1password', 
    name: '1Password', 
    patterns: [/1password/i], 
    color: '#0094F5', 
    icon: 'lock-outline', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_software',
    cancelUrl: 'https://my.1password.com/billing'
  },

  // ==========================================
  // 9. HEALTH & LIFESTYLE
  // ==========================================
  { 
    id: 'peloton', 
    name: 'Peloton', 
    patterns: [/peloton/i], 
    color: '#DF1C2F', 
    icon: 'bike', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_health',
    cancelUrl: 'https://www.onepeloton.com/mymembership'
  },
  { 
    id: 'strava', 
    name: 'Strava', 
    patterns: [/strava/i], 
    color: '#FC4C02', 
    icon: 'run', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_health',
    cancelUrl: 'https://www.strava.com/account'
  },
  { 
    id: 'calm', 
    name: 'Calm', 
    patterns: [/calm\.com/i], 
    color: '#0026FF', 
    icon: 'meditation', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_health',
    cancelUrl: 'https://www.calm.com/profile/subscription'
  },
  { 
    id: 'headspace', 
    name: 'Headspace', 
    patterns: [/headspace/i], 
    color: '#F47D31', 
    icon: 'brain', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_health',
    cancelUrl: 'https://www.headspace.com/subscription/manage'
  },
  { 
    id: 'hellofresh', 
    name: 'HelloFresh', 
    patterns: [/hellofresh/i], 
    color: '#96D600', 
    icon: 'food-apple', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_food',
    cancelUrl: 'https://www.hellofresh.com/account-settings/plan-management'
  },
  { 
    id: 'amazon_prime', 
    name: 'Amazon Prime', 
    patterns: [/amazon.*prime/i, /amzn.*prime/i], 
    color: '#00A8E1', 
    icon: 'amazon', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_shopping',
    cancelUrl: 'https://www.amazon.com/mc/pipeline/cancellation'
  },
  { 
    id: 'uber_one', 
    name: 'Uber One', 
    patterns: [/uber.*one/i, /uber.*pass/i], 
    color: '#000000', 
    icon: 'uber', 
    type: 'MaterialCommunityIcons', 
    categoryKey: 'category_transport',
    cancelUrl: 'https://m.uber.com/ul/?action=viewPass'
  },
];
// ============================================================================
// HELPERS & RESOLVER
// ============================================================================

// Normalize text for fuzzy matching (remove spaces, special chars, lowercase)
const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Main Resolver Function
 * Returns a unified VendorInfo object with logo, icon, and translation keys.
 */
export function getVendorInfo(rawName: string, themeIsDark: boolean = false): VendorInfo {
  const cleanName = rawName.trim();
  const normalizedKey = normalize(cleanName);

  // 1. Try Specific Known Subscriptions (Highest Priority)
  const knownSub = KNOWN_SUBSCRIPTIONS.find(sub => 
    sub.patterns.some(p => p.test(cleanName))
  );

  if (knownSub) {
    const domain = VENDOR_DOMAINS[knownSub.name] || VENDOR_DOMAINS[cleanName];
    // Handle Apple dark mode edge case
    let finalColor = knownSub.color;
    if (knownSub.id.includes('apple') && themeIsDark) finalColor = '#FFFFFF';

    return {
      id: knownSub.id,
      displayName: knownSub.name,
      originalName: rawName,
      // Priority: 1. Manual Domain lookup, 2. No Logo
      logoUrl: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
      icon: knownSub.icon,
      iconLib: (knownSub.type as "Ionicons" | "MaterialCommunityIcons") || "MaterialCommunityIcons",
      color: finalColor,
      isKnown: true,
      categoryKey: knownSub.categoryKey || 'category_other'
    };
  }

  // 2. Try Bill Icon Map (Regex Categories)
  const mapMatch = BILL_ICON_MAP.find(m => m.regex.test(cleanName));
  
  // 3. Try to find a domain for logo even if not in KNOWN_SUBSCRIPTIONS
  //    We check the raw name against our Domain Dictionary keys
  let logoUrl: string | null = null;
  const domainKey = Object.keys(VENDOR_DOMAINS).find(k => normalize(k) === normalizedKey || cleanName.toLowerCase().includes(k.toLowerCase()));
  if (domainKey) {
     const domain = VENDOR_DOMAINS[domainKey];
     logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }

  if (mapMatch) {
    return {
      id: cleanName,
      displayName: cleanName, // Use original name if we just matched a category
      originalName: rawName,
      logoUrl: logoUrl, // We might have found a logo via string matching
      icon: mapMatch.icon,
      iconLib: "MaterialCommunityIcons",
      color: mapMatch.color,
      isKnown: true,
      categoryKey: mapMatch.categoryKey
    };
  }

  // 4. Fallback (Generic)
  return {
    id: cleanName,
    displayName: cleanName,
    originalName: rawName,
    logoUrl: logoUrl, // Even generic bills might have a logo if the name matches a domain key
    icon: "receipt-outline", // Generic receipt icon
    iconLib: "Ionicons",
    color: "#94A3B8", // Neutral Gray
    isKnown: false,
    categoryKey: "category_other"
  };
}

const NORMALIZED_VENDOR_DOMAINS: Record<string, string> = Object.fromEntries(
  Object.entries(VENDOR_DOMAINS).map(([name, domain]) => [normalizeVendorKey(name), domain])
);

export const getVendorDomain = (vendorName: string) => {
  if (!vendorName) return null;

  // 1) Exact match
  const exact = VENDOR_DOMAINS[vendorName];
  if (exact) return exact;

  // 2) Normalized match + aliases
  const key = normalizeVendorKey(vendorName);
  return VENDOR_DOMAIN_ALIASES[key] ?? NORMALIZED_VENDOR_DOMAINS[key] ?? null;
};

export const getVendorLogo = (vendorName: string) => {
  const domain = getVendorDomain(vendorName);
  if (!domain) return null;
  
  // Google's public API. 'sz' controls size (16, 32, 64, 128).
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
};