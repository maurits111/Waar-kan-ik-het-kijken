import { NextRequest, NextResponse } from "next/server";

const WATCHMODE_API_KEY = process.env.WATCHMODE_API_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY; // Voeg toe aan je .env.local!
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
    let matches: { id: number; name: string; year: number | null; type: string; poster: string | null }[] = [];

    // STAP 1: Als TMDB API Key aanwezig is, gebruik TMDB voor slimme fuzzy search
    if (TMDB_API_KEY) {
      const tmdbRes = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          query
        )}&language=nl-NL&page=1`
      );
      const tmdbData = await tmdbRes.json();
      
      const tmdbResults = (tmdbData?.results || [])
        .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
        .slice(0, 5);

      // Koppel TMDB resultaten aan Watchmode ID's
      matches = await Promise.all(
        tmdbResults.map(async (item: any) => {
          const isTv = item.media_type === "tv";
          const title = isTv ? item.name : item.title;
          const releaseDate = isTv ? item.first_air_date : item.release_date;
          const year = releaseDate ? parseInt(releaseDate.split("-")[0]) : null;
          const poster = item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : null;

          // Haal Watchmode ID op via TMDB ID
          try {
            const wmSearch = await fetch(
              `${WATCHMODE_BASE}/search/?apiKey=${WATCHMODE_API_KEY}&search_field=tmdb_${isTv ? "tv" : "movie"}_id&search_value=${item.id}`
            );
            const wmData = await wmSearch.json();
            const wmId = wmData?.title_results?.[0]?.id;

            return {
              id: wmId || item.id,
              name: title,
              year: year,
              type: isTv ? "tv_series" : "movie",
              poster: poster,
            };
          } catch {
            return {
              id: item.id,
              name: title,
              year: year,
              type: isTv ? "tv_series" : "movie",
              poster: poster,
            };
          }
        })
      );
    } else {
      // FALLBACK: Als er geen TMDB sleutel is, gebruik direct Watchmode
      const searchRes = await fetch(
        `${WATCHMODE_BASE}/search/?apiKey=${WATCHMODE_API_KEY}&search_field=name&search_value=${encodeURIComponent(
          query
        )}`
      );
      const searchData = await searchRes.json();
      matches = (searchData?.title_results || []).slice(0, 5).map((m: any) => ({
        id: m.id,
        name: m.name,
        year: m.year,
        type: m.type,
        poster: null,
      }));
    }

    if (matches.length === 0) {
      return NextResponse.json({ results: [] as StreamingResult[] });
    }

    // STAP 2: Haal streamingbronnen op via Watchmode
    const results: StreamingResult[] = await Promise.all(
      matches.map(async (match) => {
        try {
          const sourcesRes = await fetch(
            `${WATCHMODE_BASE}/title/${match.id}/sources/?apiKey=${WATCHMODE_API_KEY}&regions=${region}`
          );
          const sourcesData = await sourcesRes.json();

          return {
            titleId: match.id,
            name: match.name,
            year: match.year,
            poster: match.poster,
            titleType: match.type,
            sources: (Array.isArray(sourcesData) ? sourcesData : [])
              .filter((s: any) => s.region === region)
              .map((s: any) => ({
                name: s.name,
                type: s.type,
                webUrl: s.web_url,
              })),
          };
        } catch {
          return {
            titleId: match.id,
            name: match.name,
            year: match.year,
            poster: match.poster,
            titleType: match.type,
            sources: [],
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Fout bij ophalen streaminggegevens" },
      { status: 502 }
    );
  }
}