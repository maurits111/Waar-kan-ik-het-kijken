'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const WATCHLIST_KEY = 'my_watchlist';

type Suggestion = {
  titleId: number;
  name: string;
  poster: string | null;
  type: string;
  year: number | null;
};

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  // Alleen suggesties tonen vanaf 3 letters.
  const visibleSuggestions = newMovieTitle.trim().length >= 3 ? suggestions : [];

  useEffect(() => {
    const saved = localStorage.getItem(WATCHLIST_KEY);
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const getItemId = (item: any) => {
    return String(item.titleId || item.id || '');
  };

  const removeFromWatchlist = (item: any) => {
    const cleanId = getItemId(item);
    const updated = watchlist.filter((movie) => getItemId(movie) !== cleanId);
    setWatchlist(updated);
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Suggesties ophalen terwijl je typt (vanaf 3 letters, na 300 ms).
  // Gebruikt alleen TMDb, dus geen Watchmode-quota.
  useEffect(() => {
    const q = newMovieTitle.trim();
    if (q.length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&region=NL&mode=suggest`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (res.ok && data.results) setSuggestions(data.results.slice(0, 5));
      } catch {}
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [newMovieTitle]);

  const addItem = (item: { id: number; titleId: number; name: string; poster: string; type?: string; year?: number | null }) => {
    const cleanId = getItemId(item);
    if (watchlist.some((w) => getItemId(w) === cleanId)) {
      setNewMovieTitle('');
      setSuggestions([]);
      return;
    }
    const updated = [...watchlist, item];
    setWatchlist(updated);
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    } catch {}
    setNewMovieTitle('');
    setSuggestions([]);
  };

  const addSuggestion = (s: Suggestion) => {
    addItem({
      id: s.titleId,
      titleId: s.titleId,
      name: s.name,
      poster: s.poster || '',
      type: s.type,
      year: s.year,
    });
  };

  const addManualMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovieTitle.trim()) return;

    // Is er een suggestie? Dan de bovenste nemen (met plaatje).
    if (visibleSuggestions.length > 0) {
      addSuggestion(visibleSuggestions[0]);
      return;
    }

    addItem({
      id: Date.now(),
      titleId: Date.now(),
      name: newMovieTitle,
      poster: '',
    });
  };

  return (
    <div className="min-h-screen bg-[#10131a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Mijn Watchlist</h1>
        <p className="text-gray-400 mb-6">Bekijk hier jouw opgeslagen films en series.</p>

        {/* Handmatig een film toevoegen */}
        <form onSubmit={addManualMovie} className="mb-8 flex gap-2 relative">
          {visibleSuggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-2 z-10 bg-[#181c27] border border-[#232838] rounded-xl overflow-hidden shadow-lg">
              {visibleSuggestions.map((s) => (
                <li key={s.titleId}>
                  <button
                    type="button"
                    onClick={() => addSuggestion(s)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#232838] cursor-pointer"
                  >
                    {s.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.poster} alt={s.name} className="w-10 h-14 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-14 bg-[#232838] rounded" />
                    )}
                    <span className="flex-1">
                      {s.name}
                      {s.year ? <span className="text-gray-400"> ({s.year})</span> : null}
                      <span className="block text-xs text-gray-400">
                        {s.type === 'tv_series' ? 'Serie' : 'Film'}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input
            type="text"
            value={newMovieTitle}
            onChange={(e) => setNewMovieTitle(e.target.value)}
            placeholder="Typ een filmnaam om toe te voegen..."
            className="px-4 py-2 bg-[#181c27] border border-[#232838] rounded-xl text-white flex-1 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all cursor-pointer"
          >
            Toevoegen
          </button>
        </form>

        {watchlist.length === 0 ? (
          <div className="text-center py-20 bg-[#181c27] rounded-2xl border border-[#232838]">
            <p className="text-gray-400 text-lg mb-4">Je watchlist is nog leeg.</p>
            <Link href="/" className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all">
              Zoek films & series
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {watchlist.map((movie, index) => {
              const titleName = movie.name || movie.title;
              const posterUrl = movie.poster || (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '');

              return (
                <div key={getItemId(movie) || index} className="bg-[#181c27] rounded-xl overflow-hidden border border-[#232838] p-4 flex flex-col">
                  {posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={posterUrl}
                      alt={titleName}
                      className="rounded-lg object-cover h-64 w-full mb-4"
                    />
                  ) : (
                    <div className="rounded-lg bg-[#232838] h-64 w-full mb-4 flex items-center justify-center text-gray-400 text-center px-2">
                      Geen poster (handmatig)
                    </div>
                  )}
                  <h3 className="font-semibold text-lg mb-2 truncate">{titleName}</h3>
                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => removeFromWatchlist(movie)}
                      className="w-full py-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all text-sm flex items-center justify-center cursor-pointer"
                    >
                      ✕ Verwijderen
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}