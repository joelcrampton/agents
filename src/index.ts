import 'dotenv/config';
import { ToolLoopAgent, tool } from 'ai';
import { google } from '@ai-sdk/google';
import z from 'zod';
import { tavily } from '@tavily/core';

const client = tavily({
  apiKey: process.env.TAVILY_API_KEY!
});

const gemini = new ToolLoopAgent({
  model: google('gemini-2.5-flash'),
  instructions: 'You are a helpful assistant.',
  tools: {
    searchWeb: tool({
      description: 'Search the web for information',
      inputSchema: z.object({
        query: z.string(),
        limit: z.number().min(1).max(10).default(10)
      }),
      execute: async ({ query, limit }) => {
        const response = await client.search(query, {
          searchDepth: 'basic',
          maxResults: limit
        });
        console.log(`Executing searchWeb for ${limit} results.`);
        return response.results.map((result) => ({
          title: result.title,
          url: result.url,
          content: result.content,
        }));
      },
    })
  },
});

const result = await gemini.generate({
  prompt: 'What are the top 3 news headlines today?',
});

console.log(result.text);