// Team rosters — HubSpot owner IDs → display names.
// Edit here when people join or leave; Vercel redeploys automatically on push.
export const SALES_TEAM = {
  "48072333": "James Duckworth",
  "90555365": "Daniel Farnes",
  "47261350": "Anastasi Kotoros",
  "79071555": "Nick Blacklock",
  "47374662": "Jon Vlatko",
  "48548989": "Kealy Day",
  "1051791165": "Zane Chattree",
  "20872099": "Molly Barr",
  "48072477": "Huon Hoogesteger"
  "579412291": "Lauren Hamilton"
};

export const PERFORMANCE_TEAM = {
  "459404046": "Danishi Katgara",
  "1463037898": "Daksh Apoorva Vora",
  "94038586": "Barbara Burba",
};

export const FY_START = "2026-07-01"; // Australian financial year start (update annually)

export function teamOf(ownerId) {
  if (SALES_TEAM[ownerId]) return "sales";
  if (PERFORMANCE_TEAM[ownerId]) return "performance";
  return null;
}
export function ownerName(ownerId) {
  return SALES_TEAM[ownerId] || PERFORMANCE_TEAM[ownerId] || "The team";
}
