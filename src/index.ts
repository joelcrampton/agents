import 'dotenv/config';
import { ToolLoopAgent, Output, tool, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import z from 'zod';
import { tavily } from '@tavily/core';

const client = tavily({
  apiKey: process.env.TAVILY_API_KEY!
});

const headlineSchema = z.object({
  title: z.string().describe('The headline title'),
  source: z.string().describe('The news source e.g. BBC, Reuters'),
  url: z.url().describe('Link to the article'),
  summary: z.string().describe('One sentence summary of the article'),
  category: z.enum(['politics', 'technology', 'business', 'science', 'sport', 'other']),
});

const newsAgent = new ToolLoopAgent({
  model: anthropic('claude-haiku-4-5'),
  instructions: 'You are a news aggregator. Search for headlines and return structured results.',
  stopWhen: stepCountIs(3),
  output: Output.object({
    schema: z.object({
      headlines: z.array(headlineSchema).describe('Top news headlines'),
      fetchedAt: z.string().describe('ISO timestamp of when this was fetched'),
      query: z.string().describe('The search query used'),
    }),
  }),
  tools: {
    searchWeb: tool({
      description: 'Search the web for information',
      inputSchema: z.object({
        query: z.string(),
        limit: z.number().min(1).max(10).default(10)
      }),
      execute: async ({ query, limit }) => {
        console.log(`Executing searchWeb for ${limit} results.`);
        return await client.search(query, {
          searchDepth: 'basic',
          maxResults: limit
        });
      },
    })
  }
});

const result = await newsAgent.generate({
  prompt: 'What are the top 3 news headlines today?',
});

console.log(result.output);