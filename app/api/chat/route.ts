import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-3.5-turbo'), // or 'gpt-4o' if you have access
    system: 'You are a helpful assistant.',
    messages,
  });

  return result.toDataStreamResponse();
} 