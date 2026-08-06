import { NextRequest, NextResponse } from "next/server";

const WATCHMODE_API_KEY = process.env.WATCHMODE_API_KEY;
const WATCHMODE_BASE = "https://api.watchmode.com/v1";

export type StreamingResult = {
  titleId: number;
  name: string;
  year: number | null;
  poster: string | null;
  titleType: string | null;
  sources: {
    name: string;
    type: string;
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
    // Zoek via het gewone search endpoint
    const searchRes = await fetch(
      `${WATCHMODE_BASE}/search/?apiKey=${WATCHMODE_API_KEY}&search_field=name&search_value=${encodeURIComponent(
        query
      )}`
    );
    const searchData = await searchRes.json();
    const rawMatches = searchData?.title_results || [];

    // Filteren: Sorteer titels met een poster en recenter jaartal naar boven
    const matches = rawMatches
      .sort((a: any, b: any) => (b.year || 0) - (a.year || 0))
      .slice(0, 5);

    if (matches.length === 0) {
      return NextResponse.json({ results: [] as StreamingResult[] });
    }

    // Details & bronnen ophalen
    const results: StreamingResult[] = await Promise.all(
      matches.map(async (match: any) => {
        try {
          const [sourcesRes, detailsRes] = await Promise.all([
            fetch(
              `${WATCHMODE_BASE}/title/${match.id}/sources/?apiKey=${WATCHMODE_API_KEY}&regions=${region}`
            ),
            fetch(
              `${WATCHMODE_BASE}/title/${match.id}/details/?apiKey=${WATCHMODE_API_KEY}`
            ),
          ]);

          const sourcesData = await sourcesRes.json();
          const detailsData = await detailsRes.json();

          return {
            titleId: match.id,
            name: match.name,
            year: match.year ?? detailsData.year ?? null,
            poster: detailsData.poster ?? null,
            titleType: match.type ?? detailsData.type ?? null,
            sources: (Array.isArray(sourcesData) ? sourcesData : [])
              .filter((s: any) => s.region === region)
              .map((s: any) => ({
                name: s.name,
                type: s.type,
                webUrl: s.web_url,
              })),
          };
        } catch (e) {
          return {
            titleId: match.id,
            name: match.name,
            year: match.year ?? null,
            poster: null,
            titleType: match.type ?? null,
            sources: [],
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong while fetching streaming data" },
      { status: 502 }
    );
  }
}