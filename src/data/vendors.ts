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
  "Chewy": "chewy.com",
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
  "BarkBox": "barkbox.com",
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