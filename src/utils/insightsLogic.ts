import { startOfMonth, addMonths, format, parseISO } from "date-fns";
import { Theme } from "../ui/useTheme";

export type ChartType = 'creditor_pie' | 'monthly_bar' | 'recurrence_pie';

export const chartTypes: { key: ChartType, labelKey: string }[] = [
    { key: 'creditor_pie', labelKey: 'Creditor Breakdown' },
    { key: 'monthly_bar', labelKey: 'Monthly Spending Trend' },
    { key: 'recurrence_pie', labelKey: 'Recurrence Frequency' },
];

export function centsToDollars(cents: number) {
  return (Number(cents || 0) / 100).toFixed(2);
}

export const CATEGORY_MAP: { regex: RegExp; label: string; color: string }[] = [
  { regex: /netflix|spotify|hulu|disney|hbo|apple|youtube|twitch|sirius|pandora|tidal|audible|peacock|paramount|sling|fubo|roku|xbox|playstation|nintendo|steam|nytimes|wsj|crunchyroll|patreon|onlyfans|starz|showtime|amc|fandango|espn|dazn|nba|nfl|mlb/i, label: "Entertainment", color: "#E50914" },
  { regex: /loan|mortgage|rent|lease|property|hoa|storage|public storage|extra space|adt|ring|simplisafe|vivint|lawn|pest|apartments|invitation homes|greystar|lincoln property|camden|equity residential|terminix|orkin|merry maids|cleaning/i, label: "Housing", color: "#9D174D" },
  { regex: /power|electric|gas|water|trash|sewer|internet|wifi|phone|att|verizon|t-mobile|sprint|boost|mint|google fi|xfinity|comcast|spectrum|cox|centurylink|frontier|optimum|directv|dish|waste|republic services|pge|edison|coned|duke energy|fpl|national grid|dominion|entergy|xcel|dte|pepco|eversource|constellation|reliant|solar|sunrun|tesla energy/i, label: "Utilities", color: "#FBBF24" },
  { regex: /chase|citi|amex|discover|visa|mastercard|capital one|wells fargo|bofa|bank of america|pnc|us bank|affirm|klarna|afterpay|sezzle|paypal credit|synchrony|navient|nelnet|sallie mae|mohela|aidvantage|sofi|lending|rocket|freedom|target card|best buy card|macys|kohls|credit one|ally|schwab|fidelity/i, label: "Debt & Credit", color: "#3B82F6" },
  { regex: /insurance|geico|state farm|progressive|liberty|allstate|usaa|aaa|farmers|nationwide|travelers|hartford|metlife|prudential|aetna|cigna|united|uhc|bcbs|anthem|humana|kaiser|lemonade|root|esurance|amica|erie|chubb|aflac/i, label: "Insurance", color: "#10B981" },
  { regex: /gym|fitness|peloton|planet|equinox|24 hour|la fitness|anytime|gold's|orange theory|crossfit|strava|myfitnesspal|doctor|dental|vision|quest|labcorp|cvs|walgreens|rite aid|capsule|pillpack|calm|headspace|betterhelp|talkspace|weight watchers|noom/i, label: "Health", color: "#8B5CF6" },
  { regex: /uber|lyft|ezpass|fastrak|sunpass|ipass|toll|parking|spothero|zipcar|turo|tesla|toyota|honda|ford|gm financial|nissan|bmw|mercedes|hyundai|kia|carmax|carvana|siriusxm|onstar/i, label: "Auto & Transport", color: "#F97316" },
  { regex: /tuition|school|university|college|udemy|coursera|chegg|duolingo|masterclass|babble|skillshare|linkedin learning|pluralsight|codecademy|kumon|daycare|kinderqaure|bright horizons/i, label: "Education", color: "#EC4899" },
  { regex: /adobe|microsoft|google storage|icloud|dropbox|zoom|slack|chatgpt|openai|github|vercel|aws|digitalocean|heroku|godaddy|namecheap|squarespace|wix|wordpress|canva|figma|notion|evernote|lastpass|1password|nordvpn|expressvpn/i, label: "Software", color: "#6366F1" },
  { regex: /chewy|barkbox|farmers dog|petco|petsmart|rover|wag|care\.com|hellofresh|blue apron|factor|instacart|doordash|grubhub|uber eats|amazon prime|walmart\+|costco|sams club/i, label: "Family & Lifestyle", color: "#14B8A6" },
];

export function getCategory(creditor: string) {
  for (const cat of CATEGORY_MAP) {
    if (creditor.match(cat.regex)) return cat.label;
  }
  return "Other";
}

export function groupDataByCreditor(bills: any[]) {
    const creditorMap: { [key: string]: number } = {};
    let total = 0;
    const colors = ['#2ECC71', '#3498DB', '#E67E22', '#F1C40F', '#9B59B6', '#E74C3C', '#1ABC9C'];
    let colorIndex = 0;

    for (const bill of bills) {
        const amount = Number(bill.amount_cents || 0);
        if (amount > 0) {
            const name = bill.creditor || 'Unknown';
            creditorMap[name] = (creditorMap[name] || 0) + amount;
            total += amount;
        }
    }

    const data = Object.keys(creditorMap)
        .map(creditor => ({
            value: creditorMap[creditor],
            label: creditor,
            color: colors[colorIndex++ % colors.length],
            text: `$${centsToDollars(creditorMap[creditor])}`,
            key: creditor,
        }))
        .sort((a, b) => b.value - a.value);

    return { data, total };
}

export function groupDataByMonth(bills: any[], theme: Theme) {
    const monthMap: { [key: string]: number } = {};
    const today = new Date();
    let total = 0;
    const numMonths = 6;

    for (let i = numMonths - 1; i >= 0; i--) {
        const month = startOfMonth(addMonths(today, -i));
        monthMap[format(month, 'yyyy-MM')] = 0;
    }

    for (const bill of bills) {
        if (!bill.due_date) continue;
        const date = parseISO(bill.due_date);
        const amount = Number(bill.amount_cents || 0);
        const dateKey = format(date, 'yyyy-MM');
        
        if (monthMap.hasOwnProperty(dateKey)) {
            monthMap[dateKey] += amount;
            total += amount;
        }
    }

    const data = Object.keys(monthMap)
        .sort()
        .map(key => ({
            value: monthMap[key],
            label: format(parseISO(key), 'MMM'),
            frontColor: theme.colors.primary,
        }));
        
    const average = total / numMonths;
    return { data, total, average };
}

export function groupDataByRecurrence(bills: any[]) {
    const recurrenceMap: { [key: string]: number } = {};
    let total = 0;
    const colors = ['#3498DB', '#9B59B6', '#E74C3C', '#F1C40F', '#2ECC71'];
    let colorIndex = 0;

    for (const bill of bills) {
        const amount = Number(bill.amount_cents || 0);
        if (amount > 0) {
            const key = bill.recurrence || 'none';
            recurrenceMap[key] = (recurrenceMap[key] || 0) + amount;
            total += amount;
        }
    }

    const data = Object.keys(recurrenceMap)
        .map(key => ({
            value: recurrenceMap[key],
            label: key.charAt(0).toUpperCase() + key.slice(1),
            color: colors[colorIndex++ % colors.length],
            key: key,
        }))
        .sort((a, b) => b.value - a.value);

    return { data, total };
}