import type { MetadataRoute } from "next";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://waarkanikhetkijken.com";

type TmdbItem = { id: number };

async function fetchIds(path: string): Promise<number[]> {
  if (!TMDB_API_KEY) return [];
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${path}?api_key=${TMDB_API_KEY}&language=nl-NL`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    return (data?.results ?? []).map((item: TmdbItem) => item.id);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [popularMovies, popularTv, trendingMovies, trendingTv] = await Promise.all([
    fetchIds("movie/popular"),
    fetchIds("tv/popular"),
    fetchIds("trending/movie/week"),
    fetchIds("trending/tv/week"),
  ]);

  const movieIds = Array.from(new Set([...popularMovies, ...trendingMovies]));
  const tvIds = Array.from(new Set([...popularTv, ...trendingTv]));

  const movieUrls = movieIds.map((id) => ({
    url: `${BASE_URL}/titel/movie-${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const tvUrls = tvIds.map((id) => ({
    url: `${BASE_URL}/titel/tv-${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...movieUrls,
    ...tvUrls,
  ];
}