import 'dotenv/config';
import { ToolLoopAgent, Output, tool, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createInterface } from 'node:readline/promises';
import z from 'zod';
import { tavily } from '@tavily/core';
import { db } from './db/index.js';
import { wishlist } from './db/schema.js';

const tav = tavily({
  apiKey: process.env.TAVILY_API_KEY!,
});

const clothingItemSchema = z.object({
  name: z.string().describe('Product name'),
  brand: z.string().nullable().describe('Brand or retailer'),
  price: z.number().nullable().describe('Numeric price, no currency symbol'),
  currency: z.string().nullable().describe('ISO currency code e.g. USD, GBP'),
  url: z.url().describe('Direct link to the product page'),
  imageUrl: z.url().nullable().describe('Product image URL'),
  description: z.string().describe('One-line description'),
});

const wishlistAgent = new ToolLoopAgent({
  model: anthropic('claude-haiku-4-5'),
  instructions:
    'You help find clothing items to add to a wishlist. Search the web for ' +
    'items matching the user request and return clean, structured results. ' +
    'Prefer direct product pages from retailers over blog/listicle links.',
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
const prompt = process.argv.slice(2).join(' ') || 'R. M. Williams boots';
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
const [row] = await db
  .insert(wishlist)
  .values({
    name: selected.name,
    brand: selected.brand,
    price: selected.price,
    currency: selected.currency,
    url: selected.url,
    imageUrl: selected.imageUrl,
    description: selected.description,
  })
  .returning();

console.log(`\nAdded "${row.name}" to your wishlist (id: ${row.id}).`);
process.exit(0);
