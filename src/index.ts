import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { db } from './db/index.js';
import { wishlist } from './db/schema.js';
import { ensureProfile } from './profile.js';
import { createWishlistAgent } from './wishlistAgent.js';

const args = process.argv.slice(2);

// 1. Search (sizes steer the query)
const profileText = await ensureProfile();
const wishlistAgent = createWishlistAgent(profileText);

const prompt = args.join(' ') || 'R. M. Williams boots';
const { output } = await wishlistAgent.generate({ prompt });

if (output.items.length === 0) {
  console.log('No matching items found.');
  process.exit(0);
}

console.log(`\nResults for "${output.query}":\n`);
output.items.forEach((item, i) => {
  const price = item.price ? `${item.price} ${item.currency ?? ''}` : 'n/a';
  console.log(`[${i + 1}] ${item.name} - ${item.brand ?? '?'} (${price})`);
  console.log(`    ${item.url}`);
});

// 2. Select
const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question('\nSelect the best result (number, or blank to cancel): ');
rl.close();

if (answer.trim() === '') {
  console.log('Cancelled.');
  process.exit(0);
}

const selected = output.items[Number(answer) - 1];
if (!selected) {
  console.error('Invalid selection.');
  process.exit(1);
}

// 3. Persist
const [row] = await db.insert(wishlist).values(selected).returning();

console.log(`\nAdded "${row.name}" to your wishlist (id: ${row.id}).`);
process.exit(0);
