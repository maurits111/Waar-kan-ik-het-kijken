import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTitleData } from "@/lib/streaming";

function parseSlug(slug: string): { tmdbId: number; type: "movie" | "tv" } | null {
  const match = slug.match(/^(movie|tv)-(\d+)/);
  if (!match) return null;
  return { type: match[1] as "movie" | "tv", tmdbId: parseInt(match[2], 10) };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) return {};

  const data = await getTitleData(parsed.tmdbId, parsed.type);
  if (!data) return {};

  return {
    title: `Waar kan ik ${data.name} kijken?`,
    description:
      data.sources.length > 0
        ? `Bekijk ${data.name}${data.year ? ` (${data.year})` : ""} op ${data.sources
            .map((s) => s.name)
            .join(", ")}.`
        : `Is ${data.name} beschikbaar op een Nederlandse streamingdienst? Check het hier.`,
  };
}

export default async function TitlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) notFound();

  const data = await getTitleData(parsed.tmdbId, parsed.type);
  if (!data) notFound();

  return (
    <main>
      <h1>
        Waar kan ik {data.name}
        {data.year ? ` (${data.year})` : ""} kijken?
      </h1>
      {data.sources.length > 0 ? (
        <ul>
          {data.sources.map((s, i) => (
            <li key={i}>
              <a href={s.webUrl} target="_blank" rel="noopener noreferrer">
                {s.name} ({s.types.join("/")})
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          {data.name} is op dit moment niet beschikbaar op een Nederlandse
          streamingdienst.
        </p>
      )}
      {data.overview && <p>{data.overview}</p>}
    </main>
  );
}