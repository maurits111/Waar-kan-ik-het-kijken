import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTitleData } from "@/lib/streaming";
import Link from "next/link";

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
    <>
        <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": data.titleType === "tv_series" ? "TVSeries" : "Movie",
            name: data.name,
            description: data.overview,
            image: data.poster ?? undefined,
            datePublished: data.releaseDate ?? undefined,
            genre: data.genres.length > 0 ? data.genres : undefined,
            aggregateRating:
              data.voteCount > 0
                ? {
                    "@type": "AggregateRating",
                    ratingValue: data.voteAverage,
                    ratingCount: data.voteCount,
                    bestRating: 10,
                    worstRating: 0,
                  }
                : undefined,
          }),
        }}
      />
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
            {data.similar.length > 0 && (
        <section>
          <h2>Vergelijkbare titels</h2>
          <ul>
            {data.similar.map((s) => (
              <li key={s.tmdbId}>
                <Link
                  href={`/titel/${s.titleType === "tv_series" ? "tv" : "movie"}-${s.tmdbId}`}
                >
                  {s.poster && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.poster} alt={s.name} width={100} />
                  )}
                  <span>{s.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
        </>
  );
}