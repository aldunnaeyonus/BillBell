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
}

export const bulkURL = "https://tinyurl.com/billMVP";
export const serverURL = "https://dunn-carabali.com/billMVP";

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
  "China Mobile": "chinamobileltd.com",
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
  "Zara": "zara.com",
  "H&M": "hm.com",
  "Uniqlo": "uniqlo.com",
  "ASOS": "asos.com",
  "Apple Store": "apple.com",
  "eBay": "ebay.com",
  "Etsy": "etsy.com",
  "CVS": "cvs.com",
  "Walgreens": "walgreens.com",
  "Rite Aid": "riteaid.com",
  "Sephora": "sephora.com",
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
  "Air France": "airfrance.com",
  "Emirates": "emirates.com",
  "Qantas": "qantas.com",
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
  // 1. STREAMING & ENTERTAINMENT (Global)
  // ==========================================
  { id: 'netflix', name: 'Netflix', patterns: [/netflix/i], color: '#E50914', icon: 'netflix', type: 'MaterialCommunityIcons', categoryKey: 'category_entertainment' },
  { id: 'spotify', name: 'Spotify', patterns: [/spotify/i], color: '#1DB954', icon: 'spotify', type: 'MaterialCommunityIcons', categoryKey: 'category_entertainment' },
  { id: 'youtube', name: 'YouTube Premium', patterns: [/youtube/i, /google.*yt/i], color: '#FF0000', icon: 'youtube', type: 'MaterialCommunityIcons', categoryKey: 'category_entertainment' },
  { id: 'hulu', name: 'Hulu', patterns: [/hulu/i], color: '#1CE783', icon: 'hulu', type: 'MaterialCommunityIcons', categoryKey: 'category_entertainment' },
  { id: 'hbo', name: 'HBO / Max', patterns: [/hbo/i, /hbomax/i, /wb.*discovery/i], color: '#560FD1', icon: 'movie-roll', type: 'MaterialCommunityIcons', categoryKey: 'category_entertainment' },
  { id: 'disney', name: 'Disney+', patterns: [/disney/i], color: '#113CCF', icon: 'creation', type: 'MaterialCommunityIcons', categoryKey: 'category_entertainment' },
  { id: 'prime_video', name: 'Prime Video', patterns: [/prime video/i], color: '#00A8E1', icon: 'amazon', type: 'MaterialCommunityIcons', categoryKey: 'category_entertainment' },
  { id: 'apple_tv', name: 'Apple TV+', patterns: [/apple.*tv/i], color: '#000000', icon: 'apple', type: 'MaterialCommunityIcons', categoryKey: 'category_entertainment' },
  { id: 'paramount', name: 'Paramount+', patterns: [/paramount/i], color: '#0064FF', icon: 'movie', type: 'MaterialCommunityIcons', categoryKey: 'category_entertainment' },
  { id: 'peacock', name: 'Peacock', patterns: [/peacock.*tv/i], color: '#000000', icon: 'feather', type: 'MaterialCommunityIcons', categoryKey: 'category_entertainment' },
  { id: 'dazn', name: 'DAZN', patterns: [/dazn/i], color: '#F5EB00', icon: 'soccer', type: 'MaterialCommunityIcons', categoryKey: 'category_entertainment' }, // Huge in EU/Japan
  { id: 'sky', name: 'Sky', patterns: [/sky.*digital/i, /sky.*tv/i, /now tv/i], color: '#E71409', icon: 'satellite-uplink', type: 'MaterialCommunityIcons', categoryKey: 'category_entertainment' }, // UK/EU
  { id: 'canal', name: 'Canal+', patterns: [/canal\+/i, /canal plus/i], color: '#000000', icon: 'television-classic', type: 'MaterialCommunityIcons', categoryKey: 'category_entertainment' }, // France

  { id: 'rocket_mortgage', name: 'Rocket Mortgage', patterns: [/rocket\s?mortgage/i, /quicken\s?loans/i], color: '#D42E12', icon: 'home-lightning-bolt', type: 'MaterialCommunityIcons', categoryKey: 'category_housing' },
  { id: 'mr_cooper', name: 'Mr. Cooper', patterns: [/mr\.?\s?cooper/i], color: '#163868', icon: 'home-account', type: 'MaterialCommunityIcons', categoryKey: 'category_housing' },
  { id: 'freedom_mortgage', name: 'Freedom Mortgage', patterns: [/freedom\s?mortgage/i], color: '#002F6C', icon: 'flag-checkered', type: 'MaterialCommunityIcons', categoryKey: 'category_housing' },
  { id: 'loandepot', name: 'LoanDepot', patterns: [/loandepot/i], color: '#F7561B', icon: 'home-analytics', type: 'MaterialCommunityIcons', categoryKey: 'category_housing' },
  { id: 'navient', name: 'Navient', patterns: [/navient/i], color: '#00467F', icon: 'school', type: 'MaterialCommunityIcons', categoryKey: 'category_debt' },
  { id: 'nelnet', name: 'Nelnet', patterns: [/nelnet/i], color: '#88C740', icon: 'school-outline', type: 'MaterialCommunityIcons', categoryKey: 'category_debt' },
  { id: 'mohela', name: 'MOHELA', patterns: [/mohela/i], color: '#00583D', icon: 'book-education', type: 'MaterialCommunityIcons', categoryKey: 'category_debt' },

  // ==========================================
  // STUDENT LOANS
  // ==========================================
  { id: 'navient', name: 'Navient', patterns: [/navient/i], color: '#00467F', icon: 'school', type: 'MaterialCommunityIcons', categoryKey: 'category_debt' },
  { id: 'nelnet', name: 'Nelnet', patterns: [/nelnet/i], color: '#88C740', icon: 'school-outline', type: 'MaterialCommunityIcons', categoryKey: 'category_debt' },
  { id: 'mohela', name: 'MOHELA', patterns: [/mohela/i], color: '#00583D', icon: 'book-education', type: 'MaterialCommunityIcons', categoryKey: 'category_debt' },
  { id: 'aidvantage', name: 'Aidvantage', patterns: [/aidvantage/i], color: '#002C5F', icon: 'account-school', type: 'MaterialCommunityIcons', categoryKey: 'category_debt' },
{ id: 'edfinancial', name: 'EdFinancial', patterns: [/edfinancial/i], color: '#00529B', icon: 'school', type: 'MaterialCommunityIcons', categoryKey: 'category_debt' },
  { id: 'ecsi', name: 'Heartland ECSI', patterns: [/heartland\s?ecsi/i, /ecsi/i], color: '#D1202F', icon: 'book-account', type: 'MaterialCommunityIcons', categoryKey: 'category_debt' },
  { id: 'sofi_loan', name: 'SoFi Student Loan', patterns: [/sofi.*mohela/i, /sofi.*loan/i], color: '#00D588', icon: 'bank-outline', type: 'MaterialCommunityIcons', categoryKey: 'category_debt' },
  { id: 'college_ave', name: 'College Ave', patterns: [/college\s?ave/i], color: '#FFC72C', icon: 'school-outline', type: 'MaterialCommunityIcons', categoryKey: 'category_debt' },
  { id: 'laurel_road', name: 'Laurel Road', patterns: [/laurel\s?road/i], color: '#004F71', icon: 'doctor', type: 'MaterialCommunityIcons', categoryKey: 'category_debt' },
  // ==========================================
  // HOUSEHOLD SERVICES
  // ==========================================
  { id: 'public_storage', name: 'Public Storage', patterns: [/public\s?storage/i], color: '#F37021', icon: 'warehouse', type: 'MaterialCommunityIcons', categoryKey: 'category_housing' },
  { id: 'extra_space', name: 'Extra Space', patterns: [/extra\s?space/i], color: '#006633', icon: 'locker-multiple', type: 'MaterialCommunityIcons', categoryKey: 'category_housing' },
  { id: 'sunrun', name: 'Sunrun', patterns: [/sunrun/i], color: '#FDB913', icon: 'solar-power', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'terminix', name: 'Terminix', patterns: [/terminix/i], color: '#68BC45', icon: 'bug', type: 'MaterialCommunityIcons', categoryKey: 'category_housing' },

  // ==========================================
  // FINANCING & STORE CARDS
  // ==========================================
  { id: 'synchrony', name: 'Synchrony Bank', patterns: [/synchrony/i, /syncb/i], color: '#F5B31B', icon: 'bank', type: 'MaterialCommunityIcons', categoryKey: 'category_debt' },
  { id: 'comenity', name: 'Comenity Bank', patterns: [/comenity/i], color: '#E31837', icon: 'credit-card-outline', type: 'MaterialCommunityIcons', categoryKey: 'category_debt' },
  { id: 'carecredit', name: 'CareCredit', patterns: [/carecredit/i], color: '#00788A', icon: 'medical-bag', type: 'MaterialCommunityIcons', categoryKey: 'category_debt' },

  // ==========================================
  // AUTO FINANCE
  // ==========================================
  { id: 'toyota_fs', name: 'Toyota Financial', patterns: [/toyota/i, /lexus/i], color: '#EB0A1E', icon: 'car', type: 'MaterialCommunityIcons', categoryKey: 'category_transport' },
  { id: 'honda_fs', name: 'Honda Financial', patterns: [/honda/i, /acura/i], color: '#CC0000', icon: 'car-hatchback', type: 'MaterialCommunityIcons', categoryKey: 'category_transport' },
  { id: 'ford_credit', name: 'Ford Credit', patterns: [/ford\s?credit/i, /lincoln/i], color: '#003478', icon: 'car-pickup', type: 'MaterialCommunityIcons', categoryKey: 'category_transport' },
  { id: 'gm_financial', name: 'GM Financial', patterns: [/gm\s?financial/i, /chevrolet/i, /cadillac/i], color: '#005595', icon: 'car-estate', type: 'MaterialCommunityIcons', categoryKey: 'category_transport' },
  { id: 'bmw_fs', name: 'BMW Financial', patterns: [/bmw/i, /mini\s?financial/i], color: '#1C69D4', icon: 'car-sports', type: 'MaterialCommunityIcons', categoryKey: 'category_transport' },
  { id: 'santander_consumer', name: 'Santander Consumer', patterns: [/santander\s?consumer/i], color: '#EC0000', icon: 'car-key', type: 'MaterialCommunityIcons', categoryKey: 'category_transport' },
  // ==========================================
  // 2. TELECOM & INTERNET (High Value)
  // ==========================================
  // USA / Canada
  { id: 'att', name: 'AT&T', patterns: [/at&t/i, /att\*bill/i], color: '#00A8E0', icon: 'phone', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'verizon', name: 'Verizon', patterns: [/verizon/i, /vzw/i], color: '#CD040B', icon: 'check', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'tmobile', name: 'T-Mobile', patterns: [/t-mobile/i, /tmobile/i], color: '#E20074', icon: 'signal', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'xfinity', name: 'Xfinity / Comcast', patterns: [/comcast/i, /xfinity/i], color: '#FF0000', icon: 'router-wireless', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'rogers', name: 'Rogers', patterns: [/rogers/i], color: '#FF0000', icon: 'cellphone', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'telus', name: 'Telus', patterns: [/telus/i], color: '#4B286D', icon: 'leaf', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  // Europe / Global
  { id: 'vodafone', name: 'Vodafone', patterns: [/vodafone/i], color: '#E60000', icon: 'sim', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'orange', name: 'Orange', patterns: [/orange/i], color: '#FF7900', icon: 'access-point', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'deutsche_telekom', name: 'Telekom', patterns: [/telekom/i], color: '#E20074', icon: 'network', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'telefonica', name: 'O2 / Telefónica', patterns: [/telefonica/i, /o2/i], color: '#032D56', icon: 'molecule', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'bt', name: 'BT Group', patterns: [/bt group/i, /british telecom/i], color: '#5514B4', icon: 'phone-classic', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },

  // ==========================================
  // UK SPECIFIC
  // ==========================================
  { id: 'council_tax', name: 'Council Tax', patterns: [/council\s?tax/i], color: '#000000', icon: 'city', type: 'MaterialCommunityIcons', categoryKey: 'category_housing' },
  { id: 'tv_licence', name: 'TV Licence', patterns: [/tv\s?licen[cs]e/i], color: '#D20042', icon: 'television-classic', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'octopus_energy', name: 'Octopus Energy', patterns: [/octopus\s?energy/i], color: '#FF00A3', icon: 'lightning-bolt', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'british_gas', name: 'British Gas', patterns: [/british\s?gas/i], color: '#0099FF', icon: 'fire', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'tesco_mobile', name: 'Tesco Mobile', patterns: [/tesco\s?mobile/i], color: '#00539F', icon: 'cellphone', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },

  // ==========================================
  // CANADA SPECIFIC
  // ==========================================
  { id: 'hydro_one', name: 'Hydro One', patterns: [/hydro\s?one/i], color: '#DA291C', icon: 'lightning-bolt', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'icbc', name: 'ICBC', patterns: [/icbc/i], color: '#003366', icon: 'car-info', type: 'MaterialCommunityIcons', categoryKey: 'category_insurance' },
  { id: 'shoppers', name: 'Shoppers Drug Mart', patterns: [/shoppers\s?drug/i, /shoppers/i], color: '#004F88', icon: 'pill', type: 'MaterialCommunityIcons', categoryKey: 'category_health' },

  // ==========================================
  // AUSTRALIA SPECIFIC
  // ==========================================
  { id: 'woolworths', name: 'Woolworths', patterns: [/woolworths/i], color: '#178841', icon: 'food-apple', type: 'MaterialCommunityIcons', categoryKey: 'category_shopping' },
  { id: 'coles', name: 'Coles', patterns: [/coles/i], color: '#DA291C', icon: 'cart', type: 'MaterialCommunityIcons', categoryKey: 'category_shopping' },
  { id: 'medibank', name: 'Medibank', patterns: [/medibank/i], color: '#D41031', icon: 'hospital-box', type: 'MaterialCommunityIcons', categoryKey: 'category_insurance' },
  { id: 'linkt', name: 'Linkt', patterns: [/linkt/i], color: '#5C2D91', icon: 'highway', type: 'MaterialCommunityIcons', categoryKey: 'category_transport' },

  // ==========================================
  // GERMANY (DACH) SPECIFIC
  // ==========================================
  { id: 'rundfunk', name: 'Rundfunkbeitrag', patterns: [/rundfunk/i, /ard\s?zdf/i], color: '#00529A', icon: 'radio-tower', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'db', name: 'Deutsche Bahn', patterns: [/deutsche\s?bahn/i, /db\s?vertrieb/i], color: '#FF0000', icon: 'train', type: 'MaterialCommunityIcons', categoryKey: 'category_transport' },
  { id: 'tk', name: 'Techniker Krankenkasse', patterns: [/techniker/i, /tk\s?beitrag/i], color: '#009FD6', icon: 'medical-bag', type: 'MaterialCommunityIcons', categoryKey: 'category_insurance' },

  // ==========================================
  // FRANCE SPECIFIC
  // ==========================================
  { id: 'edf', name: 'EDF', patterns: [/edf/i], color: '#FE5800', icon: 'lightning-bolt', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'sncf', name: 'SNCF', patterns: [/sncf/i, /ouigo/i], color: '#88258C', icon: 'train', type: 'MaterialCommunityIcons', categoryKey: 'category_transport' },
  { id: 'caf', name: 'CAF', patterns: [/caf/i], color: '#27348B', icon: 'bank-transfer', type: 'MaterialCommunityIcons', categoryKey: 'category_finance' },

  // ==========================================
  // INDIA SPECIFIC
  // ==========================================
  { id: 'jio', name: 'Jio', patterns: [/jio/i], color: '#0F3CC9', icon: 'access-point', type: 'MaterialCommunityIcons', categoryKey: 'category_utilities' },
  { id: 'lic', name: 'LIC India', patterns: [/lic\s?india/i, /life\s?insurance\s?corp/i], color: '#F1C40F', icon: 'shield-account', type: 'MaterialCommunityIcons', categoryKey: 'category_insurance' },
  { id: 'paytm', name: 'Paytm', patterns: [/paytm/i], color: '#002E6E', icon: 'cellphone-check', type: 'MaterialCommunityIcons', categoryKey: 'category_finance' },
  { id: 'zomato', name: 'Zomato', patterns: [/zomato/i], color: '#E23744', icon: 'moped', type: 'MaterialCommunityIcons', categoryKey: 'category_food' },

  // ==========================================
  // GLOBAL FINTECH & CRYPTO
  // ==========================================
  { id: 'revolut', name: 'Revolut', patterns: [/revolut/i], color: '#0075EB', icon: 'bank-outline', type: 'MaterialCommunityIcons', categoryKey: 'category_finance' },
  { id: 'wise', name: 'Wise', patterns: [/wise.*transfer/i, /transferwise/i], color: '#9FE870', icon: 'earth', type: 'MaterialCommunityIcons', categoryKey: 'category_finance' },
  { id: 'binance', name: 'Binance', patterns: [/binance/i], color: '#F3BA2F', icon: 'bitcoin', type: 'MaterialCommunityIcons', categoryKey: 'category_finance' },
  { id: 'crypto_com', name: 'Crypto.com', patterns: [/crypto\.com/i], color: '#002D74', icon: 'bitcoin', type: 'MaterialCommunityIcons', categoryKey: 'category_finance' },

  // ==========================================
  // 3. CLOUD, HOSTING & SOFTWARE (Tech)
  // ==========================================
  { id: 'aws', name: 'AWS', patterns: [/aws/i, /amazon web/i], color: '#FF9900', icon: 'aws', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },
  { id: 'google_cloud', name: 'Google Cloud', patterns: [/google.*cloud/i, /gcp/i], color: '#4285F4', icon: 'cloud', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },
  { id: 'azure', name: 'Azure', patterns: [/azure/i, /msft.*azure/i], color: '#0078D4', icon: 'microsoft-azure', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },
  { id: 'digitalocean', name: 'DigitalOcean', patterns: [/digitalocean/i, /digital ocean/i], color: '#0080FF', icon: 'water', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },
  { id: 'heroku', name: 'Heroku', patterns: [/heroku/i], color: '#430098', icon: 'code-braces', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },
  { id: 'godaddy', name: 'GoDaddy', patterns: [/godaddy/i], color: '#1BDBDB', icon: 'domain', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },
  { id: 'namecheap', name: 'Namecheap', patterns: [/namecheap/i], color: '#DE3723', icon: 'tag-text', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },
  { id: 'github', name: 'GitHub', patterns: [/github/i], color: '#181717', icon: 'github', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },
  { id: 'vercel', name: 'Vercel', patterns: [/vercel/i], color: '#000000', icon: 'triangle', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },

  // ==========================================
  // 4. LIFESTYLE, FOOD & GYM
  // ==========================================
  { id: 'uber_one', name: 'Uber One', patterns: [/uber.*one/i, /uber.*pass/i], color: '#000000', icon: 'uber', type: 'MaterialCommunityIcons', categoryKey: 'category_transport' },
  { id: 'doordash', name: 'DoorDash', patterns: [/doordash/i, /dashpass/i], color: '#FF3008', icon: 'food', type: 'MaterialCommunityIcons', categoryKey: 'category_food' },
  { id: 'hellofresh', name: 'HelloFresh', patterns: [/hellofresh/i], color: '#96D600', icon: 'food-apple', type: 'MaterialCommunityIcons', categoryKey: 'category_food' },
  { id: 'peloton', name: 'Peloton', patterns: [/peloton/i], color: '#DF1C2F', icon: 'bike', type: 'MaterialCommunityIcons', categoryKey: 'category_health' },
  { id: 'planet_fitness', name: 'Planet Fitness', patterns: [/planet fit/i], color: '#7D228F', icon: 'dumbbell', type: 'MaterialCommunityIcons', categoryKey: 'category_health' },
  { id: 'equinox', name: 'Equinox', patterns: [/equinox/i], color: '#000000', icon: 'yoga', type: 'MaterialCommunityIcons', categoryKey: 'category_health' },

  // ==========================================
  // 5. PRODUCTIVITY & TOOLS
  // ==========================================
  { id: 'microsoft_365', name: 'Microsoft 365', patterns: [/microsoft.*365/i, /msft.*office/i], color: '#0078D4', icon: 'microsoft', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },
  { id: 'adobe', name: 'Adobe', patterns: [/adobe/i], color: '#FF0000', icon: 'pencil-ruler', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },
  { id: 'zoom', name: 'Zoom', patterns: [/zoom\.us/i], color: '#2D8CFF', icon: 'video', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },
  { id: 'slack', name: 'Slack', patterns: [/slack/i], color: '#4A154B', icon: 'slack', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },
  { id: 'linkedin', name: 'LinkedIn', patterns: [/linkedin/i], color: '#0077B5', icon: 'linkedin', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },
  { id: 'dropbox', name: 'Dropbox', patterns: [/dropbox/i], color: '#0061FF', icon: 'dropbox', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },
  { id: 'notion', name: 'Notion', patterns: [/notion/i], color: '#000000', icon: 'notebook', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },
  { id: 'chatgpt', name: 'ChatGPT', patterns: [/openai/i, /chatgpt/i], color: '#74AA9C', icon: 'robot', type: 'MaterialCommunityIcons', categoryKey: 'category_software' },

  // ==========================================
  // 6. INSURANCE & FINANCE (Recurring)
  // ==========================================
  { id: 'geico', name: 'Geico', patterns: [/geico/i], color: '#004990', icon: 'car', type: 'MaterialCommunityIcons', categoryKey: 'category_insurance' },
  { id: 'progressive', name: 'Progressive', patterns: [/progressive/i], color: '#00549E', icon: 'car-hatchback', type: 'MaterialCommunityIcons', categoryKey: 'category_insurance' },
  { id: 'state_farm', name: 'State Farm', patterns: [/state farm/i], color: '#E00309', icon: 'home-heart', type: 'MaterialCommunityIcons', categoryKey: 'category_insurance' },
  { id: 'allianz', name: 'Allianz', patterns: [/allianz/i], color: '#003781', icon: 'shield-home', type: 'MaterialCommunityIcons', categoryKey: 'category_insurance' },
  { id: 'axa', name: 'AXA', patterns: [/axa/i], color: '#00008F', icon: 'hospital-box', type: 'MaterialCommunityIcons', categoryKey: 'category_insurance' },
  { id: 'amex', name: 'Amex Fee', patterns: [/american express/i, /amex.*fee/i], color: '#006FCF', icon: 'credit-card', type: 'MaterialCommunityIcons', categoryKey: 'category_finance' },
  { id: 'chase', name: 'Chase Fee', patterns: [/chase.*fee/i], color: '#117ACA', icon: 'bank', type: 'MaterialCommunityIcons', categoryKey: 'category_finance' },
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