import { NextRequest, NextResponse } from "next/server";
import { findPlatform } from "@/lib/platforms";

const WATCHMODE_API_KEY = process.env.WATCHMODE_API_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const WATCHMODE_BASE = "https://api.watchmode.com/v1";
const CACHE_REVALIDATE = 86400;

type TmdbProvider = {
  provider_id?: number;
  provider_name?: string;
  logo_path?: string | null;
};

async function getProviderLogos(): Promise<Record<string, string>> {
  if (!TMDB_API_KEY) return {};
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/watch/providers/movie?api_key=${TMDB_API_KEY}&language=nl-NL&watch_region=NL`,
      { next: { revalidate: CACHE_REVALIDATE } }
    );
    const data = await res.json();

    const best: Record<string, { name: string; url: string }> = {};
    for (const provider of (data?.results ?? []) as TmdbProvider[]) {
      const platform = provider.provider_name
        ? findPlatform(provider.provider_name)
        : null;
      if (!platform || !provider.logo_path) continue;
      const name = provider.provider_name!.toLowerCase();
      const current = best[platform.id];
      if (!current || name.length < current.name.length) {
        best[platform.id] = {
          name,
          url: `https://image.tmdb.org/t/p/w92${provider.logo_path}`,
        };
      }
    }

    const logos: Record<string, string> = {};
    for (const [id, value] of Object.entries(best)) {
      logos[id] = value.url;
    }
    return logos;
  } catch {
    return {};
  }
}

async function getTmdbProviderId(platformMatch: string): Promise<number | null> {
  if (!TMDB_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/watch/providers/movie?api_key=${TMDB_API_KEY}&language=nl-NL&watch_region=NL`
    );
    const data = await res.json();
    const providers = (data?.results ?? []) as TmdbProvider[];
    const found = providers.find((p) =>
      p.provider_name?.toLowerCase().includes(platformMatch.toLowerCase())
    );
    return found?.provider_id ?? null;
  } catch {
    return null;
  }
}

type TmdbItem = {
  id: number;
  name?: string;
  title?: string;
  first_air_date?: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  media_type?: string;
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
  watchmodeId: number | null;
  name: string;
  year: number | null;
  type: string;
  poster: string | null;
  backdrop: string | null;
  popularity: number;
};

export type StreamingResult = {
  titleId: number;
  name: string;
  year: number | null;
  poster: string | null;
  backdrop: string | null;
  titleType: string | null;
  popularity: number;
  sources: {
    name: string;
    type: string;
    webUrl: string;
    logo: string | null;
  }[];
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const region = searchParams.get("region") ?? "NL";
  const platformFilter = searchParams.get("platform");
  const typeFilter = searchParams.get("type");
  const suggestOnly = searchParams.get("mode") === "suggest";
  const selectParam = searchParams.get("select");
  const selectIndex =
    suggestOnly || selectParam === null
      ? 0
      : Math.max(0, parseInt(selectParam, 10) || 0);

  if (!query && !platformFilter && !typeFilter) {
    return NextResponse.json(
      { error: "Geef een zoekterm op of selecteer een filter." },
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

    if (TMDB_API_KEY) {
      let rawResults: TmdbItem[] = [];

      if (!query && (platformFilter || typeFilter)) {
        let tmdbProviderId: number | null = null;
        if (platformFilter) {
          tmdbProviderId = await getTmdbProviderId(platformFilter);
        }

        const fetchMedia = async (mediaType: "movie" | "tv") => {
          let url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${TMDB_API_KEY}&language=nl-NL&sort_by=popularity.desc&watch_region=${region}`;
          if (tmdbProviderId) {
            url += `&with_watch_providers=${tmdbProviderId}`;
          }
          const res = await fetch(url, { next: { revalidate: CACHE_REVALIDATE } });
          const data = await res.json();
          return (data?.results || []).map((item: TmdbItem) => ({
            ...item,
            media_type: mediaType,
          }));
        };

        if (typeFilter === "movie") {
          rawResults = await fetchMedia("movie");
        } else if (typeFilter === "tv") {
          rawResults = await fetchMedia("tv");
        } else {
          const [movies, tvShows] = await Promise.all([
            fetchMedia("movie"),
            fetchMedia("tv"),
          ]);
          rawResults = [...movies, ...tvShows];
        }
      } else if (query) {
        const tmdbRes = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
            query
          )}&language=nl-NL&page=1`,
          { next: { revalidate: CACHE_REVALIDATE } }
        );
        const tmdbData = await tmdbRes.json();

        rawResults = (tmdbData?.results || []).filter(
          (item: TmdbItem) => item.media_type === "movie" || item.media_type === "tv"
        );
      }

      if (query && typeFilter) {
        rawResults = rawResults.filter((item) => item.media_type === typeFilter);
      }

      // Filter items zonder poster weg en sorteer op populariteit
      rawResults = rawResults.filter((item) => item.poster_path);
      rawResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      
      // Als er een zoekopdracht is, pak direct alleen de nummer 1 (geen keuzerij meer)
      const limit = query ? 1 : (platformFilter || typeFilter) ? 10 : 5;
      const tmdbResults = rawResults.slice(0, limit);

      matches = await Promise.all(
        tmdbResults.map(async (item: TmdbItem, index: number) => {
          const isTv = item.media_type === "tv";
          const title = (isTv ? item.name : item.title) ?? "";
          const releaseDate = isTv ? item.first_air_date : item.release_date;
          const year = releaseDate ? parseInt(releaseDate.split("-")[0]) : null;
          const poster = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
          const backdrop = item.backdrop_path
            ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
            : null;

          let watchmodeId: number | null = null;
          if (!suggestOnly && index === selectIndex) {
            try {
              const wmSearch = await fetch(
                `${WATCHMODE_BASE}/search/?apiKey=${WATCHMODE_API_KEY}&search_field=tmdb_${
                  isTv ? "tv" : "movie"
                }_id&search_value=${item.id}`,
                { next: { revalidate: CACHE_REVALIDATE } }
              );
              const wmData = await wmSearch.json();
              watchmodeId = wmData?.title_results?.[0]?.id ?? null;
            } catch {
              watchmodeId = null;
            }
          }

          return {
            id: item.id,
            watchmodeId,
            name: title,
            year: year,
            type: isTv ? "tv_series" : "movie",
            poster: poster,
            backdrop: backdrop,
            popularity: item.popularity || 0,
          };
        })
      );
    } else if (query) {
      const searchRes = await fetch(
        `${WATCHMODE_BASE}/search/?apiKey=${WATCHMODE_API_KEY}&search_field=name&search_value=${encodeURIComponent(
          query
        )}`,
        { next: { revalidate: CACHE_REVALIDATE } }
      );
      const searchData = await searchRes.json();
      matches = (searchData?.title_results || []).slice(0, 1).map(
        (m: WatchmodeTitleResult): SearchMatch => ({
          id: m.id,
          watchmodeId: m.id,
          name: m.name,
          year: m.year,
          type: m.type,
          poster: null,
          backdrop: null,
          popularity: 0,
        })
      );
    }

    if (matches.length === 0) {
      return NextResponse.json({ results: [] as StreamingResult[] });
    }

    const providerLogos = !suggestOnly ? await getProviderLogos() : {};

    const results: StreamingResult[] = await Promise.all(
      matches.map(async (match, index) => {
        let sources: {
          name: string;
          type: string;
          webUrl: string;
          logo: string | null;
        }[] = [];

        if (!suggestOnly && index === selectIndex && match.watchmodeId) {
          try {
            const sourcesRes = await fetch(
              `${WATCHMODE_BASE}/title/${match.watchmodeId}/sources/?apiKey=${WATCHMODE_API_KEY}&regions=${region}`,
              { next: { revalidate: CACHE_REVALIDATE } }
            );
            const sourcesData = await sourcesRes.json();

            sources = (Array.isArray(sourcesData) ? sourcesData : [])
              .filter((s: WmSource) => s.region === region)
              .map((s) => {
                const platform = findPlatform(s.name);
                return {
                  name: s.name,
                  type: s.type,
                  webUrl: s.web_url,
                  logo: platform ? providerLogos[platform.id] ?? null : null,
                };
              });
          } catch {
            sources = [];
          }
        }

        return {
          titleId: match.id,
          name: match.name,
          year: match.year,
          poster: match.poster,
          backdrop: match.backdrop,
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