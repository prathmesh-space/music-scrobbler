import { useMemo, useState } from 'react';
import { GripVertical, Maximize2, Minimize2, RotateCcw, X } from 'lucide-react';

const STORAGE_KEY = 'music-scrobbler-dashboard-layout';

const defaultCards = [
  { id: 'weekly-summary', title: 'Weekly Summary', description: 'Quick view of your 7-day listening pulse.', size: 'md', color: 'from-purple-500/30 to-indigo-500/20' },
  { id: 'top-artists', title: 'Top Artists', description: 'Most played artists for your active range.', size: 'md', color: 'from-blue-500/30 to-cyan-500/20' },
  { id: 'discovery-mix', title: 'Discovery Mix', description: 'New artists and fresh tracks worth revisiting.', size: 'lg', color: 'from-pink-500/30 to-rose-500/20' },
  { id: 'goals-progress', title: 'Goals Progress', description: 'Track streaks and badges at a glance.', size: 'sm', color: 'from-emerald-500/30 to-teal-500/20' },
  { id: 'listening-rhythm', title: 'Listening Rhythm', description: 'Best hours and weekdays for your sessions.', size: 'sm', color: 'from-amber-500/30 to-orange-500/20' },
];

const sizes = {
  sm: 'md:col-span-1',
  md: 'md:col-span-2',
  lg: 'md:col-span-3',
};

const getStoredCards = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!Array.isArray(parsed)) return defaultCards;

    const byId = new Map(defaultCards.map((card) => [card.id, card]));
    return parsed
      .map((raw) => {
        const card = byId.get(raw.id);
        if (!card) return null;
        return {
          ...card,
          hidden: Boolean(raw.hidden),
          size: ['sm', 'md', 'lg'].includes(raw.size) ? raw.size : card.size,
        };
      })
      .filter(Boolean);
  } catch {
    return defaultCards;
  }
};

const saveCards = (cards) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(cards.map(({ id, hidden, size }) => ({ id, hidden, size }))),
  );
};

const Dashboard = () => {
  const [cards, setCards] = useState(getStoredCards);

  const visibleCards = useMemo(() => cards.filter((card) => !card.hidden), [cards]);

  const updateCards = (updater) => {
    setCards((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      saveCards(next);
      return next;
    });
  };

  const moveCard = (index, direction) => {
    updateCards((current) => {
      const next = [...current];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const cycleCardSize = (id) => {
    const order = ['sm', 'md', 'lg'];
    updateCards((current) =>
      current.map((card) => {
        if (card.id !== id) return card;
        const index = order.indexOf(card.size);
        return { ...card, size: order[(index + 1) % order.length] };
      }),
    );
  };

  const toggleHidden = (id) => {
    updateCards((current) =>
      current.map((card) => (card.id === id ? { ...card, hidden: !card.hidden } : card)),
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Custom Dashboard</h1>
              <p className="text-gray-400">Reorder, hide, and resize cards. Your layout is saved locally.</p>
            </div>

            <button
              type="button"
              onClick={() => updateCards(defaultCards)}
              className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600"
            >
              <RotateCcw className="h-4 w-4" />
              Reset layout
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {visibleCards.map((card, index) => (
            <article
              key={card.id}
              className={`rounded-xl border border-gray-700 bg-gradient-to-br ${card.color} p-4 ${sizes[card.size]}`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{card.title}</h2>
                  <p className="text-sm text-gray-200">{card.description}</p>
                </div>

                <button
                  type="button"
                  aria-label={`Hide ${card.title}`}
                  onClick={() => toggleHidden(card.id)}
                  className="rounded-md border border-gray-500 bg-gray-800/50 p-1 hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <button type="button" onClick={() => moveCard(index, -1)} className="rounded border border-gray-500 px-2 py-1 hover:bg-gray-700/50">
                  <GripVertical className="mr-1 inline h-3 w-3" /> Up
                </button>
                <button type="button" onClick={() => moveCard(index, 1)} className="rounded border border-gray-500 px-2 py-1 hover:bg-gray-700/50">
                  <GripVertical className="mr-1 inline h-3 w-3" /> Down
                </button>
                <button type="button" onClick={() => cycleCardSize(card.id)} className="rounded border border-gray-500 px-2 py-1 hover:bg-gray-700/50">
                  {card.size === 'lg' ? <Minimize2 className="mr-1 inline h-3 w-3" /> : <Maximize2 className="mr-1 inline h-3 w-3" />}
                  Resize ({card.size.toUpperCase()})
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-gray-700 bg-gray-800 p-4">
          <h2 className="mb-3 text-lg font-semibold">Hidden cards</h2>
          <div className="flex flex-wrap gap-2">
            {cards.filter((card) => card.hidden).length === 0 ? (
              <p className="text-sm text-gray-400">No hidden cards.</p>
            ) : (
              cards
                .filter((card) => card.hidden)
                .map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => toggleHidden(card.id)}
                    className="rounded-full border border-purple-500/60 bg-purple-500/10 px-3 py-1 text-sm text-purple-100 hover:bg-purple-500/20"
                  >
                    Show {card.title}
                  </button>
                ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
