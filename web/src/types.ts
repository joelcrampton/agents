// Mirrors the wishlist table in src/db/schema.ts.
export interface WishlistItem {
  id: string;
  name: string;
  brand: string | null;
  price: number | null;
  currency: string | null;
  url: string;
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// A search hit from the agent — a wishlist item before it has been saved.
export type SearchResult = Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>;

export interface SearchResponse {
  items: SearchResult[];
  query: string;
}

// Mirrors the profile table in src/db/schema.ts.
export interface ProfileEntry {
  id: string;
  key: string;
  value: string;
  unit: string | null;
  createdAt: string;
  updatedAt: string;
}
