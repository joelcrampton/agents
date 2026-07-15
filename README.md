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

1. **Context**
Your sizes (`shoe`, `waist`, `shirt`) are loaded from the `profile` table into the agent's `instructions`, so searches are tailored to you. Set them under **Your sizes** in the web app.

2. **Search**
The agent calls the `searchClothing` tool (Tavily web search) to find matching items and returns them as structured results.

3. **Select**
Click **Add to wishlist** on the result you want.

4. **Save**
The chosen item is inserted into the `wishlist` table and appears in your list.

## Project structure

The repo is an npm workspace: a React app and an Express API over a shared service core.

```
src/
  db/         Drizzle schema and Postgres client
  services/   Business logic: wishlist CRUD, profile, agent search
  agent/      The wishlist ToolLoopAgent definition
  api/        Express server and routes (thin HTTP layer over services)
web/          React frontend (Vite), its own workspace package
drizzle/      Generated SQL migrations
```

The API (`src/api/`) is a thin interface layer: routes validate input and delegate to `src/services/`, which owns all database access and agent orchestration.

## API

| Method | Path                | Description                                             |
| ------ | ------------------- | ------------------------------------------------------- |
| GET    | `/api/wishlist`     | List saved items, newest first                          |
| POST   | `/api/search`       | Run the agent search (`{ "query": "..." }`)             |
| POST   | `/api/wishlist`     | Save a picked item                                      |
| DELETE | `/api/wishlist/:id` | Remove an item by id                                    |
| GET    | `/api/profile`      | Read your stored sizes                                  |
| PUT    | `/api/profile`      | Set sizes (`{ "entries": [{ "key": "shoe", "value": "10" }] }`; empty value clears) |

Missing sizes are simply skipped by the search — nothing is required up front.

## Usage

Create an `.env` using `.env.example` as a guide, then:

```bash
npm install   # first time only — installs both workspaces

npm run api   # Express API on http://localhost:3001
npm run web   # Vite dev server on http://localhost:5173 (proxies /api)
```

Open http://localhost:5173, optionally fill in **Your sizes**, search for an item, and click **Add to wishlist** on the result you want. Saved items appear below with a **Remove** button.