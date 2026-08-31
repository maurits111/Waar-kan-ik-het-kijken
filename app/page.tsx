"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { MAJOR_PLATFORMS, type Platform } from "@/lib/platforms";
import Link from "next/link";

const REGION = "NL";
const RECENT_KEY = "waarkijk-recent";

const TYPE_LABELS: Record<string, string> = {
  sub: "Abonnement",
  rent: "Huur",
  buy: "Koop",
};

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
  logo: string | null;
}

interface StreamingResult {
  titleId?: number;
  name: string;
  year: number | string | null;
  poster: string | null;
  backdrop: string | null;
  titleType: string | null;
  sources?: Source[];
  popularity?: number;
}

interface TrendingItem {
  id: number;
  name: string;
  year: number | null;
  poster: string | null;
  media_type: string;
}

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StreamingResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const [suggestions, setSuggestions] = useState<StreamingResult[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [loadingSources, setLoadingSources] = useState(false);
  const [lastLoadedIndex, setLastLoadedIndex] = useState(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchedQueryRef = useRef("");

  const result = results.length > 0 ? results[selectedIndex] : null;
  const wide = Boolean(result) || loading || results.length > 1;

  const sortedSuggestions = useMemo(
    () =>
      suggestions
        .slice()
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0)),
    [suggestions]
  );

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.key === "/" &&
        target.tagName !== "INPUT" &&
        target.tagName !== "TEXTAREA" &&
        target.tagName !== "SELECT"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (query.trim().length < 3) {
      return;
    }
    
    if (query === searchedQueryRef.current) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&region=${REGION}&mode=suggest`,
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
  }, [query]);

  const saveRecent = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((x) => x !== trimmed)].slice(0, 5);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const performSearch = useCallback(async (searchQuery: string, select = 0) => {
    if (!searchQuery.trim() && !selectedPlatform && !selectedType) return;

    searchedQueryRef.current = searchQuery;
    setShowDropdown(false);
    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedIndex(select);
    setLastLoadedIndex(select);

    try {
      let url = `/api/search?region=${REGION}&select=${select}`;
      if (searchQuery.trim()) url += `&q=${encodeURIComponent(searchQuery)}`;
      if (selectedPlatform) url += `&platform=${encodeURIComponent(selectedPlatform)}`;
      if (selectedType) url += `&type=${encodeURIComponent(selectedType)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Er is iets misgegaan");
      }

      if (data.results && data.results.length > 0) {
        const safeIndex = Math.min(select, data.results.length - 1);
        setResults(data.results);
        setSelectedIndex(safeIndex);
        setLastLoadedIndex(safeIndex);
        if (searchQuery.trim()) saveRecent(searchQuery);

        if (searchQuery.trim()) {
          const current = new URLSearchParams(window.location.search).get("q");
          if (current !== searchQuery) {
            window.history.pushState(
              { q: searchQuery },
              "",
              `?q=${encodeURIComponent(searchQuery)}`
            );
          }
        }
      } else {
        setError("Geen resultaten gevonden voor deze filters of titel.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er is een fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }, [saveRecent, selectedPlatform, selectedType]);

  const selectResult = (index: number) => {
    const item = results[index];
    if (!item) return;
    setSelectedIndex(index);

    if (index === lastLoadedIndex && (item.sources?.length ?? 0) > 0) {
      return;
    }

    setLoadingSources(true);
    
    let url = `/api/search?region=${REGION}&select=${index}`;
    if (searchedQueryRef.current.trim()) {
      url += `&q=${encodeURIComponent(searchedQueryRef.current)}`;
    }
    if (selectedPlatform) url += `&platform=${encodeURIComponent(selectedPlatform)}`;
    if (selectedType) url += `&type=${encodeURIComponent(selectedType)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.results && data.results.length > 0) {
          setResults(data.results);
          setLastLoadedIndex(index);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSources(false));
  };

  useEffect(() => {
    const t = window.setTimeout(() => {
      setRecent(loadRecentSearches());

      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) {
        setQuery(q);
        searchedQueryRef.current = q;
        performSearch(q);
      }
    }, 0);

    return () => window.clearTimeout(t);
  }, [performSearch]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/trending")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.results) {
          setTrending(data.results);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setTrendingLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  const typeLabel = (type: string | undefined) => TYPE_LABELS[type || ""] || type || "";

  const findBestSource = (
    sources: Source[] | undefined,
    platform: Platform
  ): Source | undefined => {
    if (!sources) return undefined;
    const matches = sources.filter((s) =>
      s.name.toLowerCase().includes(platform.match)
    );
    if (matches.length === 0) return undefined;
    return matches.reduce((best, s) => (s.name.length < best.name.length ? s : best));
  };

  return (
    <main className="min-h-screen bg-[#10131a] text-[#f3f1ea] p-6 md:p-12 relative overflow-hidden flex flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#00f2fe]/[0.05] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#00f2fe]/[0.03] blur-3xl"
      />

      <div className="w-full relative flex-1 flex flex-col">
        <div className="my-auto w-full py-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <span className="inline-block text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full bg-[#00f2fe]/10 text-[#00f2fe] font-semibold border border-[#00f2fe]/20">
              Streaming Zoekmachine
            </span>
            
            <Link 
              href="/" 
              onClick={() => {
                setQuery("");
                setResults([]);
                setError(null);
                setSelectedPlatform("");
                setSelectedType("");
              }}
              className="inline-block cursor-pointer group"
            >
              <h1 className="text-4xl md:text-6xl font-bold mt-5 mb-3 tracking-tight bg-gradient-to-r from-[#00f2fe] via-[#5eead4] to-[#3b82f6] bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
                Waar kan ik het kijken?
              </h1>
            </Link>

            <p className="text-sm md:text-base text-[#9096a8] max-w-lg mx-auto">
              Typ de naam van een film of serie of kies een dienst om direct te ontdekken wat erop staat.
            </p>
          </div>

          <div
            className={`flex flex-col md:flex-row gap-6 w-full mx-auto items-center md:items-start ${
              wide ? "max-w-5xl" : "max-w-2xl"
            }`}
          >
            <div className="flex-1 w-full" ref={searchContainerRef}>
              <form
                role="search"
                onSubmit={handleSearch}
                className="space-y-3 bg-[#181c27] border border-[#232838] rounded-2xl p-5 relative"
              >
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    autoFocus
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
                    placeholder="Typ een titel of laat leeg om te bladeren..."
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

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="h-11 px-3 rounded-lg border border-[#232838] bg-[#1e2332] text-sm text-[#f3f1ea] focus:border-[#00f2fe] outline-none cursor-pointer"
                  >
                    <option value="">Alle diensten</option>
                    {MAJOR_PLATFORMS.map((p) => (
                      <option key={p.id} value={p.match}>
                        {p.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="h-11 px-3 rounded-lg border border-[#232838] bg-[#1e2332] text-sm text-[#f3f1ea] focus:border-[#00f2fe] outline-none cursor-pointer"
                  >
                    <option value="">Films & Series</option>
                    <option value="movie">Alleen Films</option>
                    <option value="tv">Alleen Series</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-lg bg-[#00f2fe] text-[#10131a] text-sm font-semibold hover:bg-[#00d0dc] transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,242,254,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Laden..." : "Toon overzicht"}
                </button>
              </form>

              {!wide && recent.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold tracking-wider uppercase text-[#9096a8]">
                      Recent gezocht
                    </p>
                    <button
                      onClick={() => {
                        setRecent([]);
                        try {
                          window.localStorage.removeItem(RECENT_KEY);
                        } catch {}
                      }}
                      className="text-[10px] text-[#565c6e] hover:text-[#9096a8] cursor-pointer"
                    >
                      Wissen
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((title) => (
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

              {!wide && (trendingLoading || trending.length > 0) && (
                <section className="mt-8">
                  <p className="text-xs font-semibold tracking-wider uppercase text-[#9096a8] mb-3">
                    Populair nu
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                    {trendingLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="w-32 shrink-0">
                          <div className="w-32 aspect-[2/3] rounded-xl bg-[#181c27] border border-[#232838] animate-pulse" />
                          <div className="mt-2 h-3 w-20 bg-[#232838] rounded" />
                        </div>
                      ))
                    ) : (
                      trending.map((t) => (
                        <Link
                          key={`${t.media_type}-${t.id}`}
                          href={`/titel/${t.media_type}-${t.id}`}
                          className="w-32 shrink-0 text-left group block"
                        >
                          {t.poster ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={t.poster}
                              alt={`${t.name} poster`}
                              loading="lazy"
                              decoding="async"
                              className="w-32 aspect-[2/3] object-cover rounded-xl border border-[#232838] group-hover:border-[#00f2fe]/60 group-hover:scale-[1.03] transition-all"
                            />
                          ) : (
                            <div className="w-32 aspect-[2/3] rounded-xl bg-[#181c27] border border-[#232838]" />
                          )}
                          <p className="mt-2 text-xs font-medium text-[#f3f1ea] truncate">
                            {t.name}
                          </p>
                          <p className="text-[10px] text-[#9096a8]">
                            {t.year || ""}
                            {t.media_type === "tv" ? " • Serie" : " • Film"}
                          </p>
                        </Link>
                      ))
                    )}
                  </div>
                </section>
              )}

              {error && (
                <p aria-live="polite" className="mt-6 text-sm text-[#9096a8] text-center">
                  {error}
                </p>
              )}

              {loading && (
                <div className="mt-6 animate-pulse" aria-hidden="true">
                  <div className="rounded-2xl border border-[#232838] bg-[#181c27] p-6">
                    <div className="h-6 w-1/3 bg-[#232838] rounded mb-4" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="aspect-[2/3] bg-[#232838] rounded-xl" />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Resultatenlijst (als er meerdere zijn) */}
              {!loading && results.length > 1 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold tracking-wider uppercase text-[#9096a8] mb-3">
                    Top keuzes ({results.length}) - Klik op een titel voor details
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {results.map((item, index) => (
                      <button
                        key={item.titleId || index}
                        onClick={() => selectResult(index)}
                        className={`text-left group p-2 rounded-xl border transition-all cursor-pointer ${
                          selectedIndex === index
                            ? "bg-[#1e2332] border-[#00f2fe]"
                            : "bg-[#181c27] border-[#232838] hover:border-[#00f2fe]/50"
                        }`}
                      >
                        {item.poster ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.poster}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full aspect-[2/3] object-cover rounded-lg mb-2"
                          />
                        ) : (
                          <div className="w-full aspect-[2/3] bg-[#1e2332] rounded-lg mb-2 flex items-center justify-center text-[10px] text-[#9096a8]">
                            Geen foto
                          </div>
                        )}
                        <p className="text-xs font-medium text-[#f3f1ea] truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-[#9096a8]">
                          {item.year || ""} {item.titleType?.includes("tv") ? "• Serie" : "• Film"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailweergave voor het geselecteerde item */}
              {result && (
                <div aria-live="polite" className="mt-6">
                  <div className="relative overflow-hidden rounded-2xl border border-[#232838]">
                    {result.backdrop && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={result.backdrop}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover opacity-20"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10131a] via-[#10131a]/85 to-[#10131a]/40" />

                    <div className="relative p-5 md:p-6">
                      <div className="flex flex-col sm:flex-row gap-5">
                        {result.poster ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={result.poster}
                            alt={`Poster van ${result.name}`}
                            loading="lazy"
                            decoding="async"
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
                                {result.name}
                              </span>
                              {result.year ? ` (${result.year})` : ""}
                              {result.titleType && (
                                <span className="ml-2 inline-block align-middle text-[9px] tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#1e2332] text-[#9096a8] font-normal">
                                  {result.titleType.includes("tv") ? "Serie" : "Film"}
                                </span>
                              )}
                            </p>
                          </div>

                          {loadingSources ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                              {Array.from({ length: MAJOR_PLATFORMS.length }).map(
                                (_, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-[#151922] border border-[#232838]/40 animate-pulse"
                                  >
                                    <div className="w-9 h-9 rounded-lg bg-[#232838] shrink-0" />
                                    <div className="flex-1 space-y-2">
                                      <div className="h-3 w-2/3 bg-[#232838] rounded" />
                                      <div className="h-2 w-1/3 bg-[#232838] rounded" />
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                              {MAJOR_PLATFORMS.map((platform) => {
                              const match = findBestSource(result.sources, platform);
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
                                      loading="lazy"
                                      decoding="async"
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
                                      {typeLabel(match.type)}
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
                                      Niet beschikbaar
                                    </span>
                                  </span>
                                </div>
                              );
                            })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}