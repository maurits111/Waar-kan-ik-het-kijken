import { NextRequest, NextResponse } from "next/server";

// This route runs on the server, never in the browser.
// The Watchmode API key stays in an environment variable, so it's
// never visible in the page source or dev tools.
const WATCHMODE_API_KEY = process.env.WATCHMODE_API_KEY;
const WATCHMODE_BASE = "https://api.watchmode.com/v1";

export type StreamingResult = {
  titleId: number;
  name: string;
  year: number | null;
  poster: string | null;
  sources: {
    name: string;
    type: string; // "sub" | "rent" | "buy" | "free"
    webUrl: string;
  }[];
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const region = searchParams.get("region") ?? "NL";

  if (!query) {
    return NextResponse.json(
      { error: "Missing 'q' search parameter" },
      { status: 400 }
    );
  }

  if (!WATCHMODE_API_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured: WATCHMODE_API_KEY is not set" },
      { status: 500 }
    );
  }

  try {
    // Step 1: find the title's Watchmode ID by name.
    const searchRes = await fetch(
      `${WATCHMODE_BASE}/search/?apiKey=${WATCHMODE_API_KEY}&search_field=name&search_value=${encodeURIComponent(
        query
      )}`
    );
    const searchData = await searchRes.json();
    const firstMatch = searchData?.title_results?.[0];

    if (!firstMatch) {
      return NextResponse.json({ results: [] as StreamingResult[] });
    }

    // Step 2: fetch streaming sources for that title, filtered by region.
    const sourcesRes = await fetch(
      `${WATCHMODE_BASE}/title/${firstMatch.id}/sources/?apiKey=${WATCHMODE_API_KEY}&regions=${region}`
    );
    const sourcesData = await sourcesRes.json();

    const result: StreamingResult = {
      titleId: firstMatch.id,
      name: firstMatch.name,
      year: firstMatch.year ?? null,
      poster: firstMatch.image_url ?? null,
      sources: (sourcesData ?? [])
        .filter((s: any) => s.region === region)
        .map((s: any) => ({
          name: s.name,
          type: s.type,
          webUrl: s.web_url,
        })),
    };

    return NextResponse.json({ results: [result] });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong while fetching streaming data" },
      { status: 502 }
    );
  }
}
