import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const CACHE_REVALIDATE = 21600; // 6 uur

type TrendingItem = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  media_type: string;
};

type TrendingResponse = {
  results?: TrendingItem[];
};

export async function GET() {
  if (!TMDB_API_KEY) {
    return NextResponse.json({ results: [] });
  }

  try {
    const [moviesRes, tvRes] = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=nl-NL`,
        { next: { revalidate: CACHE_REVALIDATE } }
      ),
      fetch(
        `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}&language=nl-NL`,
        { next: { revalidate: CACHE_REVALIDATE } }
      ),
    ]);

    const moviesData = (await moviesRes.json()) as TrendingResponse;
    const tvData = (await tvRes.json()) as TrendingResponse;

    const movies = (moviesData.results || [])
      .slice(0, 5)
      .map((item: TrendingItem) => ({
        id: item.id,
        name: item.title ?? "",
        year: item.release_date ? parseInt(item.release_date.split("-")[0]) : null,
        poster: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        media_type: "movie",
      }));

    const shows = (tvData.results || [])
      .slice(0, 5)
      .map((item: TrendingItem) => ({
        id: item.id,
        name: item.name ?? "",
        year: item.first_air_date ? parseInt(item.first_air_date.split("-")[0]) : null,
        poster: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        media_type: "tv",
      }));

    return NextResponse.json({ results: [...movies, ...shows] });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
