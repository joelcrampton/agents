import { ToolLoopAgent, Output, tool, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { tavily } from '@tavily/core';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';
import { wishlist } from './db/schema.js';

const tav = tavily({
  apiKey: process.env.TAVILY_API_KEY!,
});

// Inferred from the wishlist table (minus DB-managed columns). We only keep the
// refinements that change behavior: URL validation and price/currency hints so
// the model splits the number from the symbol and uses ISO currency codes.
export const clothingItemSchema = createInsertSchema(wishlist, {
  price: (s) => s.describe('Numeric price, no currency symbol'),
  currency: (s) => s.describe('ISO currency code e.g. USD, GBP'),
  url: () => z.url(),
  imageUrl: () => z.url(),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Build the agent with the user's sizes folded into its instructions.
export function createWishlistAgent(profileText: string) {
  return new ToolLoopAgent({
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
}
