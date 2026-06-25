# Agents

Agents are large language models (LLMs) that use tools in a loop to accomplish tasks.
- LLMs are trained with data up to a certain date
- If we ask questions about current events beyond that date the LLM is unable to response effectively
- We can define tools that can be used to provide additional information/guidance when training data is insufficient

We can do this using the [`ToolLoopAgent`](https://ai-sdk.dev/docs/agents/building-agents).

```ts
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
```

- Select a `model`. All major LLM providers are supported
- Provide `instructions` to the LLM to tell it how to act
- Define `tools` to extend the LLM's capabilities
  - For example, `searchWeb` allows the LLM to search the web for information
  - Interestingly, even with the same prompt the LLM might not always choose to invoke tools with the same `inputSchema`
- Use `stopWhen` to determine how many steps a loop makes before it stops. Default is 20
- Define an `output` schema with zod so the LLM responds with an expected structure
