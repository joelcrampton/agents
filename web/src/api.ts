import type { ProfileEntry, SearchResponse, SearchResult, WishlistItem } from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export function fetchWishlist(): Promise<WishlistItem[]> {
  return request('/api/wishlist');
}

export function searchClothing(query: string): Promise<SearchResponse> {
  return request('/api/search', { method: 'POST', body: JSON.stringify({ query }) });
}

export function addItem(item: SearchResult): Promise<WishlistItem> {
  return request('/api/wishlist', { method: 'POST', body: JSON.stringify(item) });
}

export function removeItem(id: string): Promise<WishlistItem> {
  return request(`/api/wishlist/${id}`, { method: 'DELETE' });
}

export function fetchProfile(): Promise<ProfileEntry[]> {
  return request('/api/profile');
}

// An empty value clears that field on the server.
export function saveProfile(entries: { key: string; value: string }[]): Promise<ProfileEntry[]> {
  return request('/api/profile', { method: 'PUT', body: JSON.stringify({ entries }) });
}
