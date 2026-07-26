"use client";

import { useState } from "react";
import type { StreamingResult } from "./api/search/route";

const COUNTRIES = [
  { code: "NL", label: "Nederland" },
  { code: "BE", label: "België" },
  { code: "DE", label: "Duitsland" },
  { code: "GB", label: "Verenigd Koninkrijk" },
  { code: "US", label: "Verenigde Staten" },
];

const MAJOR_PLATFORMS = [
  { label: "Netflix", match: "netflix" },
  { label: "Disney+", match: "disney" },
  { label: "Prime Video", match: "prime video" },
  { label: "HBO Max", match: "max" },
  { label: "Apple TV+", match: "apple tv" },
  { label: "Videoland", match: "videoland" },
];

function findMatch(sources: StreamingResult["sources"], match: string) {
  return sources.find((s) => s.name.toLowerCase().includes(match));
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("NL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StreamingResult | null>(null);

  async function handleSearch(e: React.FormEvent) {
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
        setError(data.error ?? "Er ging iets mis.");
      } else if (data.results.length === 0) {
        setError("Geen resultaten gevonden voor deze titel.");
      } else {
        setResult(data.results[0]);
      }
    } catch {
      setError("Kon geen verbinding maken. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#12141c] flex items-start justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-5">
          <span className="text-[11px] tracking-[0.2em] uppercase text-[#f2a641] border border-[#f2a641]/30 bg-[#f2a641]/10 rounded-full px-3 py-1">
            Nu zoeken
          </span>
        </div>

        <div className="text-center mb-9">
          <h1 className="text-[28px] font-semibold tracking-tight text-[#f3f1ea]">
            Waar kan ik het kijken?
          </h1>
          <p className="text-sm text-[#9096a8] mt-2">
            Zoek een titel, kies je land
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="space-y-3 bg-[#1b1e29] border border-[#2a2e3c] rounded-2xl p-5"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Bijv. The Bear"
            className="w-full h-11 px-4 rounded-lg border border-[#2a2e3c] bg-[#20232f] text-[#f3f1ea] placeholder:text-[#565c6e] focus:outline-none focus:ring-2 focus:ring-[#f2a641]/40 focus:border-[#f2a641]/50"
          />

          <div className="relative">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full h-11 pl-4 pr-9 rounded-lg border border-[#2a2e3c] bg-[#20232f] text-[#f3f1ea] appearance-none focus:outline-none focus:ring-2 focus:ring-[#f2a641]/40 focus:border-[#f2a641]/50"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#565c6e] text-xs">
              ▾
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-[#f2a641] text-[#12141c] text-sm font-semibold hover:bg-[#f5b661] transition-colors disabled:opacity-50"
          >
            {loading ? "Zoeken…" : "Zoek"}
          </button>
        </form>

        {error && (
          <p className="mt-6 text-sm text-[#9096a8] text-center">{error}</p>
        )}

        {result && (
          <div className="mt-6 bg-[#1b1e29] border border-[#2a2e3c] rounded-2xl p-5">
            <p className="text-sm text-[#9096a8] mb-4">
              <span className="text-[#f3f1ea] font-medium">{result.name}</span>
              {result.year ? ` (${result.year})` : ""}
              {result.titleType && (
                <span className="ml-2 text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full bg-[#f2a641]/10 text-[#f2a641] align-middle">
                  {result.titleType.includes("tv") ? "Serie" : "Film"}
                </span>
              )}
            </p>

            <div className="grid grid-cols-2 gap-2">
              {MAJOR_PLATFORMS.map((platform) => {
                const found = findMatch(result.sources, platform.match);
                return found ? (
                  
                    <a
                    key={platform.label}
                    href={found.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#f2a641]/25 bg-[#f2a641]/[0.07] text-sm text-[#f3f1ea] hover:border-[#f2a641]/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f2a641]" />
                      {platform.label}
                    </span>
                    <span className="text-[10px] text-[#f2a641]/70 uppercase">
                      {found.type}
                    </span>
                  </a>
                ) : (
                  <div
                    key={platform.label}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#2a2e3c] bg-[#191b24] text-sm text-[#565c6e]"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3a3f52]" />
                      {platform.label}
                    </span>
                    <span className="text-[10px]">niet beschikbaar</span>
                  </div>
                );
              })}
            </div>

            {(() => {
              const extra = result.sources.filter(
                (s) =>
                  !MAJOR_PLATFORMS.some((p) =>
                    s.name.toLowerCase().includes(p.match)
                  )
              );
              return extra.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-[#2a2e3c]">
                  <p className="text-[11px] text-[#565c6e] uppercase tracking-wide mb-2">
                    Ook gevonden op
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {extra.map((s, i) => (
                      
                        <a
                        key={i}
                        href={s.webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#2a2e3c] bg-[#20232f] text-sm text-[#f3f1ea] hover:border-[#3a3f52] transition-colors"
                      >
                        <span>{s.name}</span>
                        <span className="text-[10px] text-[#9096a8] uppercase">
                          {s.type}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>
    </main>
  );
}