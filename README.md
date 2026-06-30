# Agents

Agents are large language models (LLMs) that use tools in a loop to accomplish tasks.
- LLMs are trained with data up to a certain date.
- If we ask questions about current events beyond that date the LLM is unable to response effectively.
- We can define tools that can be used to provide additional information/guidance when training data is insufficient.

We can do this using the [`ToolLoopAgent`](https://ai-sdk.dev/docs/agents/building-agents).

```ts
const agent = new ToolLoopAgent({
  model: anthropic('claude-haiku-4-5'),
  instructions: '',
  stopWhen: stepCountIs(n),
  output: Output.object({
    schema: z.object({
      ...
    }),
  }),
  tools: {
    searchWeb: tool({
      description: '',
      inputSchema: z.object({
        ...
      }),
      execute: async () => {
        ...
      },
    })
  }
});
```

- Select a `model`. All major LLM providers are supported.
- Provide `instructions` to the LLM to tell it how to act.
- Define `tools` to extend the LLM's capabilities.
  - For example, a `searchWeb` tool could the LLM to search the web for information.
  - Interestingly, even with the same prompt the LLM might not always choose to invoke tools with the same `inputSchema`.
- Use `stopWhen` to determine how many steps a loop makes before it stops. Default is 20.
- Define an `output` schema with zod so the LLM responds with an expected structure.

## Wishlist Agent

The `wishlistAgent` finds clothing items on the web and saves the ones you pick to a Supabase wishlist. It uses your stored sizes to tailor each search.

### How it works

1. **Profile check**
On the first run it prompts you for any missing sizes (`shoe`, `waist`, `shirt`) and saves them to the `profile` table. Subsequent runs skip this.

2. **Context**
Your sizes are loaded from the `profile` table into the agent's `instructions`, so searches are tailored to you.

3. **Search**
The agent calls the `searchClothing` tool (Tavily web search) to find matching items and returns them as structured results.

4. **Select**
Pick the best result by number from the printed list.

5. **Save**
The chosen item is inserted into the `wishlist` table.

### Usage

Create an `.env` using `.env.example` as a guide.

```bash
npm start -- "The clothing item you want"
```