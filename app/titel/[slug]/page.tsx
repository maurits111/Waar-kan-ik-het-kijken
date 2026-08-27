import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getTitleData } from "@/lib/streaming";
import { MAJOR_PLATFORMS } from "@/lib/platforms";

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
      <main className="min-h-screen bg-[#10131a] text-[#f3f1ea] p-6 md:p-12 relative overflow-hidden flex flex-col">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#00f2fe]/[0.05] blur-3xl"
        />

        <div className="w-full relative flex-1 flex flex-col max-w-5xl mx-auto">
          <Link
            href="/"
            className="text-xs text-[#9096a8] hover:text-[#00f2fe] mb-6 inline-block"
          >
            ← Terug naar zoeken
          </Link>

          <div className="relative overflow-hidden rounded-2xl border border-[#232838]">
            {data.backdrop && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.backdrop}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#10131a] via-[#10131a]/85 to-[#10131a]/40" />

            <div className="relative p-5 md:p-6">
              <div className="flex flex-col sm:flex-row gap-5">
                {data.poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.poster}
                    alt={`Poster van ${data.name}`}
                    className="w-40 sm:w-44 mx-auto sm:mx-0 aspect-[2/3] object-cover rounded-xl border border-[#232838] shadow-lg shrink-0"
                  />
                ) : (
                  <div className="w-40 sm:w-44 mx-auto sm:mx-0 aspect-[2/3] rounded-xl border border-[#232838] bg-[#181c27] flex items-center justify-center text-xs text-[#9096a8] shrink-0">
                    geen foto
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="mb-4">
                    <p className="text-sm text-[#9096a8]">
                      <span className="text-[#f3f1ea] font-semibold text-xl md:text-2xl">
                        {data.name}
                      </span>
                      {data.year ? ` (${data.year})` : ""}
                      <span className="ml-2 inline-block align-middle text-[9px] tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#1e2332] text-[#9096a8] font-normal">
                        {data.titleType === "tv_series" ? "Serie" : "Film"}
                      </span>
                    </p>
                    {data.genres.length > 0 && (
                      <p className="mt-1 text-xs text-[#565c6e]">
                        {data.genres.join(" · ")}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {MAJOR_PLATFORMS.map((platform) => {
                      const match = data.sources.find((s) => s.name === platform.label);
                      return match ? (
                        <a
                          key={platform.id}
                          href={match.webUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl bg-[#181c27]/90 border border-[#232838] hover:border-[#00f2fe]/60 transition-all group"
                        >
                          {match.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={match.logo}
                              alt={`${platform.label} logo`}
                              className="w-9 h-9 rounded-lg bg-white p-1.5 object-contain shrink-0"
                            />
                          ) : (
                            <span
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-md shrink-0"
                              style={{ backgroundColor: platform.color }}
                            >
                              {platform.abbr}
                            </span>
                          )}
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-[#f3f1ea] truncate">
                              {platform.label}
                            </span>
                            <span className="block text-[10px] uppercase tracking-wide text-[#00f2fe]">
                              {match.types.join("/")}
                            </span>
                          </span>
                        </a>
                      ) : (
                        <div
                          key={platform.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[#151922] border border-[#232838]/40"
                        >
                          <span className="w-9 h-9 rounded-lg bg-[#232838] flex items-center justify-center text-[10px] text-[#565c6e] shrink-0">
                            {platform.abbr}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm text-[#9096a8] truncate">
                              {platform.label}
                            </span>
                            <span className="block text-[10px] text-[#565c6e]">
                              niet gevonden
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {data.overview && (
                <p className="mt-5 text-sm text-[#9096a8] leading-relaxed">
                  {data.overview}
                </p>
              )}

              <p className="mt-4 text-[11px] text-[#565c6e]">
                Gebaseerd op onze bronnen (Watchmode). Sommige diensten, zoals NPO Start,
                worden niet altijd volledig bijgewerkt.
              </p>
            </div>
          </div>

          {data.similar.length > 0 && (
            <section className="mt-8">
              <p className="text-xs font-semibold tracking-wider uppercase text-[#9096a8] mb-3">
                Vergelijkbare titels
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {data.similar.map((s) => (
                  <Link
                    key={s.tmdbId}
                    href={`/titel/${s.titleType === "tv_series" ? "tv" : "movie"}-${s.tmdbId}`}
                    className="w-32 shrink-0 text-left group block"
                  >
                    {s.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.poster}
                        alt={`${s.name} poster`}
                        className="w-32 aspect-[2/3] object-cover rounded-xl border border-[#232838] group-hover:border-[#00f2fe]/60 group-hover:scale-[1.03] transition-all"
                      />
                    ) : (
                      <div className="w-32 aspect-[2/3] rounded-xl bg-[#181c27] border border-[#232838]" />
                    )}
                    <p className="mt-2 text-xs font-medium text-[#f3f1ea] truncate">
                      {s.name}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <footer className="relative mt-12 text-center text-[11px] text-[#565c6e] space-y-1">
          <p>© {new Date().getFullYear()} Waar kan ik het kijken?</p>
          <p>Gegevens aangeleverd door TMDB en Watchmode</p>
        </footer>
      </main>
    </>
  );
}