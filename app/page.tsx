"use client";

import { useState } from "react";

const COUNTRIES = [
  { code: "NL", label: "Nederland" },
  { code: "BE", label: "België" },
  { code: "US", label: "Verenigde Staten" },
];

const MAJOR_PLATFORMS = [
  { id: "netflix", label: "Netflix", match: "netflix" },
  { id: "disney", label: "Disney+", match: "disney" },
  { id: "prime", label: "Prime Video", match: "prime" },
  { id: "hbo", label: "HBO Max", match: "hbo" },
  { id: "apple", label: "Apple TV+", match: "apple" },
  { id: "videoland", label: "Videoland", match: "videoland" },
];

interface Source {
  name: string;
  type: string;
  webUrl: string;
}

interface StreamingResult {
  titleId: number;
  name: string;
  year: number | null;
  poster: string | null;
  titleType: string | null;
  sources: Source[];
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("NL");
  const [result, setResult] = useState<StreamingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&region=${region}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Er is iets misgegaan");
      }

      if (data.results && data.results.length > 0) {
        setResult(data.results[0]);
      } else {
        setError("Geen resultaten gevonden voor deze zoekopdracht.");
      }
    } catch (err: any) {
      setError(err.message || "Er is een fout opgetreden.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#12141c] text-[#f3f1ea] p-6 md:p-12">
      <div className="max-w-4xl mx-auto text-center mb-8">
        <span className="text-[10px] tracking-widest uppercase px-3 py-1 rounded-full bg-[#f2a641]/10 text-[#f2a641] font-semibold border border-[#f2a641]/20">
          NU ZOEKEN
        </span>
        <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-2">
          Waar kan ik het kijken?
        </h1>
        <p className="text-sm text-[#9096a8]">Zoek een titel, kies je land</p>
      </div>

      {/* HOOFDCONTAINER: Foto Links op laptop, subtiel op mobiel */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl mx-auto items-center md:items-start">
        
        {/* LINKS / BOVEN: De poster */}
        {result && (
          <div className="w-full md:w-64 flex-shrink-0 flex justify-center md:justify-start">
            {result.poster ? (
              <img
                src={result.poster}
                alt={result.name}
                /* Mobiel: max 140px breed & h-48 (subtiel). Laptop: volle breedte & h-80 (groot) */
                className="w-full max-w-[140px] md:max-w-none h-48 md:h-80 object-cover rounded-2xl border border-[#2a2e3c] shadow-md md:shadow-xl"
              />
            ) : (
              <div className="w-full max-w-[140px] md:max-w-none h-48 md:h-80 rounded-2xl border border-[#2a2e3c] bg-[#1b1e29] flex items-center justify-center text-xs md:text-sm text-[#9096a8]">
                geen foto
              </div>
            )}
          </div>
        )}

        {/* RECHTS / ONDER: Zoekbalk + Platformen */}
        <div className="flex-1 w-full">
          <form
            onSubmit={handleSearch}
            className="space-y-3 bg-[#1b1e29] border border-[#2a2e3c] rounded-2xl p-5"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Bijv. The Bear"
              className="w-full h-11 px-4 rounded-lg border border-[#2a2e3c] bg-[#20232f] text-sm focus:outline-none focus:border-[#f2a641]"
            />

            <div className="relative">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full h-11 pl-4 pr-9 rounded-lg border border-[#2a2e3c] bg-[#20232f] text-sm appearance-none focus:outline-none focus:border-[#f2a641]"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#9096a8]">
                ▼
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-[#f2a641] text-[#12141c] text-sm font-semibold hover:bg-[#e09530] transition-colors"
            >
              {loading ? "Zoeken..." : "Zoek"}
            </button>
          </form>

          {error && (
            <p className="mt-6 text-sm text-[#9096a8] text-center">{error}</p>
          )}

          {result && (
            <div className="mt-6 bg-[#1b1e29] border border-[#2a2e3c] rounded-2xl p-5">
              <div className="mb-4">
                <p className="text-sm text-[#9096a8]">
                  <span className="text-[#f3f1ea] font-medium text-base">
                    {result.name}
                  </span>
                  {result.year ? ` (${result.year})` : ""}
                  {result.titleType && (
                    <span className="ml-2 text-[10px] tracking-wide uppercase px-2 py-0.5 rounded bg-[#20232f] text-[#f2a641]">
                      {result.titleType.includes("tv") ? "Serie" : "Film"}
                    </span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {MAJOR_PLATFORMS.map((platform) => {
                  const match = result.sources.find((s) =>
                    s.name.toLowerCase().includes(platform.match)
                  );
                  return match ? (
                    <a
                      key={platform.id}
                      href={match.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-[#20232f] border border-[#f2a641]/30 hover:border-[#f2a641] transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#f2a641]" />
                        <span className="text-sm font-medium text-[#f3f1ea]">
                          {platform.label}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-[#f2a641]">
                        {match.type}
                      </span>
                    </a>
                  ) : (
                    <div
                      key={platform.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#1b1e29] border border-[#2a2e3c]/50 opacity-40"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3a3f52]" />
                        <span className="text-sm text-[#9096a8]">
                          {platform.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#9096a8]">
                        niet beschikbaar
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}