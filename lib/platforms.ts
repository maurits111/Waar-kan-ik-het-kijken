export interface Platform {
  id: string;
  label: string;
  match: string;
  color: string;
  abbr: string;
}

export const MAJOR_PLATFORMS: Platform[] = [
  { id: "netflix", label: "Netflix", match: "netflix", color: "#E50914", abbr: "NF" },
  { id: "disney", label: "Disney+", match: "disney", color: "#113CCF", abbr: "D+" },
  { id: "prime", label: "Prime Video", match: "prime", color: "#00A8E1", abbr: "PV" },
  { id: "hbo", label: "HBO Max", match: "hbo", color: "#8B5CF6", abbr: "HB" },
  { id: "apple", label: "Apple TV+", match: "apple", color: "#7C7C82", abbr: "AT" },
  { id: "videoland", label: "Videoland", match: "videoland", color: "#D90A6C", abbr: "VL" },
  { id: "nlziet", label: "NLZIET", match: "nlziet", color: "#2D6CDF", abbr: "NL" },
  { id: "sooner", label: "Sooner", match: "sooner", color: "#7B4BFF", abbr: "SO" },
  { id: "mubi", label: "MUBI", match: "mubi", color: "#C88A00", abbr: "MU" },
  { id: "pathe", label: "Pathé Thuis", match: "path", color: "#E30613", abbr: "PT" },
  { id: "showtime", label: "SkyShowtime", match: "showtime", color: "#00C2A8", abbr: "SS" },
  { id: "npo", label: "NPO Start", match: "npo", color: "#D99E00", abbr: "NP" },
];

export function findPlatform(name: string): Platform | null {
  const lower = name.toLowerCase();
  return MAJOR_PLATFORMS.find((p) => lower.includes(p.match)) ?? null;
}
