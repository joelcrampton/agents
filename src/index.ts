import 'dotenv/config';
import { ToolLoopAgent, generateText } from 'ai';
import { google } from '@ai-sdk/google';

const gemini = new ToolLoopAgent({
  model: google('gemini-2.5-flash'),
  instructions: 'You are a helpful assistant.',
});

const result = await gemini.generate({
  prompt: 'Hello.',
});

console.log(result.text);