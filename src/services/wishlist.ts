import { desc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { wishlist, type NewWishlistItem, type WishlistItem } from '../db/schema.js';

// All wishlist persistence lives here so the CLI and API stay thin.

// Every saved item, newest first.
export async function listItems(): Promise<WishlistItem[]> {
  return db.select().from(wishlist).orderBy(desc(wishlist.createdAt));
}

export async function addItem(item: NewWishlistItem): Promise<WishlistItem> {
  const [row] = await db.insert(wishlist).values(item).returning();
  return row;
}

// Returns the removed row, or undefined when no row matched the id.
export async function removeItem(id: string): Promise<WishlistItem | undefined> {
  const [row] = await db.delete(wishlist).where(eq(wishlist.id, id)).returning();
  return row;
}
