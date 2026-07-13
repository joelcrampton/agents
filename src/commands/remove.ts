import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { wishlist } from '../db/schema.js';

// Delete a single item by id (as printed by `list`).
export async function remove(args: string[]): Promise<void> {
  const id = args[0]?.trim();
  if (!id) {
    console.error('Usage: npm start -- remove <id>');
    process.exitCode = 1;
    return;
  }

  // Guard against a non-UUID reaching Postgres and throwing a raw type error.
  if (!z.uuid().safeParse(id).success) {
    console.error(`Invalid id: ${id}`);
    process.exitCode = 1;
    return;
  }

  const [row] = await db.delete(wishlist).where(eq(wishlist.id, id)).returning();
  if (!row) {
    console.error(`No wishlist item found with id: ${id}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Removed "${row.name}" from your wishlist.`);
}
