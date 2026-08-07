import { NextRequest, NextResponse } from "next/server";

const WATCHMODE_API_KEY = process.env.WATCHMODE_API_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const WATCHMODE_BASE = "https://api.watchmode.com/v1";
const CACHE_REVALIDATE = 86400;

type TmdbItem = {
  id: number;
  name?: string;
  title?: string;
  first_air_date?: string;
  release_date?: string;
  poster_path?: string | null;
  media_type: string;
  popularity: number;
};

type WatchmodeTitleResult = {
  id: number;
  name: string;
  year: number | null;
  type: string;
};

type WmSource = {
  name: string;
  type: string;
  web_url: string;
  region?: string;
};

type SearchMatch = {
  id: number;
  name: string;
  year: number | null;
  type: string;
  poster: string | null;
  popularity: number;
};

export type StreamingResult = {
  titleId: number;
  name: string;
  year: number | null;
  poster: string | null;
  titleType: string | null;
  popularity: number;
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
  const suggestOnly = searchParams.get("mode") === "suggest";

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
    let matches: SearchMatch[] = [];

    // STAP 1: Gebruik TMDB voor slimme fuzzy search met populariteitssortering
    if (TMDB_API_KEY) {
      const tmdbRes = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          query
        )}&language=nl-NL&page=1`,
        { next: { revalidate: CACHE_REVALIDATE } }
      );
      const tmdbData = await tmdbRes.json();

      const rawResults: TmdbItem[] = (tmdbData?.results || []).filter(
        (item: TmdbItem) => item.media_type === "movie" || item.media_type === "tv"
      );

      // BELANGRIJK: Sorteer op populariteit van hoog naar laag!
      rawResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      // Pak de top 5 meest populaire matches
      const tmdbResults = rawResults.slice(0, 5);

      matches = await Promise.all(
        tmdbResults.map(async (item: TmdbItem) => {
          const isTv = item.media_type === "tv";
          const title = (isTv ? item.name : item.title) ?? "";
          const releaseDate = isTv ? item.first_air_date : item.release_date;
          const year = releaseDate ? parseInt(releaseDate.split("-")[0]) : null;
          const poster = item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : null;

          let wmId: number | null = null;
          // Bij suggesties geen Watchmode-lookup nodig (bespaart API-calls)
          if (!suggestOnly) {
            try {
              const wmSearch = await fetch(
                `${WATCHMODE_BASE}/search/?apiKey=${WATCHMODE_API_KEY}&search_field=tmdb_${
                  isTv ? "tv" : "movie"
                }_id&search_value=${item.id}`,
                { next: { revalidate: CACHE_REVALIDATE } }
              );
              const wmData = await wmSearch.json();
              wmId = wmData?.title_results?.[0]?.id ?? null;
            } catch {
              wmId = null;
            }
          }

          return {
            id: wmId ?? item.id,
            name: title,
            year: year,
            type: isTv ? "tv_series" : "movie",
            poster: poster,
            popularity: item.popularity || 0,
          };
        })
      );
    } else {
      // Fallback als TMDB er niet is
      const searchRes = await fetch(
        `${WATCHMODE_BASE}/search/?apiKey=${WATCHMODE_API_KEY}&search_field=name&search_value=${encodeURIComponent(
          query
        )}`,
        { next: { revalidate: CACHE_REVALIDATE } }
      );
      const searchData = await searchRes.json();
      matches = (searchData?.title_results || []).slice(0, 5).map(
        (m: WatchmodeTitleResult): SearchMatch => ({
          id: m.id,
          name: m.name,
          year: m.year,
          type: m.type,
          poster: null,
          popularity: 0,
        })
      );
    }

    if (matches.length === 0) {
      return NextResponse.json({ results: [] as StreamingResult[] });
    }

    // STAP 2: Haal streamingbronnen op (alleen bij volledige zoekopdracht)
    const results: StreamingResult[] = await Promise.all(
      matches.map(async (match) => {
        let sources: { name: string; type: string; webUrl: string }[] = [];

        if (!suggestOnly) {
          try {
            const sourcesRes = await fetch(
              `${WATCHMODE_BASE}/title/${match.id}/sources/?apiKey=${WATCHMODE_API_KEY}&regions=${region}`,
              { next: { revalidate: CACHE_REVALIDATE } }
            );
            const sourcesData = await sourcesRes.json();

            sources = (Array.isArray(sourcesData) ? sourcesData : [])
              .filter((s: WmSource) => s.region === region)
              .map((s) => ({
                name: s.name,
                type: s.type,
                webUrl: s.web_url,
              }));
          } catch {
            sources = [];
          }
        }

        return {
          titleId: match.id,
          name: match.name,
          year: match.year,
          poster: match.poster,
          titleType: match.type,
          popularity: match.popularity,
          sources,
        };
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
