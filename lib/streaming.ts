import { findPlatform } from "@/lib/platforms";

const WATCHMODE_API_KEY = process.env.WATCHMODE_API_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const WATCHMODE_BASE = "https://api.watchmode.com/v1";
const CACHE_REVALIDATE = 86400;

const TYPE_LABELS: Record<string, string> = {
  sub: "abonnement",
  free: "gratis",
  rent: "huren",
  buy: "kopen",
};

// Voorkeursvolgorde voor welke link je toont als er meerdere opties zijn
const TYPE_PRIORITY = ["sub", "free", "rent", "buy"];

export type StreamingSource = {
  name: string;
  types: string[]; // bijv. ["abonnement"] of ["huren", "kopen"]
  webUrl: string;
  logo: string | null;
};

export type TitleDetails = {
  tmdbId: number;
  name: string;
  year: number | null;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  titleType: "movie" | "tv_series";
  genres: string[];
  voteAverage: number | null;
  voteCount: number;
  sources: StreamingSource[];
  similar: SimilarTitle[];
};

export type SimilarTitle = {
  tmdbId: number;
  name: string;
  poster: string | null;
  titleType: "movie" | "tv_series";
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
    for (const provider of data?.results ?? []) {
      const platform = provider.provider_name
        ? findPlatform(provider.provider_name)
        : null;
      if (!platform || !provider.logo_path) continue;
      const name = provider.provider_name.toLowerCase();
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

function dedupeSources(
  raw: { name: string; type: string; web_url: string }[],
  providerLogos: Record<string, string>
): StreamingSource[] {
  type Bucket = {
    name: string;
    logo: string | null;
    types: Set<string>;
    urlsByType: Record<string, string>;
  };
  const buckets = new Map<string, Bucket>();

  for (const s of raw) {
    const platform = findPlatform(s.name);
    const key = platform ? platform.id : s.name.toLowerCase();

    if (!buckets.has(key)) {
      buckets.set(key, {
        name: platform ? platform.label : s.name,
        logo: platform ? providerLogos[platform.id] ?? null : null,
        types: new Set(),
        urlsByType: {},
      });
    }
    const bucket = buckets.get(key)!;
    bucket.types.add(s.type);
    bucket.urlsByType[s.type] = s.web_url;
  }

  return Array.from(buckets.values()).map((bucket) => {
    const bestType =
      TYPE_PRIORITY.find((t) => bucket.types.has(t)) ??
      Array.from(bucket.types)[0];
    return {
      name: bucket.name,
      types: Array.from(bucket.types).map((t) => TYPE_LABELS[t] ?? t),
      webUrl: bucket.urlsByType[bestType],
      logo: bucket.logo,
    };
  });
}

async function getSimilarTitles(
  tmdbId: number,
  type: "movie" | "tv"
): Promise<SimilarTitle[]> {
  if (!TMDB_API_KEY) return [];
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${tmdbId}/recommendations?api_key=${TMDB_API_KEY}&language=nl-NL`,
      { next: { revalidate: CACHE_REVALIDATE } }
    );
    const data = await res.json();
    return (data?.results ?? [])
      .slice(0, 6)
      .map((item: { id: number; title?: string; name?: string; poster_path?: string | null }) => ({
        tmdbId: item.id,
        name: (type === "tv" ? item.name : item.title) ?? "",
        poster: item.poster_path
          ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
          : null,
        titleType: type === "tv" ? "tv_series" as const : "movie" as const,
      }));
  } catch {
    return [];
  }
}





export async function getTitleData(
  tmdbId: number,
  type: "movie" | "tv"
): Promise<TitleDetails | null> {
  if (!TMDB_API_KEY || !WATCHMODE_API_KEY) return null;

  const detailRes = await fetch(
    `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=nl-NL`,
    { next: { revalidate: CACHE_REVALIDATE } }
  );
  if (!detailRes.ok) return null;
  const detail = await detailRes.json();

  const name = type === "tv" ? detail.name : detail.title;
  if (!name) return null;

  const releaseDate = type === "tv" ? detail.first_air_date : detail.release_date;
  const year = releaseDate ? parseInt(releaseDate.split("-")[0]) : null;
  const poster = detail.poster_path
    ? `https://image.tmdb.org/t/p/w500${detail.poster_path}`
    : null;
  const backdrop = detail.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${detail.backdrop_path}`
    : null;

  let watchmodeId: number | null = null;
  try {
    const wmSearch = await fetch(
      `${WATCHMODE_BASE}/search/?apiKey=${WATCHMODE_API_KEY}&search_field=tmdb_${
        type === "tv" ? "tv" : "movie"
      }_id&search_value=${tmdbId}`,
      { next: { revalidate: CACHE_REVALIDATE } }
    );
    const wmData = await wmSearch.json();
    watchmodeId = wmData?.title_results?.[0]?.id ?? null;
  } catch {
    watchmodeId = null;
  }

  let sources: StreamingSource[] = [];
    const similar = await getSimilarTitles(tmdbId, type);
  if (watchmodeId) {
    try {
      const providerLogos = await getProviderLogos();
      const sourcesRes = await fetch(
        `${WATCHMODE_BASE}/title/${watchmodeId}/sources/?apiKey=${WATCHMODE_API_KEY}&regions=NL`,
        { next: { revalidate: CACHE_REVALIDATE } }
      );
      const sourcesData = await sourcesRes.json();
      const raw = (Array.isArray(sourcesData) ? sourcesData : []).filter(
        (s: { region?: string }) => s.region === "NL"
      );
      sources = dedupeSources(raw, providerLogos);
    } catch {
      sources = [];
    }
  }

    return {
    tmdbId,
    name,
    year,
    releaseDate: releaseDate ?? null,
    overview: detail.overview ?? "",
    poster,
    backdrop,
    titleType: type === "tv" ? "tv_series" : "movie",
    genres: (detail.genres ?? []).map((g: { name: string }) => g.name),
    voteAverage: detail.vote_average ?? null,
    voteCount: detail.vote_count ?? 0,
    sources,
    similar,
  };
}