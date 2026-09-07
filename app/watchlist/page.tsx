'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const WATCHLIST_KEY = 'my_watchlist';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [newMovieTitle, setNewMovieTitle] = useState('');

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

  const addManualMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovieTitle.trim()) return;

    const newMovie = {
      id: Date.now(),
      titleId: Date.now(),
      name: newMovieTitle,
      poster: '',
    };

    const updated = [...watchlist, newMovie];
    setWatchlist(updated);
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    } catch {}
    setNewMovieTitle('');
  };

  return (
    <div className="min-h-screen bg-[#10131a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Mijn Watchlist</h1>
        <p className="text-gray-400 mb-6">Bekijk hier jouw opgeslagen films en series.</p>

        {/* Handmatig een film toevoegen */}
        <form onSubmit={addManualMovie} className="mb-8 flex gap-2">
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