// Plume's `organization` field was a free-text box in 2025 and a dropdown in
// 2026, so the same school shows up under many spellings ("UC Berkeley",
// "U.C. Berkeley", "University of California - Berkeley"). Everything is
// canonicalized to the 2026 dropdown names so the two years group the same way.

export const OTHER = "Other / not listed";

// Reduce a spelling to a comparison key: lowercase, drop "the", punctuation,
// dashes and parentheticals, collapse whitespace.
function key(s: string): string {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[–—\-,.'’&:]/g, " ")
    .replace(/\bthe\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// canonical name → every spelling we've seen (compared via key()).
const CANON: Record<string, string[]> = {
  MIT: ["mit", "massachusetts institute of technology", "massachusetts institute of technology mit"],
  "Georgia Institute of Technology": ["georgia tech", "georgia institute of technology"],
  "University of California, Berkeley (UCB)": ["uc berkeley", "ucb", "berkeley", "u c berkeley", "university of california berkeley"],
  "University of California, Los Angeles (UCLA)": ["ucla", "university of california los angeles"],
  "University of California, San Diego (UCSD)": ["ucsd", "uc san diego", "university of california san diego"],
  "University of California, Santa Barbara (UCSB)": ["ucsb", "university of california santa barbara"],
  "University of California, Santa Cruz": ["ucsc", "university of california santa cruz"],
  "University of California, Irvine": ["uci", "uc irvine", "university of california irvine"],
  "University of California, Davis": ["uc davis", "university of california davis"],
  "Stanford University": ["stanford"],
  "Harvard University": ["harvard", "harvard college"],
  "Yale University": ["yale"],
  "Princeton University": ["princeton"],
  "Columbia University": ["columbia"],
  "Cornell University": ["cornell"],
  "Brown University": ["brown"],
  "Duke University": ["duke", "duke universsity"],
  "Dartmouth College": ["dartmouth"],
  "University of Pennsylvania": ["upenn", "penn", "penn engineering cs ai wharton finance"],
  "Carnegie Mellon University": ["cmu", "carnegie mellon", "carnegie mellon university school of computer science"],
  "New York University (NYU)": ["nyu", "new york university"],
  "Northeastern University": ["northeastern"],
  "Boston University": ["bu"],
  "Wellesley College": ["wellesley"],
  "Tufts University": ["tufts"],
  "University of Michigan-Ann Arbor": ["university of michigan", "umich", "university of michigan ann arbor"],
  "University of Massachusetts, Amherst": ["umass amherst", "umass", "university of massachusetts amherst"],
  "University of Maryland, College Park": ["umd", "university of maryland", "university of maryland college park"],
  "University of Illinois at Urbana-Champaign": ["uiuc", "university of illinois urbana champaign", "university of illinois at urbana champaign"],
  "University of Illinois Chicago (UIC)": ["uic", "university of illinois chicago", "university of illinois at chicago"],
  "University of Texas at Austin": ["ut austin", "university of texas at austin", "university of texas austin"],
  "University of Texas at Dallas": ["ut dallas", "university of texas at dallas"],
  "University of Texas at Arlington": ["ut arlington", "university of texas at arlington"],
  "Texas A&M University": ["texas a m", "texas a m university", "tamu"],
  "University of Wisconsin-Madison": ["uw madison", "university of wisconsin madison"],
  "University of Washington": ["uw", "university of washington"],
  "University of Southern California": ["usc", "university of southern california"],
  "Arizona State University": ["asu", "arizona state", "arizona state university", "barrett honors college at arizona state university"],
  "Pennsylvania State University": ["penn state", "penn state university", "psu"],
  "Purdue University": ["purdue", "purdue university west lafayette"],
  "Ohio State University": ["osu", "ohio state university"],
  "Rutgers University – New Brunswick": ["rutgers", "rutgers university", "rutgers university new brunswick", "honors college at rutgers university new brunswick"],
  "Stony Brook University": ["suny stony brook university", "stony brook"],
  "University of North Carolina, Chapel Hill": ["unc", "unc chapel hill", "university of north carolina at chapel hill"],
  "Virginia Polytechnic Institute (Virginia Tech)": ["virginia tech", "vt"],
  "Washington University in St. Louis": ["washu", "washington university", "washington university in st louis"],
  "California Institute of Technology (Caltech)": ["caltech", "california institute of technology"],
  "Worcester Polytechnic Institute": ["wpi", "worcester polytechnic institute"],
  "University of Waterloo": ["uwaterloo", "waterloo", "university of waterloo computer engineering"],
  "University of Toronto": ["uoft", "u of t", "university of toronto st george"],
  "University of British Columbia": ["ubc", "university of british columbia"],
  "McGill University": ["mcgill", "mcgll universiry"],
  "Queen's University, Ontario": ["queen s university", "queens university"],
  "National University of Singapore (NUS)": ["nus", "national university of singapore"],
  "ETH Zurich (Swiss Federal Institute of Technology)": ["eth zurich", "eth zürich", "eth"],
  "Technical University of Munich": ["tum", "tum technical university of munich"],
  "Tecnológico de Monterrey (ITESM)": ["tecnologico de monterrey", "tecnológico de monterrey", "itesm", "monterrey institute of technology", "monterrey institute of technology and higher education"],
  "Politecnico di Milano": ["polytechnic university of milan", "polimi"],
  "Universitat Politècnica de Catalunya": ["upc", "polytechnic university of catalonia"],
  "Indian Institute of Technology Madras (IITM)": ["iit madras", "indian institute of technology madras"],
  "University of Southern Mississippi": ["southern miss"],
  "De Anza College": ["de anza"],
  "Cascadia College": ["cascadia community college"],
};

const ALIASES = new Map<string, string>();
for (const [canon, spellings] of Object.entries(CANON)) {
  ALIASES.set(key(canon), canon);
  for (const s of spellings) ALIASES.set(key(s), canon);
}

// Personal names, majors and multi-school entries can't be counted as a school.
const NOT_A_SCHOOL = /\b(and|&)\b.*\b(university|mit|princeton)\b|^rohil/i;

export function normalizeSchool(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed || /^(other|n\/a|none)$/i.test(trimmed)) return OTHER;
  if (NOT_A_SCHOOL.test(trimmed) && !ALIASES.has(key(trimmed))) return OTHER;
  return ALIASES.get(key(trimmed)) ?? trimmed;
}
