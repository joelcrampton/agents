import { desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { wishlist } from '../db/schema.js';

// Print every saved item, newest first, with the id needed to remove it.
export async function list(): Promise<void> {
  const items = await db.select().from(wishlist).orderBy(desc(wishlist.createdAt));

  if (items.length === 0) {
    console.log('Your wishlist is empty.');
    return;
  }

  console.log(`\nYour wishlist (${items.length} item${items.length === 1 ? '' : 's'}):\n`);
  for (const item of items) {
    const price = item.price ? `${item.price} ${item.currency ?? ''}` : 'n/a';
    console.log(`${item.name} - ${item.brand ?? '?'} (${price})`);
    console.log(`    ${item.url}`);
    console.log(`    id: ${item.id}`);
  }
}
