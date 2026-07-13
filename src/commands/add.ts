import { createInterface } from 'node:readline/promises';
import { db } from '../db/index.js';
import { wishlist } from '../db/schema.js';
import { ensureProfile } from '../profile.js';
import { createWishlistAgent } from '../wishlistAgent.js';

// Search the web for an item, let the user pick one, and save it.
export async function add(prompt: string): Promise<void> {
  const query = prompt.trim() || 'R. M. Williams boots';

  // Sizes steer the query.
  const profileText = await ensureProfile();
  const wishlistAgent = createWishlistAgent(profileText);

  const { output } = await wishlistAgent.generate({ prompt: query });

  if (output.items.length === 0) {
    console.log('No matching items found.');
    return;
  }

  console.log(`\nResults for "${output.query}":\n`);
  output.items.forEach((item, i) => {
    const price = item.price ? `${item.price} ${item.currency ?? ''}` : 'n/a';
    console.log(`[${i + 1}] ${item.name} - ${item.brand ?? '?'} (${price})`);
    console.log(`    ${item.url}`);
  });

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('\nSelect the best result (number, or blank to cancel): ');
  rl.close();

  if (answer.trim() === '') {
    console.log('Cancelled.');
    return;
  }

  const selected = output.items[Number(answer) - 1];
  if (!selected) {
    console.error('Invalid selection.');
    process.exitCode = 1;
    return;
  }

  const [row] = await db.insert(wishlist).values(selected).returning();
  console.log(`\nAdded "${row.name}" to your wishlist (id: ${row.id}).`);
}
