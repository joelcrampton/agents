import 'dotenv/config';
import { ToolLoopAgent, Output, tool, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createInterface } from 'node:readline/promises';
import z from 'zod';
import { tavily } from '@tavily/core';
import { createInsertSchema } from 'drizzle-zod';
import { db } from './db/index.js';
import { wishlist, profile } from './db/schema.js';

const tav = tavily({
  apiKey: process.env.TAVILY_API_KEY!,
});

const args = process.argv.slice(2);

// Profile fields we keep on file, each with its fixed unit.
const PROFILE_FIELDS: { key: string; unit: string | null; label: string }[] = [
  { key: 'shoe', unit: 'us', label: 'shoe size' },
  { key: 'waist', unit: 'in', label: 'waist' },
  { key: 'shirt', unit: null, label: 'shirt size' },
];

// Ask for any fields that aren't stored yet, then remember them.
let sizes = await db.select().from(profile);
const missing = PROFILE_FIELDS.filter((f) => !sizes.some((s) => s.key === f.key));

if (missing.length) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log("Let's set up your profile (press Enter to skip a field).");
  for (const field of missing) {
    const hint = field.unit ? ` (${field.unit})` : '';
    const value = (await rl.question(`  ${field.label}${hint}: `)).trim();
    if (value) {
      await db.insert(profile).values({ key: field.key, value, unit: field.unit });
    }
  }
  rl.close();
  sizes = await db.select().from(profile); // refresh after saving
}

const profileText = sizes.length
  ? sizes.map((s) => `${s.key}: ${s.value}${s.unit ? ` ${s.unit}` : ''}`).join(', ')
  : 'none recorded';

// Inferred from the wishlist table (minus DB-managed columns). We only keep the
// refinements that change behavior: URL validation and price/currency hints so
// the model splits the number from the symbol and uses ISO currency codes.
const clothingItemSchema = createInsertSchema(wishlist, {
  price: (s) => s.describe('Numeric price, no currency symbol'),
  currency: (s) => s.describe('ISO currency code e.g. USD, GBP'),
  url: () => z.url(),
  imageUrl: () => z.url(),
}).omit({ id: true, createdAt: true, updatedAt: true });

const wishlistAgent = new ToolLoopAgent({
  model: anthropic('claude-haiku-4-5'),
  instructions:
    'You help find clothing items to add to a wishlist. Search the web for ' +
    'items matching the user request and return clean, structured results. ' +
    'Prefer direct product pages from retailers over blog/listicle links. ' +
    `The user's sizes/preferences are: ${profileText}. When relevant, fold the ` +
    'matching size into the search query (e.g. shoe size for footwear, waist ' +
    'for trousers, t-shirt size for tops).',
  stopWhen: stepCountIs(3),
  output: Output.object({
    schema: z.object({
      items: z.array(clothingItemSchema).describe('Matching clothing items'),
      query: z.string().describe('The search query used'),
    }),
  }),
  tools: {
    searchClothing: tool({
      description: 'Search the web for clothing items for sale',
      inputSchema: z.object({
        query: z.string(),
        limit: z.number().min(1).max(10).default(8),
      }),
      execute: async ({ query, limit }) => {
        console.log(`Executing searchClothing for ${limit} results.`);
        return await tav.search(query, {
          searchDepth: 'basic',
          maxResults: limit,
        });
      },
    }),
  },
});

// 1. Search
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
