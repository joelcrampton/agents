import { FormEvent, useEffect, useState } from 'react';
import { addItem, fetchWishlist, removeItem, searchClothing } from './api';
import ItemCard from './components/ItemCard';
import ProfilePanel from './components/ProfilePanel';
import type { SearchResult, WishlistItem } from './types';

export default function App() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [resultsQuery, setResultsQuery] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null); // url or id of item being added/removed

  useEffect(() => {
    fetchWishlist()
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim() || searching) return;
    setSearching(true);
    setError(null);
    try {
      const { items: found, query: used } = await searchClothing(query);
      setResults(found);
      setResultsQuery(used);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSearching(false);
    }
  }

  async function onAdd(result: SearchResult) {
    setBusyKey(result.url);
    setError(null);
    try {
      const saved = await addItem(result);
      setItems((prev) => [saved, ...prev]);
      setResults((prev) => prev?.filter((r) => r.url !== result.url) ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyKey(null);
    }
  }

  async function onRemove(item: WishlistItem) {
    setBusyKey(item.id);
    setError(null);
    try {
      await removeItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <main>
      <header>
        <h1>Wishlist</h1>
        <p className="tagline">Search for clothing and save your picks.</p>
      </header>

      <ProfilePanel />

      <form className="search" onSubmit={onSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. R. M. Williams boots"
          aria-label="Search for a clothing item"
        />
        <button type="submit" disabled={searching || !query.trim()}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>
      {searching && <p className="hint">The agent is searching the web — this can take a moment.</p>}

      {error && <p className="error">{error}</p>}

      {results && !searching && (
        <section>
          <div className="section-head">
            <h2>
              Results for “{resultsQuery}” ({results.length})
            </h2>
            <button className="link" onClick={() => setResults(null)}>
              Clear
            </button>
          </div>
          {results.length === 0 ? (
            <p className="empty">No matching items found.</p>
          ) : (
            <div className="grid">
              {results.map((r) => (
                <ItemCard
                  key={r.url}
                  {...r}
                  action={
                    <button onClick={() => onAdd(r)} disabled={busyKey === r.url}>
                      {busyKey === r.url ? 'Adding…' : 'Add to wishlist'}
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2>
          Your wishlist{loading ? '' : ` (${items.length} item${items.length === 1 ? '' : 's'})`}
        </h2>
        {loading ? (
          <p className="empty">Loading…</p>
        ) : items.length === 0 ? (
          <p className="empty">Your wishlist is empty. Search above to add something.</p>
        ) : (
          <div className="grid">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                {...item}
                action={
                  <button
                    className="danger"
                    onClick={() => onRemove(item)}
                    disabled={busyKey === item.id}
                  >
                    {busyKey === item.id ? 'Removing…' : 'Remove'}
                  </button>
                }
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
