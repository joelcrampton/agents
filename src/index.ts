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
  toolChoice: {
    type: 'tool',
    toolName: 'searchWeb' // Force the searchWeb tool to be used on every step
  },
  prepareStep: ({ steps }) => {
    const searched = steps.some(step => step.toolCalls?.some(tc => tc.toolName === 'searchWeb'));
    if (searched) {
      // Force a text-only response on the next step after the searchWeb tool is used
      // Overrides the base toolChoice settings
      return { toolChoice: 'none' }; // Or activeTools: []
    }
  },
});

const result = await gemini.generate({
  prompt: 'What are the top 3 news headlines today?',
});

console.log(result.text);