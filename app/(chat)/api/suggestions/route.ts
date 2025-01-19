import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { role, messages } = await req.json();

    const prompt = `Given the following chat context and user role, generate 2-4 relevant, concise follow-up questions or prompts. The suggestions should be specific to the user's role and the current conversation context.

Role: ${role.name}
Role Description: ${role.description}

Recent Messages:
${messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}

Generate suggestions that:
1. Are relevant to the user's role and previous conversation
2. Are concise and clear
3. Help the user get more value from the conversation
4. Are phrased as questions or clear prompts

Return the suggestions in this JSON format:
{
  "suggestions": [
    {
      "text": "the suggestion text",
      "description": "optional brief context for the suggestion"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that generates contextual suggestions for users based on their role and conversation history.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const suggestions = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
