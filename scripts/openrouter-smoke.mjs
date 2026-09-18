import { OpenRouter } from '@openrouter/sdk';

process.loadEnvFile('.env.local');

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  throw new Error('OPENROUTER_API_KEY is not defined in .env.local.');
}

const openRouter = new OpenRouter({
  apiKey,
  httpReferer: process.env.NEXT_PUBLIC_SITE_URL,
  appTitle: 'Sergio Fotografia',
});

const completion = await openRouter.chat.send({
  chatRequest: {
    model: 'openrouter/free',
    messages: [
      {
        role: 'user',
        content: 'Invent a new holiday and describe its traditions.',
      },
    ],
  },
});

console.log(completion.choices[0]?.message?.content ?? 'No text was returned.');
