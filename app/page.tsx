"use client";

import { useState, useEffect, useMemo, useRef } from "react";

const COUNTRIES = [{ code: "NL", label: "Nederland" }];

const MAJOR_PLATFORMS = [
  { id: "netflix", label: "Netflix", match: "netflix" },
  { id: "disney", label: "Disney+", match: "disney" },
  { id: "prime", label: "Prime Video", match: "prime" },
  { id: "hbo", label: "HBO Max", match: "hbo" },
  { id: "apple", label: "Apple TV+", match: "apple" },
  { id: "videoland", label: "Videoland", match: "videoland" },
  { id: "nlziet", label: "NLZIET", match: "nlziet" },
  { id: "sooner", label: "Sooner", match: "sooner" },
  { id: "mubi", label: "MUBI", match: "mubi" },
  { id: "pathe", label: "Pathé Thuis", match: "path" },
  { id: "showtime", label: "SkyShowtime", match: "showtime" },
  { id: "npo", label: "NPO Start", match: "npo" },
];

// Populaire suggesties op de homepage
const POPULAR_SUGGESTIONS = [
  "The Bear",
  "Stranger Things",
  "Dune",
  "Game of Thrones",
  "Breaking Bad",
  "The Last of Us",
];

interface Source {
  name: string;
  type: string;
  webUrl: string;
}

interface StreamingResult {
  titleId?: number;
  name: string;
  year: number | string | null;
  poster: string | null;
  titleType: string | null;
  sources?: Source[];
  popularity?: number;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("NL");
  const [result, setResult] = useState<StreamingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States voor de live suggesties
  const [suggestions, setSuggestions] = useState<StreamingResult[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const sortedSuggestions = useMemo(
    () =>
      suggestions
        .slice()
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0)),
    [suggestions]
  );

  // Sluit de suggesties als je buiten het zoekveld klikt
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Haal live zoeksuggesties op vanaf 3 letters
  useEffect(() => {
    if (query.trim().length < 3) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&region=${region}&mode=suggest`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (res.ok && data.results) {
          setSuggestions(data.results.slice(0, 5));
          setShowDropdown(true);
          setActiveIndex(-1);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        console.error("Fout bij ophalen suggesties:", err);
      } finally {
        if (!controller.signal.aborted) {
          setIsSuggesting(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, region]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setShowDropdown(false);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&region=${region}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Er is iets misgegaan");
      }

      if (data.results && data.results.length > 0) {
        setResult(data.results[0]);
      } else {
        setError("Geen resultaten gevonden voor deze film of serie.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er is een fout opgetreden.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (showDropdown && activeIndex >= 0 && sortedSuggestions[activeIndex]) {
      const item = sortedSuggestions[activeIndex];
      setQuery(item.name);
      performSearch(item.name);
    } else {
      performSearch(query);
    }
  };

  const selectSuggestion = (item: StreamingResult) => {
    setQuery(item.name);
    setShowDropdown(false);
    setActiveIndex(-1);
    performSearch(item.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showDropdown) {
        setShowDropdown(true);
        setActiveIndex(0);
      } else {
        setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      }
    } else if (e.key === "ArrowUp") {
      if (showDropdown) {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  return (
    <main className="min-h-screen bg-[#10131a] text-[#f3f1ea] p-6 md:p-12 relative overflow-hidden flex items-center">
      {/* Achtergrond Glow in Neon Cyan/Blue */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#00f2fe]/[0.05] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#00f2fe]/[0.03] blur-3xl"
      />

      <div className="w-full relative">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <span className="inline-block text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full bg-[#00f2fe]/10 text-[#00f2fe] font-semibold border border-[#00f2fe]/20">
            Streaming Zoekmachine
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mt-5 mb-3 tracking-tight">
            Waar kan ik het kijken?
          </h1>
          <p className="text-sm md:text-base text-[#9096a8] max-w-lg mx-auto">
            Typ de naam van een film of serie en ontdek direct op welke streamingdienst hij staat.
          </p>
        </div>

        <div
          className={`flex flex-col md:flex-row gap-6 w-full mx-auto items-center md:items-start ${
            result ? "max-w-4xl" : "max-w-md"
          }`}
        >
          {result && (
            <div className="w-full md:w-64 flex-shrink-0 flex justify-center md:justify-start">
              {result.poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.poster}
                  alt={result.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full max-w-[140px] md:max-w-none aspect-[2/3] object-cover rounded-2xl border border-[#232838] shadow-md md:shadow-xl"
                />
              ) : (
                <div className="w-full max-w-[140px] md:max-w-none aspect-[2/3] rounded-2xl border border-[#232838] bg-[#181c27] flex items-center justify-center text-xs md:text-sm text-[#9096a8]">
                  geen foto
                </div>
              )}
            </div>
          )}

          <div className="flex-1 w-full" ref={searchContainerRef}>
            <form
              role="search"
              onSubmit={handleSearch}
              className="space-y-3 bg-[#181c27] border border-[#232838] rounded-2xl p-5 relative"
            >
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (e.target.value.trim().length < 3) {
                      setSuggestions([]);
                      setShowDropdown(false);
                      setActiveIndex(-1);
                    }
                  }}
                  onFocus={() => query.trim().length >= 3 && setShowDropdown(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Typ een film- of serietitel (bijv. The Bear)..."
                  aria-label="Zoek een film of serie"
                  role="combobox"
                  aria-expanded={showDropdown}
                  aria-controls="zoek-suggesties"
                  aria-autocomplete="list"
                  aria-activedescendant={
                    activeIndex >= 0 ? `suggestie-${activeIndex}` : undefined
                  }
                  className="w-full h-11 px-4 rounded-lg border border-[#232838] bg-[#1e2332] text-sm focus:border-[#00f2fe]"
                />

                {/* Live Zoeksuggesties Dropdown */}
                {showDropdown && (
                  <div
                    id="zoek-suggesties"
                    role="listbox"
                    aria-label="Zoeksuggesties"
                    className="absolute left-0 right-0 top-12 bg-[#1e2332] border border-[#232838] rounded-xl shadow-2xl z-50 overflow-y-auto max-h-60 mt-1"
                  >
                    {isSuggesting ? (
                      <div className="p-3 text-xs text-[#9096a8] text-center">
                        Zoeken naar suggesties...
                      </div>
                    ) : suggestions.length > 0 ? (
                      sortedSuggestions.map((item, index) => (
                          <button
                            key={item.titleId || index}
                            id={`suggestie-${index}`}
                            type="button"
                            role="option"
                            aria-selected={index === activeIndex}
                            onClick={() => selectSuggestion(item)}
                            className={`w-full text-left p-2.5 flex items-center gap-3 transition-colors border-b border-[#232838]/40 last:border-none cursor-pointer ${
                              index === activeIndex ? "bg-[#181c27]" : "hover:bg-[#181c27]"
                            }`}
                          >
                            {item.poster ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.poster}
                                alt={item.name}
                                loading="lazy"
                                decoding="async"
                                className="w-8 h-11 object-cover rounded flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-11 bg-[#181c27] rounded flex items-center justify-center text-[9px] text-[#9096a8] flex-shrink-0">
                                Geen
                              </div>
                            )}
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm text-[#f3f1ea] font-medium truncate">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-[#9096a8]">
                                {item.year ? item.year : ""}
                                {item.titleType &&
                                  ` • ${item.titleType.includes("tv") ? "Serie" : "Film"}`}
                                {item.popularity && item.popularity > 100 && (
                                  <span
                                    aria-hidden="true"
                                    className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] bg-[#00f2fe]/20 text-[#00f2fe]"
                                  >
                                    {item.popularity > 5000
                                      ? "🔥🔥"
                                      : item.popularity > 1000
                                        ? "🔥"
                                        : ""}
                                  </span>
                                )}
                              </p>
                            </div>
                          </button>
                        ))
                    ) : (
                      <div className="p-3 text-xs text-[#9096a8] text-center">
                        Geen suggesties gevonden
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  aria-label="Land"
                  className="w-full h-11 pl-4 pr-9 rounded-lg border border-[#232838] bg-[#1e2332] text-sm appearance-none focus:border-[#00f2fe]"
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
                className="w-full h-11 rounded-lg bg-[#00f2fe] text-[#10131a] text-sm font-semibold hover:bg-[#00d0dc] transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,242,254,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Zoeken..." : "Zoek"}
              </button>
            </form>

            {/* SECTIE: Populair nu / Snelle zoek-suggesties */}
            {!result && (
              <div className="mt-6 bg-[#181c27] border border-[#232838] rounded-2xl p-5">
                <p className="text-xs font-semibold tracking-wider uppercase text-[#9096a8] mb-3">
                  Populair om te zoeken
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SUGGESTIONS.map((title) => (
                    <button
                      key={title}
                      onClick={() => {
                        setQuery(title);
                        performSearch(title);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#1e2332] border border-[#232838] text-xs text-[#f3f1ea] hover:border-[#00f2fe] hover:text-[#00f2fe] transition-all cursor-pointer"
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p aria-live="polite" className="mt-6 text-sm text-[#9096a8] text-center">
                {error}
              </p>
            )}

            {result && result.sources && (
              <div aria-live="polite" className="mt-6 bg-[#181c27] border border-[#232838] rounded-2xl p-5">
                <div className="mb-4">
                  <p className="text-sm text-[#9096a8]">
                    <span className="text-[#f3f1ea] font-medium text-base">{result.name}</span>
                    {result.year ? ` (${result.year})` : ""}
                    {result.titleType && (
                      <span className="ml-2 text-[9px] tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#1e2332] text-[#9096a8] font-normal">
                        {result.titleType.includes("tv") ? "Serie" : "Film"}
                      </span>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {MAJOR_PLATFORMS.map((platform) => {
                    const match = result.sources?.find((s) =>
                      s.name.toLowerCase().includes(platform.match)
                    );
                    return match ? (
                      <a
                        key={platform.id}
                        href={match.webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-[#1e2332] border border-[#00f2fe]/30 hover:border-[#00f2fe] transition-all shadow-[0_0_10px_rgba(0,242,254,0.05)]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#00f2fe]" />
                          <span className="text-sm font-normal text-[#f3f1ea]">
                            {platform.label}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-semibold text-[#00f2fe]">
                          {match.type}
                        </span>
                      </a>
                    ) : (
                      <div
                        key={platform.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#181c27] border border-[#232838]/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3a3f52]" />
                          <span className="text-sm text-[#9096a8]">{platform.label}</span>
                        </div>
                        <span className="text-[10px] text-[#565c6e]">niet gevonden</span>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-4 text-[11px] text-[#565c6e]">
                  Gebaseerd op onze bronnen (Watchmode). Sommige diensten, zoals NPO Start,
                  worden niet altijd volledig bijgewerkt.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
